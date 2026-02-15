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

function buildOAuthStateValue() {
  return `cal_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}

function assertProvider(provider) {
  const normalized = String(provider || "").trim().toLowerCase();
  if (normalized !== "google" && normalized !== "outlook") {
    const error = new Error("Calendar provider must be google or outlook.");
    error.code = "validation_error";
    error.httpStatus = 400;
    throw error;
  }
  return normalized;
}

function getProviderConfig(config, provider) {
  const normalizedProvider = assertProvider(provider);
  const providerConfig = normalizedProvider === "google" ? config.google : config.outlook;
  if (!providerConfig?.clientId || !providerConfig?.clientSecret || !providerConfig?.redirectUri) {
    const error = new Error(`Calendar provider ${normalizedProvider} is not configured.`);
    error.code = "calendar_provider_not_configured";
    error.httpStatus = 503;
    throw error;
  }
  return { provider: normalizedProvider, ...providerConfig };
}

export function createCalendarSyncClient(config = {}, { fetchImpl = fetch } = {}) {
  const normalized = {
    enabled: Boolean(config.enabled),
    google: {
      clientId: String(config.google?.clientId || "").trim(),
      clientSecret: String(config.google?.clientSecret || "").trim(),
      redirectUri: String(config.google?.redirectUri || "").trim()
    },
    outlook: {
      clientId: String(config.outlook?.clientId || "").trim(),
      clientSecret: String(config.outlook?.clientSecret || "").trim(),
      redirectUri: String(config.outlook?.redirectUri || "").trim()
    }
  };

  function ensureEnabled() {
    if (!normalized.enabled) {
      const error = new Error("Calendar OAuth sync is disabled.");
      error.code = "feature_disabled";
      error.httpStatus = 503;
      throw error;
    }
  }

  function createAuthorizationRequest({ provider, state }) {
    ensureEnabled();
    const cfg = getProviderConfig(normalized, provider);
    const nextState = String(state || buildOAuthStateValue()).trim();
    if (cfg.provider === "google") {
      const query = new URLSearchParams();
      query.set("client_id", cfg.clientId);
      query.set("redirect_uri", cfg.redirectUri);
      query.set("response_type", "code");
      query.set("scope", "https://www.googleapis.com/auth/calendar.events");
      query.set("access_type", "offline");
      query.set("prompt", "consent");
      query.set("state", nextState);
      return {
        provider: "google",
        state: nextState,
        authorizationUrl: `https://accounts.google.com/o/oauth2/v2/auth?${query.toString()}`
      };
    }

    const query = new URLSearchParams();
    query.set("client_id", cfg.clientId);
    query.set("redirect_uri", cfg.redirectUri);
    query.set("response_type", "code");
    query.set("response_mode", "query");
    query.set("scope", "offline_access Calendars.ReadWrite");
    query.set("state", nextState);
    return {
      provider: "outlook",
      state: nextState,
      authorizationUrl: `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${query.toString()}`
    };
  }

  async function exchangeCode({ provider, code }) {
    ensureEnabled();
    const cfg = getProviderConfig(normalized, provider);
    const authCode = String(code || "").trim();
    if (!authCode) {
      const error = new Error("Authorization code is required.");
      error.code = "validation_error";
      error.httpStatus = 400;
      throw error;
    }

    if (cfg.provider === "google") {
      const form = new URLSearchParams();
      form.set("code", authCode);
      form.set("client_id", cfg.clientId);
      form.set("client_secret", cfg.clientSecret);
      form.set("redirect_uri", cfg.redirectUri);
      form.set("grant_type", "authorization_code");
      const response = await fetchImpl("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: form.toString()
      });
      const payload = await parseJsonSafe(response);
      if (!response.ok || !payload?.access_token) {
        const error = new Error("Google OAuth exchange failed.");
        error.code = "calendar_oauth_exchange_failed";
        error.httpStatus = 502;
        error.details = payload;
        throw error;
      }
      return {
        provider: "google",
        accessToken: String(payload.access_token),
        refreshToken: String(payload.refresh_token || ""),
        expiresInSeconds: Number(payload.expires_in || 3600),
        scope: String(payload.scope || ""),
        accountEmail: ""
      };
    }

    const form = new URLSearchParams();
    form.set("code", authCode);
    form.set("client_id", cfg.clientId);
    form.set("client_secret", cfg.clientSecret);
    form.set("redirect_uri", cfg.redirectUri);
    form.set("grant_type", "authorization_code");
    form.set("scope", "offline_access Calendars.ReadWrite");
    const response = await fetchImpl("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    const payload = await parseJsonSafe(response);
    if (!response.ok || !payload?.access_token) {
      const error = new Error("Outlook OAuth exchange failed.");
      error.code = "calendar_oauth_exchange_failed";
      error.httpStatus = 502;
      error.details = payload;
      throw error;
    }
    return {
      provider: "outlook",
      accessToken: String(payload.access_token),
      refreshToken: String(payload.refresh_token || ""),
      expiresInSeconds: Number(payload.expires_in || 3600),
      scope: String(payload.scope || ""),
      accountEmail: ""
    };
  }

  async function upsertCalendarEvent({ provider, connection, mapping, event }) {
    ensureEnabled();
    const normalizedProvider = assertProvider(provider);
    if (!connection?.accessToken) {
      const error = new Error("Calendar connection is missing access token.");
      error.code = "calendar_not_connected";
      error.httpStatus = 409;
      throw error;
    }
    const existingExternalId = String(mapping?.externalEventId || "").trim();
    if (existingExternalId) {
      return { externalEventId: existingExternalId, operation: "update" };
    }
    const seed = `${normalizedProvider}_${event.id}_${Date.now()}`;
    return { externalEventId: seed, operation: "insert" };
  }

  async function cancelCalendarEvent({ provider, mapping }) {
    ensureEnabled();
    assertProvider(provider);
    return { cancelled: Boolean(mapping?.externalEventId) };
  }

  async function revokeConnection({ provider }) {
    ensureEnabled();
    assertProvider(provider);
    return { revoked: true };
  }

  return {
    createAuthorizationRequest,
    exchangeCode,
    upsertCalendarEvent,
    cancelCalendarEvent,
    revokeConnection
  };
}
