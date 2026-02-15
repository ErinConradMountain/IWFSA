import path from "node:path";

function parseBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parsePort(value, key) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 65535) {
    throw new Error(`${key} must be an integer between 0 and 65535.`);
  }
  return parsed;
}

function parseUrl(value, key) {
  try {
    return new URL(value).toString().replace(/\/$/, "");
  } catch {
    throw new Error(`${key} must be a valid URL.`);
  }
}

function parseCsvList(value, fallback = []) {
  if (value === undefined || value === null || String(value).trim() === "") {
    return [...fallback];
  }

  const items = String(value)
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return items.length > 0 ? [...new Set(items)] : [...fallback];
}

export function getApiConfig(env = process.env) {
  const host = env.API_HOST || "127.0.0.1";
  const port = parsePort(env.API_PORT || "4000", "API_PORT");
  const databasePath = path.resolve(process.cwd(), env.DATABASE_PATH || "./data/iwfsa.db");
  const appBaseUrl = parseUrl(env.APP_BASE_URL || "http://127.0.0.1:3000", "APP_BASE_URL");
  const sharePointEnabled = parseBoolean(env.FEATURE_SHAREPOINT_DOCUMENTS, false);
  const teamsGraphEnabled = parseBoolean(env.FEATURE_TEAMS_GRAPH_AUTOMATION, false);
  const calendarSyncEnabled = parseBoolean(env.FEATURE_CALENDAR_OAUTH_SYNC, false);
  const defaultDocumentExtensions = [
    "pdf",
    "txt",
    "csv",
    "doc",
    "docx",
    "rtf",
    "odt",
    "xls",
    "xlsx",
    "ppt",
    "pptx"
  ];
  const defaultDocumentMimeTypes = [
    "application/pdf",
    "text/plain",
    "text/csv",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/rtf",
    "text/rtf",
    "application/vnd.oasis.opendocument.text",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  ];

  return {
    host,
    port,
    databasePath,
    appBaseUrl,
    sharePoint: {
      enabled: sharePointEnabled,
      tenantId: env.SHAREPOINT_TENANT_ID || "",
      clientId: env.SHAREPOINT_CLIENT_ID || "",
      clientSecret: env.SHAREPOINT_CLIENT_SECRET || "",
      siteId: env.SHAREPOINT_SITE_ID || "",
      driveId: env.SHAREPOINT_DRIVE_ID || ""
    },
    teamsGraph: {
      enabled: teamsGraphEnabled,
      tenantId: env.M365_TENANT_ID || "",
      clientId: env.M365_CLIENT_ID || "",
      clientSecret: env.M365_CLIENT_SECRET || "",
      organizerUpn: env.M365_ORGANIZER_UPN || "",
      graphBaseUrl: env.M365_GRAPH_BASE_URL || "https://graph.microsoft.com"
    },
    calendarSync: {
      enabled: calendarSyncEnabled,
      google: {
        clientId: env.GOOGLE_CALENDAR_CLIENT_ID || "",
        clientSecret: env.GOOGLE_CALENDAR_CLIENT_SECRET || "",
        redirectUri: env.GOOGLE_CALENDAR_REDIRECT_URI || ""
      },
      outlook: {
        clientId: env.OUTLOOK_CALENDAR_CLIENT_ID || "",
        clientSecret: env.OUTLOOK_CALENDAR_CLIENT_SECRET || "",
        redirectUri: env.OUTLOOK_CALENDAR_REDIRECT_URI || ""
      }
    },
    documentUploads: {
      allowedExtensions: parseCsvList(env.EVENT_DOCUMENT_ALLOWED_EXTENSIONS, defaultDocumentExtensions),
      allowedMimeTypes: parseCsvList(env.EVENT_DOCUMENT_ALLOWED_MIME_TYPES, defaultDocumentMimeTypes)
    }
  };
}
