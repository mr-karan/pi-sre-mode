export const INCIDENT_MODE_OVERLAY_EVENT = "incident-mode:register-overlay";

export interface IncidentTemplate {
	id: string;
	label: string;
	description: string;
	icon?: string;
	prompt: string;
	defaultSince?: string;
	defaultSkills?: string[];
}

export interface ConnectorCheck {
	id: string;
	label: string;
	command: string;
	timeoutSeconds?: number;
}

export interface IncidentOverlay {
	id: string;
	priority?: number;
	templates?: IncidentTemplate[];
	connectorChecks?: ConnectorCheck[];
	defaultSkills?: string[];
	promptPreamble?: string;
	reportPathPattern?: string;
	timezoneHint?: string;
}

export interface EffectiveOverlayConfig {
	templates: IncidentTemplate[];
	connectorChecks: ConnectorCheck[];
	defaultSkills: string[];
	promptPreambles: string[];
	reportPathPattern?: string;
	timezoneHint?: string;
}
