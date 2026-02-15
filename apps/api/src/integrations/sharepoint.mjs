function encodePathSegment(segment) {
  return encodeURIComponent(String(segment || "").trim());
}

function sanitizeFileName(fileName) {
  const cleaned = String(fileName || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ");
  return cleaned || `document-${Date.now()}.bin`;
}

async function parseJsonSafe(response) {
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function assertConfigured(config) {
  const missing = [];
  if (!config?.tenantId) missing.push("SHAREPOINT_TENANT_ID");
  if (!config?.clientId) missing.push("SHAREPOINT_CLIENT_ID");
  if (!config?.clientSecret) missing.push("SHAREPOINT_CLIENT_SECRET");
  if (!config?.siteId) missing.push("SHAREPOINT_SITE_ID");
  if (!config?.driveId) missing.push("SHAREPOINT_DRIVE_ID");
  if (missing.length > 0) {
    const error = new Error(`SharePoint integration not configured. Missing: ${missing.join(", ")}`);
    error.code = "sharepoint_not_configured";
    error.httpStatus = 503;
    throw error;
  }
}

export function createSharePointClient(config = {}, { fetchImpl = fetch } = {}) {
  const normalized = {
    enabled: Boolean(config.enabled),
    tenantId: String(config.tenantId || "").trim(),
    clientId: String(config.clientId || "").trim(),
    clientSecret: String(config.clientSecret || "").trim(),
    siteId: String(config.siteId || "").trim(),
    driveId: String(config.driveId || "").trim(),
    graphBaseUrl: String(config.graphBaseUrl || "https://graph.microsoft.com").replace(/\/+$/, "")
  };

  let tokenCache = { value: "", expiresAtMs: 0 };

  async function getAccessToken() {
    if (!normalized.enabled) {
      const error = new Error("SharePoint document flow is disabled.");
      error.code = "feature_disabled";
      error.httpStatus = 503;
      throw error;
    }
    assertConfigured(normalized);

    const now = Date.now();
    if (tokenCache.value && tokenCache.expiresAtMs - 60_000 > now) {
      return tokenCache.value;
    }

    const tokenUrl = `https://login.microsoftonline.com/${encodeURIComponent(normalized.tenantId)}/oauth2/v2.0/token`;
    const form = new URLSearchParams();
    form.set("client_id", normalized.clientId);
    form.set("client_secret", normalized.clientSecret);
    form.set("scope", "https://graph.microsoft.com/.default");
    form.set("grant_type", "client_credentials");

    const response = await fetchImpl(tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    const payload = await parseJsonSafe(response);
    if (!response.ok || !payload?.access_token) {
      const error = new Error("Unable to acquire Microsoft Graph access token.");
      error.code = "sharepoint_auth_failed";
      error.httpStatus = 502;
      error.details = payload;
      throw error;
    }

    const expiresIn = Number(payload.expires_in || 3600);
    tokenCache = {
      value: String(payload.access_token),
      expiresAtMs: now + Math.max(60, expiresIn) * 1000
    };
    return tokenCache.value;
  }

  async function uploadEventDocument({ folderPath, fileName, mimeType, fileBuffer }) {
    const token = await getAccessToken();
    const normalizedFolder = String(folderPath || "")
      .split("/")
      .map((segment) => String(segment || "").trim())
      .filter(Boolean)
      .map(encodePathSegment)
      .join("/");
    const safeFileName = sanitizeFileName(fileName);
    const encodedFileName = encodePathSegment(safeFileName);
    const graphPath = normalizedFolder ? `${normalizedFolder}/${encodedFileName}` : encodedFileName;
    const uploadUrl = `${normalized.graphBaseUrl}/v1.0/sites/${encodeURIComponent(normalized.siteId)}/drives/${encodeURIComponent(normalized.driveId)}/root:/${graphPath}:/content`;

    const response = await fetchImpl(uploadUrl, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": String(mimeType || "application/octet-stream")
      },
      body: fileBuffer
    });
    const payload = await parseJsonSafe(response);
    if (!response.ok || !payload?.id) {
      const error = new Error("SharePoint upload failed.");
      error.code = "sharepoint_upload_failed";
      error.httpStatus = 502;
      error.details = payload;
      throw error;
    }

    return {
      siteId: normalized.siteId,
      driveId: normalized.driveId,
      itemId: String(payload.id),
      webUrl: String(payload.webUrl || "")
    };
  }

  async function downloadEventDocument({ siteId, driveId, itemId }) {
    const token = await getAccessToken();
    const url = `${normalized.graphBaseUrl}/v1.0/sites/${encodeURIComponent(siteId)}/drives/${encodeURIComponent(driveId)}/items/${encodeURIComponent(itemId)}/content`;
    return fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return {
    uploadEventDocument,
    downloadEventDocument
  };
}
