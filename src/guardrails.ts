const TOKEN_PREFIX = "(?:^|[\\s'\"`;()|&])";
const OPTIONAL_PATH_PREFIX = "(?:\\\\)?(?:/(?:usr/)?bin/)?";

const BLOCKED_BASH_PATTERNS: Array<{ match: RegExp; reason: string }> = [
	{ match: new RegExp(`${TOKEN_PREFIX}${OPTIONAL_PATH_PREFIX}sudo(?:\\s|$)`), reason: "Incident mode blocks sudo." },
	{ match: new RegExp(`${TOKEN_PREFIX}${OPTIONAL_PATH_PREFIX}rm(?:\\s|$)`), reason: "Incident mode blocks file deletion." },
	{ match: new RegExp(`${TOKEN_PREFIX}${OPTIONAL_PATH_PREFIX}mv(?:\\s|$)`), reason: "Incident mode blocks file moves and renames." },
	{ match: new RegExp(`${TOKEN_PREFIX}${OPTIONAL_PATH_PREFIX}chmod(?:\\s|$)`), reason: "Incident mode blocks permission changes." },
	{ match: new RegExp(`${TOKEN_PREFIX}${OPTIONAL_PATH_PREFIX}chown(?:\\s|$)`), reason: "Incident mode blocks ownership changes." },
	{ match: new RegExp(`${TOKEN_PREFIX}${OPTIONAL_PATH_PREFIX}(?:kill|pkill|killall)(?:\\s|$)`), reason: "Incident mode blocks process termination." },
	{ match: /(?:^|\s)(?:\/bin\/)?(?:ba|z)?sh\s+-[a-z]*c\b/, reason: "Incident mode blocks shell trampoline commands like bash -c." },
	{ match: /(?:^|\s)(?:env\s+)?(?:bash|sh|zsh|dash)\s+-[a-z]*c\b/, reason: "Incident mode blocks shell trampoline commands like sh -c." },
	{ match: /(^|\s)eval(\s|$)/, reason: "Incident mode blocks eval-style command execution." },
	{ match: /\$\(/, reason: "Incident mode blocks subshell command execution." },
	{ match: /`[^`]*`/, reason: "Incident mode blocks backtick command substitution." },
	{ match: /systemctl\s+(restart|stop|start)\b/, reason: "Incident mode blocks systemctl mutations." },
	{ match: /nomad\s+job\s+(run|stop|dispatch)\b/, reason: "Incident mode blocks mutating Nomad job commands." },
	{ match: /nomad\s+alloc\s+stop\b/, reason: "Incident mode blocks mutating Nomad allocation commands." },
	{ match: /aws\s+[a-z0-9-]+\s+(create|delete|update|put|run|start|stop|terminate|reboot|cp|sync|mv|rm)\b/i, reason: "Incident mode blocks mutating AWS CLI commands." },
	{ match: /(^|\s)tee(\s|$)/, reason: "Incident mode blocks tee because it can write or truncate files." },
];

export function buildGuardrailsPromptSection(sudoModeEnabled: boolean): string {
	const accessLine = sudoModeEnabled
		? "- Sudo mode is active. pi-sre-mode permission checks are bypassed and full write/edit/bash access is allowed."
		: "- Treat this session as read-only incident investigation.";

	return [
		"## Incident Mode Constraints",
		accessLine,
		"- Prefer evidence over speculation.",
		"- State uncertainty explicitly.",
		"- Build a timeline before concluding root cause.",
		"- Use relevant skills before improvising complex workflows.",
		"- Keep conclusions operator-friendly: findings, evidence, impact, next actions.",
	].join("\n");
}

export function getGuardrailBlockReason(toolName: string, input: Record<string, unknown>): string | undefined {
	if (toolName === "write" || toolName === "edit") {
		return "Incident mode is read-only and blocks write/edit tools.";
	}

	if (toolName !== "bash") return undefined;
	const command = typeof input.command === "string" ? input.command.trim() : undefined;
	if (!command) return undefined;

	for (const rule of BLOCKED_BASH_PATTERNS) {
		if (!rule.match.test(command)) continue;
		return rule.reason;
	}

	return undefined;
}
