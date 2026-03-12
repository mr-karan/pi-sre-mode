import * as path from "node:path";
import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import {
	formatConnectorCheckResults,
	mergeConnectorChecks,
	runConnectorChecks,
} from "../src/connector-checks";
import {
	buildGuardrailsPromptSection,
	getGuardrailBlockReason,
} from "../src/guardrails";
import {
	INCIDENT_MODE_OVERLAY_EVENT,
	type EffectiveOverlayConfig,
	type IncidentOverlay,
} from "../src/overlay-types";
import {
	buildIncidentReportMarkdown,
	resolveReportPath,
	writeIncidentReport,
} from "../src/report";
import {
	buildIncidentWidgetLines,
	defaultIncidentState,
	formatIncidentStatus,
	persistIncidentState,
	restoreIncidentState,
	type IncidentModeState,
} from "../src/state";
import {
	defaultSudoModeState,
	formatSudoModeStatus,
	persistSudoModeState,
	restoreSudoModeState,
	type SudoModeState,
} from "../src/sudo-mode";
import {
	findIncidentTemplate,
	mergeIncidentTemplates,
} from "../src/template-catalog";

const STATUS_KEY = "incident-mode";
const CHECK_STATUS_KEY = "incident-mode-checks";
const SUDO_STATUS_KEY = "incident-sudo";
const WIDGET_KEY = "incident-mode";

export default function incidentMode(pi: ExtensionAPI) {
	const overlays = new Map<string, IncidentOverlay>();
	let currentState = defaultIncidentState();
	let sudoModeState = defaultSudoModeState();
	let lastContext: ExtensionContext | undefined;

	const unsubscribeOverlayRegistration = pi.events.on(INCIDENT_MODE_OVERLAY_EVENT, (payload) => {
		const overlay = asIncidentOverlay(payload);
		if (!overlay) return;
		overlays.set(overlay.id, overlay);
		if (!lastContext) return;
		applyUi(lastContext, currentState, getEffectiveOverlayConfig());
	});

	function getEffectiveOverlayConfig(): EffectiveOverlayConfig {
		const ordered = [...overlays.values()].sort((left, right) => (left.priority ?? 0) - (right.priority ?? 0));
		const promptPreambles = ordered
			.map((overlay) => overlay.promptPreamble?.trim())
			.filter((entry): entry is string => Boolean(entry));
		const defaultSkills = dedupeStrings(ordered.flatMap((overlay) => overlay.defaultSkills ?? []));
		const reportPathPattern = ordered.reduce<string | undefined>((current, overlay) => overlay.reportPathPattern ?? current, undefined);
		const timezoneHint = ordered.reduce<string | undefined>((current, overlay) => overlay.timezoneHint ?? current, undefined);

		return {
			templates: mergeIncidentTemplates(ordered),
			connectorChecks: mergeConnectorChecks(ordered),
			defaultSkills,
			promptPreambles,
			reportPathPattern,
			timezoneHint,
		};
	}

	function restoreState(ctx: ExtensionContext): void {
		lastContext = ctx;
		currentState = restoreIncidentState(ctx);
		sudoModeState = restoreSudoModeState(ctx);
		applyUi(ctx, currentState, getEffectiveOverlayConfig());
	}

	function setState(ctx: ExtensionContext, nextState: IncidentModeState): void {
		currentState = {
			...nextState,
			updatedAt: Date.now(),
		};
		persistIncidentState(pi, currentState);
		applyUi(ctx, currentState, getEffectiveOverlayConfig());
	}

	function setSudoMode(ctx: ExtensionContext, enabled: boolean): void {
		sudoModeState = {
			enabled,
			updatedAt: Date.now(),
		};
		persistSudoModeState(pi, sudoModeState);
		applyUi(ctx, currentState, getEffectiveOverlayConfig());
	}

	function carryStateAcrossBranch(ctx: ExtensionContext, reason: string): void {
		const previousState = currentState;
		const previousSudoModeState = sudoModeState;
		restoreState(ctx);

		if (previousState.enabled && !currentState.enabled) {
			setState(ctx, {
				...previousState,
				updatedAt: Date.now(),
			});
			ctx.ui.notify(`Incident mode carried into this branch after ${reason}.`, "info");
		}

		if (previousSudoModeState.enabled && !sudoModeState.enabled) {
			setSudoMode(ctx, true);
			ctx.ui.notify(`Sudo mode carried into this branch after ${reason}.`, "warning");
		}
	}

	function applyUi(ctx: ExtensionContext, state: IncidentModeState, config: EffectiveOverlayConfig): void {
		if (!ctx.hasUI) return;

		const template = findIncidentTemplate(config.templates, state.templateId);
		const status = formatIncidentStatus(state, template?.label);
		ctx.ui.setStatus(STATUS_KEY, status);
		ctx.ui.setStatus(SUDO_STATUS_KEY, formatSudoModeStatus(sudoModeState));

		const widget = buildIncidentWidgetLines(state, template?.label, config.timezoneHint, config.defaultSkills);
		ctx.ui.setWidget(WIDGET_KEY, widget);
	}

	pi.on("session_start", async (_event, ctx) => {
		restoreState(ctx);
	});

	pi.on("session_tree", async (_event, ctx) => {
		carryStateAcrossBranch(ctx, "tree navigation");
	});

	pi.on("session_fork", async (_event, ctx) => {
		carryStateAcrossBranch(ctx, "fork");
	});

	pi.on("session_switch", async (_event, ctx) => {
		restoreState(ctx);
	});

	pi.on("session_shutdown", async () => {
		unsubscribeOverlayRegistration();
	});

	pi.on("before_agent_start", (event) => {
		if (!currentState.enabled) return;

		const config = getEffectiveOverlayConfig();
		const template = findIncidentTemplate(config.templates, currentState.templateId);
		const sections = [
			buildGuardrailsPromptSection(sudoModeState.enabled),
			buildIncidentContextSection(currentState, template?.label),
			template?.prompt ? `## Template Focus\n${template.prompt}` : undefined,
			config.timezoneHint ? `## Timezone Hint\n- ${config.timezoneHint}` : undefined,
			config.defaultSkills.length > 0 ? ["## Preferred Skills", ...config.defaultSkills.map((skill) => `- ${skill}`)].join("\n") : undefined,
			config.promptPreambles.length > 0 ? ["## Overlay Guidance", ...config.promptPreambles.map((entry) => `- ${entry}`)].join("\n") : undefined,
		]
			.filter((section): section is string => Boolean(section))
			.join("\n\n");

		return {
			systemPrompt: `${event.systemPrompt}\n\n${sections}`,
		};
	});

	pi.on("tool_call", async (event) => {
		if (!currentState.enabled) return;
		if (sudoModeState.enabled) return;

		const reason = getGuardrailBlockReason(event.toolName, event.input as Record<string, unknown>);
		if (!reason) return;
		return { block: true, reason };
	});

	pi.registerCommand("incident", {
		description: "Configure incident mode for the current session",
		handler: async (_args, ctx) => {
			lastContext = ctx;
			const config = getEffectiveOverlayConfig();
			const templateOptions = config.templates.map((template) => `${template.icon ?? "🔍"} ${template.label} — ${template.description}`);
			const selection = await ctx.ui.select("Incident template", templateOptions);
			if (!selection) return;

			const templateIndex = templateOptions.indexOf(selection);
			const template = config.templates[templateIndex];
			if (!template) return;

			const service = await ctx.ui.input("Service (optional):", currentState.service ?? "e.g. api-service");
			if (service === undefined) return;

			const sincePlaceholder = currentState.since ?? template.defaultSince ?? "e.g. 2h";
			const since = await ctx.ui.input("Time window (optional):", sincePlaceholder);
			if (since === undefined) return;

			const notes = await ctx.ui.input("Notes (optional):", currentState.notes ?? "extra hypotheses or context");
			if (notes === undefined) return;

			setState(ctx, {
				enabled: true,
				templateId: template.id,
				service: normalizeOptionalText(service),
				since: normalizeOptionalText(since) ?? template.defaultSince,
				notes: normalizeOptionalText(notes),
				updatedAt: Date.now(),
			});

			ctx.ui.notify(`Incident mode enabled: ${template.label}`, "info");
		},
	});

	pi.registerCommand("incident-reset", {
		description: "Disable incident mode for the current session",
		handler: async (_args, ctx) => {
			lastContext = ctx;
			setState(ctx, {
				...defaultIncidentState(),
				updatedAt: Date.now(),
			});
			ctx.ui.setStatus(CHECK_STATUS_KEY, undefined);
			ctx.ui.notify("Incident mode cleared", "info");
		},
	});

	pi.registerCommand("sudo", {
		description: "Enable sudo mode and bypass incident permission checks",
		handler: async (_args, ctx) => {
			lastContext = ctx;
			if (sudoModeState.enabled) {
				ctx.ui.notify("Sudo mode is already active. Permission checks are bypassed.", "warning");
				applyUi(ctx, currentState, getEffectiveOverlayConfig());
				return;
			}

			setSudoMode(ctx, true);
			ctx.ui.notify("Sudo mode is active. Permission checks will be bypassed.", "warning");
		},
	});

	pi.registerCommand("sudo-off", {
		description: "Disable sudo mode and restore incident permission checks",
		handler: async (_args, ctx) => {
			lastContext = ctx;
			if (!sudoModeState.enabled) {
				ctx.ui.notify("Sudo mode is already disabled.", "info");
				applyUi(ctx, currentState, getEffectiveOverlayConfig());
				return;
			}

			setSudoMode(ctx, false);
			ctx.ui.notify("Sudo mode disabled. Incident permission checks restored.", "info");
		},
	});

	pi.registerCommand("check-connectors", {
		description: "Run connector and environment preflight checks",
		handler: async (_args, ctx) => {
			lastContext = ctx;
			const config = getEffectiveOverlayConfig();
			if (config.connectorChecks.length === 0) {
				ctx.ui.notify("No connector checks configured", "warning");
				return;
			}

			ctx.ui.setStatus(CHECK_STATUS_KEY, "checking connectors...");
			const results = await runConnectorChecks((command, args, options) => pi.exec(command, args, options), config.connectorChecks);
			ctx.ui.setStatus(CHECK_STATUS_KEY, undefined);
			applyUi(ctx, currentState, config);

			const lines = formatConnectorCheckResults(results);
			const hasFailure = results.some((result) => result.status === "fail");
			ctx.ui.notify(lines.join("\n"), hasFailure ? "warning" : "info");
		},
	});

	pi.registerCommand("report", {
		description: "Generate a markdown incident report from the current incident context",
		handler: async (_args, ctx) => {
			lastContext = ctx;
			if (!currentState.enabled) {
				ctx.ui.notify("Incident mode is not active. Run /incident first.", "warning");
				return;
			}

			const config = getEffectiveOverlayConfig();
			const template = findIncidentTemplate(config.templates, currentState.templateId);
			const markdown = buildIncidentReportMarkdown({
				state: currentState,
				template,
				preferredSkills: config.defaultSkills,
				promptPreambles: config.promptPreambles,
				timezoneHint: config.timezoneHint,
			});
			const filePath = resolveReportPath(ctx.cwd, currentState, template, config.reportPathPattern);
			const confirmed = await ctx.ui.confirm("Write incident report?", `Write report to ${path.relative(ctx.cwd, filePath)}`);
			if (!confirmed) return;

			writeIncidentReport(filePath, markdown);
			ctx.ui.setEditorText(markdown);
			ctx.ui.notify(`Report written to ${path.relative(ctx.cwd, filePath)}`, "info");
		},
	});
}

function asIncidentOverlay(value: unknown): IncidentOverlay | undefined {
	if (!value || typeof value !== "object") return undefined;
	const record = value as Record<string, unknown>;
	if (typeof record.id !== "string" || record.id.trim().length === 0) return undefined;
	if (record.templates !== undefined && !Array.isArray(record.templates)) return undefined;
	if (record.connectorChecks !== undefined && !Array.isArray(record.connectorChecks)) return undefined;
	if (record.defaultSkills !== undefined && !Array.isArray(record.defaultSkills)) return undefined;
	if (record.priority !== undefined && typeof record.priority !== "number") return undefined;
	if (record.promptPreamble !== undefined && typeof record.promptPreamble !== "string") return undefined;
	if (record.reportPathPattern !== undefined && typeof record.reportPathPattern !== "string") return undefined;
	if (record.timezoneHint !== undefined && typeof record.timezoneHint !== "string") return undefined;
	return value as IncidentOverlay;
}

function buildIncidentContextSection(state: IncidentModeState, templateLabel?: string): string {
	const lines = [
		"## Incident Context",
		`- Template: ${templateLabel ?? state.templateId}`,
		`- Service: ${state.service ?? "(not specified)"}`,
		`- Since: ${state.since ?? "(not specified)"}`,
		`- Notes: ${state.notes ?? "(none)"}`,
	];
	return lines.join("\n");
}

function dedupeStrings(values: string[]): string[] {
	const deduped = new Set<string>();
	for (const value of values) {
		const normalized = normalizeOptionalText(value);
		if (!normalized) continue;
		deduped.add(normalized);
	}
	return [...deduped];
}

function normalizeOptionalText(value: string | undefined): string | undefined {
	if (!value) return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}
