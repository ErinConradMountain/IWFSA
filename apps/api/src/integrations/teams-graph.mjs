function encodePathSegment(value) {
  return encodeURIComponent(String(value || "").trim());
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

function requireConfig(config) {
  const missing = [];
  if (!config.tenantId) missing.push("M365_TENANT_ID");
  if (!config.clientId) missing.push("M365_CLIENT_ID");
  if (!config.clientSecret) missing.push("M365_CLIENT_SECRET");
  if (!config.organizerUpn) missing.push("M365_ORGANIZER_UPN");
  if (missing.length > 0) {
    const error = new Error(`Teams Graph integration not configured. Missing: ${missing.join(", ")}`);
    error.code = "teams_graph_not_configured";
    error.httpStatus = 503;
    throw error;
  }
}

function toGraphDateTime(value) {
  const ms = Date.parse(String(value || ""));
  if (!Number.isFinite(ms)) {
    const error = new Error("Meeting date/time must be a valid ISO value.");
    error.code = "validation_error";
    error.httpStatus = 400;
    throw error;
  }
  return new Date(ms).toISOString();
}

function mapEventPayload({ title, description, startAt, endAt }) {
  return {
    subject: String(title || "IWFSA Meeting"),
    body: {
      contentType: "text",
      content: String(description || "")
    },
    start: {
      dateTime: toGraphDateTime(startAt),
      timeZone: "UTC"
    },
    end: {
      dateTime: toGraphDateTime(endAt),
      timeZone: "UTC"
    },
    isOnlineMeeting: true,
    onlineMeetingProvider: "teamsForBusiness"
  };
}

function extractJoinUrl(payload) {
  const candidates = [
    payload?.onlineMeeting?.joinUrl,
    payload?.onlineMeetingUrl,
    payload?.joinWebUrl
  ];
  for (const candidate of candidates) {
    const url = String(candidate || "").trim();
    if (url) {
      return url;
    }
  }
  return "";
}

export function createTeamsGraphClient(config = {}, { fetchImpl = fetch } = {}) {
  const normalized = {
    enabled: Boolean(config.enabled),
    tenantId: String(config.tenantId || "").trim(),
    clientId: String(config.clientId || "").trim(),
    clientSecret: String(config.clientSecret || "").trim(),
    organizerUpn: String(config.organizerUpn || "").trim(),
    graphBaseUrl: String(config.graphBaseUrl || "https://graph.microsoft.com").replace(/\/+$/, "")
  };

  let tokenCache = { value: "", expiresAtMs: 0 };

  async function getAccessToken() {
    if (!normalized.enabled) {
      const error = new Error("Teams Graph automation is disabled.");
      error.code = "feature_disabled";
      error.httpStatus = 503;
      throw error;
    }
    requireConfig(normalized);

    const now = Date.now();
    if (tokenCache.value && tokenCache.expiresAtMs - 60_000 > now) {
      return tokenCache.value;
    }

    const tokenUrl = `https://login.microsoftonline.com/${encodePathSegment(normalized.tenantId)}/oauth2/v2.0/token`;
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
      error.code = "teams_graph_auth_failed";
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

  async function createOnlineMeetingEvent({ title, description, startAt, endAt }) {
    const token = await getAccessToken();
    const payload = mapEventPayload({ title, description, startAt, endAt });
    const organizer = normalized.organizerUpn;
    const url = `${normalized.graphBaseUrl}/v1.0/users/${encodePathSegment(organizer)}/events`;
    const response = await fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    const body = await parseJsonSafe(response);
    if (!response.ok || !body?.id) {
      const error = new Error("Teams meeting creation failed.");
      error.code = "teams_graph_create_failed";
      error.httpStatus = 502;
      error.details = body;
      throw error;
    }
    return {
      meetingId: String(body.id),
      joinUrl: extractJoinUrl(body),
      organizerUpn: organizer
    };
  }

  async function updateOnlineMeetingEvent({ meetingId, title, description, startAt, endAt }) {
    const token = await getAccessToken();
    const organizer = normalized.organizerUpn;
    const url = `${normalized.graphBaseUrl}/v1.0/users/${encodePathSegment(organizer)}/events/${encodePathSegment(meetingId)}`;
    const payload = mapEventPayload({ title, description, startAt, endAt });
    const updateResponse = await fetchImpl(url, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });
    if (!updateResponse.ok) {
      const errorBody = await parseJsonSafe(updateResponse);
      const error = new Error("Teams meeting update failed.");
      error.code = "teams_graph_patch_failed";
      error.httpStatus = 502;
      error.details = errorBody;
      throw error;
    }

    const readResponse = await fetchImpl(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });
    const readBody = await parseJsonSafe(readResponse);
    if (!readResponse.ok || !readBody?.id) {
      const error = new Error("Teams meeting refresh failed after patch.");
      error.code = "teams_graph_patch_read_failed";
      error.httpStatus = 502;
      error.details = readBody;
      throw error;
    }

    return {
      meetingId: String(readBody.id),
      joinUrl: extractJoinUrl(readBody),
      organizerUpn: organizer
    };
  }

  return {
    createOnlineMeetingEvent,
    updateOnlineMeetingEvent
  };
}
