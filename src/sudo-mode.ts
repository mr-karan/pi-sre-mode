import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";

export const SUDO_MODE_STATE_ENTRY = "incident-sudo-mode-state";

export interface SudoModeState {
	enabled: boolean;
	updatedAt: number;
}

export function defaultSudoModeState(): SudoModeState {
	return {
		enabled: false,
		updatedAt: 0,
	};
}

export function persistSudoModeState(pi: ExtensionAPI, state: SudoModeState): void {
	pi.appendEntry<SudoModeState>(SUDO_MODE_STATE_ENTRY, {
		...state,
		updatedAt: Date.now(),
	});
}

export function restoreSudoModeState(ctx: ExtensionContext): SudoModeState {
	let restored = defaultSudoModeState();

	for (const entry of ctx.sessionManager.getBranch()) {
		if (entry.type !== "custom") continue;
		if (entry.customType !== SUDO_MODE_STATE_ENTRY) continue;
		restored = normalizeSudoModeState(entry.data);
	}

	return restored;
}

export function formatSudoModeStatus(state: SudoModeState): string | undefined {
	return state.enabled ? "sudo:on" : undefined;
}

function normalizeSudoModeState(value: unknown): SudoModeState {
	const fallback = defaultSudoModeState();
	if (!value || typeof value !== "object") return fallback;

	const record = value as Record<string, unknown>;
	return {
		enabled: record.enabled === true,
		updatedAt: asNumber(record.updatedAt) ?? fallback.updatedAt,
	};
}

function asNumber(value: unknown): number | undefined {
	if (typeof value !== "number") return undefined;
	return Number.isFinite(value) ? value : undefined;
}
