import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

export default function localOverlay(pi: ExtensionAPI) {
	pi.on("session_start", async () => {
		pi.events.emit("incident-mode:register-overlay", {
			id: "local-overlay",
			priority: 100,
			timezoneHint: "Example timezone hint: logs may differ from metrics.",
			defaultSkills: ["demo-topology", "sre-methodology"],
			connectorChecks: [
				{
					id: "demo-cli",
					label: "Demo CLI",
					command: "printf 'demo cli reachable'",
					timeoutSeconds: 5,
				},
			],
			templates: [
				{
					id: "demo-api-latency",
					label: "Demo API Latency",
					description: "Example overlay template for API latency investigations.",
					icon: "🧪",
					defaultSince: "90m",
					defaultSkills: ["demo-topology", "generic-investigation"],
					prompt: "Investigate API latency using the overlay-provided topology and service hints before concluding root cause.",
				},
			],
			promptPreamble: "Use overlay-specific topology knowledge when the demo template is selected.",
		});
	});
}
