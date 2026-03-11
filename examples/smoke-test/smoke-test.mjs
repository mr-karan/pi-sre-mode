#!/usr/bin/env node
import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPackagePath = path.resolve(__dirname, "../..");

const args = parseArgs(process.argv.slice(2));
const overlayPath = args.overlay ? path.resolve(args.overlay) : undefined;
const overlayEnabled = Boolean(overlayPath);

if (args.publicOnly && overlayEnabled) {
	console.error("Cannot combine --overlay and --public-only");
	process.exit(1);
}

if (overlayPath && !fs.existsSync(overlayPath)) {
	console.error(`Overlay path does not exist: ${overlayPath}`);
	process.exit(1);
}

const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), "pi-sre-mode-smoke-"));
const homeDir = path.join(tempRoot, "home");
const workspaceDir = path.join(tempRoot, "workspace");
fs.mkdirSync(path.join(workspaceDir, ".pi"), { recursive: true });
fs.mkdirSync(path.join(homeDir, ".pi", "agent"), { recursive: true });
fs.writeFileSync(
	path.join(workspaceDir, ".pi", "settings.json"),
	JSON.stringify({ packages: [publicPackagePath, ...(overlayPath ? [overlayPath] : [])] }, null, 2),
);

const piBin = process.env.PI_BIN || "pi";
const child = spawn(piBin, ["--mode", "rpc", "--no-session"], {
	cwd: workspaceDir,
	env: {
		...process.env,
		HOME: homeDir,
		PROMQLCLI_BIN: process.env.PROMQLCLI_BIN || "echo",
		LOGCHEF_BIN: process.env.LOGCHEF_BIN || "echo",
	},
	stdio: ["pipe", "pipe", "pipe"],
});

const responses = new Map();
const uiRequests = [];
const stderrChunks = [];
let stdoutBuffer = "";
let requestCounter = 0;
let shuttingDown = false;

child.stderr.on("data", (chunk) => {
	stderrChunks.push(chunk.toString("utf8"));
});

child.stdout.on("data", (chunk) => {
	stdoutBuffer += chunk.toString("utf8");
	let newlineIndex = stdoutBuffer.indexOf("\n");
	while (newlineIndex >= 0) {
		const line = stdoutBuffer.slice(0, newlineIndex).replace(/\r$/, "");
		stdoutBuffer = stdoutBuffer.slice(newlineIndex + 1);
		if (line.trim().length > 0) handleLine(line);
		newlineIndex = stdoutBuffer.indexOf("\n");
	}
});

child.on("exit", (code, signal) => {
	if (!shuttingDown && code !== 0 && code !== null) {
		console.error(`pi exited unexpectedly with code ${code}`);
		if (stderrChunks.length > 0) {
			console.error(stderrChunks.join(""));
		}
		process.exitCode = 1;
	}
	if (!shuttingDown && signal) {
		console.error(`pi exited unexpectedly with signal ${signal}`);
		process.exitCode = 1;
	}
});

await sleep(300);

try {
	const commandsResponse = await rpcRequest({ type: "get_commands" });
	assert(commandsResponse.success === true, "get_commands failed");
	const commands = commandsResponse.data?.commands ?? [];
	assert(commands.some((command) => command.name === "incident"), "incident command not loaded");
	assert(commands.some((command) => command.name === "check-connectors"), "check-connectors command not loaded");
	assert(commands.some((command) => command.name === "report"), "report command not loaded");

	if (overlayEnabled) {
		assert(commands.some((command) => command.name === "zerodha-investigate"), "zerodha-investigate prompt not loaded");
		assert(commands.some((command) => command.name === "skill:incident-orchestrator"), "incident-orchestrator skill command not loaded");
	}

	await runPrompt("/incident");
	await waitForUiRequest((request) => request.method === "notify" && String(request.message).includes("Incident mode enabled"));
	assert(uiRequests.some((request) => request.method === "setStatus" && request.statusKey === "incident-mode"), "incident mode status was not set");

	const connectorNotifyCount = uiRequests.filter((request) => request.method === "notify").length;
	await runPrompt("/check-connectors");
	const connectorNotify = await waitForUiRequest(
		(request, index) => index >= connectorNotifyCount && request.method === "notify",
		20000,
	);
	assert(String(connectorNotify.message).length > 0, "connector check notification was empty");

	const reportNotifyCount = uiRequests.filter((request) => request.method === "notify").length;
	await runPrompt("/report");
	await waitForUiRequest((request) => request.method === "set_editor_text", 10000);
	const reportNotify = await waitForUiRequest(
		(request, index) => index >= reportNotifyCount && request.method === "notify" && String(request.message).includes("Report written to"),
		10000,
	);
	const relativeReportPath = String(reportNotify.message).replace(/^Report written to /, "").trim();
	assert(relativeReportPath.length > 0, "report notification path missing");

	const reportPath = path.join(workspaceDir, relativeReportPath);
	assert(fs.existsSync(reportPath), `report file does not exist: ${reportPath}`);
	const reportContent = fs.readFileSync(reportPath, "utf8");
	assert(reportContent.includes("Service: kite-api"), "report does not include service");
	assert(reportContent.includes("Since: 2h"), "report does not include time window");
	assert(uiRequests.some((request) => request.method === "set_editor_text"), "report did not push markdown into editor");

	console.log("Smoke test passed");
	console.log(`Workspace: ${workspaceDir}`);
	console.log(`Report: ${reportPath}`);
} finally {
	shuttingDown = true;
	child.kill("SIGTERM");
	await sleep(150);
	if (process.env.KEEP_SMOKE_TMP !== "1") {
		fs.rmSync(tempRoot, { recursive: true, force: true });
	} else {
		console.log(`Kept temp workspace at: ${tempRoot}`);
	}
}

function handleLine(line) {
	let payload;
	try {
		payload = JSON.parse(line);
	} catch (error) {
		throw new Error(`Failed to parse RPC line: ${line}\n${error}`);
	}

	if (payload.type === "response" && payload.id) {
		const pending = responses.get(payload.id);
		if (pending) {
			responses.delete(payload.id);
			pending.resolve(payload);
			return;
		}
	}

	if (payload.type === "extension_ui_request") {
		uiRequests.push(payload);
		respondToUiRequest(payload);
	}
}

function respondToUiRequest(request) {
	if (request.method === "select") {
		const option = request.options.find((entry) => entry.includes("Zerodha Service Investigation")) ?? request.options[0];
		send({ type: "extension_ui_response", id: request.id, value: option });
		return;
	}

	if (request.method === "input") {
		const title = String(request.title || "");
		if (title.includes("Service")) {
			send({ type: "extension_ui_response", id: request.id, value: "kite-api" });
			return;
		}
		if (title.includes("Time window")) {
			send({ type: "extension_ui_response", id: request.id, value: "2h" });
			return;
		}
		if (title.includes("Notes")) {
			send({ type: "extension_ui_response", id: request.id, value: "smoke-test" });
			return;
		}
		send({ type: "extension_ui_response", id: request.id, value: "smoke-test" });
		return;
	}

	if (request.method === "confirm") {
		send({ type: "extension_ui_response", id: request.id, confirmed: true });
	}
}

function send(payload) {
	child.stdin.write(`${JSON.stringify(payload)}\n`);
}

function rpcRequest(payload) {
	const id = `req-${++requestCounter}`;
	const message = { ...payload, id };
	return new Promise((resolve, reject) => {
		responses.set(id, { resolve, reject });
		send(message);
	});
}

async function runPrompt(message) {
	const response = await rpcRequest({ type: "prompt", message });
	assert(response.success === true, `prompt failed: ${message}`);
}

async function waitForUiRequest(predicate, timeoutMs = 10000) {
	const startedAt = Date.now();
	for (;;) {
		for (let index = 0; index < uiRequests.length; index++) {
			const request = uiRequests[index];
			if (predicate(request, index)) {
				return request;
			}
		}
		if (Date.now() - startedAt > timeoutMs) {
			throw new Error(`Timed out waiting for UI request. Seen requests: ${JSON.stringify(uiRequests, null, 2)}`);
		}
		await sleep(50);
	}
}

function parseArgs(argv) {
	const result = {};
	for (let index = 0; index < argv.length; index++) {
		const current = argv[index];
		if (current === "--overlay") {
			result.overlay = argv[index + 1];
			index += 1;
			continue;
		}
		if (current === "--public-only") {
			result.publicOnly = true;
		}
	}
	return result;
}

function assert(condition, message) {
	if (!condition) {
		throw new Error(message);
	}
}

function sleep(ms) {
	return new Promise((resolve) => setTimeout(resolve, ms));
}
