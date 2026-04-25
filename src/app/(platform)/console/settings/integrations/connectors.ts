export const KNOWN_CONNECTORS = [
  { id: "stripe", name: "Stripe", desc: "Invoicing + Connect payouts" },
  { id: "anthropic", name: "Anthropic (Claude)", desc: "AI assistant + drafting" },
  { id: "slack", name: "Slack", desc: "Notifications + approvals" },
  { id: "google", name: "Google Workspace", desc: "SSO + Drive" },
  { id: "clickup", name: "ClickUp", desc: "Task sync" },
  { id: "hubspot", name: "HubSpot", desc: "CRM sync" },
  { id: "quickbooks", name: "QuickBooks", desc: "GL + reconciliation" },
] as const;

export type KnownConnector = (typeof KNOWN_CONNECTORS)[number];
