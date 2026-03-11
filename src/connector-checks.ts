import type { IncidentOverlay, ConnectorCheck } from "./overlay-types";

export interface ConnectorCheckResult {
	id: string;
	label: string;
	command: string;
	status: "pass" | "fail";
	exitCode: number | null;
	output: string;
}

export interface ExecResult {
	stdout: string;
	stderr: string;
	code: number;
	killed?: boolean;
}

export type ExecFunction = (command: string, args: string[], options?: { timeout?: number }) => Promise<ExecResult>;

export const DEFAULT_CONNECTOR_CHECKS: ConnectorCheck[] = [
	{
		id: "aws",
		label: "AWS CLI",
		command: "command -v aws >/dev/null 2>&1 && aws --version",
		timeoutSeconds: 10,
	},
	{
		id: "curl",
		label: "curl",
		command: "command -v curl >/dev/null 2>&1 && curl --version | head -1",
		timeoutSeconds: 10,
	},
	{
		id: "ssh",
		label: "SSH",
		command: "command -v ssh >/dev/null 2>&1 && ssh -V",
		timeoutSeconds: 10,
	},
];

export function mergeConnectorChecks(overlays: IncidentOverlay[]): ConnectorCheck[] {
	const merged = new Map<string, ConnectorCheck>();

	for (const check of DEFAULT_CONNECTOR_CHECKS) {
		merged.set(check.id, check);
	}

	const ordered = [...overlays].sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0));
	for (const overlay of ordered) {
		for (const check of overlay.connectorChecks ?? []) {
			merged.set(check.id, check);
		}
	}

	return [...merged.values()].sort((left, right) => left.label.localeCompare(right.label));
}

export async function runConnectorChecks(exec: ExecFunction, checks: ConnectorCheck[]): Promise<ConnectorCheckResult[]> {
	return Promise.all(
		checks.map(async (check) => {
			try {
				const result = await exec("bash", ["-lc", check.command], {
					timeout: (check.timeoutSeconds ?? 10) * 1000,
				});
				const output = trimOutput(`${result.stdout}\n${result.stderr}`);
				return {
					id: check.id,
					label: check.label,
					command: check.command,
					status: result.code === 0 ? "pass" : "fail",
					exitCode: result.code,
					output,
				} satisfies ConnectorCheckResult;
			} catch (error) {
				return {
					id: check.id,
					label: check.label,
					command: check.command,
					status: "fail",
					exitCode: null,
					output: error instanceof Error ? error.message : String(error),
				} satisfies ConnectorCheckResult;
			}
		}),
	);
}

export function formatConnectorCheckResults(results: ConnectorCheckResult[]): string[] {
	return results.map((result) => {
		const icon = result.status === "pass" ? "✓" : "✗";
		const suffix = result.output ? ` — ${result.output}` : "";
		return `${icon} ${result.label}${suffix}`;
	});
}

function trimOutput(output: string): string {
	const compact = output.trim().replace(/\s+/g, " ");
	if (compact.length <= 160) return compact;
	return `${compact.slice(0, 157)}...`;
}
