import type { IncidentOverlay, IncidentTemplate } from "./overlay-types";

export const DEFAULT_TEMPLATES: IncidentTemplate[] = [
	{
		id: "5xx-spike",
		label: "5xx Spike",
		description: "Sudden increase in HTTP 5xx errors.",
		icon: "🔴",
		defaultSince: "1h",
		prompt: "Focus on edge error rates, backend health, recent deploys, and whether failures are global or isolated to a subset of backends.",
	},
	{
		id: "high-latency",
		label: "High Latency",
		description: "Investigate elevated response times.",
		icon: "🐌",
		defaultSince: "2h",
		prompt: "Focus on latency percentiles, saturation, dependency slowdown, queueing, and whether latency affects all traffic or a narrow path.",
	},
	{
		id: "oom-crash",
		label: "OOM / Crash Loop",
		description: "Investigate restarts, OOMs, and failing workloads.",
		icon: "💥",
		defaultSince: "4h",
		prompt: "Focus on restart history, exit codes, memory growth, limits versus usage, and what changed before failures started.",
	},
	{
		id: "broker-issues",
		label: "Broker Issues",
		description: "Investigate queue, broker, or message bus problems.",
		icon: "📡",
		defaultSince: "1h",
		prompt: "Focus on backlog, slow consumers, disconnects, pending bytes, producer versus consumer imbalance, and downstream symptoms.",
	},
	{
		id: "service-down",
		label: "Service Down",
		description: "Service unreachable or completely broken.",
		icon: "⛔",
		defaultSince: "30m",
		prompt: "Focus on whether the service is running, whether traffic reaches it, whether health checks fail, and whether the outage is node-local or broad.",
	},
	{
		id: "deployment-regression",
		label: "Deploy Regression",
		description: "Issues started after a recent deployment.",
		icon: "🔄",
		defaultSince: "2h",
		prompt: "Focus on what changed, compare before and after deploy, and validate whether the deploy timing aligns with the first anomaly.",
	},
	{
		id: "resource-exhaustion",
		label: "Resource Exhaustion",
		description: "CPU, memory, disk, or pool limits are being hit.",
		icon: "📊",
		defaultSince: "6h",
		prompt: "Focus on saturation relative to allocation or limits, corroborating throttling or restarts, and whether resource pressure is cause or consequence.",
	},
	{
		id: "custom",
		label: "Custom",
		description: "Start from a blank incident context.",
		icon: "🔍",
		prompt: "Investigate the problem systematically. Clarify scope, timeline, blast radius, and evidence before concluding root cause.",
	},
];

function overlayPriority(overlay: IncidentOverlay): number {
	return overlay.priority ?? 0;
}

export function mergeIncidentTemplates(overlays: IncidentOverlay[]): IncidentTemplate[] {
	const merged = new Map<string, IncidentTemplate>();

	for (const template of DEFAULT_TEMPLATES) {
		merged.set(template.id, template);
	}

	const ordered = [...overlays].sort((left, right) => overlayPriority(left) - overlayPriority(right));
	for (const overlay of ordered) {
		for (const template of overlay.templates ?? []) {
			merged.set(template.id, template);
		}
	}

	const templates = [...merged.values()];
	templates.sort((left, right) => {
		if (left.id === "custom") return 1;
		if (right.id === "custom") return -1;
		return left.label.localeCompare(right.label);
	});
	return templates;
}

export function findIncidentTemplate(templates: IncidentTemplate[], templateId: string | undefined): IncidentTemplate | undefined {
	if (!templateId) return undefined;
	return templates.find((template) => template.id === templateId);
}
