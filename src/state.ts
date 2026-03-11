import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

export const INCIDENT_MODE_STATE_ENTRY = "incident-mode-state";

export interface IncidentModeState {
	enabled: boolean;
	templateId: string;
	service?: string;
	since?: string;
	notes?: string;
	updatedAt: number;
}

export function defaultIncidentState(): IncidentModeState {
	return {
		enabled: false,
		templateId: "custom",
		updatedAt: 0,
	};
}

export function persistIncidentState(pi: ExtensionAPI, state: IncidentModeState): void {
	pi.appendEntry<IncidentModeState>(INCIDENT_MODE_STATE_ENTRY, {
		...state,
		updatedAt: Date.now(),
	});
}

export function restoreIncidentState(ctx: ExtensionContext): IncidentModeState {
	let restored = defaultIncidentState();

	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type !== "custom") continue;
		if (entry.customType !== INCIDENT_MODE_STATE_ENTRY) continue;
		restored = normalizeIncidentState(entry.data);
	}

	return restored;
}

export function formatIncidentStatus(state: IncidentModeState, templateLabel?: string): string | undefined {
	if (!state.enabled) return undefined;

	const parts = [
		`incident:${templateLabel ?? state.templateId}`,
		state.service ? `svc:${state.service}` : undefined,
		state.since ? `since:${state.since}` : undefined,
	].filter(Boolean);
	return parts.join(" ");
}

export function buildIncidentWidgetLines(
	state: IncidentModeState,
	templateLabel?: string,
	timezoneHint?: string,
	preferredSkills: string[] = [],
): string[] | undefined {
	if (!state.enabled) return undefined;

	const lines = [
		`Incident mode: ${templateLabel ?? state.templateId}`,
		`Service: ${state.service ?? "(not set)"}`,
		`Since: ${state.since ?? "(not set)"}`,
	];

	if (state.notes) {
		lines.push(`Notes: ${state.notes}`);
	}

	if (timezoneHint) {
		lines.push(`Timezone: ${timezoneHint}`);
	}

	if (preferredSkills.length > 0) {
		lines.push(`Skills: ${preferredSkills.join(", ")}`);
	}

	return lines;
}

function normalizeIncidentState(value: unknown): IncidentModeState {
	const fallback = defaultIncidentState();
	if (!value || typeof value !== "object") return fallback;

	const record = value as Record<string, unknown>;
	return {
		enabled: record.enabled === true,
		templateId: asString(record.templateId) ?? fallback.templateId,
		service: asString(record.service),
		since: asString(record.since),
		notes: asString(record.notes),
		updatedAt: asNumber(record.updatedAt) ?? fallback.updatedAt,
	};
}

function asString(value: unknown): string | undefined {
	if (typeof value !== "string") return undefined;
	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

function asNumber(value: unknown): number | undefined {
	if (typeof value !== "number") return undefined;
	return Number.isFinite(value) ? value : undefined;
}
