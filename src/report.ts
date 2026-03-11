import * as fs from "node:fs";
import * as path from "node:path";
import type { IncidentTemplate } from "./overlay-types";
import type { IncidentModeState } from "./state";

interface BuildReportInput {
	state: IncidentModeState;
	template?: IncidentTemplate;
	preferredSkills?: string[];
	promptPreambles?: string[];
	timezoneHint?: string;
	generatedAt?: Date;
}

export function buildIncidentReportMarkdown(input: BuildReportInput): string {
	const generatedAt = input.generatedAt ?? new Date();
	const iso = generatedAt.toISOString();
	const preferredSkills = input.preferredSkills ?? [];
	const promptPreambles = input.promptPreambles ?? [];
	const templateLabel = input.template?.label ?? input.state.templateId;

	const lines = [
		`# Incident Report — ${templateLabel}`,
		"",
		`- Generated at: ${iso}`,
		`- Service: ${input.state.service ?? "(not specified)"}`,
		`- Since: ${input.state.since ?? "(not specified)"}`,
		`- Template: ${templateLabel}`,
		"",
		"## Summary",
		"- Fill in a concise operator-facing summary here.",
		"",
		"## Incident Context",
		`- Template ID: ${input.state.templateId}`,
		`- Notes: ${input.state.notes ?? "(none)"}`,
	];

	if (input.timezoneHint) {
		lines.push(`- Timezone hint: ${input.timezoneHint}`);
	}

	lines.push("", "## Findings", "- Finding 1", "", "## Evidence", "- Evidence snippet or command output summary");
	lines.push("", "## Timeline", "- Add UTC and local-time aligned events here.");
	lines.push("", "## Root Cause Hypothesis", "- State current best explanation and confidence.");
	lines.push("", "## Actions", "- Mitigation:", "- Prevention:", "- Detection:");

	if (preferredSkills.length > 0) {
		lines.push("", "## Preferred Skills", ...preferredSkills.map((skill) => `- ${skill}`));
	}

	if (promptPreambles.length > 0) {
		lines.push("", "## Overlay Guidance", ...promptPreambles.map((entry) => `- ${entry}`));
	}

	if (input.template?.prompt) {
		lines.push("", "## Template Focus", input.template.prompt);
	}

	return lines.join("\n");
}

export function resolveReportPath(
	cwd: string,
	state: IncidentModeState,
	template?: IncidentTemplate,
	pathPattern?: string,
	generatedAt = new Date(),
): string {
	const date = generatedAt.toISOString().slice(0, 10);
	const slug = buildReportSlug(state, template);
	const service = slugify(state.service ?? "service");
	const templatePart = slugify(template?.id ?? state.templateId);
	const relativePath = (pathPattern ?? `reports/{{date}}-{{slug}}.md`)
		.replaceAll("{{date}}", date)
		.replaceAll("{{slug}}", slug)
		.replaceAll("{{service}}", service)
		.replaceAll("{{template}}", templatePart);
	return path.resolve(cwd, relativePath);
}

export function writeIncidentReport(filePath: string, markdown: string): void {
	fs.mkdirSync(path.dirname(filePath), { recursive: true });
	fs.writeFileSync(filePath, markdown);
}

function buildReportSlug(state: IncidentModeState, template?: IncidentTemplate): string {
	const parts = [
		state.service,
		template?.id ?? state.templateId,
	].filter(Boolean) as string[];
	return slugify(parts.join("-")) || "incident-report";
}

function slugify(value: string): string {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "")
		.replace(/-{2,}/g, "-");
}
