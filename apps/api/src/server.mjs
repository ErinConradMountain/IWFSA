import http from "node:http";
import { createHash, randomBytes } from "node:crypto";
import Busboy from "busboy";
import * as XLSX from "xlsx";
import { hashPassword, verifyPassword } from "./auth/passwords.mjs";
import { openDatabase } from "./db/client.mjs";
import { sendTransactionalEmail } from "./notifications/email.mjs";
import { listUpcomingBirthdays } from "./birthdays.mjs";

const REGISTRATION_WARNING_WINDOW_MINUTES = 15;
const EVENT_SUMMARY_CACHE_TTL_MS = 10 * 1000;
const DEFAULT_CLOSE_REMINDER_OFFSETS_MINUTES = [48 * 60, 24 * 60, 60];
const MEETING_RSVP_TOKEN_TTL_HOURS = 24 * 14;
const USER_ROLES = Object.freeze(["chief_admin", "admin", "event_editor", "member"]);
const USER_ROLE_SET = new Set(USER_ROLES);
const INTERNAL_PORTAL_ROLES = Object.freeze(["member", "event_editor", "admin", "chief_admin"]);
const ADMIN_ROLES = Object.freeze(["admin", "chief_admin"]);
const MEETING_PLANNING_SCOPES = new Set(["all_invited", "confirmed_only", "waitlisted_only", "pending_only"]);
const EVENT_VENUE_TYPES = new Set(["physical", "online"]);
const EVENT_AUDIENCE_OPTIONS = Object.freeze([
  { code: "all_members", label: "All Members", groupNames: [] },
  { code: "board_of_directors", label: "Board of Directors", groupNames: ["Board of Directors"] },
  { code: "member_affairs", label: "Member Affairs", groupNames: ["Member Affairs"] },
  { code: "brand_and_reputation", label: "Brand and Reputation", groupNames: ["Brand and Reputation"] },
  {
    code: "strategic_alliances_and_advocacy",
    label: "Strategic Alliances and Advocacy",
    groupNames: ["Strategic Alliances and Advocacy"]
  },
  {
    code: "catalytic_strategy_and_voice",
    label: "Catalytic Strategy and Voice",
    groupNames: ["Catalytic Strategy and Voice"]
  },
  { code: "leadership_development", label: "Leadership Development", groupNames: ["Leadership Development"] }
]);
const EVENT_AUDIENCE_BY_CODE = new Map(EVENT_AUDIENCE_OPTIONS.map((item) => [item.code, item]));
const EVENT_AUDIENCE_CODE_BY_GROUP = new Map(
  EVENT_AUDIENCE_OPTIONS.flatMap((item) =>
    item.groupNames.map((name) => [String(name || "").trim().toLowerCase(), item.code])
  )
);
EVENT_AUDIENCE_CODE_BY_GROUP.set("board", "board_of_directors");
const IMPORT_BLOCKING_REASON_CODES = new Set(["missing_required_field", "invalid_email", "duplicate_email_in_file"]);
const DEFAULT_ACTIVATION_POLICY = "password_change_required";

function writeJson(response, statusCode, payload, extraHeaders = {}) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    ...extraHeaders
  });
  response.end(`${JSON.stringify(payload)}\n`);
}

const LOCALHOST_HOSTNAMES = new Set(["127.0.0.1", "localhost", "[::1]", "0.0.0.0"]);

function isLocalhostHostname(hostname) {
  return LOCALHOST_HOSTNAMES.has(String(hostname || "").toLowerCase());
}

function determineAllowedOrigin(appBaseUrl, requestOrigin) {
  if (!requestOrigin) {
    return appBaseUrl;
  }
  if (requestOrigin === appBaseUrl) {
    return appBaseUrl;
  }

  try {
    const appUrl = new URL(appBaseUrl);
    const originUrl = new URL(requestOrigin);

    if (appUrl.protocol !== originUrl.protocol) {
      return appBaseUrl;
    }

    const appPort = appUrl.port || (appUrl.protocol === "https:" ? "443" : "80");
    const originPort = originUrl.port || (originUrl.protocol === "https:" ? "443" : "80");

    if (appPort !== originPort) {
      return appBaseUrl;
    }

    if (appUrl.hostname === originUrl.hostname) {
      return requestOrigin;
    }

    if (isLocalhostHostname(appUrl.hostname) && isLocalhostHostname(originUrl.hostname)) {
      return requestOrigin;
    }
  } catch {
    return appBaseUrl;
  }

  return appBaseUrl;
}

function getCorsHeaders(appBaseUrl, requestOrigin) {
  return {
    "Access-Control-Allow-Origin": determineAllowedOrigin(appBaseUrl, requestOrigin),
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization"
  };
}

function buildMeetingRsvpUrl(appBaseUrl, token) {
  const baseUrl = String(appBaseUrl || "").replace(/\/+$/, "");
  if (!baseUrl || !token) {
    return "";
  }
  return `${baseUrl}/meetings/rsvp?token=${encodeURIComponent(String(token))}`;
}

async function readJsonBody(request, maxBytes = 32 * 1024) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    const chunkSize = Buffer.byteLength(chunk);
    totalBytes += chunkSize;
    if (totalBytes > maxBytes) {
      throw new Error("Payload too large.");
    }
    chunks.push(chunk);
  }

  const bodyText = Buffer.concat(chunks).toString("utf8").trim();
  if (!bodyText) {
    return {};
  }

  return JSON.parse(bodyText);
}

async function readMultipartForm(request, { maxFileSizeBytes = 5 * 1024 * 1024 } = {}) {
  return new Promise((resolve, reject) => {
    const fields = {};
    let fileBuffer = null;
    let fileInfo = null;
    let fileTooLarge = false;

    const busboy = Busboy({
      headers: request.headers,
      limits: { fileSize: maxFileSizeBytes, files: 1 }
    });

    busboy.on("field", (name, value) => {
      fields[name] = value;
    });

    busboy.on("file", (_name, stream, info) => {
      const chunks = [];
      fileInfo = info;

      stream.on("data", (chunk) => {
        chunks.push(chunk);
      });

      stream.on("limit", () => {
        fileTooLarge = true;
        stream.resume();
      });

      stream.on("end", () => {
        fileBuffer = Buffer.concat(chunks);
      });
    });

    busboy.on("error", reject);
    busboy.on("finish", () => {
      if (fileTooLarge) {
        reject(new Error("file_too_large"));
        return;
      }

      resolve({
        fields,
        file: fileBuffer
          ? {
              buffer: fileBuffer,
              filename: fileInfo?.filename || "",
              mimeType: fileInfo?.mimeType || ""
            }
          : null
      });
    });

    request.pipe(busboy);
  });
}

const REQUIRED_IMPORT_HEADERS = [
  "No",
  "First Name",
  "Surname",
  "Email",
  "Organisation",
  "Username",
  "Status",
  "Groups",
  "Roles"
];

function normalizeHeader(value) {
  return String(value || "").trim();
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function parseCsvList(value) {
  return String(value || "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function normalizeUniqueList(values) {
  const source = Array.isArray(values) ? values : parseCsvList(values);
  const normalized = [];
  const seen = new Set();
  for (const item of source) {
    const value = String(item || "").trim();
    if (!value) {
      continue;
    }
    const key = value.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    normalized.push(value);
  }
  return normalized;
}

function normalizeImportMembershipRecord(record, fallbackId = 0) {
  const rowNumber = Number(record?.rowNumber || 0);
  const rowId = Number(record?.id || fallbackId || rowNumber || 0);
  const parsedName = splitFullName(record?.fullName || "");
  const firstName = String(record?.firstName || parsedName.firstName || "").trim();
  const surname = String(record?.surname || parsedName.surname || "").trim();
  const fullName = String(record?.fullName || `${firstName} ${surname}`).trim();
  const normalizedStatus = normalizeStatusValue(record?.status, "active") || "active";
  const existingUserId = Number(record?.existingUserId || 0);

  return {
    id: Number.isInteger(rowId) && rowId > 0 ? rowId : fallbackId || 0,
    rowNumber: Number.isInteger(rowNumber) && rowNumber > 0 ? rowNumber : 0,
    action: String(record?.action || "error").trim().toLowerCase() || "error",
    reasonCode: String(record?.reasonCode || "").trim(),
    errorMessage: String(record?.errorMessage || "").trim(),
    firstName,
    surname,
    fullName,
    email: String(record?.email || "").trim().toLowerCase(),
    organisation: String(record?.organisation || "").trim(),
    phone: String(record?.phone || "").trim(),
    status: normalizedStatus,
    username: String(record?.username || "").trim(),
    updateUsername: Boolean(record?.updateUsername),
    groups: normalizeUniqueList(record?.groups || []),
    roles: normalizeUniqueList(record?.roles || []),
    existingUserId: Number.isInteger(existingUserId) && existingUserId > 0 ? existingUserId : null
  };
}

function parseImportMembershipSetJson(membershipSetJson) {
  const jsonText = String(membershipSetJson || "").trim();
  if (!jsonText) {
    return { parsed: false, items: [] };
  }
  try {
    const parsed = JSON.parse(jsonText);
    if (!Array.isArray(parsed)) {
      return { parsed: false, items: [] };
    }
    const items = parsed.map((item, index) => normalizeImportMembershipRecord(item, index + 1));
    return { parsed: true, items };
  } catch {
    return { parsed: false, items: [] };
  }
}

function serializeImportMembershipSetJson(items) {
  const normalized = (Array.isArray(items) ? items : []).map((item, index) =>
    normalizeImportMembershipRecord(item, index + 1)
  );
  return JSON.stringify(normalized);
}

function summarizeImportMembershipSet(items) {
  let createCount = 0;
  let updateCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  let blockingIssueCount = 0;

  for (const item of items) {
    if (item.action === "create") {
      createCount += 1;
    } else if (item.action === "update") {
      updateCount += 1;
    } else if (item.action === "skip") {
      skipCount += 1;
    } else if (item.action === "error") {
      errorCount += 1;
    }

    if (IMPORT_BLOCKING_REASON_CODES.has(item.reasonCode)) {
      blockingIssueCount += 1;
    }
  }

  return {
    totalRows: items.length,
    createCount,
    updateCount,
    skipCount,
    errorCount,
    blockingIssueCount,
    hasBlockingIssues: blockingIssueCount > 0
  };
}

function toImportMembershipResponseItem(item) {
  return {
    id: item.id,
    rowNumber: item.rowNumber,
    action: item.action,
    reasonCode: item.reasonCode || "",
    email: item.email || "",
    username: item.username || "",
    fullName: item.fullName || "",
    status: item.status || "",
    organisation: item.organisation || "",
    phone: item.phone || "",
    groups: (item.groups || []).join(", "),
    roles: (item.roles || []).join(", "),
    errorMessage: item.errorMessage || ""
  };
}

function loadLegacyImportMembershipSet(database, batchId) {
  const rows = database
    .prepare(
      `
      SELECT
        id,
        row_number AS rowNumber,
        action,
        reason_code AS reasonCode,
        email,
        username,
        full_name AS fullName,
        status,
        organisation,
        phone,
        groups_csv AS groupsCsv,
        roles_csv AS rolesCsv,
        data_json AS dataJson,
        error_message AS errorMessage
      FROM member_import_rows
      WHERE batch_id = ?
      ORDER BY id ASC
    `
    )
    .all(batchId);

  return rows.map((row, index) => {
    let data = {};
    try {
      data = JSON.parse(row.dataJson || "{}");
    } catch {
      data = {};
    }
    const parsedName = splitFullName(data.fullName || row.fullName || "");
    return normalizeImportMembershipRecord(
      {
        id: row.id,
        rowNumber: row.rowNumber,
        action: row.action,
        reasonCode: row.reasonCode || "",
        errorMessage: row.errorMessage || "",
        firstName: data.firstName || parsedName.firstName || "",
        surname: data.surname || parsedName.surname || "",
        fullName: data.fullName || row.fullName || parsedName.fullName || "",
        email: data.email || row.email || "",
        organisation: data.organisation || row.organisation || "",
        phone: data.phone || row.phone || "",
        status: data.status || row.status || "active",
        username: data.username || row.username || "",
        updateUsername: data.updateUsername === true,
        groups: Array.isArray(data.groups) ? data.groups : row.groupsCsv || "",
        roles: Array.isArray(data.roles) ? data.roles : row.rolesCsv || "",
        existingUserId: data.existingUserId || null
      },
      index + 1
    );
  });
}

function loadImportMembershipSet(database, batchId, membershipSetJson) {
  const parsed = parseImportMembershipSetJson(membershipSetJson);
  if (parsed.parsed) {
    return parsed.items;
  }

  const legacyItems = loadLegacyImportMembershipSet(database, batchId);
  if (legacyItems.length > 0) {
    database
      .prepare(
        `
        UPDATE member_import_batches
        SET membership_set_json = ?
        WHERE batch_id = ?
      `
      )
      .run(serializeImportMembershipSetJson(legacyItems), batchId);
  }
  return legacyItems;
}

function normalizeAudienceCode(value) {
  return String(value || "").trim().toLowerCase();
}

function mapAudienceCodeToSelection(database, audienceCode) {
  const code = normalizeAudienceCode(audienceCode);
  const option = EVENT_AUDIENCE_BY_CODE.get(code);
  if (!option) {
    return null;
  }
  if (code === "all_members") {
    return {
      audienceCode: option.code,
      audienceLabel: option.label,
      audienceType: "all_members",
      groupIds: [],
      groupNames: []
    };
  }

  const groupMap = ensureGroupIds(database, option.groupNames);
  const groupIds = option.groupNames.map((name) => Number(groupMap.get(name))).filter((id) => Number.isInteger(id));
  return {
    audienceCode: option.code,
    audienceLabel: option.label,
    audienceType: "groups",
    groupIds,
    groupNames: option.groupNames.slice()
  };
}

function deriveAudiencePresentation(audienceType, groupNames = []) {
  if (audienceType !== "groups") {
    return { audienceCode: "all_members", audienceLabel: "All Members" };
  }

  const normalized = groupNames
    .map((name) => String(name || "").trim())
    .filter(Boolean)
    .map((name) => name.toLowerCase());

  if (normalized.length === 1) {
    const mappedCode = EVENT_AUDIENCE_CODE_BY_GROUP.get(normalized[0]);
    if (mappedCode) {
      const option = EVENT_AUDIENCE_BY_CODE.get(mappedCode);
      if (option) {
        return { audienceCode: option.code, audienceLabel: option.label };
      }
    }
  }

  if (groupNames.length === 0) {
    return { audienceCode: "groups", audienceLabel: "Groups" };
  }

  return {
    audienceCode: "groups",
    audienceLabel: groupNames.join(", ")
  };
}

function normalizeStatusValue(value, defaultStatus) {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return defaultStatus;
  }
  if (normalized === "active") {
    return "active";
  }
  if (normalized === "suspended") {
    return "suspended";
  }
  return null;
}

function splitFullName(value) {
  const fullName = String(value || "").trim();
  if (!fullName) {
    return { fullName: "", firstName: "", surname: "" };
  }
  const segments = fullName.split(/\s+/).filter(Boolean);
  if (segments.length === 0) {
    return { fullName, firstName: fullName, surname: "" };
  }
  return {
    fullName,
    firstName: segments[0],
    surname: segments.slice(1).join(" ")
  };
}

function parseImportOptions(fields) {
  const mode = fields.mode === "create_only" ? "create_only" : "create_or_update";
  const defaultStatus = String(fields.default_status || "active").trim().toLowerCase();
  const normalizedStatus = defaultStatus === "suspended" ? "suspended" : "active";
  const usernamePolicy =
    fields.username_policy === "from_column_or_generate" ? "from_column_or_generate" : "generate_random";
  const activationPolicy =
    fields.activation_policy === "password_and_username_personalization_required"
      ? "password_and_username_personalization_required"
      : DEFAULT_ACTIVATION_POLICY;
  const invitePolicy = fields.invite_policy === "none" ? "none" : "queue_on_apply";

  return {
    mode,
    defaultStatus: normalizedStatus,
    usernamePolicy,
    activationPolicy,
    invitePolicy
  };
}

function generateRandomUsername(existingUsernames) {
  let username = "";
  for (let attempt = 0; attempt < 10; attempt += 1) {
    username = `member_${randomBytes(3).toString("hex")}`;
    if (!existingUsernames.has(username.toLowerCase())) {
      existingUsernames.add(username.toLowerCase());
      return username;
    }
  }
  const fallback = `member_${randomBytes(4).toString("hex")}`;
  existingUsernames.add(fallback.toLowerCase());
  return fallback;
}

function parseExcelWorkbook(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    return { headers: [], rows: [] };
  }
  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" });
  const headers = Array.isArray(rows[0]) ? rows[0].map(normalizeHeader) : [];
  const dataRows = rows.slice(1);
  return { headers, rows: dataRows };
}

function requireActivationClear(user, response, corsHeaders) {
  if (user?.mustChangePassword) {
    writeJson(
      response,
      403,
      { error: "activation_required", message: "Password change required before access." },
      corsHeaders
    );
    return false;
  }
  return true;
}

function buildEventSelect() {
  return `
    SELECT
      events.id,
      events.title,
      events.description,
      events.start_at AS startAt,
      events.end_at AS endAt,
      events.venue_type AS venueType,
      events.venue_name AS venueName,
      events.venue_address AS venueAddress,
      events.online_provider AS onlineProvider,
      events.online_join_url AS onlineJoinUrl,
      events.host_name AS hostName,
      events.capacity,
      events.registration_closes_at AS registrationClosesAt,
      events.audience_type AS audienceType,
      events.status,
      events.created_by_user_id AS createdByUserId,
      events.created_at AS createdAt,
      events.updated_at AS updatedAt
    FROM events
  `;
}

function formatIcsDateTime(value) {
  const ms = Date.parse(String(value || ""));
  if (!Number.isFinite(ms)) {
    return null;
  }
  const date = new Date(ms);
  const pad = (n) => String(n).padStart(2, "0");
  return (
    String(date.getUTCFullYear()) +
    pad(date.getUTCMonth() + 1) +
    pad(date.getUTCDate()) +
    "T" +
    pad(date.getUTCHours()) +
    pad(date.getUTCMinutes()) +
    pad(date.getUTCSeconds()) +
    "Z"
  );
}

function escapeIcsText(value) {
  return String(value || "")
    .replace(/\\/g, "\\\\")
    .replace(/\r\n|\r|\n/g, "\\n")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,");
}

function buildIcsForEvent(eventRow, { appBaseUrl = "" } = {}) {
  const dtStart = formatIcsDateTime(eventRow?.start_at || eventRow?.startAt);
  const dtEnd = formatIcsDateTime(eventRow?.end_at || eventRow?.endAt);
  if (!dtStart || !dtEnd) {
    return null;
  }

  const nowStamp = formatIcsDateTime(new Date().toISOString());
  const uid = `iwfsa-event-${eventRow.id}@iwfsa.local`;
  const title = escapeIcsText(eventRow.title);
  const descriptionParts = [];
  if (eventRow.description) descriptionParts.push(String(eventRow.description));
  if (eventRow.online_join_url || eventRow.onlineJoinUrl) {
    descriptionParts.push(`Join link: ${eventRow.online_join_url || eventRow.onlineJoinUrl}`);
  }
  if (appBaseUrl) {
    descriptionParts.push(`Portal: ${appBaseUrl}/member`);
  }
  const description = escapeIcsText(descriptionParts.filter(Boolean).join("\n\n"));

  let location = "";
  const venueName = eventRow.venue_name || eventRow.venueName;
  const venueAddress = eventRow.venue_address || eventRow.venueAddress;
  const venueType = eventRow.venue_type || eventRow.venueType;
  if (venueName || venueAddress) {
    location = [venueName, venueAddress].filter(Boolean).join(" - ");
  } else if (venueType === "online" || (eventRow.online_join_url || eventRow.onlineJoinUrl)) {
    location = "Online";
  }
  location = escapeIcsText(location);

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//IWFSA//Member Portal//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${nowStamp}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:${title}`,
    `DESCRIPTION:${description}`
  ];
  if (location) {
    lines.push(`LOCATION:${location}`);
  }
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.join("\r\n") + "\r\n";
}

function applyDateFilter(baseSql, view) {
  if (!view) {
    return { sql: baseSql, params: [] };
  }

  const now = new Date();
  let end = null;
  if (view === "week") {
    end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (view === "month") {
    end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  } else if (view === "year") {
    end = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  }

  if (!end) {
    return { sql: baseSql, params: [] };
  }

  return {
    sql: `${baseSql} AND events.start_at BETWEEN ? AND ?`,
    params: [now.toISOString(), end.toISOString()]
  };
}

function listPublishedEvents(database, user, view) {
  const baseSelect = buildEventSelect();
  let sql = `${baseSelect} WHERE events.status = 'published'`;
  const params = [];

  if (user?.role !== "admin" && user?.role !== "chief_admin") {
    sql += `
      AND (
        events.audience_type = 'all_members'
        OR EXISTS (
          SELECT 1
          FROM event_audience_groups
          JOIN group_members ON group_members.group_id = event_audience_groups.group_id
          WHERE event_audience_groups.event_id = events.id
            AND group_members.user_id = ?
        )
      )
    `;
    params.push(user?.id || -1);
  }

  const filtered = applyDateFilter(sql, view);
  sql = filtered.sql;
  params.push(...filtered.params);

  sql += " ORDER BY events.start_at ASC";

  return database.prepare(sql).all(...params);
}

function listEventsForAdmin(database, view) {
  let sql = `${buildEventSelect()} WHERE 1 = 1`;
  const filtered = applyDateFilter(sql, view);
  sql = filtered.sql + " ORDER BY events.start_at ASC";
  return database.prepare(sql).all(...filtered.params);
}

function listEventsForMember(database, userId, view) {
  let sql = `
    ${buildEventSelect()}
    WHERE (
      events.created_by_user_id = ?
      OR EXISTS (
        SELECT 1
        FROM event_editor_grants
        WHERE event_editor_grants.event_id = events.id
          AND event_editor_grants.user_id = ?
      )
    )
  `;
  const params = [userId, userId];
  const filtered = applyDateFilter(sql, view);
  sql = filtered.sql + " ORDER BY events.start_at ASC";
  params.push(...filtered.params);
  return database.prepare(sql).all(...params);
}

function listEventsForEditor(database, userId, view) {
  let sql = `
    ${buildEventSelect()}
    WHERE (
      events.created_by_user_id = ?
      OR EXISTS (
        SELECT 1
        FROM event_editor_grants
        WHERE event_editor_grants.event_id = events.id
          AND event_editor_grants.user_id = ?
      )
    )
  `;
  const params = [userId, userId];
  const filtered = applyDateFilter(sql, view);
  sql = filtered.sql + " ORDER BY events.start_at ASC";
  params.push(...filtered.params);
  return database.prepare(sql).all(...params);
}

function parseIsoToMs(value) {
  const text = String(value || "").trim();
  if (!text) {
    return null;
  }
  const parsed = Date.parse(text);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function isRequestJsonSyntaxError(error) {
  if (!error) {
    return false;
  }
  if (error instanceof SyntaxError) {
    return true;
  }
  const message = String(error.message || "");
  return /JSON/i.test(message);
}

function isDatabaseConstraintError(error) {
  if (!error) {
    return false;
  }
  const message = String(error.message || "").toLowerCase();
  return message.includes("constraint") || message.includes("foreign key");
}

function writeMutationError(response, error, corsHeaders, { validationMessage }) {
  if (isRequestJsonSyntaxError(error)) {
    writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
    return;
  }

  if (isDatabaseConstraintError(error)) {
    writeJson(response, 400, { error: "validation_error", message: validationMessage }, corsHeaders);
    return;
  }

  writeJson(
    response,
    500,
    { error: "internal_error", message: "Unable to process request." },
    corsHeaders
  );
}

function normalizeReminderOffsets(rawOffsets) {
  if (!Array.isArray(rawOffsets)) {
    return [];
  }
  const unique = new Set();
  for (const offset of rawOffsets) {
    const numeric = Number(offset);
    if (!Number.isInteger(numeric)) {
      continue;
    }
    if (numeric <= 0 || numeric > 60 * 24 * 30) {
      continue;
    }
    unique.add(numeric);
  }
  return [...unique].sort((left, right) => right - left);
}

function createEventSummaryCache(ttlMs = EVENT_SUMMARY_CACHE_TTL_MS) {
  const store = new Map();
  return {
    get(eventId) {
      const item = store.get(eventId);
      if (!item) {
        return null;
      }
      if (item.expiresAtMs <= Date.now()) {
        store.delete(eventId);
        return null;
      }
      return item.value;
    },
    set(eventId, value) {
      store.set(eventId, { value, expiresAtMs: Date.now() + ttlMs });
    },
    invalidate(eventId) {
      store.delete(eventId);
    },
    clear() {
      store.clear();
    }
  };
}

function loadEventSignupSummary(database, eventId) {
  const row = database
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmedCount,
        COALESCE(SUM(CASE WHEN status = 'waitlisted' THEN 1 ELSE 0 END), 0) AS waitlistedCount,
        COALESCE(SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END), 0) AS cancelledCount
      FROM signups
      WHERE event_id = ?
    `
    )
    .get(eventId);

  return {
    confirmedCount: Number(row?.confirmedCount || 0),
    waitlistedCount: Number(row?.waitlistedCount || 0),
    cancelledCount: Number(row?.cancelledCount || 0)
  };
}

function getEventSignupSummary(database, eventId, summaryCache) {
  if (summaryCache) {
    const cached = summaryCache.get(eventId);
    if (cached) {
      return cached;
    }
  }
  const summary = loadEventSignupSummary(database, eventId);
  if (summaryCache) {
    summaryCache.set(eventId, summary);
  }
  return summary;
}

function loadRegistrationWindow({ registrationClosesAt, overrideClosesAt, nowMs = Date.now() }) {
  const closeMs = parseIsoToMs(overrideClosesAt || registrationClosesAt);
  if (closeMs === null) {
    return {
      closesAtIso: null,
      closeMs: null,
      state: "open",
      minutesToClose: null,
      closingSoon: false,
      closed: false
    };
  }

  const diffMs = closeMs - nowMs;
  const closed = diffMs <= 0;
  const minutesToClose = closed ? 0 : Math.ceil(diffMs / (60 * 1000));
  const closingSoon = !closed && minutesToClose <= REGISTRATION_WARNING_WINDOW_MINUTES;

  return {
    closesAtIso: new Date(closeMs).toISOString(),
    closeMs,
    state: closed ? "closed" : closingSoon ? "closing_soon" : "open",
    minutesToClose,
    closingSoon,
    closed
  };
}

function pickUrgencyVariant(eventId) {
  return Number(eventId) % 2 === 0 ? "final_hours" : "last_chance";
}

function canUserAccessGroupedEvent(database, eventId, userId) {
  const row = database
    .prepare(
      `
      SELECT 1
      FROM event_audience_groups
      JOIN group_members ON group_members.group_id = event_audience_groups.group_id
      WHERE event_audience_groups.event_id = ?
        AND group_members.user_id = ?
      LIMIT 1
    `
    )
    .get(eventId, userId);
  return Boolean(row);
}

function loadEventOverrideMap(database, userId, eventIds) {
  const map = new Map();
  if (!userId || eventIds.length === 0) {
    return map;
  }
  const placeholders = eventIds.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT event_id AS eventId, closes_at AS closesAt
      FROM event_registration_overrides
      WHERE user_id = ? AND event_id IN (${placeholders})
    `
    )
    .all(userId, ...eventIds);
  for (const row of rows) {
    map.set(row.eventId, row.closesAt);
  }
  return map;
}

function loadEventSignupMap(database, userId, eventIds) {
  const map = new Map();
  if (!userId || eventIds.length === 0) {
    return map;
  }
  const placeholders = eventIds.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT event_id AS eventId, status, updated_at AS updatedAt
      FROM signups
      WHERE user_id = ? AND event_id IN (${placeholders})
    `
    )
    .all(userId, ...eventIds);
  for (const row of rows) {
    map.set(row.eventId, { status: row.status, updatedAt: row.updatedAt });
  }
  return map;
}

function loadEventDraftMap(database, userId, eventIds) {
  const map = new Map();
  if (!userId || eventIds.length === 0) {
    return map;
  }
  const placeholders = eventIds.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT event_id AS eventId, draft_json AS draftJson, updated_at AS updatedAt
      FROM registration_drafts
      WHERE user_id = ? AND event_id IN (${placeholders})
    `
    )
    .all(userId, ...eventIds);
  for (const row of rows) {
    let draft = null;
    try {
      draft = JSON.parse(row.draftJson || "{}");
    } catch {
      draft = {};
    }
    map.set(row.eventId, { draft, updatedAt: row.updatedAt });
  }
  return map;
}

function loadEventEditorGrantMap(database, userId, eventIds) {
  const map = new Map();
  if (!userId || eventIds.length === 0) {
    return map;
  }
  const placeholders = eventIds.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT event_id AS eventId
      FROM event_editor_grants
      WHERE user_id = ? AND event_id IN (${placeholders})
    `
    )
    .all(userId, ...eventIds);
  for (const row of rows) {
    map.set(row.eventId, true);
  }
  return map;
}

function loadEventAudienceGroupMap(database, eventIds) {
  const map = new Map();
  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    return map;
  }

  const placeholders = eventIds.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT
        event_audience_groups.event_id AS eventId,
        event_audience_groups.group_id AS groupId,
        groups.name AS groupName
      FROM event_audience_groups
      JOIN groups ON groups.id = event_audience_groups.group_id
      WHERE event_audience_groups.event_id IN (${placeholders})
      ORDER BY event_audience_groups.event_id, groups.name
    `
    )
    .all(...eventIds);

  for (const row of rows) {
    if (!map.has(row.eventId)) {
      map.set(row.eventId, { groupIds: [], groupNames: [] });
    }
    const item = map.get(row.eventId);
    item.groupIds.push(row.groupId);
    item.groupNames.push(row.groupName);
  }

  return map;
}

function hasAudienceIntersection(proposedAudienceType, proposedGroupIds, existingAudienceType, existingGroupIds) {
  const normalizedProposedType = proposedAudienceType === "groups" ? "groups" : "all_members";
  const normalizedExistingType = existingAudienceType === "groups" ? "groups" : "all_members";

  if (normalizedProposedType === "all_members" || normalizedExistingType === "all_members") {
    return true;
  }

  const proposed = Array.isArray(proposedGroupIds) ? proposedGroupIds : [];
  const existing = Array.isArray(existingGroupIds) ? existingGroupIds : [];
  if (proposed.length === 0 || existing.length === 0) {
    return false;
  }

  const proposedSet = new Set(proposed.map((value) => Number(value)).filter((value) => Number.isInteger(value)));
  for (const groupId of existing) {
    const normalizedGroupId = Number(groupId);
    if (proposedSet.has(normalizedGroupId)) {
      return true;
    }
  }
  return false;
}

function detectEventScheduleConflicts(database, { startAt, endAt, audienceType, groupIds = [], excludeEventId = null, limit = 5 }) {
  const startMs = parseIsoToMs(startAt);
  const endMs = parseIsoToMs(endAt);
  if (startMs === null || endMs === null || endMs <= startMs) {
    return { count: 0, items: [] };
  }

  let sql = `
    SELECT
      id,
      title,
      start_at AS startAt,
      end_at AS endAt,
      status,
      audience_type AS audienceType
    FROM events
    WHERE status != 'cancelled'
  `;
  const params = [];
  if (Number.isInteger(excludeEventId)) {
    sql += " AND id != ?";
    params.push(excludeEventId);
  }

  const candidates = database.prepare(sql).all(...params);
  if (candidates.length === 0) {
    return { count: 0, items: [] };
  }

  const audienceMap = loadEventAudienceGroupMap(
    database,
    candidates.map((item) => item.id)
  );
  const normalizedProposedGroups = Array.isArray(groupIds)
    ? groupIds.map((value) => Number(value)).filter((value) => Number.isInteger(value))
    : [];
  const conflicts = [];

  for (const candidate of candidates) {
    const candidateStartMs = parseIsoToMs(candidate.startAt);
    const candidateEndMs = parseIsoToMs(candidate.endAt);
    if (candidateStartMs === null || candidateEndMs === null || candidateEndMs <= candidateStartMs) {
      continue;
    }
    const overlapsInTime = candidateStartMs < endMs && candidateEndMs > startMs;
    if (!overlapsInTime) {
      continue;
    }

    const existingGroups = audienceMap.get(candidate.id)?.groupIds || [];
    const overlapsAudience = hasAudienceIntersection(
      audienceType,
      normalizedProposedGroups,
      candidate.audienceType,
      existingGroups
    );
    if (!overlapsAudience) {
      continue;
    }

    conflicts.push({
      id: candidate.id,
      title: candidate.title,
      status: candidate.status,
      startAt: candidate.startAt,
      endAt: candidate.endAt,
      audienceType: candidate.audienceType
    });
  }

  conflicts.sort((left, right) => {
    const leftMs = parseIsoToMs(left.startAt) || 0;
    const rightMs = parseIsoToMs(right.startAt) || 0;
    return leftMs - rightMs;
  });

  const safeLimit = Math.max(1, Number(limit) || 5);
  return {
    count: conflicts.length,
    items: conflicts.slice(0, safeLimit)
  };
}

function decorateEventsForViewer(database, items, user, summaryCache) {
  if (!Array.isArray(items) || items.length === 0) {
    return [];
  }

  const eventIds = items.map((item) => item.id);
  const userId = user?.id || null;
  const signupMap = loadEventSignupMap(database, userId, eventIds);
  const overrideMap = loadEventOverrideMap(database, userId, eventIds);
  const draftMap = loadEventDraftMap(database, userId, eventIds);
  const editorGrantMap = loadEventEditorGrantMap(database, userId, eventIds);
  const audienceGroupMap = loadEventAudienceGroupMap(database, eventIds);
  const nowMs = Date.now();
  const viewerIsAdmin = isAdminRole(user?.role || "");

  return items.map((item) => {
    const summary = getEventSignupSummary(database, item.id, summaryCache);
    const signup = signupMap.get(item.id) || null;
    const overrideClosesAt = overrideMap.get(item.id) || null;
    const audienceMeta = audienceGroupMap.get(item.id) || { groupIds: [], groupNames: [] };
    const audiencePresentation = deriveAudiencePresentation(item.audienceType, audienceMeta.groupNames);
    const hasEventEditorGrant = Boolean(editorGrantMap.get(item.id));
    const isCreator = Number(item.createdByUserId || 0) === Number(userId || 0);
    const canEdit = viewerIsAdmin || hasEventEditorGrant || (isCreator && item.status !== "cancelled");
    const canManagePlanning = viewerIsAdmin || hasEventEditorGrant || isCreator;
    const canAssignEditors = viewerIsAdmin || isCreator;
    const canDelete = viewerIsAdmin || hasEventEditorGrant || (isCreator && item.status === "draft");
    const registrationWindow = loadRegistrationWindow({
      registrationClosesAt: item.registrationClosesAt,
      overrideClosesAt,
      nowMs
    });
    const seatsRemaining = Math.max(Number(item.capacity || 0) - Number(summary.confirmedCount || 0), 0);
    const mySignupStatus = signup?.status || "none";
    const canRegister =
      item.status === "published" &&
      !registrationWindow.closed &&
      mySignupStatus !== "confirmed" &&
      mySignupStatus !== "waitlisted";
    const urgencyVariant = registrationWindow.closingSoon ? pickUrgencyVariant(item.id) : null;
    const draftPayload = draftMap.get(item.id) || null;

    return {
      ...item,
      confirmedCount: summary.confirmedCount,
      waitlistedCount: summary.waitlistedCount,
      seatsRemaining,
      registrationState: registrationWindow.state,
      registrationClosed: registrationWindow.closed,
      registrationClosingSoon: registrationWindow.closingSoon,
      minutesToClose: registrationWindow.minutesToClose,
      countdownEndsAt: registrationWindow.closesAtIso,
      effectiveRegistrationClosesAt: registrationWindow.closesAtIso,
      urgencyVariant,
      mySignupStatus,
      mySignupUpdatedAt: signup?.updatedAt || null,
      canRegister,
      registrationDraft: draftPayload ? draftPayload.draft : null,
      registrationDraftUpdatedAt: draftPayload ? draftPayload.updatedAt : null,
      audienceCode: audiencePresentation.audienceCode,
      audienceLabel: audiencePresentation.audienceLabel,
      audienceGroupIds: audienceMeta.groupIds,
      audienceGroupNames: audienceMeta.groupNames,
      isCreator,
      hasEventEditorGrant,
      canEdit,
      canManagePlanning,
      canAssignEditors,
      canDelete
    };
  });
}

function insertReminderSendIfMissing(database, { eventId, userId, reminderType, offsetMinutes = null }) {
  const result = database
    .prepare(
      `
      INSERT OR IGNORE INTO registration_reminder_sends (event_id, user_id, reminder_type, offset_minutes)
      VALUES (?, ?, ?, ?)
    `
    )
    .run(eventId, userId, reminderType, offsetMinutes);
  return result.changes > 0;
}

function formatParticipantName(fullName, username) {
  const trimmed = String(fullName || "").trim();
  if (trimmed) {
    return trimmed;
  }
  return String(username || "member");
}

function dispatchDueRegistrationNotifications(database, { nowMs = Date.now(), supportEmail = "support@iwfsa.local" } = {}) {
  const events = database
    .prepare(
      `
      SELECT id, title, registration_closes_at AS registrationClosesAt
      FROM events
      WHERE status = 'published' AND registration_closes_at IS NOT NULL
    `
    )
    .all();

  let reminderSent = 0;
  let waitlistClosedSent = 0;

  for (const event of events) {
    const closeMs = parseIsoToMs(event.registrationClosesAt);
    if (closeMs === null) {
      continue;
    }

    const participants = database
      .prepare(
        `
        SELECT
          users.id AS userId,
          users.username,
          users.email,
          member_profiles.full_name AS fullName,
          signups.status
        FROM signups
        JOIN users ON users.id = signups.user_id
        LEFT JOIN member_profiles ON member_profiles.user_id = users.id
        WHERE signups.event_id = ? AND signups.status IN ('confirmed', 'waitlisted')
      `
      )
      .all(event.id);

    for (const participant of participants) {
      for (const offsetMinutes of DEFAULT_CLOSE_REMINDER_OFFSETS_MINUTES) {
        const reminderType = `close_${offsetMinutes}m`;
        const sendAtMs = closeMs - offsetMinutes * 60 * 1000;
        if (nowMs < sendAtMs || nowMs >= closeMs || nowMs > sendAtMs + 15 * 60 * 1000) {
          continue;
        }
        const inserted = insertReminderSendIfMissing(database, {
          eventId: event.id,
          userId: participant.userId,
          reminderType,
          offsetMinutes
        });
        if (!inserted) {
          continue;
        }
        const hours = Math.round((offsetMinutes / 60) * 10) / 10;
        sendTransactionalEmail({
          to: participant.email,
          subject: `IWFSA Event Registration Closing Reminder - ${event.title}`,
          text:
            `Hello ${formatParticipantName(participant.fullName, participant.username)},\n\n` +
            `Registration for "${event.title}" closes in ${hours} hour(s).\n` +
            `Please review your registration status in the member portal.\n\n` +
            `Regards,\nIWFSA Admin`,
          metadata: { template: "registration_close_reminder" }
        });
        recordNotificationDelivery(database, {
          userId: participant.userId,
          channel: "email",
          eventType: "registration_close_reminder",
          status: "sent",
          idempotencyKey: `reminder:${event.id}:${participant.userId}:${reminderType}`
        });
        reminderSent += 1;
      }
    }

    const personalRows = database
      .prepare(
        `
        SELECT
          pref.user_id AS userId,
          pref.offset_minutes AS offsetMinutes,
          users.username,
          users.email,
          member_profiles.full_name AS fullName
        FROM registration_reminder_preferences pref
        JOIN users ON users.id = pref.user_id
        LEFT JOIN member_profiles ON member_profiles.user_id = users.id
        WHERE pref.event_id = ?
      `
      )
      .all(event.id);

    for (const personal of personalRows) {
      const offsetMinutes = Number(personal.offsetMinutes || 0);
      if (!Number.isInteger(offsetMinutes) || offsetMinutes <= 0) {
        continue;
      }
      const reminderType = `personal_${offsetMinutes}m`;
      const sendAtMs = closeMs - offsetMinutes * 60 * 1000;
      if (nowMs < sendAtMs || nowMs >= closeMs || nowMs > sendAtMs + 15 * 60 * 1000) {
        continue;
      }
      const inserted = insertReminderSendIfMissing(database, {
        eventId: event.id,
        userId: personal.userId,
        reminderType,
        offsetMinutes
      });
      if (!inserted) {
        continue;
      }
      sendTransactionalEmail({
        to: personal.email,
        subject: `IWFSA Personal Reminder - ${event.title}`,
        text:
          `Hello ${formatParticipantName(personal.fullName, personal.username)},\n\n` +
          `Your personal reminder has triggered. Registration for "${event.title}" closes soon.\n\n` +
          `Regards,\nIWFSA Admin`,
        metadata: { template: "registration_personal_reminder" }
      });
      recordNotificationDelivery(database, {
        userId: personal.userId,
        channel: "email",
        eventType: "registration_personal_reminder",
        status: "sent",
        idempotencyKey: `reminder:${event.id}:${personal.userId}:${reminderType}`
      });
      reminderSent += 1;
    }

    if (nowMs >= closeMs) {
      const waitlistedRows = participants.filter((participant) => participant.status === "waitlisted");
      for (const waitlisted of waitlistedRows) {
        const inserted = insertReminderSendIfMissing(database, {
          eventId: event.id,
          userId: waitlisted.userId,
          reminderType: "waitlist_closed",
          offsetMinutes: null
        });
        if (!inserted) {
          continue;
        }
        sendTransactionalEmail({
          to: waitlisted.email,
          subject: `IWFSA Waitlist Update - ${event.title}`,
          text:
            `Hello ${formatParticipantName(waitlisted.fullName, waitlisted.username)},\n\n` +
            `Registration for "${event.title}" is now closed and your waitlist status remains unchanged.\n` +
            `We will contact you if a space is released.\n\n` +
            `Regards,\nIWFSA Admin`,
          metadata: { template: "registration_waitlist_closed" }
        });
        recordNotificationDelivery(database, {
          userId: waitlisted.userId,
          channel: "email",
          eventType: "registration_waitlist_closed",
          status: "sent",
          idempotencyKey: `reminder:${event.id}:${waitlisted.userId}:waitlist_closed`
        });
        waitlistClosedSent += 1;
      }

      const overflow = loadEventSignupSummary(database, event.id);
      if (overflow.waitlistedCount > 0) {
        const alert = database
          .prepare(
            `
            INSERT OR IGNORE INTO event_alerts (event_id, alert_type, metadata_json)
            VALUES (?, 'registration_closed_waitlist_remaining', ?)
          `
          )
          .run(
            event.id,
            JSON.stringify({ waitlistedCount: overflow.waitlistedCount, closedAt: event.registrationClosesAt })
          );
        if (alert.changes > 0) {
          sendTransactionalEmail({
            to: supportEmail,
            subject: `IWFSA Admin Alert - Waitlist remains after close (${event.title})`,
            text:
              `Registration closed for "${event.title}" with ${overflow.waitlistedCount} waitlisted member(s).\n` +
              `Review capacity and communication plans.`,
            metadata: { template: "registration_admin_alert_waitlist_remaining" }
          });
          recordNotificationDelivery(database, {
            channel: "email",
            eventType: "registration_admin_alert_waitlist_remaining",
            status: "sent",
            idempotencyKey: `alert:${event.id}:waitlist_remaining`
          });
        }
      }
    }
  }

  return { reminderSent, waitlistClosedSent };
}

function extractBearerToken(request) {
  const header = request.headers.authorization || "";
  if (!header.toLowerCase().startsWith("bearer ")) {
    return null;
  }
  const token = header.slice("bearer ".length).trim();
  return token || null;
}

function loadSession(database, token) {
  if (!token) {
    return null;
  }

  const session = database
    .prepare(
      `
      SELECT
        sessions.token,
        sessions.user_id AS userId,
        sessions.expires_at AS expiresAt,
        sessions.revoked_at AS revokedAt,
        users.username,
        users.email,
        users.role,
        users.status,
        users.must_change_password AS mustChangePassword,
        users.must_change_username AS mustChangeUsername
      FROM sessions
      JOIN users ON users.id = sessions.user_id
      WHERE sessions.token = ?
      LIMIT 1
    `
    )
    .get(token);

  if (!session) {
    return null;
  }

  if (session.revokedAt) {
    return null;
  }

  if (new Date(session.expiresAt).getTime() <= Date.now()) {
    return null;
  }

  if (session.status !== "active") {
    return null;
  }

  return session;
}

function requireAuth(database, request, response, corsHeaders) {
  const token = extractBearerToken(request);
  const session = loadSession(database, token);
  if (!session) {
    writeJson(response, 401, { error: "unauthorized", message: "Authentication required." }, corsHeaders);
    return null;
  }

  return {
    token: session.token,
    user: {
      id: session.userId,
      username: session.username,
      email: session.email,
      role: session.role,
      mustChangePassword: Boolean(session.mustChangePassword),
      mustChangeUsername: Boolean(session.mustChangeUsername)
    }
  };
}

function hasRole(role, allowedRoles) {
  return allowedRoles.includes(role);
}

function requireRole(user, allowedRoles, response, corsHeaders) {
  if (!user || !hasRole(user.role, allowedRoles)) {
    writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
    return false;
  }
  if (!requireActivationClear(user, response, corsHeaders)) {
    return false;
  }
  return true;
}

function createSession(database, userId) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  database
    .prepare(
      `
      INSERT INTO sessions (token, user_id, expires_at)
      VALUES (?, ?, ?)
    `
    )
    .run(token, userId, expiresAt);

  return { token, expiresAt };
}

function revokeSession(database, token) {
  if (!token) {
    return false;
  }
  const result = database
    .prepare(
      `
      UPDATE sessions
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token = ? AND revoked_at IS NULL
    `
    )
    .run(token);
  return result.changes > 0;
}

function hasEventEditorGrant(database, eventId, userId) {
  const row = database
    .prepare(
      `
      SELECT 1
      FROM event_editor_grants
      WHERE event_id = ? AND user_id = ?
      LIMIT 1
    `
    )
    .get(eventId, userId);
  return Boolean(row);
}

function isAdminRole(role) {
  return role === "chief_admin" || role === "admin";
}

function resolveEventCreatorUserId(eventRow) {
  const raw = eventRow?.created_by_user_id ?? eventRow?.createdByUserId ?? 0;
  const normalized = Number(raw);
  return Number.isInteger(normalized) ? normalized : 0;
}

function canEditEvent(database, user, eventId, { eventRow = null } = {}) {
  if (!user) {
    return false;
  }
  if (isAdminRole(user.role)) {
    return true;
  }
  const current = eventRow || loadEvent(database, eventId);
  if (!current) {
    return false;
  }
  if (hasEventEditorGrant(database, current.id, user.id)) {
    return true;
  }
  const isCreator = resolveEventCreatorUserId(current) === Number(user.id || 0);
  if (!isCreator) {
    return false;
  }
  return current.status !== "cancelled";
}

function canDeleteEvent(database, user, eventId, { eventRow = null } = {}) {
  if (!user) {
    return false;
  }
  if (isAdminRole(user.role)) {
    return true;
  }
  const current = eventRow || loadEvent(database, eventId);
  if (!current) {
    return false;
  }
  if (hasEventEditorGrant(database, current.id, user.id)) {
    return true;
  }
  const isCreator = resolveEventCreatorUserId(current) === Number(user.id || 0);
  return isCreator && current.status === "draft";
}

function canManageEventPlanning(database, user, eventId, { eventRow = null } = {}) {
  if (!user) {
    return false;
  }
  if (isAdminRole(user.role)) {
    return true;
  }
  const current = eventRow || loadEvent(database, eventId);
  if (!current) {
    return false;
  }
  const isCreator = resolveEventCreatorUserId(current) === Number(user.id || 0);
  if (isCreator) {
    return true;
  }
  return hasEventEditorGrant(database, current.id, user.id);
}

function canManageEventEditorGrants(database, user, eventId, { eventRow = null } = {}) {
  if (!user) {
    return false;
  }
  if (isAdminRole(user.role)) {
    return true;
  }
  const current = eventRow || loadEvent(database, eventId);
  if (!current) {
    return false;
  }
  return resolveEventCreatorUserId(current) === Number(user.id || 0);
}

function findUserForLogin(database, username) {
  return database
    .prepare(
      `
      SELECT
        id,
        username,
        email,
        role,
        status,
        must_change_password AS must_change_password,
        must_change_username AS must_change_username,
        password_hash AS passwordHash
      FROM users
      WHERE username = ?
      LIMIT 1
    `
    )
    .get(username);
}

function listMembers(database) {
  const members = database
    .prepare(
      `
      SELECT
        users.id,
        users.username,
        users.email,
        users.role,
        users.status,
        users.created_at AS createdAt,
        users.updated_at AS updatedAt,
        member_profiles.full_name AS fullName,
        member_profiles.company AS company,
        member_profiles.phone AS phone,
        member_profiles.photo_url AS photoUrl,
        member_profiles.birthday_month AS birthdayMonth,
        member_profiles.birthday_day AS birthdayDay,
        member_profiles.birthday_visibility AS birthdayVisibility
      FROM users
      LEFT JOIN member_profiles ON member_profiles.user_id = users.id
      WHERE users.role = 'member'
      ORDER BY
        CASE WHEN member_profiles.full_name IS NULL OR member_profiles.full_name = '' THEN 1 ELSE 0 END,
        member_profiles.full_name,
        users.username
    `
    )
    .all();

  if (members.length === 0) {
    return [];
  }

  const ids = members.map((member) => member.id);
  const placeholders = ids.map(() => "?").join(",");
  const groupRows = database
    .prepare(
      `
      SELECT
        group_members.user_id AS userId,
        groups.name AS name
      FROM group_members
      JOIN groups ON groups.id = group_members.group_id
      WHERE group_members.user_id IN (${placeholders})
      ORDER BY groups.name
    `
    )
    .all(...ids);

  const groupsByUser = new Map();
  for (const row of groupRows) {
    if (!groupsByUser.has(row.userId)) {
      groupsByUser.set(row.userId, []);
    }
    groupsByUser.get(row.userId).push(row.name);
  }

  return members.map((member) => ({
    ...member,
    groups: groupsByUser.get(member.id) || []
  }));
}

function queueMemberInvites(database, userIds, actorUserId, { expiryHours = 72 } = {}) {
  if (userIds.length === 0) {
    return { queued: [], skipped: [] };
  }

  const placeholders = userIds.map(() => "?").join(",");
  const members = database
    .prepare(
      `
      SELECT id, username, email, status
      FROM users
      WHERE role = 'member' AND id IN (${placeholders})
    `
    )
    .all(...userIds);

  if (members.length === 0) {
    return { queued: [], skipped: [] };
  }

  const eligible = members.filter((member) => member.status !== "active");
  const eligibleIds = eligible.map((member) => member.id);

  if (eligibleIds.length > 0) {
    const updatePlaceholders = eligibleIds.map(() => "?").join(",");
    database
      .prepare(
        `
        UPDATE users
        SET status = 'invited', must_change_password = 1, updated_at = CURRENT_TIMESTAMP
        WHERE id IN (${updatePlaceholders})
          AND status IN ('not_invited', 'invited')
      `
      )
      .run(...eligibleIds);

    const insertAudit = database.prepare(
      `
      INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
      VALUES (?, 'member_invite_queued', 'user', ?, ?)
    `
    );

    for (const member of eligible) {
      insertAudit.run(
        actorUserId || null,
        String(member.id),
        JSON.stringify({ username: member.username, email: member.email })
      );
    }
  }

  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
  const inviteTokens = new Map();
  for (const member of eligible) {
    const tokenRecord = createTokenRecord(database, "member_invite_tokens", member.id, actorUserId, expiresAt);
    inviteTokens.set(member.id, tokenRecord);
  }

  const queued = eligible.map((member) => ({
    id: member.id,
    username: member.username,
    email: member.email,
    status: "invited",
    inviteTokenId: inviteTokens.get(member.id)?.id,
    inviteToken: inviteTokens.get(member.id)?.token,
    expiresAt: inviteTokens.get(member.id)?.expiresAt
  }));

  const skipped = members
    .filter((member) => member.status === "active")
    .map((member) => ({
      id: member.id,
      username: member.username,
      email: member.email,
      status: member.status,
      reason: "Already active"
    }));

  return { queued, skipped };
}

function queueCredentialResets(database, userIds, actorUserId, { expiryHours = 72 } = {}) {
  if (userIds.length === 0) {
    return { queued: [], skipped: [] };
  }

  const placeholders = userIds.map(() => "?").join(",");
  const members = database
    .prepare(
      `
      SELECT id, username, email, status
      FROM users
      WHERE role = 'member' AND id IN (${placeholders})
    `
    )
    .all(...userIds);

  if (members.length === 0) {
    return { queued: [], skipped: [] };
  }

  const eligible = members.filter((member) => member.status === "active" || member.status === "suspended");
  const eligibleIds = eligible.map((member) => member.id);
  const skipped = members
    .filter((member) => !eligibleIds.includes(member.id))
    .map((member) => ({
      id: member.id,
      username: member.username,
      email: member.email,
      status: member.status,
      reason: "Account not active"
    }));

  const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000).toISOString();
  const queued = [];

  for (const member of eligible) {
    runTransaction(database, () => {
      const tempPassword = randomBytes(16).toString("hex");
      database
        .prepare(
          `
          UPDATE users
          SET password_hash = ?, must_change_password = 1, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
        )
        .run(hashPassword(tempPassword), member.id);

      database
        .prepare(
          `
          UPDATE sessions
          SET revoked_at = CURRENT_TIMESTAMP
          WHERE user_id = ? AND revoked_at IS NULL
        `
        )
        .run(member.id);

      const tokenRecord = createTokenRecord(
        database,
        "password_reset_tokens",
        member.id,
        actorUserId,
        expiresAt
      );

      database
        .prepare(
          `
          INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
          VALUES (?, 'member_credential_reset_queued', 'user', ?, ?)
        `
        )
        .run(actorUserId, String(member.id), JSON.stringify({ username: member.username, email: member.email }));

      queued.push({
        id: member.id,
        username: member.username,
        email: member.email,
        status: member.status,
        resetTokenId: tokenRecord.id,
        resetToken: tokenRecord.token,
        expiresAt: tokenRecord.expiresAt
      });
    });
  }

  return { queued, skipped };
}

function toPublicInviteQueueResult(result) {
  return {
    queued: (result?.queued || []).map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      status: item.status,
      expiresAt: item.expiresAt
    })),
    skipped: (result?.skipped || []).map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      status: item.status,
      reason: item.reason
    }))
  };
}

function toPublicResetQueueResult(result) {
  return {
    queued: (result?.queued || []).map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      status: item.status,
      expiresAt: item.expiresAt
    })),
    skipped: (result?.skipped || []).map((item) => ({
      id: item.id,
      username: item.username,
      email: item.email,
      status: item.status,
      reason: item.reason
    }))
  };
}

function loadExistingUsersByEmail(database, emails) {
  if (emails.length === 0) {
    return new Map();
  }

  const placeholders = emails.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT id, email, username, status
      FROM users
      WHERE LOWER(email) IN (${placeholders})
    `
    )
    .all(...emails.map((email) => email.toLowerCase()));

  const map = new Map();
  for (const row of rows) {
    map.set(String(row.email).toLowerCase(), row);
  }
  return map;
}

function loadExistingUsernames(database, usernames) {
  if (usernames.length === 0) {
    return new Map();
  }

  const placeholders = usernames.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT id, username
      FROM users
      WHERE LOWER(username) IN (${placeholders})
    `
    )
    .all(...usernames.map((username) => username.toLowerCase()));

  const map = new Map();
  for (const row of rows) {
    map.set(String(row.username).toLowerCase(), row);
  }
  return map;
}

function ensureGroupIds(database, groupNames) {
  const result = new Map();
  if (groupNames.length === 0) {
    return result;
  }

  const unique = [...new Set(groupNames.map((name) => name.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return result;
  }

  const placeholders = unique.map(() => "?").join(",");
  const existing = database
    .prepare(`SELECT id, name FROM groups WHERE name IN (${placeholders})`)
    .all(...unique);

  for (const row of existing) {
    result.set(row.name, row.id);
  }

  const insert = database.prepare("INSERT INTO groups (name) VALUES (?)");
  for (const name of unique) {
    if (!result.has(name)) {
      const info = insert.run(name);
      result.set(name, info.lastInsertRowid);
    }
  }

  return result;
}

function ensureRoleIds(database, roleNames) {
  const result = new Map();
  if (roleNames.length === 0) {
    return result;
  }

  const unique = [...new Set(roleNames.map((name) => name.trim()).filter(Boolean))];
  if (unique.length === 0) {
    return result;
  }

  const placeholders = unique.map(() => "?").join(",");
  const existing = database
    .prepare(`SELECT id, name FROM member_roles WHERE name IN (${placeholders})`)
    .all(...unique);

  for (const row of existing) {
    result.set(row.name, row.id);
  }

  const insert = database.prepare("INSERT INTO member_roles (name) VALUES (?)");
  for (const name of unique) {
    if (!result.has(name)) {
      const info = insert.run(name);
      result.set(name, info.lastInsertRowid);
    }
  }

  return result;
}

function loadEvent(database, eventId) {
  return database
    .prepare(
      `
      SELECT *
      FROM events
      WHERE id = ?
      LIMIT 1
    `
    )
    .get(eventId);
}

function loadEventAudienceUserIds(database, eventId, audienceType) {
  if (audienceType === "groups") {
    const rows = database
      .prepare(
        `
        SELECT DISTINCT group_members.user_id AS userId
        FROM event_audience_groups
        JOIN group_members ON group_members.group_id = event_audience_groups.group_id
        JOIN users ON users.id = group_members.user_id
        WHERE event_audience_groups.event_id = ?
          AND users.role = 'member'
          AND users.status = 'active'
      `
      )
      .all(eventId);
    return rows.map((row) => row.userId);
  }

  const rows = database
    .prepare(
      `
      SELECT id AS userId
      FROM users
      WHERE role = 'member' AND status = 'active'
    `
    )
    .all();
  return rows.map((row) => row.userId);
}

function loadEventParticipantUserIds(database, eventId) {
  const rows = database
    .prepare(
      `
      SELECT DISTINCT user_id AS userId
      FROM signups
      WHERE event_id = ? AND status IN ('confirmed', 'waitlisted')
    `
    )
    .all(eventId);
  return rows.map((row) => row.userId);
}

function loadUserContacts(database, userIds) {
  if (!Array.isArray(userIds) || userIds.length === 0) {
    return new Map();
  }
  const placeholders = userIds.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT
        users.id AS userId,
        users.email,
        users.username,
        member_profiles.full_name AS fullName
      FROM users
      LEFT JOIN member_profiles ON member_profiles.user_id = users.id
      WHERE users.id IN (${placeholders})
    `
    )
    .all(...userIds);
  return new Map(rows.map((row) => [row.userId, row]));
}

function buildEventSnapshot(database, eventId) {
  const eventRow = loadEvent(database, eventId);
  if (!eventRow) {
    return null;
  }
  const groupRows = database
    .prepare(
      `
      SELECT group_id AS groupId
      FROM event_audience_groups
      WHERE event_id = ?
    `
    )
    .all(eventId);
  return {
    event: eventRow,
    groupIds: groupRows.map((row) => row.groupId)
  };
}

function insertEventRevision(database, { eventId, revisionType, snapshot, actorUserId }) {
  const payload = JSON.stringify(snapshot || {});
  const result = database
    .prepare(
      `
      INSERT INTO event_revisions (event_id, revision_type, snapshot_json, created_by_user_id)
      VALUES (?, ?, ?, ?)
    `
    )
    .run(eventId, revisionType, payload, actorUserId || null);
  return result.lastInsertRowid;
}

function enqueueNotification(database, { idempotencyKey, eventType, payload }) {
  const result = database
    .prepare(
      `
      INSERT OR IGNORE INTO notification_queue (
        idempotency_key,
        event_type,
        payload_json,
        status
      ) VALUES (?, ?, ?, 'pending')
    `
    )
    .run(idempotencyKey, eventType, JSON.stringify(payload || {}));
  return result.changes > 0;
}

function recordNotificationDelivery(database, {
  notificationId = null,
  userId = null,
  channel,
  eventType,
  status,
  idempotencyKey,
  errorMessage = null
}) {
  database
    .prepare(
      `
      INSERT OR IGNORE INTO notification_deliveries (
        notification_id,
        user_id,
        channel,
        event_type,
        status,
        idempotency_key,
        error_message
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(notificationId, userId, channel, eventType, status, idempotencyKey, errorMessage);
}

function createInAppNotification(database, { userId, eventType, title, body, metadata, idempotencyKey }) {
  const existing = database
    .prepare("SELECT id FROM notification_deliveries WHERE idempotency_key = ?")
    .get(idempotencyKey);
  if (existing) {
    return existing.id;
  }
  const result = database
    .prepare(
      `
      INSERT INTO notifications (user_id, event_type, title, body, metadata_json)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(userId, eventType, title, body, JSON.stringify(metadata || {}));
  const notificationId = result.lastInsertRowid;
  recordNotificationDelivery(database, {
    notificationId,
    userId,
    channel: "in_app",
    eventType,
    status: "sent",
    idempotencyKey
  });
  return notificationId;
}

function processNotificationQueue(database, { limit = 50, supportEmail = "support@iwfsa.local", appBaseUrl = "" } = {}) {
  const rows = database
    .prepare(
      `
      SELECT id, event_type AS eventType, payload_json AS payloadJson
      FROM notification_queue
      WHERE status = 'pending'
      ORDER BY id ASC
      LIMIT ?
    `
    )
    .all(limit);

  for (const row of rows) {
    const updateResult = database
      .prepare(
        `
        UPDATE notification_queue
        SET status = 'processing', attempts = attempts + 1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND status = 'pending'
      `
      )
      .run(row.id);
    if (updateResult.changes === 0) {
      continue;
    }

    let payload = {};
    try {
      payload = JSON.parse(row.payloadJson || "{}");
    } catch {
      payload = {};
    }

    try {
      const errors = [];

      if (row.eventType === "event_published") {
        const eventRow = loadEvent(database, payload.eventId);
        if (!eventRow) {
          throw new Error("Event not found.");
        }
        const userIds = loadEventAudienceUserIds(database, eventRow.id, eventRow.audience_type);
        const contactMap = loadUserContacts(database, userIds);
        for (const userId of userIds) {
          const tokenRecord = ensureMeetingRsvpToken(database, {
            eventId: eventRow.id,
            userId,
            actorUserId: eventRow.created_by_user_id || null
          });
          const rsvpUrl = buildMeetingRsvpUrl(appBaseUrl, tokenRecord.token);
          const idempotencyKey = `event_published:${payload.revisionId}:${userId}`;
          const title = `Meeting invitation: ${eventRow.title}`;
          const body =
            `Starts ${eventRow.start_at}. Venue: ${eventRow.venue_name || "TBA"}.` +
            (rsvpUrl ? ` Confirm participation: ${rsvpUrl}` : "");
          createInAppNotification(database, {
            userId,
            eventType: row.eventType,
            title,
            body,
            metadata: { eventId: eventRow.id, rsvpUrl },
            idempotencyKey
          });

          const contact = contactMap.get(userId);
          const emailKey = `event_published_email:${payload.revisionId}:${userId}`;
          if (!contact || !contact.email) {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: "missing_email"
            });
            errors.push(`missing_email:${userId}`);
            continue;
          }

          try {
            sendTransactionalEmail({
              to: contact.email,
              subject: title,
              text:
                `${body}\n\n` +
                (rsvpUrl
                  ? `One-click RSVP: ${rsvpUrl}\n\n`
                  : "") +
                "Open the member portal to view details and manage your response.",
              metadata: { template: "event_published" }
            });
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "sent",
              idempotencyKey: emailKey
            });
          } catch (error) {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: String(error.message || error)
            });
            errors.push(`email_failed:${userId}`);
          }
        }
      }

      if (row.eventType === "event_updated") {
        const eventRow = loadEvent(database, payload.eventId);
        if (!eventRow) {
          throw new Error("Event not found.");
        }
        const userIds = loadEventParticipantUserIds(database, eventRow.id);
        const contactMap = loadUserContacts(database, userIds);
        const changeSummary = Array.isArray(payload.changes) ? payload.changes.join(", ") : "Event details updated.";
        for (const userId of userIds) {
          const idempotencyKey = `event_updated:${payload.revisionId}:${userId}`;
          const title = `Event updated: ${eventRow.title}`;
          const body = `${changeSummary} Starts ${eventRow.start_at}.`;
          createInAppNotification(database, {
            userId,
            eventType: row.eventType,
            title,
            body,
            metadata: { eventId: eventRow.id },
            idempotencyKey
          });

          const contact = contactMap.get(userId);
          const emailKey = `event_updated_email:${payload.revisionId}:${userId}`;
          if (!contact || !contact.email) {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: "missing_email"
            });
            errors.push(`missing_email:${userId}`);
            continue;
          }

          try {
            sendTransactionalEmail({
              to: contact.email,
              subject: title,
              text: `${body}\n\nOpen the member portal to view details.`,
              metadata: { template: "event_updated" }
            });
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "sent",
              idempotencyKey: emailKey
            });
          } catch (error) {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: String(error.message || error)
            });
            errors.push(`email_failed:${userId}`);
          }
        }
      }

      const nextStatus = errors.length > 0 ? "failed" : "sent";
      const lastError = errors.length > 0 ? errors.slice(0, 3).join(", ") : null;
      database
        .prepare(
          `
          UPDATE notification_queue
          SET status = ?, last_error = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
        )
        .run(nextStatus, lastError, row.id);
    } catch (error) {
      database
        .prepare(
          `
          UPDATE notification_queue
          SET status = 'failed', last_error = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
        )
        .run(String(error.message || error), row.id);
      recordNotificationDelivery(database, {
        channel: "email",
        eventType: row.eventType,
        status: "failed",
        idempotencyKey: `queue:${row.id}`,
        errorMessage: String(error.message || error)
      });
      console.error(
        JSON.stringify({
          level: "error",
          event: "notification_queue_failed",
          message: String(error.message || error),
          supportEmail
        })
      );
    }
  }
}

function setEventAudienceGroups(database, eventId, groupIds) {
  database.prepare("DELETE FROM event_audience_groups WHERE event_id = ?").run(eventId);
  if (groupIds.length === 0) {
    return;
  }
  const insert = database.prepare("INSERT INTO event_audience_groups (event_id, group_id) VALUES (?, ?)");
  for (const groupId of groupIds) {
    insert.run(eventId, groupId);
  }
}

function loadEventAudienceGroupIds(database, eventId) {
  const rows = database
    .prepare(
      `
      SELECT group_id AS groupId
      FROM event_audience_groups
      WHERE event_id = ?
      ORDER BY group_id
    `
    )
    .all(eventId);
  return rows.map((row) => Number(row.groupId)).filter((id) => Number.isInteger(id));
}

function hasSameIntegerSet(left, right) {
  const a = [...new Set((left || []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))].sort(
    (x, y) => x - y
  );
  const b = [...new Set((right || []).map((value) => Number(value)).filter((value) => Number.isInteger(value)))].sort(
    (x, y) => x - y
  );
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}

function normalizeEventStatus(value) {
  const status = String(value || "").trim().toLowerCase();
  if (["draft", "published", "postponed", "cancelled"].includes(status)) {
    return status;
  }
  return null;
}

function setGroupMemberships(database, userId, groupIds) {
  database.prepare("DELETE FROM group_members WHERE user_id = ?").run(userId);
  if (groupIds.length === 0) {
    return;
  }
  const insert = database.prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)");
  for (const groupId of groupIds) {
    insert.run(groupId, userId);
  }
}

function hashOpaqueToken(token) {
  return createHash("sha256").update(String(token || "")).digest("hex");
}

function createTokenRecord(database, tableName, userId, actorUserId, expiresAt) {
  const token = randomBytes(24).toString("hex");
  const tokenHash = hashOpaqueToken(token);
  const result = database
    .prepare(
      `
      INSERT INTO ${tableName} (token, user_id, created_by_user_id, expires_at)
      VALUES (?, ?, ?, ?)
    `
    )
    .run(tokenHash, userId, actorUserId, expiresAt);
  return { id: result.lastInsertRowid, token, expiresAt };
}

function loadTokenRecord(database, tableName, token) {
  if (!token) {
    return null;
  }
  const tokenText = String(token || "").trim();
  const tokenHash = hashOpaqueToken(tokenText);
  return database
    .prepare(
      `
      SELECT id, user_id AS userId, expires_at AS expiresAt, used_at AS usedAt
      FROM ${tableName}
      WHERE token = ? OR token = ?
      LIMIT 1
    `
    )
    .get(tokenHash, tokenText);
}

function markTokenUsed(database, tableName, tokenId) {
  database
    .prepare(
      `
      UPDATE ${tableName}
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ? AND used_at IS NULL
    `
    )
    .run(tokenId);
}

function setRoleAssignments(database, userId, roleIds) {
  database.prepare("DELETE FROM member_role_assignments WHERE user_id = ?").run(userId);
  if (roleIds.length === 0) {
    return;
  }
  const insert = database.prepare("INSERT INTO member_role_assignments (role_id, user_id) VALUES (?, ?)");
  for (const roleId of roleIds) {
    insert.run(roleId, userId);
  }
}

function runTransaction(database, callback, { immediate = false } = {}) {
  database.exec(immediate ? "BEGIN IMMEDIATE" : "BEGIN");
  try {
    const result = callback();
    database.exec("COMMIT");
    return result;
  } catch (error) {
    database.exec("ROLLBACK");
    throw error;
  }
}

function getFirstName(fullName, fallback) {
  if (fullName) {
    return String(fullName).trim().split(" ")[0] || fallback;
  }
  return fallback;
}

function loadUserRegistrationOverride(database, eventId, userId) {
  return database
    .prepare(
      `
      SELECT closes_at AS closesAt
      FROM event_registration_overrides
      WHERE event_id = ? AND user_id = ?
      LIMIT 1
    `
    )
    .get(eventId, userId);
}

function loadSignupRecord(database, eventId, userId) {
  return database
    .prepare(
      `
      SELECT id, status, created_at AS createdAt, updated_at AS updatedAt
      FROM signups
      WHERE event_id = ? AND user_id = ?
      LIMIT 1
    `
    )
    .get(eventId, userId);
}

function createMeetingRsvpToken(database, { eventId, userId, actorUserId, expiresAt }) {
  const token = randomBytes(24).toString("hex");
  database
    .prepare(
      `
      INSERT INTO meeting_rsvp_tokens (token, event_id, user_id, created_by_user_id, expires_at)
      VALUES (?, ?, ?, ?, ?)
    `
    )
    .run(token, eventId, userId, actorUserId || null, expiresAt);
  return { token, expiresAt };
}

function loadMeetingRsvpToken(database, token) {
  if (!token) {
    return null;
  }
  return database
    .prepare(
      `
      SELECT
        id,
        token,
        event_id AS eventId,
        user_id AS userId,
        created_by_user_id AS createdByUserId,
        expires_at AS expiresAt,
        used_at AS usedAt,
        created_at AS createdAt
      FROM meeting_rsvp_tokens
      WHERE token = ?
      LIMIT 1
    `
    )
    .get(token);
}

function markMeetingRsvpTokenUsed(database, tokenId) {
  database
    .prepare(
      `
      UPDATE meeting_rsvp_tokens
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ? AND used_at IS NULL
    `
    )
    .run(tokenId);
}

function ensureMeetingRsvpToken(database, { eventId, userId, actorUserId, ttlHours = MEETING_RSVP_TOKEN_TTL_HOURS }) {
  const rows = database
    .prepare(
      `
      SELECT token, expires_at AS expiresAt, used_at AS usedAt
      FROM meeting_rsvp_tokens
      WHERE event_id = ? AND user_id = ?
      ORDER BY id DESC
      LIMIT 8
    `
    )
    .all(eventId, userId);

  const nowMs = Date.now();
  for (const row of rows) {
    const expiresAtMs = parseIsoToMs(row.expiresAt);
    if (!row.usedAt && expiresAtMs !== null && expiresAtMs > nowMs) {
      return { token: row.token, expiresAt: row.expiresAt };
    }
  }

  const expiresAt = new Date(nowMs + Number(ttlHours || 0) * 60 * 60 * 1000).toISOString();
  return createMeetingRsvpToken(database, { eventId, userId, actorUserId, expiresAt });
}

function loadEventSignupRows(database, eventId) {
  return database
    .prepare(
      `
      SELECT user_id AS userId, status, updated_at AS updatedAt
      FROM signups
      WHERE event_id = ?
    `
    )
    .all(eventId);
}

function buildMeetingPlanningSnapshot(database, eventId) {
  const eventRow = loadEvent(database, eventId);
  if (!eventRow) {
    return null;
  }

  const invitedUserIds = loadEventAudienceUserIds(database, eventId, eventRow.audience_type);
  const contacts = loadUserContacts(database, invitedUserIds);
  const signupRows = loadEventSignupRows(database, eventId);
  const signupMap = new Map(signupRows.map((row) => [Number(row.userId), row]));

  let confirmedCount = 0;
  let waitlistedCount = 0;
  let cancelledCount = 0;
  const participants = invitedUserIds.map((userId) => {
    const signup = signupMap.get(Number(userId)) || null;
    const responseStatus = signup?.status || "pending";
    if (responseStatus === "confirmed") confirmedCount += 1;
    if (responseStatus === "waitlisted") waitlistedCount += 1;
    if (responseStatus === "cancelled") cancelledCount += 1;

    const contact = contacts.get(userId) || {};
    return {
      userId,
      fullName: contact.fullName || null,
      username: contact.username || null,
      email: contact.email || null,
      responseStatus,
      respondedAt: signup?.updatedAt || null
    };
  });

  const statusRank = { confirmed: 1, waitlisted: 2, pending: 3, cancelled: 4 };
  participants.sort((left, right) => {
    const leftRank = statusRank[left.responseStatus] || 9;
    const rightRank = statusRank[right.responseStatus] || 9;
    if (leftRank !== rightRank) return leftRank - rightRank;
    const leftName = String(left.fullName || left.username || left.email || "").toLowerCase();
    const rightName = String(right.fullName || right.username || right.email || "").toLowerCase();
    return leftName.localeCompare(rightName);
  });

  const pendingCount = Math.max(invitedUserIds.length - confirmedCount - waitlistedCount - cancelledCount, 0);
  return {
    eventRow,
    participants,
    invitedUserIds,
    counts: {
      invitedCount: invitedUserIds.length,
      confirmedCount,
      waitlistedCount,
      cancelledCount,
      pendingCount
    }
  };
}

function resolveMeetingPlanningRecipients(snapshot, audienceScope) {
  const scope = MEETING_PLANNING_SCOPES.has(audienceScope) ? audienceScope : "all_invited";
  if (!snapshot || !Array.isArray(snapshot.participants)) {
    return [];
  }

  if (scope === "confirmed_only") {
    return snapshot.participants.filter((item) => item.responseStatus === "confirmed");
  }
  if (scope === "waitlisted_only") {
    return snapshot.participants.filter((item) => item.responseStatus === "waitlisted");
  }
  if (scope === "pending_only") {
    return snapshot.participants.filter((item) => item.responseStatus === "pending");
  }
  return snapshot.participants;
}

function submitEventForApproval(database, { eventId, actorUserId, eventRow = null }) {
  const current = eventRow || loadEvent(database, eventId);
  if (!current) {
    return {
      submitted: false,
      alreadySubmitted: false,
      alreadyPublished: false,
      status: null,
      eventRow: null
    };
  }

  if (current.status === "published") {
    return {
      submitted: false,
      alreadySubmitted: true,
      alreadyPublished: true,
      status: "published",
      eventRow: current
    };
  }

  if (current.status === "cancelled") {
    const error = new Error("Cancelled meetings cannot be published.");
    error.httpStatus = 409;
    error.code = "invalid_state";
    throw error;
  }

  const publication = publishEvent(database, {
    eventId,
    actorUserId,
    eventRow: current
  });

  return {
    submitted: publication.published,
    alreadySubmitted: publication.alreadyPublished,
    alreadyPublished: publication.alreadyPublished,
    status: "published",
    eventRow: publication.eventRow
  };
}

function publishEvent(database, { eventId, actorUserId, eventRow = null, requirePendingApproval = false }) {
  const current = eventRow || loadEvent(database, eventId);
  if (!current) {
    return { published: false, alreadyPublished: false, revisionId: null, eventRow: null };
  }
  if (current.status === "published") {
    return { published: true, alreadyPublished: true, revisionId: null, eventRow: current };
  }
  if (requirePendingApproval && current.status !== "pending_approval") {
    const error = new Error("Event must be pending approval before publishing.");
    error.httpStatus = 409;
    error.code = "invalid_state";
    throw error;
  }
  if (current.status === "cancelled") {
    const error = new Error("Cancelled meetings cannot be published.");
    error.httpStatus = 409;
    error.code = "invalid_state";
    throw error;
  }

  const snapshot = buildEventSnapshot(database, eventId);
  const revisionId = insertEventRevision(database, {
    eventId,
    revisionType: "publish",
    snapshot,
    actorUserId: actorUserId || null
  });

  database
    .prepare("UPDATE events SET status = 'published', updated_at = CURRENT_TIMESTAMP WHERE id = ?")
    .run(eventId);

  database
    .prepare(
      `
      INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
      VALUES (?, 'event_published', 'event', ?, ?)
    `
    )
    .run(
      actorUserId || null,
      String(eventId),
      JSON.stringify({ previousStatus: current.status, status: "published", revisionId, autoPublished: false })
    );

  enqueueNotification(database, {
    idempotencyKey: `event_published:${revisionId}`,
    eventType: "event_published",
    payload: { eventId, revisionId }
  });

  return {
    published: true,
    alreadyPublished: false,
    revisionId,
    eventRow: { ...current, status: "published" }
  };
}

function notifyMeetingOrganizerAboutResponse(database, { eventRow, responderUserId, responseStatus }) {
  const organizerUserId = Number(eventRow?.created_by_user_id || 0);
  if (!Number.isInteger(organizerUserId) || organizerUserId <= 0 || organizerUserId === responderUserId) {
    return;
  }

  const responder = loadUserContacts(database, [responderUserId]).get(responderUserId);
  const responderName = responder?.fullName || responder?.username || `Member ${responderUserId}`;
  const detail =
    responseStatus === "waitlisted"
      ? `${responderName} joined the waitlist for "${eventRow.title}".`
      : `${responderName} confirmed participation for "${eventRow.title}".`;
  createInAppNotification(database, {
    userId: organizerUserId,
    eventType: "meeting_participation_confirmed",
    title: "Meeting participation update",
    body: detail,
    metadata: { eventId: Number(eventRow.id), responderUserId: Number(responderUserId), responseStatus },
    idempotencyKey: `meeting_participation_confirmed:${eventRow.id}:${responderUserId}:${responseStatus}`
  });
}

function confirmMeetingRsvpByToken(database, { token, summaryCache }) {
  const normalizedToken = String(token || "").trim();
  if (!normalizedToken) {
    const error = new Error("RSVP token is required.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }

  const tokenRecord = loadMeetingRsvpToken(database, normalizedToken);
  if (!tokenRecord) {
    const error = new Error("RSVP token is invalid.");
    error.httpStatus = 403;
    error.code = "invalid_token";
    throw error;
  }
  const expiresAtMs = parseIsoToMs(tokenRecord.expiresAt);
  if (expiresAtMs === null || expiresAtMs <= Date.now()) {
    const error = new Error("RSVP token has expired.");
    error.httpStatus = 403;
    error.code = "expired_token";
    throw error;
  }

  const registration = registerMemberForEvent(database, {
    eventId: tokenRecord.eventId,
    userId: tokenRecord.userId,
    summaryCache
  });

  if (!tokenRecord.usedAt) {
    markMeetingRsvpTokenUsed(database, tokenRecord.id);
  }

  const statusLabel = registration.signupStatus === "waitlisted" ? "waitlisted" : "confirmed";
  createInAppNotification(database, {
    userId: tokenRecord.userId,
    eventType: "meeting_rsvp_confirmed",
    title: "RSVP recorded",
    body:
      statusLabel === "waitlisted"
        ? `You were added to the waitlist for "${registration.eventRow.title}".`
        : `You are confirmed for "${registration.eventRow.title}".`,
    metadata: { eventId: Number(tokenRecord.eventId), status: statusLabel },
    idempotencyKey: `meeting_rsvp_confirmed:${tokenRecord.eventId}:${tokenRecord.userId}:${statusLabel}`
  });

  notifyMeetingOrganizerAboutResponse(database, {
    eventRow: registration.eventRow,
    responderUserId: tokenRecord.userId,
    responseStatus: statusLabel
  });

  database
    .prepare(
      `
      INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
      VALUES (?, 'meeting_rsvp_confirmed', 'event', ?, ?)
    `
    )
    .run(
      tokenRecord.userId,
      String(tokenRecord.eventId),
      JSON.stringify({
        status: statusLabel,
        idempotent: Boolean(registration.idempotent),
        source: "email_link"
      })
    );

  return {
    eventId: tokenRecord.eventId,
    userId: tokenRecord.userId,
    eventTitle: registration.eventRow.title,
    startAt: registration.eventRow.start_at,
    status: statusLabel,
    idempotent: Boolean(registration.idempotent)
  };
}

function saveRegistrationDraft(database, eventId, userId, draftPayload) {
  const draftText = JSON.stringify(draftPayload || {});
  database
    .prepare(
      `
      INSERT INTO registration_drafts (event_id, user_id, draft_json, created_at, updated_at)
      VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(event_id, user_id)
      DO UPDATE SET
        draft_json = excluded.draft_json,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .run(eventId, userId, draftText);
}

function alertLastMinuteSurge(database, eventRow, summary) {
  const closeMs = parseIsoToMs(eventRow.registration_closes_at);
  if (closeMs === null) {
    return false;
  }
  const window = loadRegistrationWindow({
    registrationClosesAt: eventRow.registration_closes_at,
    nowMs: Date.now()
  });
  if (!window.closingSoon || summary.waitlistedCount <= 0) {
    return false;
  }
  const result = database
    .prepare(
      `
      INSERT OR IGNORE INTO event_alerts (event_id, alert_type, metadata_json)
      VALUES (?, 'last_minute_capacity_surge', ?)
    `
    )
    .run(
      eventRow.id,
      JSON.stringify({
        title: eventRow.title,
        waitlistedCount: summary.waitlistedCount,
        capacity: eventRow.capacity,
        registrationClosesAt: eventRow.registration_closes_at
      })
    );
  if (result.changes > 0) {
    sendTransactionalEmail({
      to: "support@iwfsa.local",
      subject: `IWFSA Admin Alert - Last-minute surge (${eventRow.title})`,
      text:
        `Registration demand exceeded capacity close to deadline for "${eventRow.title}".\n` +
        `Waitlisted members: ${summary.waitlistedCount}. Capacity: ${eventRow.capacity}.`,
      metadata: { template: "registration_admin_alert_last_minute_surge" }
    });
    recordNotificationDelivery(database, {
      channel: "email",
      eventType: "registration_admin_alert_last_minute_surge",
      status: "sent",
      idempotencyKey: `alert:${eventRow.id}:last_minute_surge`
    });
    return true;
  }
  return false;
}

function registerMemberForEvent(database, { eventId, userId, summaryCache }) {
  const result = runTransaction(
    database,
    () => {
      const eventRow = loadEvent(database, eventId);
      if (!eventRow) {
        const error = new Error("Event not found.");
        error.httpStatus = 404;
        error.code = "not_found";
        throw error;
      }
      if (eventRow.status !== "published") {
        const error = new Error("Event is not open for registration.");
        error.httpStatus = 409;
        error.code = "invalid_state";
        throw error;
      }
      if (
        eventRow.audience_type === "groups" &&
        !canUserAccessGroupedEvent(database, eventId, userId)
      ) {
        const error = new Error("You are not eligible for this event.");
        error.httpStatus = 403;
        error.code = "forbidden";
        throw error;
      }

      const override = loadUserRegistrationOverride(database, eventId, userId);
      const registrationWindow = loadRegistrationWindow({
        registrationClosesAt: eventRow.registration_closes_at,
        overrideClosesAt: override?.closesAt || null
      });

      if (registrationWindow.closed) {
        const error = new Error("Registration is closed for this event.");
        error.httpStatus = 409;
        error.code = "registration_closed";
        error.details = {
          registrationState: registrationWindow.state,
          minutesToClose: registrationWindow.minutesToClose,
          effectiveRegistrationClosesAt: registrationWindow.closesAtIso
        };
        throw error;
      }

      const existingSignup = loadSignupRecord(database, eventId, userId);
      if (existingSignup && (existingSignup.status === "confirmed" || existingSignup.status === "waitlisted")) {
        const summary = loadEventSignupSummary(database, eventId);
        return {
          eventRow,
          registrationWindow,
          signupStatus: existingSignup.status,
          idempotent: true,
          summary
        };
      }

      const summaryBefore = loadEventSignupSummary(database, eventId);
      const capacity = Number(eventRow.capacity || 0);
      const nextStatus = summaryBefore.confirmedCount < capacity ? "confirmed" : "waitlisted";

      if (existingSignup && existingSignup.status === "cancelled") {
        database
          .prepare(
            `
            UPDATE signups
            SET status = ?, created_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          )
          .run(nextStatus, existingSignup.id);
      } else {
        database
          .prepare(
            `
            INSERT INTO signups (event_id, user_id, status, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
          )
          .run(eventId, userId, nextStatus);
      }

      const summaryAfter = loadEventSignupSummary(database, eventId);
      const surgeAlerted = nextStatus === "waitlisted" ? alertLastMinuteSurge(database, eventRow, summaryAfter) : false;

      database
        .prepare(
          `
          INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
          VALUES (?, 'event_registration_created', 'event', ?, ?)
        `
        )
        .run(
          userId,
          String(eventId),
          JSON.stringify({
            status: nextStatus,
            registrationState: registrationWindow.state,
            warningWindowMinutes: REGISTRATION_WARNING_WINDOW_MINUTES,
            surgeAlerted
          })
        );

      return {
        eventRow,
        registrationWindow,
        signupStatus: nextStatus,
        idempotent: false,
        summary: summaryAfter,
        surgeAlerted
      };
    },
    { immediate: true }
  );

  if (summaryCache) {
    summaryCache.invalidate(eventId);
  }
  return result;
}

function cancelMemberRegistration(database, { eventId, userId, summaryCache }) {
  const result = runTransaction(
    database,
    () => {
      const eventRow = loadEvent(database, eventId);
      if (!eventRow) {
        const error = new Error("Event not found.");
        error.httpStatus = 404;
        error.code = "not_found";
        throw error;
      }

      const existingSignup = loadSignupRecord(database, eventId, userId);
      if (!existingSignup || existingSignup.status === "cancelled") {
        const error = new Error("No active registration found.");
        error.httpStatus = 404;
        error.code = "not_found";
        throw error;
      }

      database
        .prepare(
          `
          UPDATE signups
          SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `
        )
        .run(existingSignup.id);

      let promoted = null;
      if (existingSignup.status === "confirmed") {
        const waitlisted = database
          .prepare(
            `
            SELECT id, user_id AS userId
            FROM signups
            WHERE event_id = ? AND status = 'waitlisted'
            ORDER BY created_at ASC, id ASC
            LIMIT 1
          `
          )
          .get(eventId);
        if (waitlisted) {
          database
            .prepare(
              `
              UPDATE signups
              SET status = 'confirmed', updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `
            )
            .run(waitlisted.id);
          promoted = waitlisted;
        }
      }

      database
        .prepare(
          `
          INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
          VALUES (?, 'event_registration_cancelled', 'event', ?, ?)
        `
        )
        .run(
          userId,
          String(eventId),
          JSON.stringify({
            previousStatus: existingSignup.status,
            promotedUserId: promoted?.userId || null
          })
        );

      const summary = loadEventSignupSummary(database, eventId);

      if (promoted) {
        const promotedMember = database
          .prepare(
            `
            SELECT users.email, users.username, member_profiles.full_name AS fullName
            FROM users
            LEFT JOIN member_profiles ON member_profiles.user_id = users.id
            WHERE users.id = ?
            LIMIT 1
          `
          )
          .get(promoted.userId);
        if (promotedMember) {
          sendTransactionalEmail({
            to: promotedMember.email,
            subject: `IWFSA Waitlist Promotion - ${eventRow.title}`,
            text:
              `Hello ${formatParticipantName(promotedMember.fullName, promotedMember.username)},\n\n` +
              `A space has opened for "${eventRow.title}" and your registration is now confirmed.\n\n` +
              `Regards,\nIWFSA Admin`,
            metadata: { template: "waitlist_promoted" }
          });
          recordNotificationDelivery(database, {
            userId: promoted?.userId || null,
            channel: "email",
            eventType: "waitlist_promoted",
            status: "sent",
            idempotencyKey: `waitlist_promoted:${eventId}:${promoted?.userId || "unknown"}`
          });
        }
      }

      return { eventRow, previousStatus: existingSignup.status, promoted, summary };
    },
    { immediate: true }
  );

  if (summaryCache) {
    summaryCache.invalidate(eventId);
  }
  return result;
}

function buildInviteEmail({ firstName, portalUrl, username, inviteUrl, supportEmail }) {
  return {
    subject: "IWFSA Member Portal – Your login details",
    text: `Hello ${firstName},

Your IWFSA Member Portal account has been created.

The Member Portal is the official place to view upcoming IWFSA events, manage registrations, receive event updates/notifications, and access member-only information.

Website: ${portalUrl}
Username: ${username}
Activation link (expires): ${inviteUrl}

Access requirement: To access the portal, you must change your password. Depending on portal policy, you may also be asked to personalise your username. Until activation is completed, your member profile remains on our database for administration purposes, but you will not be able to log in using temporary credentials.

Please sign in as soon as possible and complete the activation step. Once updated, keep your password private and do not share your login details with anyone.

POPIA notice: The IWFSA Member Portal is managed in accordance with the Protection of Personal Information Act (POPIA). Your login credentials are treated as confidential and will not be disclosed to third parties. Only you will have access to your username and password, and you are encouraged to change your password on first login.

If you did not expect this email, or if you believe your account has been compromised, please contact us at ${supportEmail}.

Kind regards,
Akeida Bradley
IWF Administrator`
  };
}

function buildResetEmail({ firstName, username, resetUrl, supportEmail }) {
  return {
    subject: "IWFSA Member Portal – Password reset",
    text: `Hello ${firstName},

A password reset was initiated for your IWFSA Member Portal account.

Username: ${username}
Reset link (expires): ${resetUrl}

If you did not request this change, please contact us at ${supportEmail}.

Kind regards,
Akeida Bradley
IWF Administrator`
  };
}

export async function startApiServer(config) {
  const database = openDatabase(config.databasePath);
  const eventSummaryCache = createEventSummaryCache();
  const reminderIntervalMs =
    Number.isFinite(config.reminderDispatchIntervalMs) && config.reminderDispatchIntervalMs > 0
      ? config.reminderDispatchIntervalMs
      : 60 * 1000;
  const reminderDispatchInterval = setInterval(() => {
    try {
      dispatchDueRegistrationNotifications(database);
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "registration_notification_dispatch_failed",
          message: String(error.message || error)
        })
      );
    }
  }, reminderIntervalMs);
  if (typeof reminderDispatchInterval.unref === "function") {
    reminderDispatchInterval.unref();
  }

  const notificationIntervalMs =
    Number.isFinite(config.notificationDispatchIntervalMs) && config.notificationDispatchIntervalMs > 0
      ? config.notificationDispatchIntervalMs
      : 30 * 1000;
  const notificationDispatchInterval = setInterval(() => {
    try {
      processNotificationQueue(database, { appBaseUrl: config.appBaseUrl });
    } catch (error) {
      console.error(
        JSON.stringify({
          level: "error",
          event: "notification_queue_dispatch_failed",
          message: String(error.message || error)
        })
      );
    }
  }, notificationIntervalMs);
  if (typeof notificationDispatchInterval.unref === "function") {
    notificationDispatchInterval.unref();
  }

  const server = http.createServer(async (request, response) => {
    const corsHeaders = getCorsHeaders(config.appBaseUrl, request.headers.origin);

    if (!request.url) {
      writeJson(response, 400, { error: "bad_request", message: "Request URL is missing." }, corsHeaders);
      return;
    }

    if (request.method === "OPTIONS") {
      response.writeHead(204, corsHeaders);
      response.end();
      return;
    }

    const requestUrl = new URL(request.url, `http://${request.headers.host || `${config.host}:${config.port}`}`);

    if (request.method === "GET" && requestUrl.pathname === "/health") {
      writeJson(response, 200, { status: "ok" }, corsHeaders);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/time") {
      writeJson(
        response,
        200,
        {
          serverTime: new Date().toISOString(),
          monotonicMs: Number(process.hrtime.bigint() / 1000000n)
        },
        corsHeaders
      );
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/events") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const view = requestUrl.searchParams.get("view") || "";
        const items = listPublishedEvents(database, auth.user, view);
        const decorated = decorateEventsForViewer(database, items, auth.user, eventSummaryCache);
        writeJson(
          response,
          200,
          {
            items: decorated,
            serverTime: new Date().toISOString(),
            monotonicMs: Number(process.hrtime.bigint() / 1000000n)
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load events.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/calendar.ics")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const eventRow = loadEvent(database, eventId);
        if (!eventRow || eventRow.status !== "published") {
          writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
          return;
        }

        if (auth.user.role !== "admin" && auth.user.role !== "chief_admin") {
          if (eventRow.audience_type === "groups" && !canUserAccessGroupedEvent(database, eventId, auth.user.id)) {
            writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
            return;
          }
        }

        const ics = buildIcsForEvent(eventRow, { appBaseUrl: config.appBaseUrl });
        if (!ics) {
          writeJson(response, 500, { error: "internal_error", message: "Unable to generate calendar file." }, corsHeaders);
          return;
        }

        response.writeHead(200, {
          ...corsHeaders,
          "Content-Type": "text/calendar; charset=utf-8",
          "Content-Disposition": `attachment; filename="event-${eventId}.ics"`
        });
        response.end(ics);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to generate calendar file.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/notifications") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        if (!requireActivationClear(auth.user, response, corsHeaders)) {
          return;
        }
        const limit = Math.min(Math.max(Number(requestUrl.searchParams.get("limit") || 25), 1), 100);
        const items = database
          .prepare(
            `
            SELECT id, event_type AS eventType, title, body, metadata_json AS metadataJson, created_at AS createdAt, read_at AS readAt
            FROM notifications
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ?
          `
          )
          .all(auth.user.id, limit)
          .map((row) => {
            let metadata = null;
            try {
              metadata = row.metadataJson ? JSON.parse(row.metadataJson) : null;
            } catch {
              metadata = null;
            }
            return { ...row, metadata };
          });
        writeJson(response, 200, { items }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load notifications.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/birthdays") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        if (!requireActivationClear(auth.user, response, corsHeaders)) {
          return;
        }

        const windowDays = Math.min(Math.max(Number(requestUrl.searchParams.get("window") || 14), 1), 60);
        const rows = database
          .prepare(
            `
            SELECT
              users.id AS userId,
              member_profiles.full_name AS fullName,
              member_profiles.photo_url AS photoUrl,
              member_profiles.birthday_month AS birthdayMonth,
              member_profiles.birthday_day AS birthdayDay,
              member_profiles.birthday_visibility AS birthdayVisibility,
              group_concat(member_roles.name, ',') AS rolesCsv
            FROM users
            JOIN member_profiles ON member_profiles.user_id = users.id
            LEFT JOIN member_role_assignments ON member_role_assignments.user_id = users.id
            LEFT JOIN member_roles ON member_roles.id = member_role_assignments.role_id
            WHERE users.role = 'member'
              AND users.status = 'active'
              AND member_profiles.birthday_visibility IN ('hidden', 'members_only', 'members_and_social')
              AND member_profiles.birthday_month IS NOT NULL
              AND member_profiles.birthday_day IS NOT NULL
            GROUP BY users.id
          `
          )
          .all();

        const people = rows.map((row) => ({
          userId: row.userId,
          fullName: row.fullName,
          photoUrl: row.photoUrl,
          birthdayMonth: row.birthdayMonth,
          birthdayDay: row.birthdayDay,
          birthdayVisibility: row.birthdayVisibility,
          roles: row.rolesCsv ? String(row.rolesCsv).split(",").map((name) => name.trim()).filter(Boolean) : []
        }));

        const items = listUpcomingBirthdays({
          nowMs: Date.now(),
          windowDays,
          people: people.filter(
            (person) =>
              person.birthdayVisibility === "members_only" || person.birthdayVisibility === "members_and_social"
          )
        }).map((item) => ({
          userId: item.userId,
          fullName: item.fullName,
          photoUrl: item.photoUrl,
          birthdayMonth: item.birthdayMonth,
          birthdayDay: item.birthdayDay,
          occursOn: item.occursOn,
          daysUntil: item.daysUntil,
          roles: item.roles
        }));

        writeJson(
          response,
          200,
          {
            windowDays,
            items,
            serverTime: new Date().toISOString()
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load birthdays.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/notifications/mark-read") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        if (!requireActivationClear(auth.user, response, corsHeaders)) {
          return;
        }
        const payload = await readJsonBody(request);
        if (payload && payload.markAll) {
          const result = database
            .prepare(
              `
              UPDATE notifications
              SET read_at = CURRENT_TIMESTAMP
              WHERE user_id = ? AND read_at IS NULL
            `
            )
            .run(auth.user.id);
          writeJson(response, 200, { updated: result.changes }, corsHeaders);
          return;
        }
        const ids = Array.isArray(payload.notificationIds)
          ? payload.notificationIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
          : [];
        if (ids.length === 0) {
          writeJson(response, 400, { error: "validation_error", message: "Notification ids are required." }, corsHeaders);
          return;
        }
        const placeholders = ids.map(() => "?").join(",");
        const result = database
          .prepare(
            `
            UPDATE notifications
            SET read_at = CURRENT_TIMESTAMP
            WHERE user_id = ? AND id IN (${placeholders})
          `
          )
          .run(auth.user.id, ...ids);
        writeJson(response, 200, { updated: result.changes }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/event-audiences") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
        return;
      }

      writeJson(
        response,
        200,
        {
          items: EVENT_AUDIENCE_OPTIONS.map((item) => ({ code: item.code, label: item.label }))
        },
        corsHeaders
      );
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/events") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        const view = requestUrl.searchParams.get("view") || "";
        const items =
          auth.user.role === "member"
            ? listEventsForMember(database, auth.user.id, view)
            : auth.user.role === "event_editor"
            ? listEventsForEditor(database, auth.user.id, view)
            : listEventsForAdmin(database, view);
        const decorated = decorateEventsForViewer(database, items, auth.user, eventSummaryCache);
        writeJson(
          response,
          200,
          {
            items: decorated,
            serverTime: new Date().toISOString(),
            monotonicMs: Number(process.hrtime.bigint() / 1000000n)
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load events.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/api/admin/events/") && requestUrl.pathname.endsWith("/revisions")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[4]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const rows = database
          .prepare(
            `
            SELECT id, revision_type AS revisionType, created_by_user_id AS createdByUserId, created_at AS createdAt
            FROM event_revisions
            WHERE event_id = ?
            ORDER BY created_at DESC
          `
          )
          .all(eventId);
        writeJson(response, 200, { items: rows }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load revisions.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/admin/events/") && requestUrl.pathname.endsWith("/rollback")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[4]);
        const revisionId = Number(parts[6]);
        if (!Number.isInteger(eventId) || !Number.isInteger(revisionId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event and revision are required." }, corsHeaders);
          return;
        }

        const revision = database
          .prepare(
            `
            SELECT snapshot_json AS snapshotJson
            FROM event_revisions
            WHERE id = ? AND event_id = ?
            LIMIT 1
          `
          )
          .get(revisionId, eventId);

        if (!revision) {
          writeJson(response, 404, { error: "not_found", message: "Revision not found." }, corsHeaders);
          return;
        }

        let snapshot = null;
        try {
          snapshot = JSON.parse(revision.snapshotJson || "{}");
        } catch {
          snapshot = null;
        }
        if (!snapshot || !snapshot.event) {
          writeJson(response, 409, { error: "invalid_snapshot", message: "Revision snapshot is invalid." }, corsHeaders);
          return;
        }

        const preRollback = buildEventSnapshot(database, eventId);
        const rollbackRevisionId = insertEventRevision(database, {
          eventId,
          revisionType: "rollback",
          snapshot: preRollback,
          actorUserId: auth.user.id
        });

        const eventData = snapshot.event;
        database
          .prepare(
            `
            UPDATE events
            SET title = ?,
                description = ?,
                start_at = ?,
                end_at = ?,
                venue_type = ?,
                venue_name = ?,
                venue_address = ?,
                online_provider = ?,
                online_join_url = ?,
                host_name = ?,
                capacity = ?,
                registration_closes_at = ?,
                audience_type = ?,
                status = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          )
          .run(
            eventData.title,
            eventData.description,
            eventData.start_at,
            eventData.end_at,
            eventData.venue_type,
            eventData.venue_name,
            eventData.venue_address,
            eventData.online_provider,
            eventData.online_join_url,
            eventData.host_name,
            eventData.capacity,
            eventData.registration_closes_at,
            eventData.audience_type,
            eventData.status,
            eventId
          );

        const snapshotGroupIds = Array.isArray(snapshot.groupIds) ? snapshot.groupIds : [];
        setEventAudienceGroups(database, eventId, snapshotGroupIds);

        database
          .prepare(
            `
            INSERT INTO event_revision_rollbacks (event_id, revision_id, rolled_back_by_user_id)
            VALUES (?, ?, ?)
          `
          )
          .run(eventId, revisionId, auth.user.id);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_revision_rollback', 'event', ?, ?)
          `
          )
          .run(auth.user.id, String(eventId), JSON.stringify({ revisionId }));

        enqueueNotification(database, {
          idempotencyKey: `event_updated:rollback:${rollbackRevisionId}`,
          eventType: "event_updated",
          payload: { eventId, revisionId: rollbackRevisionId, changes: ["Event rolled back"] }
        });

        writeJson(response, 200, { rolledBack: true, revisionId }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to rollback event.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/notification-deliveries") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const limit = Math.min(Math.max(Number(requestUrl.searchParams.get("limit") || 50), 1), 200);
        const rows = database
          .prepare(
            `
            SELECT
              notification_deliveries.id,
              notification_deliveries.user_id AS userId,
              notification_deliveries.channel,
              notification_deliveries.event_type AS eventType,
              notification_deliveries.status,
              notification_deliveries.error_message AS errorMessage,
              notification_deliveries.created_at AS createdAt,
              users.email AS email
            FROM notification_deliveries
            LEFT JOIN users ON users.id = notification_deliveries.user_id
            ORDER BY notification_deliveries.created_at DESC
            LIMIT ?
          `
          )
          .all(limit);
        writeJson(response, 200, { items: rows }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load deliveries.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/notification-queue") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const limit = Math.min(Math.max(Number(requestUrl.searchParams.get("limit") || 50), 1), 200);
        const rows = database
          .prepare(
            `
            SELECT
              id,
              event_type AS eventType,
              status,
              attempts,
              last_error AS lastError,
              created_at AS createdAt,
              updated_at AS updatedAt
            FROM notification_queue
            ORDER BY created_at DESC
            LIMIT ?
          `
          )
          .all(limit);
        writeJson(response, 200, { items: rows }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load queue.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/events") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const title = String(payload.title || "").trim();
        const description = String(payload.description || "").trim();
        const startAt = String(payload.startAt || "").trim();
        const endAt = String(payload.endAt || "").trim();
        const venueType = String(payload.venueType || "").trim();
        const venueName = String(payload.venueName || "").trim();
        const venueAddress = String(payload.venueAddress || "").trim();
        const onlineProvider = String(payload.onlineProvider || "").trim();
        const onlineJoinUrl = String(payload.onlineJoinUrl || "").trim();
        const hostName = String(payload.hostName || "").trim();
        const capacity = Number(payload.capacity || 0);
        const registrationClosesAt = String(payload.registrationClosesAt || "").trim();
        const startAtMs = parseIsoToMs(startAt);
        const endAtMs = parseIsoToMs(endAt);
        const registrationClosesAtMs = parseIsoToMs(registrationClosesAt);
        let audienceType = payload.audienceType === "groups" ? "groups" : "all_members";
        let groupIds = Array.isArray(payload.groupIds)
          ? payload.groupIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
          : [];
        const audienceCode = normalizeAudienceCode(payload.audienceCode);
        if (audienceCode) {
          const mappedAudience = mapAudienceCodeToSelection(database, audienceCode);
          if (!mappedAudience) {
            writeJson(
              response,
              400,
              { error: "validation_error", message: "Audience selection is invalid." },
              corsHeaders
            );
            return;
          }
          audienceType = mappedAudience.audienceType;
          groupIds = mappedAudience.groupIds;
        }

        if (!title || !startAt || !endAt || !venueType) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Title, start/end, and venue type are required." },
            corsHeaders
          );
          return;
        }

        if (startAtMs === null || endAtMs === null) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Start and end must be valid ISO date values." },
            corsHeaders
          );
          return;
        }

        if (endAtMs <= startAtMs) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "End date and time must be later than start date and time." },
            corsHeaders
          );
          return;
        }

        if (!EVENT_VENUE_TYPES.has(venueType)) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Venue type must be either physical or online." },
            corsHeaders
          );
          return;
        }

        if (registrationClosesAt && registrationClosesAtMs === null) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Registration close must be a valid ISO date value." },
            corsHeaders
          );
          return;
        }

        if (!Number.isFinite(capacity) || capacity < 0) {
          writeJson(response, 400, { error: "validation_error", message: "Capacity must be 0 or more." }, corsHeaders);
          return;
        }

        if (audienceType === "groups" && groupIds.length === 0) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Select at least one group for group-only events." },
            corsHeaders
          );
          return;
        }

        const clashWarning = detectEventScheduleConflicts(database, {
          startAt,
          endAt,
          audienceType,
          groupIds,
          limit: 5
        });

        const result = database
          .prepare(
            `
            INSERT INTO events (
              title,
              description,
              start_at,
              end_at,
              venue_type,
              venue_name,
              venue_address,
              online_provider,
              online_join_url,
              host_name,
              capacity,
              registration_closes_at,
              audience_type,
              status,
              created_by_user_id,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft', ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
          )
          .run(
            title,
            description || null,
            startAt,
            endAt,
            venueType,
            venueName || null,
            venueAddress || null,
            onlineProvider || null,
            onlineJoinUrl || null,
            hostName || null,
            capacity,
            registrationClosesAt || null,
            audienceType,
            auth.user.id
          );

        const eventId = result.lastInsertRowid;
        if (audienceType === "groups") {
          setEventAudienceGroups(database, eventId, groupIds);
        }
        eventSummaryCache.invalidate(eventId);
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_created', 'event', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(eventId),
            JSON.stringify({
              status: "draft",
              audienceType,
              audienceCode: audienceCode || (audienceType === "all_members" ? "all_members" : "groups"),
              clashCount: clashWarning.count,
              autoPublished: false
            })
          );

        if (clashWarning.count > 0) {
          const conflictTitles = clashWarning.items.map((item) => String(item.title || "").trim()).filter(Boolean);
          createInAppNotification(database, {
            userId: auth.user.id,
            eventType: "event_time_conflict_warning",
            title: "Meeting time overlap detected",
            body:
              `Your meeting overlaps with ${clashWarning.count} existing meeting(s). ` +
              "You can still proceed, but shared members may need to choose one meeting.",
            metadata: {
              eventId: Number(eventId),
              conflictCount: clashWarning.count,
              conflictEventIds: clashWarning.items.map((item) => item.id),
              conflictTitles
            },
            idempotencyKey: `event_time_conflict_warning:create:${eventId}`
          });
        }

        writeJson(
          response,
          201,
          {
            id: eventId,
            status: "draft",
            clashWarning: {
              hasClash: clashWarning.count > 0,
              conflictCount: clashWarning.count,
              conflicts: clashWarning.items,
              suggestedActions:
                clashWarning.count > 0
                  ? ["adjust_time", "narrow_audience", "proceed_with_overlap_notice"]
                  : []
            }
          },
          corsHeaders
        );
      } catch (error) {
        writeMutationError(response, error, corsHeaders, {
          validationMessage: "Event payload failed validation."
        });
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/meetings/rsvp") {
      writeJson(
        response,
        405,
        {
          error: "method_not_allowed",
          message: "Use POST /api/meetings/rsvp to confirm participation."
        },
        { ...corsHeaders, Allow: "POST" }
      );
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/meetings/rsvp") {
      try {
        const payload = await readJsonBody(request);
        const token = String(payload.token || "").trim();
        const result = confirmMeetingRsvpByToken(database, { token, summaryCache: eventSummaryCache });
        writeJson(response, 200, { confirmed: true, ...result }, corsHeaders);
      } catch (error) {
        const statusCode = Number(error.httpStatus || 400);
        writeJson(
          response,
          statusCode,
          {
            error: error.code || "invalid_json",
            message: String(error.message || "Unable to confirm RSVP.")
          },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/planning")) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const eventId = Number(parts[3]);
      if (!Number.isInteger(eventId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
        return;
      }

      if (!canManageEventPlanning(database, auth.user, eventId)) {
        writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
        return;
      }

      const snapshot = buildMeetingPlanningSnapshot(database, eventId);
      if (!snapshot) {
        writeJson(response, 404, { error: "not_found" }, corsHeaders);
        return;
      }

      const messages = database
        .prepare(
          `
          SELECT
            id,
            audience_scope AS audienceScope,
            subject,
            body,
            sender_user_id AS senderUserId,
            created_at AS createdAt
          FROM meeting_planning_messages
          WHERE event_id = ?
          ORDER BY id DESC
          LIMIT 30
        `
        )
        .all(eventId);

      writeJson(
        response,
        200,
        {
          eventId,
          event: {
            title: snapshot.eventRow.title,
            startAt: snapshot.eventRow.start_at,
            endAt: snapshot.eventRow.end_at,
            status: snapshot.eventRow.status,
            audienceType: snapshot.eventRow.audience_type
          },
          ...snapshot.counts,
          participants: snapshot.participants,
          messages
        },
        corsHeaders
      );
      return;
    }

    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/planning-message")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }
        if (!canManageEventPlanning(database, auth.user, eventId)) {
          writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const subject = String(payload.subject || "").trim();
        const body = String(payload.body || "").trim();
        const audienceScope = String(payload.audienceScope || "all_invited").trim();
        if (!subject || !body) {
          writeJson(response, 400, { error: "validation_error", message: "Subject and message body are required." }, corsHeaders);
          return;
        }
        if (!MEETING_PLANNING_SCOPES.has(audienceScope)) {
          writeJson(response, 400, { error: "validation_error", message: "Audience scope is invalid." }, corsHeaders);
          return;
        }

        const snapshot = buildMeetingPlanningSnapshot(database, eventId);
        if (!snapshot) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }
        const recipients = resolveMeetingPlanningRecipients(snapshot, audienceScope);
        if (recipients.length === 0) {
          writeJson(response, 400, { error: "validation_error", message: "No recipients found for the selected scope." }, corsHeaders);
          return;
        }

        const insert = database
          .prepare(
            `
            INSERT INTO meeting_planning_messages (event_id, sender_user_id, audience_scope, subject, body)
            VALUES (?, ?, ?, ?, ?)
          `
          )
          .run(eventId, auth.user.id, audienceScope, subject, body);
        const messageId = Number(insert.lastInsertRowid);

        let emailSent = 0;
        let emailFailed = 0;
        for (const recipient of recipients) {
          const userId = Number(recipient.userId);
          if (!Number.isInteger(userId)) {
            continue;
          }

          createInAppNotification(database, {
            userId,
            eventType: "meeting_planning_update",
            title: `Meeting update: ${snapshot.eventRow.title}`,
            body: `${subject}\n\n${body}`,
            metadata: { eventId, messageId, audienceScope },
            idempotencyKey: `meeting_planning_update:${messageId}:${userId}`
          });

          const emailKey = `meeting_planning_update_email:${messageId}:${userId}`;
          if (!recipient.email) {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: "meeting_planning_update",
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: "missing_email"
            });
            emailFailed += 1;
            continue;
          }

          let rsvpText = "";
          if (recipient.responseStatus === "pending") {
            const tokenRecord = ensureMeetingRsvpToken(database, {
              eventId,
              userId,
              actorUserId: auth.user.id
            });
            const rsvpUrl = buildMeetingRsvpUrl(config.appBaseUrl, tokenRecord.token);
            if (rsvpUrl) {
              rsvpText = `\n\nConfirm participation: ${rsvpUrl}`;
            }
          }

          try {
            sendTransactionalEmail({
              to: recipient.email,
              subject: `Meeting update: ${snapshot.eventRow.title} - ${subject}`,
              text:
                `${body}\n\n` +
                `Meeting starts: ${snapshot.eventRow.start_at}.${rsvpText}\n\n` +
                "Open the member portal for full planning updates.",
              metadata: { template: "meeting_planning_update" }
            });
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: "meeting_planning_update",
              status: "sent",
              idempotencyKey: emailKey
            });
            emailSent += 1;
          } catch (error) {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: "meeting_planning_update",
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: String(error.message || error)
            });
            emailFailed += 1;
          }
        }

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'meeting_planning_message_sent', 'event', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(eventId),
            JSON.stringify({
              messageId,
              audienceScope,
              recipientCount: recipients.length,
              emailSent,
              emailFailed
            })
          );

        writeJson(
          response,
          200,
          {
            sent: true,
            messageId,
            audienceScope,
            recipientCount: recipients.length,
            emailSent,
            emailFailed
          },
          corsHeaders
        );
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/register")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        if (payload && typeof payload.draft === "object") {
          saveRegistrationDraft(database, eventId, auth.user.id, payload.draft);
        }

        try {
          const registration = registerMemberForEvent(database, {
            eventId,
            userId: auth.user.id,
            summaryCache: eventSummaryCache
          });
          notifyMeetingOrganizerAboutResponse(database, {
            eventRow: registration.eventRow,
            responderUserId: auth.user.id,
            responseStatus: registration.signupStatus
          });
          const seatsRemaining = Math.max(
            Number(registration.eventRow.capacity || 0) - Number(registration.summary.confirmedCount || 0),
            0
          );
          writeJson(
            response,
            200,
            {
              registered: true,
              status: registration.signupStatus,
              idempotent: registration.idempotent,
              seatsRemaining,
              confirmedCount: registration.summary.confirmedCount,
              waitlistedCount: registration.summary.waitlistedCount,
              registrationState: registration.registrationWindow.state,
              minutesToClose: registration.registrationWindow.minutesToClose,
              effectiveRegistrationClosesAt: registration.registrationWindow.closesAtIso,
              warningWindowMinutes: REGISTRATION_WARNING_WINDOW_MINUTES,
              urgencyVariant: registration.registrationWindow.closingSoon
                ? pickUrgencyVariant(eventId)
                : null,
              surgeAlerted: Boolean(registration.surgeAlerted)
            },
            corsHeaders
          );
        } catch (error) {
          const statusCode = Number(error.httpStatus || 500);
          writeJson(
            response,
            statusCode,
            {
              error: error.code || "internal_error",
              message: String(error.message || "Unable to register."),
              ...(error.details ? { details: error.details } : {})
            },
            corsHeaders
          );
        }
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/cancel-registration")) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const eventId = Number(parts[3]);
      if (!Number.isInteger(eventId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
        return;
      }

      try {
        const cancellation = cancelMemberRegistration(database, {
          eventId,
          userId: auth.user.id,
          summaryCache: eventSummaryCache
        });
        const seatsRemaining = Math.max(
          Number(cancellation.eventRow.capacity || 0) - Number(cancellation.summary.confirmedCount || 0),
          0
        );
        writeJson(
          response,
          200,
          {
            cancelled: true,
            previousStatus: cancellation.previousStatus,
            promotedUserId: cancellation.promoted?.userId || null,
            seatsRemaining,
            confirmedCount: cancellation.summary.confirmedCount,
            waitlistedCount: cancellation.summary.waitlistedCount
          },
          corsHeaders
        );
      } catch (error) {
        const statusCode = Number(error.httpStatus || 500);
        writeJson(
          response,
          statusCode,
          { error: error.code || "internal_error", message: String(error.message || "Unable to cancel registration.") },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/registration-draft")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        if (!payload || typeof payload.draft !== "object") {
          writeJson(response, 400, { error: "validation_error", message: "Draft payload is required." }, corsHeaders);
          return;
        }

        saveRegistrationDraft(database, eventId, auth.user.id, payload.draft);
        writeJson(response, 200, { saved: true, eventId }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/registration-draft")) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const eventId = Number(parts[3]);
      if (!Number.isInteger(eventId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
        return;
      }

      const row = database
        .prepare(
          `
          SELECT draft_json AS draftJson, updated_at AS updatedAt
          FROM registration_drafts
          WHERE event_id = ? AND user_id = ?
          LIMIT 1
        `
        )
        .get(eventId, auth.user.id);

      if (!row) {
        writeJson(response, 200, { draft: null, updatedAt: null }, corsHeaders);
        return;
      }

      let parsed = null;
      try {
        parsed = JSON.parse(row.draftJson || "{}");
      } catch {
        parsed = {};
      }

      writeJson(response, 200, { draft: parsed, updatedAt: row.updatedAt }, corsHeaders);
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/reminders")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["member", "event_editor", "admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const offsets = normalizeReminderOffsets(payload.offsetMinutes || payload.offsets || []);

        runTransaction(database, () => {
          database
            .prepare("DELETE FROM registration_reminder_preferences WHERE event_id = ? AND user_id = ?")
            .run(eventId, auth.user.id);

          if (offsets.length > 0) {
            const insert = database.prepare(
              `
              INSERT INTO registration_reminder_preferences (event_id, user_id, offset_minutes, created_at, updated_at)
              VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            `
            );
            for (const offset of offsets) {
              insert.run(eventId, auth.user.id, offset);
            }
          }
        });

        writeJson(response, 200, { saved: true, offsets }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/registration-overrides")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const userId = Number(payload.userId);
        const closesAt = String(payload.closesAt || "").trim();
        const reason = String(payload.reason || "").trim();
        const closesAtMs = parseIsoToMs(closesAt);

        if (!Number.isInteger(userId) || closesAtMs === null) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "userId and valid closesAt are required." },
            corsHeaders
          );
          return;
        }

        database
          .prepare(
            `
            INSERT INTO event_registration_overrides (
              event_id, user_id, closes_at, reason, granted_by_user_id, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
            ON CONFLICT(event_id, user_id)
            DO UPDATE SET
              closes_at = excluded.closes_at,
              reason = excluded.reason,
              granted_by_user_id = excluded.granted_by_user_id,
              updated_at = CURRENT_TIMESTAMP
          `
          )
          .run(eventId, userId, new Date(closesAtMs).toISOString(), reason || null, auth.user.id);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_registration_override_set', 'event', ?, ?)
          `
          )
          .run(auth.user.id, String(eventId), JSON.stringify({ userId, closesAt, reason: reason || null }));

        writeJson(response, 200, { saved: true, eventId, userId, closesAt: new Date(closesAtMs).toISOString() }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "DELETE" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/registration-overrides")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const userId = Number(payload.userId);
        if (!Number.isInteger(userId)) {
          writeJson(response, 400, { error: "validation_error", message: "userId is required." }, corsHeaders);
          return;
        }

        const result = database
          .prepare("DELETE FROM event_registration_overrides WHERE event_id = ? AND user_id = ?")
          .run(eventId, userId);

        if (result.changes > 0) {
          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'event_registration_override_deleted', 'event', ?, ?)
            `
            )
            .run(auth.user.id, String(eventId), JSON.stringify({ userId }));
        }

        writeJson(response, 200, { removed: result.changes > 0 }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/admin/registration-reminders/dispatch") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
        return;
      }

      const dispatched = dispatchDueRegistrationNotifications(database);
      writeJson(response, 200, { dispatched }, corsHeaders);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/collaboration")) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const eventId = Number(parts[3]);
      if (!Number.isInteger(eventId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
        return;
      }

      const eventRow = loadEvent(database, eventId);
      if (!eventRow) {
        writeJson(response, 404, { error: "not_found" }, corsHeaders);
        return;
      }

      if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
        writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
        return;
      }

      const notesRow = database.prepare("SELECT draft_notes_markdown AS draftNotesMarkdown FROM events WHERE id = ?").get(eventId);
      const comments = database
        .prepare(
          `
          SELECT
            c.id,
            c.author_user_id AS authorUserId,
            c.body_markdown AS bodyMarkdown,
            c.created_at AS createdAt,
            c.updated_at AS updatedAt,
            COALESCE(mp.full_name, u.username, u.email) AS authorName
          FROM event_internal_comments c
          LEFT JOIN users u ON u.id = c.author_user_id
          LEFT JOIN member_profiles mp ON mp.user_id = u.id
          WHERE c.event_id = ?
          ORDER BY c.id DESC
          LIMIT 50
        `
        )
        .all(eventId)
        .map((row) => ({
          id: row.id,
          authorUserId: row.authorUserId ?? null,
          authorName: row.authorName || null,
          bodyMarkdown: row.bodyMarkdown,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt
        }));

      writeJson(
        response,
        200,
        {
          eventId,
          draftNotesMarkdown: notesRow?.draftNotesMarkdown || "",
          comments
        },
        corsHeaders
      );
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/draft-notes")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const eventRow = loadEvent(database, eventId);
        if (!eventRow) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }

        if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
          writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const rawNotes = payload?.draftNotesMarkdown !== undefined ? payload.draftNotesMarkdown : payload?.notesMarkdown;
        const notes = String(rawNotes || "");
        if (notes.length > 20000) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Draft notes must be 20,000 characters or fewer." },
            corsHeaders
          );
          return;
        }

        database
          .prepare(
            `
            UPDATE events
            SET draft_notes_markdown = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          )
          .run(notes || null, eventId);

        eventSummaryCache.invalidate(eventId);
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_draft_notes_updated', 'event', ?, ?)
          `
          )
          .run(auth.user.id, String(eventId), JSON.stringify({ length: notes.length }));

        writeJson(response, 200, { saved: true, eventId }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/internal-comments")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const eventRow = loadEvent(database, eventId);
        if (!eventRow) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }

        if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
          writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const bodyMarkdown = String(payload?.bodyMarkdown || "").trim();
        if (!bodyMarkdown) {
          writeJson(response, 400, { error: "validation_error", message: "Comment body is required." }, corsHeaders);
          return;
        }
        if (bodyMarkdown.length > 5000) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Comment body must be 5,000 characters or fewer." },
            corsHeaders
          );
          return;
        }

        const result = database
          .prepare(
            `
            INSERT INTO event_internal_comments (event_id, author_user_id, body_markdown, created_at, updated_at)
            VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
          )
          .run(eventId, auth.user.id, bodyMarkdown);

        const commentId = result.lastInsertRowid;
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_internal_comment_added', 'event', ?, ?)
          `
          )
          .run(auth.user.id, String(eventId), JSON.stringify({ commentId }));

        writeJson(response, 201, { created: true, eventId, id: commentId }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "PATCH" && requestUrl.pathname.startsWith("/api/events/")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const eventRow = loadEvent(database, eventId);
        if (!eventRow) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }

        if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
          writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const currentGroupIds = loadEventAudienceGroupIds(database, eventId);
        let nextAudienceType = payload.audienceType === "groups" ? "groups" : eventRow.audience_type;
        let nextGroupIds = Array.isArray(payload.groupIds)
          ? payload.groupIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
          : null;
        const audienceCode = payload.audienceCode !== undefined ? normalizeAudienceCode(payload.audienceCode) : "";
        if (audienceCode) {
          const mappedAudience = mapAudienceCodeToSelection(database, audienceCode);
          if (!mappedAudience) {
            writeJson(
              response,
              400,
              { error: "validation_error", message: "Audience selection is invalid." },
              corsHeaders
            );
            return;
          }
          nextAudienceType = mappedAudience.audienceType;
          nextGroupIds = mappedAudience.groupIds;
        }
        const next = {
          title: payload.title !== undefined ? String(payload.title || "").trim() : eventRow.title,
          description:
            payload.description !== undefined ? String(payload.description || "").trim() : eventRow.description,
          startAt: payload.startAt !== undefined ? String(payload.startAt || "").trim() : eventRow.start_at,
          endAt: payload.endAt !== undefined ? String(payload.endAt || "").trim() : eventRow.end_at,
          venueType:
            payload.venueType !== undefined ? String(payload.venueType || "").trim() : eventRow.venue_type,
          venueName:
            payload.venueName !== undefined ? String(payload.venueName || "").trim() : eventRow.venue_name,
          venueAddress:
            payload.venueAddress !== undefined
              ? String(payload.venueAddress || "").trim()
              : eventRow.venue_address,
          onlineProvider:
            payload.onlineProvider !== undefined
              ? String(payload.onlineProvider || "").trim()
              : eventRow.online_provider,
          onlineJoinUrl:
            payload.onlineJoinUrl !== undefined
              ? String(payload.onlineJoinUrl || "").trim()
              : eventRow.online_join_url,
          hostName: payload.hostName !== undefined ? String(payload.hostName || "").trim() : eventRow.host_name,
          capacity: payload.capacity !== undefined ? Number(payload.capacity) : eventRow.capacity,
          registrationClosesAt:
            payload.registrationClosesAt !== undefined
              ? String(payload.registrationClosesAt || "").trim()
              : eventRow.registration_closes_at,
          audienceType: nextAudienceType,
          groupIds: nextGroupIds
        };
        const nextStartAtMs = parseIsoToMs(next.startAt);
        const nextEndAtMs = parseIsoToMs(next.endAt);
        const nextRegistrationClosesAtMs = parseIsoToMs(next.registrationClosesAt);

        const changes = [];
        if (eventRow.title !== next.title) changes.push("Title changed");
        if (eventRow.start_at !== next.startAt) changes.push("Start time changed");
        if (eventRow.end_at !== next.endAt) changes.push("End time changed");
        if (eventRow.venue_type !== next.venueType) changes.push("Venue type changed");
        if ((eventRow.venue_name || "") !== (next.venueName || "")) changes.push("Venue name changed");
        if ((eventRow.venue_address || "") !== (next.venueAddress || "")) changes.push("Venue address changed");
        if ((eventRow.online_provider || "") !== (next.onlineProvider || "")) changes.push("Online provider changed");
        if ((eventRow.online_join_url || "") !== (next.onlineJoinUrl || "")) changes.push("Online join link changed");
        if (eventRow.capacity !== next.capacity) changes.push("Capacity changed");
        if ((eventRow.registration_closes_at || "") !== (next.registrationClosesAt || "")) {
          changes.push("Registration close time changed");
        }
        const effectiveNextGroupIds = Array.isArray(next.groupIds) ? next.groupIds : currentGroupIds;
        if (
          eventRow.audience_type !== next.audienceType ||
          (next.audienceType === "groups" && !hasSameIntegerSet(currentGroupIds, effectiveNextGroupIds))
        ) {
          changes.push("Audience changed");
        }

        if (!next.title || !next.startAt || !next.endAt || !next.venueType) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Title, start/end, and venue type are required." },
            corsHeaders
          );
          return;
        }

        if (nextStartAtMs === null || nextEndAtMs === null) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Start and end must be valid ISO date values." },
            corsHeaders
          );
          return;
        }

        if (nextEndAtMs <= nextStartAtMs) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "End date and time must be later than start date and time." },
            corsHeaders
          );
          return;
        }

        if (!EVENT_VENUE_TYPES.has(next.venueType)) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Venue type must be either physical or online." },
            corsHeaders
          );
          return;
        }

        if (next.registrationClosesAt && nextRegistrationClosesAtMs === null) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Registration close must be a valid ISO date value." },
            corsHeaders
          );
          return;
        }

        if (!Number.isFinite(next.capacity) || next.capacity < 0) {
          writeJson(response, 400, { error: "validation_error", message: "Capacity must be 0 or more." }, corsHeaders);
          return;
        }

        if (next.audienceType === "groups") {
          const effectiveGroupIds = Array.isArray(next.groupIds) ? next.groupIds : currentGroupIds;
          if (effectiveGroupIds.length === 0) {
            writeJson(
              response,
              400,
              { error: "validation_error", message: "Select at least one group for group-only events." },
              corsHeaders
            );
            return;
          }
        }

        const snapshot = buildEventSnapshot(database, eventId);
        const revisionId = changes.length > 0
          ? insertEventRevision(database, {
              eventId,
              revisionType: "update",
              snapshot,
              actorUserId: auth.user.id
            })
          : null;

        database
          .prepare(
            `
            UPDATE events
            SET title = ?,
                description = ?,
                start_at = ?,
                end_at = ?,
                venue_type = ?,
                venue_name = ?,
                venue_address = ?,
                online_provider = ?,
                online_join_url = ?,
                host_name = ?,
                capacity = ?,
                registration_closes_at = ?,
                audience_type = ?,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          )
          .run(
            next.title,
            next.description || null,
            next.startAt,
            next.endAt,
            next.venueType,
            next.venueName || null,
            next.venueAddress || null,
            next.onlineProvider || null,
            next.onlineJoinUrl || null,
            next.hostName || null,
            next.capacity,
            next.registrationClosesAt || null,
            next.audienceType,
            eventId
          );

        if (Array.isArray(next.groupIds)) {
          if (next.audienceType === "groups") {
            setEventAudienceGroups(database, eventId, next.groupIds);
          } else {
            setEventAudienceGroups(database, eventId, []);
          }
        }
        eventSummaryCache.invalidate(eventId);

        if (changes.length > 0) {
          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'event_updated', 'event', ?, ?)
            `
            )
            .run(
              auth.user.id,
              String(eventId),
              JSON.stringify({
                revisionId,
                changes,
                audienceCode: audienceCode || (next.audienceType === "all_members" ? "all_members" : "groups")
              })
            );
        }

        if (eventRow.status === "published" && changes.length > 0 && revisionId) {
          enqueueNotification(database, {
            idempotencyKey: `event_updated:${revisionId}`,
            eventType: "event_updated",
            payload: { eventId, revisionId, changes }
          });
        }

        writeJson(response, 200, { updated: true }, corsHeaders);
      } catch (error) {
        writeMutationError(response, error, corsHeaders, {
          validationMessage: "Event update payload failed validation."
        });
      }
      return;
    }

    if (request.method === "DELETE" && requestUrl.pathname.startsWith("/api/events/")) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      if (parts.length !== 4) {
        writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
        return;
      }

      const eventId = Number(parts[3]);
      if (!Number.isInteger(eventId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
        return;
      }

      const eventRow = loadEvent(database, eventId);
      if (!eventRow) {
        writeJson(response, 404, { error: "not_found" }, corsHeaders);
        return;
      }

      if (!canDeleteEvent(database, auth.user, eventId, { eventRow })) {
        writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
        return;
      }

      const result = database.prepare("DELETE FROM events WHERE id = ?").run(eventId);
      if (result.changes > 0) {
        eventSummaryCache.invalidate(eventId);
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_deleted', 'event', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(eventId),
            JSON.stringify({ title: eventRow.title, status: eventRow.status })
          );
      }

      writeJson(response, 200, { deleted: result.changes > 0, id: eventId }, corsHeaders);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/submit")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        const parts = requestUrl.pathname.split("/");
        const eventId = Number(parts[3]);
        if (!Number.isInteger(eventId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
          return;
        }

        const eventRow = loadEvent(database, eventId);
        if (!eventRow) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }

        const canEdit = canEditEvent(database, auth.user, eventId, { eventRow });
        if (!canEdit) {
          writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
          return;
        }

        const submission = submitEventForApproval(database, {
          eventId,
          actorUserId: auth.user.id,
          eventRow
        });
        writeJson(
          response,
          200,
          {
            status: submission.status,
            alreadySubmitted: submission.alreadySubmitted,
            alreadyPublished: submission.alreadyPublished
          },
          corsHeaders
        );
      } catch (error) {
        const statusCode = Number(error.httpStatus || 500);
        writeJson(
          response,
          statusCode,
          {
            error: error.code || "internal_error",
            message: String(error.message || "Unable to submit event.")
          },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "PATCH" && requestUrl.pathname.startsWith("/api/admin/users/") && requestUrl.pathname.endsWith("/role")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        if (parts.length !== 6 || parts[5] !== "role") {
          writeJson(response, 400, { error: "validation_error", message: "User id is required." }, corsHeaders);
          return;
        }

        const userId = Number(parts[4]);
        if (!Number.isInteger(userId) || userId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "User id is required." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const nextRole = String(payload.role || "").trim().toLowerCase();
        if (!USER_ROLE_SET.has(nextRole)) {
          writeJson(
            response,
            400,
            {
              error: "validation_error",
              message: "Role must be one of chief_admin, admin, event_editor, member."
            },
            corsHeaders
          );
          return;
        }

        const existingUser = database
          .prepare(
            `
            SELECT id, username, email, role
            FROM users
            WHERE id = ?
            LIMIT 1
          `
          )
          .get(userId);
        if (!existingUser) {
          writeJson(response, 404, { error: "not_found", message: "User not found." }, corsHeaders);
          return;
        }

        const previousRole = String(existingUser.role || "").trim().toLowerCase();
        if (previousRole === nextRole) {
          writeJson(
            response,
            200,
            {
              updated: false,
              userId,
              role: previousRole,
              revokedEventEditorGrants: 0
            },
            corsHeaders
          );
          return;
        }

        if (previousRole === "chief_admin" && nextRole !== "chief_admin") {
          const chiefAdminCount = database
            .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'chief_admin'")
            .get();
          if (Number(chiefAdminCount?.count || 0) <= 1) {
            writeJson(
              response,
              409,
              {
                error: "invalid_state",
                message: "At least one chief admin must remain."
              },
              corsHeaders
            );
            return;
          }
        }

        let revokedEventEditorGrants = 0;
        runTransaction(database, () => {
          database
            .prepare(
              `
              UPDATE users
              SET role = ?, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `
            )
            .run(nextRole, userId);

          if (previousRole === "event_editor" && nextRole !== "event_editor") {
            const revokeResult = database
              .prepare("DELETE FROM event_editor_grants WHERE user_id = ?")
              .run(userId);
            revokedEventEditorGrants = Number(revokeResult.changes || 0);
          }

          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'user_role_changed', 'user', ?, ?)
            `
            )
            .run(
              auth.user.id,
              String(userId),
              JSON.stringify({
                username: existingUser.username,
                email: existingUser.email,
                previousRole,
                nextRole,
                revokedEventEditorGrants
              })
            );
        });

        writeJson(
          response,
          200,
          {
            updated: true,
            userId,
            role: nextRole,
            previousRole,
            revokedEventEditorGrants
          },
          corsHeaders
        );
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/members") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const items = listMembers(database);
        writeJson(response, 200, { items }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load members.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/members") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const fullName = String(payload.fullName || "").trim();
        const emailRaw = String(payload.email || "").trim();
        const requestedGroups = Array.isArray(payload.groups)
          ? payload.groups
          : typeof payload.groups === "string"
            ? parseCsvList(payload.groups)
            : [];
        const normalizedGroupNames = [];
        const seenGroupNames = new Set();
        for (const groupValue of requestedGroups) {
          const groupName = String(groupValue || "").trim();
          if (!groupName) {
            continue;
          }
          const normalizedKey = groupName.toLowerCase();
          if (seenGroupNames.has(normalizedKey)) {
            continue;
          }
          seenGroupNames.add(normalizedKey);
          normalizedGroupNames.push(groupName);
        }

        if (!fullName) {
          writeJson(response, 400, { error: "validation_error", message: "Full name is required." }, corsHeaders);
          return;
        }
        if (!emailRaw || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(emailRaw)) {
          writeJson(response, 400, { error: "validation_error", message: "Valid email is required." }, corsHeaders);
          return;
        }
        const email = emailRaw.toLowerCase();
        const existingEmail = database.prepare("SELECT id FROM users WHERE LOWER(email) = ?").get(email);
        if (existingEmail) {
          writeJson(response, 409, { error: "conflict", message: "Email already exists." }, corsHeaders);
          return;
        }

        const baseUsername = (email.split("@")[0] || fullName.split(" ").join("_") || "member").toLowerCase().replace(/[^a-z0-9_]+/g, "_");
        let username = baseUsername || "member";
        let suffix = 1;
        while (database.prepare("SELECT id FROM users WHERE LOWER(username) = ?").get(username)) {
          username = `${baseUsername || "member"}${suffix}`;
          suffix += 1;
        }

        const tempPassword = randomBytes(16).toString("hex");
        const insertUser = database
          .prepare(
            `
            INSERT INTO users (
              username,
              email,
              password_hash,
              role,
              status,
              desired_status,
              must_change_password,
              must_change_username,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, 'member', 'invited', 'active', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
          )
          .run(username, email, hashPassword(tempPassword));

        const userId = insertUser.lastInsertRowid;

        database
          .prepare(
            `
            INSERT INTO member_profiles (user_id, full_name, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
          )
          .run(userId, fullName);

        if (normalizedGroupNames.length > 0) {
          const groupMap = ensureGroupIds(database, normalizedGroupNames);
          const groupIds = normalizedGroupNames
            .map((name) => Number(groupMap.get(name)))
            .filter((id) => Number.isInteger(id));
          setGroupMemberships(database, userId, groupIds);
        }

        // Queue and send invite immediately for the newly added member
        const inviteResult = queueMemberInvites(database, [userId], auth.user.id, { expiryHours: 72 });

        if (inviteResult.queued.length > 0) {
          const firstName = getFirstName(fullName, username);
          const queued = inviteResult.queued[0];
          const inviteUrl = `${config.appBaseUrl}/activate?token=${queued.inviteToken}`;
          const emailPayload = buildInviteEmail({
            firstName,
            portalUrl: config.appBaseUrl,
            username: queued.username,
            inviteUrl,
            supportEmail: "support@iwfsa.local"
          });
          sendTransactionalEmail({
            to: queued.email,
            subject: emailPayload.subject,
            text: emailPayload.text,
            metadata: { template: "member_invite" }
          });
          recordNotificationDelivery(database, {
            userId: queued.id,
            channel: "email",
            eventType: "member_invite",
            status: "sent",
            idempotencyKey: `invite:${queued.inviteTokenId}`
          });
        }

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_created_manual', 'user', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(userId),
            JSON.stringify({ email, groups: normalizedGroupNames, inviteQueued: inviteResult.queued.length })
          );

        writeJson(
          response,
          201,
          { id: userId, username, email, fullName, groups: normalizedGroupNames, inviteQueued: inviteResult.queued.length },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to add member.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/members/invitations") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const payload = await readJsonBody(request);
        const userIds = Array.isArray(payload.userIds)
          ? payload.userIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
          : [];
        const expiryHours = Number(payload.invite_expiry_hours) || 72;

        if (userIds.length === 0) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Select at least one member to invite." },
            corsHeaders
          );
          return;
        }

        const result = queueMemberInvites(database, userIds, auth.user.id, { expiryHours });

        if (result.queued.length > 0) {
          const ids = result.queued.map((item) => item.id);
          const placeholders = ids.map(() => "?").join(",");
          const profileRows = database
            .prepare(
              `
              SELECT user_id AS userId, full_name AS fullName
              FROM member_profiles
              WHERE user_id IN (${placeholders})
            `
            )
            .all(...ids);
          const nameMap = new Map(profileRows.map((row) => [row.userId, row.fullName]));

          for (const queued of result.queued) {
            const firstName = getFirstName(nameMap.get(queued.id), queued.username);
            const inviteUrl = `${config.appBaseUrl}/activate?token=${queued.inviteToken}`;
            const email = buildInviteEmail({
              firstName,
              portalUrl: config.appBaseUrl,
              username: queued.username,
              inviteUrl,
              supportEmail: "support@iwfsa.local"
            });
            sendTransactionalEmail({
              to: queued.email,
              subject: email.subject,
              text: email.text,
              metadata: { template: "member_invite" }
            });
          recordNotificationDelivery(database, {
            userId: queued.id,
            channel: "email",
            eventType: "member_invite",
            status: "sent",
            idempotencyKey: `invite:${queued.inviteTokenId}`
          });
        }
      }
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_invites_dispatch_triggered', 'user_batch', 'manual', ?)
          `
          )
          .run(
            auth.user.id,
            JSON.stringify({
              userIds,
              invite_expiry_hours: expiryHours,
              queued: result.queued.length,
              skipped: result.skipped.length
            })
          );
        writeJson(response, 200, toPublicInviteQueueResult(result), corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/members/credential-resets") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const userIds = Array.isArray(payload.userIds)
          ? payload.userIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
          : [];
        const expiryHours = Number(payload.reset_expiry_hours) || 72;

        if (userIds.length === 0) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Select at least one member to reset." },
            corsHeaders
          );
          return;
        }

        const result = queueCredentialResets(database, userIds, auth.user.id, { expiryHours });

        if (result.queued.length > 0) {
          const ids = result.queued.map((item) => item.id);
          const placeholders = ids.map(() => "?").join(",");
          const profileRows = database
            .prepare(
              `
              SELECT user_id AS userId, full_name AS fullName
              FROM member_profiles
              WHERE user_id IN (${placeholders})
            `
            )
            .all(...ids);
          const nameMap = new Map(profileRows.map((row) => [row.userId, row.fullName]));

          for (const queued of result.queued) {
            const firstName = getFirstName(nameMap.get(queued.id), queued.username);
            const resetUrl = `${config.appBaseUrl}/reset?token=${queued.resetToken}`;
            const email = buildResetEmail({
              firstName,
              username: queued.username,
              resetUrl,
              supportEmail: "support@iwfsa.local"
            });
            sendTransactionalEmail({
              to: queued.email,
              subject: email.subject,
              text: email.text,
              metadata: { template: "member_reset" }
            });
          recordNotificationDelivery(database, {
            userId: queued.id,
            channel: "email",
            eventType: "member_reset",
            status: "sent",
            idempotencyKey: `reset:${queued.resetTokenId}`
          });
        }
      }
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_credential_resets_dispatch_triggered', 'user_batch', 'manual', ?)
          `
          )
          .run(
            auth.user.id,
            JSON.stringify({
              userIds,
              reset_expiry_hours: expiryHours,
              queued: result.queued.length,
              skipped: result.skipped.length
            })
          );
        writeJson(response, 200, toPublicResetQueueResult(result), corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/admin/member-imports/dry-run") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        let formData;
        try {
          formData = await readMultipartForm(request);
        } catch (error) {
          if (String(error.message || error) === "file_too_large") {
            writeJson(response, 413, { error: "file_too_large", message: "Upload exceeds size limit." }, corsHeaders);
            return;
          }
          writeJson(response, 400, { error: "invalid_form", message: "Unable to parse upload." }, corsHeaders);
          return;
        }

        const requestedReuseBatchId = String(formData.fields.reuse_batch_id || "").trim();
        let sourceBuffer = null;
        let filename = "";
        let reusedSourceBatchId = "";

        if (formData.file && formData.file.buffer) {
          filename = formData.file.filename || "";
          sourceBuffer = formData.file.buffer;
        } else {
          const sourceBatch = requestedReuseBatchId
            ? database
                .prepare(
                  `
                  SELECT batch_id AS batchId, source_filename AS sourceFilename, source_file_blob AS sourceBlob
                  FROM member_import_batches
                  WHERE batch_id = ?
                  LIMIT 1
                `
                )
                .get(requestedReuseBatchId)
            : database
                .prepare(
                  `
                  SELECT batch_id AS batchId, source_filename AS sourceFilename, source_file_blob AS sourceBlob
                  FROM member_import_batches
                  WHERE source_file_blob IS NOT NULL
                  ORDER BY datetime(created_at) DESC, id DESC
                  LIMIT 1
                `
                )
                .get();

          if (!sourceBatch || !sourceBatch.sourceBlob) {
            writeJson(
              response,
              422,
              {
                error: "missing_file",
                message: "Upload a .xlsx file or load a batch with a saved upload."
              },
              corsHeaders
            );
            return;
          }

          filename = String(sourceBatch.sourceFilename || "members.xlsx");
          sourceBuffer = sourceBatch.sourceBlob;
          reusedSourceBatchId = String(sourceBatch.batchId || "");
        }

        if (!filename.toLowerCase().endsWith(".xlsx")) {
          writeJson(response, 422, { error: "invalid_file", message: "File must be .xlsx." }, corsHeaders);
          return;
        }

        const workbookBuffer = Buffer.isBuffer(sourceBuffer) ? sourceBuffer : Buffer.from(sourceBuffer || []);
        const options = parseImportOptions(formData.fields);
        const workbook = parseExcelWorkbook(workbookBuffer);

        const missingHeaders = REQUIRED_IMPORT_HEADERS.filter(
          (header) => !workbook.headers.includes(header)
        );
        if (missingHeaders.length > 0) {
          writeJson(
            response,
            422,
            { error: "missing_headers", message: "Spreadsheet headers are missing.", missingHeaders },
            corsHeaders
          );
          return;
        }

        const headerIndex = new Map();
        workbook.headers.forEach((header, index) => {
          headerIndex.set(header, index);
        });

        const rows = [];
        for (let index = 0; index < workbook.rows.length; index += 1) {
          const rawRow = workbook.rows[index];
          if (!Array.isArray(rawRow)) {
            continue;
          }
          const values = {};
          let hasValue = false;
          for (const header of workbook.headers) {
            const cellValue = rawRow[headerIndex.get(header)] ?? "";
            const normalized = String(cellValue || "").trim();
            values[header] = normalized;
            if (normalized) {
              hasValue = true;
            }
          }
          if (!hasValue) {
            continue;
          }
          rows.push({ rowNumber: index + 2, values });
        }

        if (rows.length === 0) {
          writeJson(response, 422, { error: "empty_sheet", message: "Spreadsheet contains no data rows." }, corsHeaders);
          return;
        }

        const emails = rows
          .map((row) => row.values["Email"].trim().toLowerCase())
          .filter(Boolean);
        const existingUsers = loadExistingUsersByEmail(database, emails);

        const providedUsernames = rows
          .map((row) => row.values["Username"].trim())
          .filter(Boolean);
        const existingUsernames = loadExistingUsernames(database, providedUsernames);
        const assignedUsernames = new Set(existingUsernames.keys());
        const allExistingUsernames = database.prepare("SELECT username FROM users").all();
        for (const row of allExistingUsernames) {
          assignedUsernames.add(String(row.username).toLowerCase());
        }

        const emailCounts = new Map();
        for (const email of emails) {
          emailCounts.set(email, (emailCounts.get(email) || 0) + 1);
        }

        const rowResults = [];

        for (const row of rows) {
          const values = row.values;
          const firstName = values["First Name"].trim();
          const surname = values["Surname"].trim();
          const rawEmail = values["Email"].trim();
          const email = rawEmail.toLowerCase();
          const organisation = values["Organisation"].trim();
          const phone = String(values["Phone"] || values["Mobile"] || "").trim();
          const usernameInput = values["Username"].trim();
          const statusValue = values["Status"].trim();
          const groups = parseCsvList(values["Groups"]);
          const roles = parseCsvList(values["Roles"]);

          let action = "";
          let reasonCode = "";
          let errorMessage = "";
          let blocking = false;

          if (!firstName || !surname || !email) {
            action = "error";
            reasonCode = "missing_required_field";
            errorMessage = "First name, surname, and email are required.";
            blocking = true;
          } else if (!isValidEmail(email)) {
            action = "error";
            reasonCode = "invalid_email";
            errorMessage = "Email format is invalid.";
            blocking = true;
          } else if (emailCounts.get(email) > 1) {
            action = "error";
            reasonCode = "duplicate_email_in_file";
            errorMessage = "Duplicate email in spreadsheet.";
            blocking = true;
          }

          const normalizedStatus = normalizeStatusValue(statusValue, options.defaultStatus);
          if (!action && !normalizedStatus) {
            action = "error";
            reasonCode = "invalid_status_value";
            errorMessage = "Status must be Active or Suspended.";
          }

          const existingUser = email ? existingUsers.get(email) : null;
          let updateUsername = false;
          let finalUsername = "";

          if (!action) {
            if (options.usernamePolicy === "generate_random") {
              finalUsername = generateRandomUsername(assignedUsernames);
              updateUsername = true;
            } else if (usernameInput) {
              const candidateLower = usernameInput.toLowerCase();
              const existingUsername = existingUsernames.get(candidateLower);
              if (!existingUsername || existingUsername.id === existingUser?.id) {
                finalUsername = usernameInput;
                assignedUsernames.add(candidateLower);
                updateUsername = true;
              } else if (!existingUser) {
                finalUsername = generateRandomUsername(assignedUsernames);
                updateUsername = true;
              } else {
                finalUsername = existingUser.username;
                updateUsername = false;
              }
            } else {
              finalUsername = generateRandomUsername(assignedUsernames);
              updateUsername = true;
            }
          }

          if (!action) {
            if (existingUser) {
              if (options.mode === "create_only") {
                action = "skip";
                reasonCode = "skipped_existing_create_only";
              } else {
                action = "update";
                reasonCode = "updated_existing_member";
              }
            } else {
              action = "create";
              reasonCode = "created_new_member";
            }
          }

          rowResults.push(
            normalizeImportMembershipRecord(
              {
                id: rowResults.length + 1,
                rowNumber: row.rowNumber,
                action,
                reasonCode,
                errorMessage,
                firstName,
                surname,
                fullName: `${firstName} ${surname}`.trim(),
                email,
                organisation,
                phone,
                status: normalizedStatus || options.defaultStatus,
                username: finalUsername,
                updateUsername,
                groups,
                roles,
                existingUserId: existingUser?.id || null
              },
              rowResults.length + 1
            )
          );
        }

        const batchId = `imp_${new Date().toISOString().slice(0, 10).replace(/-/g, "")}_${randomBytes(3).toString("hex")}`;
        const summary = summarizeImportMembershipSet(rowResults);
        const totalRows = summary.totalRows;

        database
          .prepare(
            `
            INSERT INTO member_import_batches (
              batch_id,
              created_by_user_id,
              source_filename,
              source_file_blob,
              mode,
              default_status,
              username_policy,
              activation_policy,
              invite_policy,
              status,
              membership_set_json,
              total_rows,
              create_count,
              update_count,
              skip_count,
              error_count,
              blocking_issue_count,
              has_blocking_issues
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?)
          `
          )
          .run(
            batchId,
            auth.user.id,
            filename,
            workbookBuffer,
            options.mode,
            options.defaultStatus,
            options.usernamePolicy,
            options.activationPolicy,
            options.invitePolicy,
            serializeImportMembershipSetJson(rowResults),
            totalRows,
            summary.createCount,
            summary.updateCount,
            summary.skipCount,
            summary.errorCount,
            summary.blockingIssueCount,
            summary.hasBlockingIssues ? 1 : 0
          );

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_import_dry_run', 'member_import_batch', ?, ?)
          `
          )
          .run(
            auth.user.id,
            batchId,
            JSON.stringify({
              filename,
              reused_source_batch_id: reusedSourceBatchId || null,
              mode: options.mode,
              default_status: options.defaultStatus,
              username_policy: options.usernamePolicy,
              activation_policy: options.activationPolicy,
              invite_policy: options.invitePolicy
            })
          );

        writeJson(
          response,
          200,
          {
            batch_id: batchId,
            status: "completed",
            source_filename: filename,
            reused_source_batch_id: reusedSourceBatchId || null,
            mode: options.mode,
            summary: {
              total_rows: totalRows,
              create: summary.createCount,
              update: summary.updateCount,
              skip: summary.skipCount,
              error: summary.errorCount
            },
            blocking_issue_count: summary.blockingIssueCount,
            has_blocking_issues: summary.hasBlockingIssues
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to process import.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/member-imports/latest") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
        return;
      }

      const latestPending = database
        .prepare(
          `
          SELECT
            batch_id AS batchId,
            source_filename AS sourceFilename,
            status,
            created_at AS createdAt,
            applied_at AS appliedAt
          FROM member_import_batches
          WHERE status = 'completed'
          ORDER BY datetime(created_at) DESC, id DESC
          LIMIT 1
        `
        )
        .get();
      const latestAny = latestPending
        ? latestPending
        : database
            .prepare(
              `
              SELECT
                batch_id AS batchId,
                source_filename AS sourceFilename,
                status,
                created_at AS createdAt,
                applied_at AS appliedAt
              FROM member_import_batches
              ORDER BY datetime(created_at) DESC, id DESC
              LIMIT 1
            `
            )
            .get();

      if (!latestAny) {
        writeJson(response, 200, { item: null }, corsHeaders);
        return;
      }

      writeJson(
        response,
        200,
        {
          item: {
            batch_id: latestAny.batchId,
            source_filename: latestAny.sourceFilename,
            status: latestAny.status,
            created_at: latestAny.createdAt,
            applied_at: latestAny.appliedAt
          }
        },
        corsHeaders
      );
      return;
    }

    if (
      request.method === "PATCH" &&
      requestUrl.pathname.startsWith("/api/admin/member-imports/") &&
      requestUrl.pathname.includes("/rows/")
    ) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const batchId = parts[4];
        const rowCollection = parts[5];
        const rowId = Number(parts[6] || 0);
        if (!batchId || rowCollection !== "rows" || !Number.isInteger(rowId) || rowId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "Valid batch id and row id are required." }, corsHeaders);
          return;
        }

        const batch = database
          .prepare(
            `
            SELECT batch_id AS batchId, mode, default_status AS defaultStatus, status, membership_set_json AS membershipSetJson
            FROM member_import_batches
            WHERE batch_id = ?
            LIMIT 1
          `
          )
          .get(batchId);
        if (!batch) {
          writeJson(response, 404, { error: "not_found", message: "Batch not found." }, corsHeaders);
          return;
        }
        if (batch.status === "applied") {
          writeJson(
            response,
            409,
            { error: "batch_applied", message: "Applied batches are read-only. Create a new dry-run to edit." },
            corsHeaders
          );
          return;
        }

        const importMembershipSet = loadImportMembershipSet(database, batchId, batch.membershipSetJson);
        const currentRow = importMembershipSet.find((item) => Number(item.id) === Number(rowId));
        if (!currentRow) {
          writeJson(response, 404, { error: "not_found", message: "Row not found for this batch." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const fullNameInput =
          payload.fullName !== undefined ? String(payload.fullName || "") : String(currentRow.fullName || "");
        const emailInput = payload.email !== undefined ? String(payload.email || "") : String(currentRow.email || "");
        const organisationInput =
          payload.organisation !== undefined ? String(payload.organisation || "") : String(currentRow.organisation || "");
        const phoneInput = payload.phone !== undefined ? String(payload.phone || "") : String(currentRow.phone || "");
        const groupsInput =
          payload.groups !== undefined
            ? payload.groups
            : Array.isArray(currentRow.groups)
              ? currentRow.groups
              : [];

        const parsedName = splitFullName(fullNameInput);
        const email = emailInput.trim().toLowerCase();
        const organisation = organisationInput.trim();
        const phone = phoneInput.trim();
        const normalizedStatus = normalizeStatusValue(
          payload.status !== undefined ? payload.status : currentRow.status || batch.defaultStatus,
          batch.defaultStatus
        );
        const normalizedGroups = normalizeUniqueList(groupsInput);

        const duplicateEmailRow = email
          ? importMembershipSet.find((item) => Number(item.id) !== Number(rowId) && String(item.email || "") === email)
          : null;
        const existingByEmail = email ? loadExistingUsersByEmail(database, [email]).get(email) : null;

        let nextAction = "error";
        let nextReasonCode = "";
        let nextErrorMessage = "";
        if (!parsedName.fullName || !email) {
          nextAction = "error";
          nextReasonCode = "missing_required_field";
          nextErrorMessage = "Full name and email are required.";
        } else if (!isValidEmail(email)) {
          nextAction = "error";
          nextReasonCode = "invalid_email";
          nextErrorMessage = "Email format is invalid.";
        } else if (duplicateEmailRow) {
          nextAction = "error";
          nextReasonCode = "duplicate_email_in_file";
          nextErrorMessage = "Duplicate email in spreadsheet.";
        } else if (!normalizedStatus) {
          nextAction = "error";
          nextReasonCode = "invalid_status_value";
          nextErrorMessage = "Status must be Active or Suspended.";
        } else if (existingByEmail) {
          if (batch.mode === "create_only") {
            nextAction = "skip";
            nextReasonCode = "skipped_existing_create_only";
          } else {
            nextAction = "update";
            nextReasonCode = "updated_existing_member";
          }
        } else {
          nextAction = "create";
          nextReasonCode = "created_new_member";
        }

        let username = String(currentRow.username || "").trim();
        const occupiedUsernames = new Set(
          database
            .prepare("SELECT username FROM users")
            .all()
            .map((row) => String(row.username || "").toLowerCase())
            .filter(Boolean)
        );
        for (const row of importMembershipSet) {
          if (Number(row.id) === Number(rowId)) {
            continue;
          }
          const value = String(row.username || "").trim().toLowerCase();
          if (value) {
            occupiedUsernames.add(value);
          }
        }

        if (nextAction === "create") {
          if (!username || occupiedUsernames.has(username.toLowerCase())) {
            username = generateRandomUsername(occupiedUsernames);
          }
        } else if (nextAction === "update") {
          if (!username && existingByEmail?.username) {
            username = existingByEmail.username;
          }
        }

        const roles = normalizeUniqueList(currentRow.roles || []);
        const updatedRecord = normalizeImportMembershipRecord(
          {
            ...currentRow,
            firstName: parsedName.firstName,
            surname: parsedName.surname,
            fullName: parsedName.fullName,
            email,
            organisation,
          phone,
            status: normalizedStatus || batch.defaultStatus,
            username,
            updateUsername:
              nextAction === "create" ? true : nextAction === "update" ? false : Boolean(currentRow.updateUsername),
            groups: normalizedGroups,
            roles,
            existingUserId: existingByEmail?.id || null
          },
          currentRow.id
        );
        const updatedSet = importMembershipSet.map((row) =>
          Number(row.id) === Number(rowId) ? updatedRecord : row
        );
        const refreshed = summarizeImportMembershipSet(updatedSet);

        runTransaction(database, () => {
          database
            .prepare(
              `
              UPDATE member_import_batches
              SET
                membership_set_json = ?,
                total_rows = ?,
                create_count = ?,
                update_count = ?,
                skip_count = ?,
                error_count = ?,
                blocking_issue_count = ?,
                has_blocking_issues = ?
              WHERE batch_id = ?
            `
            )
            .run(
              serializeImportMembershipSetJson(updatedSet),
              refreshed.totalRows,
              refreshed.createCount,
              refreshed.updateCount,
              refreshed.skipCount,
              refreshed.errorCount,
              refreshed.blockingIssueCount,
              refreshed.hasBlockingIssues ? 1 : 0,
              batchId
            );

          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'member_import_row_updated', 'member_import_row', ?, ?)
            `
            )
            .run(
              auth.user.id,
              String(rowId),
              JSON.stringify({
                batch_id: batchId,
                action: updatedRecord.action,
                reason_code: updatedRecord.reasonCode,
                blocking: IMPORT_BLOCKING_REASON_CODES.has(updatedRecord.reasonCode)
              })
            );
        });

        writeJson(
          response,
          200,
          {
            item: toImportMembershipResponseItem(updatedRecord),
            summary: {
              create: refreshed.createCount,
              update: refreshed.updateCount,
              skip: refreshed.skipCount,
              error: refreshed.errorCount
            },
            blocking_issue_count: refreshed.blockingIssueCount,
            has_blocking_issues: refreshed.hasBlockingIssues
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to update import row.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/api/admin/member-imports/")) {
      const parts = requestUrl.pathname.split("/");
      const batchId = parts[4];

      if (!batchId) {
        writeJson(response, 400, { error: "validation_error", message: "Batch id is required." }, corsHeaders);
        return;
      }

      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
        return;
      }

      if (requestUrl.pathname.endsWith("/rows")) {
        const batch = database
          .prepare(
            `
            SELECT batch_id AS batchId, membership_set_json AS membershipSetJson
            FROM member_import_batches
            WHERE batch_id = ?
            LIMIT 1
          `
          )
          .get(batchId);
        if (!batch) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }

        const cursor = Number(requestUrl.searchParams.get("cursor") || 0);
        const limit = Math.min(Number(requestUrl.searchParams.get("limit") || 50), 200);
        const rows = loadImportMembershipSet(database, batchId, batch.membershipSetJson)
          .slice()
          .sort((left, right) => Number(left.id) - Number(right.id))
          .filter((item) => Number(item.id) > cursor)
          .slice(0, limit)
          .map((item) => toImportMembershipResponseItem(item));

        const nextCursor = rows.length > 0 ? rows[rows.length - 1].id : null;

        writeJson(response, 200, { items: rows, next_cursor: nextCursor }, corsHeaders);
        return;
      }

      if (requestUrl.pathname.endsWith("/report.csv")) {
        const batch = database
          .prepare(
            `
            SELECT batch_id AS batchId, membership_set_json AS membershipSetJson
            FROM member_import_batches
            WHERE batch_id = ?
            LIMIT 1
          `
          )
          .get(batchId);
        if (!batch) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }

        const rows = loadImportMembershipSet(database, batchId, batch.membershipSetJson)
          .slice()
          .sort((left, right) => {
            const leftKey = Number(left.rowNumber || left.id || 0);
            const rightKey = Number(right.rowNumber || right.id || 0);
            return leftKey - rightKey;
          })
          .map((item) => ({
            rowNumber: item.rowNumber || item.id,
            action: item.action,
            reasonCode: item.reasonCode || "",
            email: item.email || "",
            fullName: item.fullName || "",
            status: item.status || "",
            organisation: item.organisation || "",
            phone: item.phone || "",
            groups: (item.groups || []).join(", "),
            errorMessage: item.errorMessage || ""
          }));

        const header = "row_number,action,reason_code,email,full_name,status,organisation,phone,groups,error_message";
        const lines = rows.map((row) =>
          [
            row.rowNumber,
            row.action,
            row.reasonCode || "",
            row.email || "",
            row.fullName || "",
            row.status || "",
            row.organisation || "",
            row.phone || "",
            row.groups || "",
            row.errorMessage || ""
          ]
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(",")
        );

        response.writeHead(200, {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${batchId}-report.csv"`,
          ...corsHeaders
        });
        response.end([header, ...lines].join("\n"));
        return;
      }

      const batch = database
        .prepare(
          `
          SELECT
            batch_id AS batchId,
            source_filename AS sourceFilename,
            mode,
            default_status AS defaultStatus,
            username_policy AS usernamePolicy,
            activation_policy AS activationPolicy,
            invite_policy AS invitePolicy,
            status,
            total_rows AS totalRows,
            create_count AS createCount,
            update_count AS updateCount,
            skip_count AS skipCount,
            error_count AS errorCount,
            blocking_issue_count AS blockingIssueCount,
            has_blocking_issues AS hasBlockingIssues,
            created_at AS createdAt,
            applied_at AS appliedAt,
            invites_queued AS invitesQueued,
            invites_failed AS invitesFailed
          FROM member_import_batches
          WHERE batch_id = ?
          LIMIT 1
        `
        )
        .get(batchId);

      if (!batch) {
        writeJson(response, 404, { error: "not_found" }, corsHeaders);
        return;
      }

      writeJson(
        response,
        200,
        {
          batch_id: batch.batchId,
          source_filename: batch.sourceFilename,
          mode: batch.mode,
          default_status: batch.defaultStatus,
          username_policy: batch.usernamePolicy,
          activation_policy: batch.activationPolicy,
          invite_policy: batch.invitePolicy,
          status: batch.status,
          summary: {
            total_rows: batch.totalRows,
            create: batch.createCount,
            update: batch.updateCount,
            skip: batch.skipCount,
            error: batch.errorCount
          },
          blocking_issue_count: batch.blockingIssueCount,
          has_blocking_issues: Boolean(batch.hasBlockingIssues),
          created_at: batch.createdAt,
          applied_at: batch.appliedAt,
          invites: {
            queued: batch.invitesQueued,
            failed: batch.invitesFailed
          }
        },
        corsHeaders
      );
      return;
    }

    if (request.method === "POST" && requestUrl.pathname.startsWith("/api/admin/member-imports/") && requestUrl.pathname.endsWith("/apply")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const batchId = parts[4];
        if (!batchId) {
          writeJson(response, 400, { error: "validation_error", message: "Batch id is required." }, corsHeaders);
          return;
        }

        const batch = database
          .prepare(
            `
            SELECT *
            FROM member_import_batches
            WHERE batch_id = ?
            LIMIT 1
          `
          )
          .get(batchId);

        if (!batch) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }

        if (batch.has_blocking_issues) {
          writeJson(
            response,
            409,
            { error: "blocking_issues", message: "Resolve blocking issues before applying." },
            corsHeaders
          );
          return;
        }

        if (batch.status === "applied") {
          writeJson(
            response,
            200,
            {
              batch_id: batch.batch_id,
              status: batch.status,
              applied_at: batch.applied_at,
              summary: {
                create: batch.create_count,
                update: batch.update_count,
                skip: batch.skip_count,
                error: batch.error_count
              },
              invites: {
                queued: batch.invites_queued,
                failed: batch.invites_failed
              }
            },
            corsHeaders
          );
          return;
        }

        const payload = await readJsonBody(request);
        const sendInvites = payload.send_invites === true;
        const requestedInviteExpiryHours = Number(payload.invite_expiry_hours);
        const inviteExpiryHours =
          Number.isFinite(requestedInviteExpiryHours) && requestedInviteExpiryHours > 0 ? requestedInviteExpiryHours : 72;

        const rows = loadImportMembershipSet(database, batchId, batch.membership_set_json)
          .slice()
          .sort((left, right) => Number(left.id) - Number(right.id));

        const createdUserIds = [];
        const updatedUserIds = [];

        for (let rowIndex = 0; rowIndex < rows.length; rowIndex += 1) {
          const row = rows[rowIndex];
          if (row.action === "skip" || row.action === "error") {
            continue;
          }

          try {
            runTransaction(database, () => {
              if (row.action === "create") {
                const desiredStatus = row.status === "suspended" ? "suspended" : "active";
                const status =
                  desiredStatus === "suspended"
                    ? "suspended"
                    : sendInvites && batch.invite_policy === "queue_on_apply"
                      ? "invited"
                      : "not_invited";
                const mustChangePassword =
                  batch.activation_policy === "password_change_required" ||
                  batch.activation_policy === "password_and_username_personalization_required";
                const mustChangeUsername =
                  batch.activation_policy === "password_and_username_personalization_required";
                const tempPassword = randomBytes(16).toString("hex");
                const insertUser = database
                  .prepare(
                    `
                    INSERT INTO users (
                      username,
                      email,
                      password_hash,
                      role,
                      status,
                      desired_status,
                      must_change_password,
                      must_change_username,
                      created_at,
                      updated_at
                    ) VALUES (?, ?, ?, 'member', ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                  `
                  )
                  .run(
                    row.username,
                    row.email,
                    hashPassword(tempPassword),
                    status,
                    desiredStatus,
                    mustChangePassword ? 1 : 0,
                    mustChangeUsername ? 1 : 0
                  );

                const userId = insertUser.lastInsertRowid;
                createdUserIds.push(userId);

                database
                  .prepare(
                    `
                    INSERT INTO member_profiles (user_id, full_name, company, phone, created_at, updated_at)
                    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                  `
                  )
                  .run(userId, row.fullName, row.organisation || null, row.phone || null);

                const groupMap = ensureGroupIds(database, row.groups || []);
                const groupIds = (row.groups || []).map((name) => groupMap.get(name)).filter(Boolean);
                setGroupMemberships(database, userId, groupIds);

                const roleMap = ensureRoleIds(database, row.roles || []);
                const roleIds = (row.roles || []).map((name) => roleMap.get(name)).filter(Boolean);
                setRoleAssignments(database, userId, roleIds);
              }

              if (row.action === "update") {
                let userId = Number(row.existingUserId || 0);
                if (!Number.isInteger(userId) || userId <= 0) {
                  const byEmail = row.email ? loadExistingUsersByEmail(database, [row.email]).get(row.email) : null;
                  userId = Number(byEmail?.id || 0);
                }
                if (!userId) {
                  throw new Error("Missing user id for update.");
                }

                const current = database
                  .prepare("SELECT id, status, username FROM users WHERE id = ?")
                  .get(userId);
                if (!current) {
                  throw new Error("User not found for update.");
                }

                const desiredStatus = row.status === "suspended" ? "suspended" : "active";
                let statusUpdate = current.status;
                if (desiredStatus === "suspended") {
                  statusUpdate = "suspended";
                } else if (desiredStatus === "active" && current.status === "suspended") {
                  statusUpdate = "active";
                }

                let usernameUpdate = current.username;
                if (row.updateUsername && row.username) {
                  const collision = database
                    .prepare("SELECT id FROM users WHERE LOWER(username) = ? AND id != ?")
                    .get(String(row.username).toLowerCase(), userId);
                  if (!collision) {
                    usernameUpdate = row.username;
                  }
                }

                database
                  .prepare(
                    `
                    UPDATE users
                    SET username = ?, desired_status = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                  `
                  )
                  .run(usernameUpdate, desiredStatus, statusUpdate, userId);

                database
                  .prepare(
                    `
                    UPDATE member_profiles
                    SET full_name = ?, company = ?, phone = ?, updated_at = CURRENT_TIMESTAMP
                    WHERE user_id = ?
                  `
                  )
                  .run(row.fullName, row.organisation || null, row.phone || null, userId);

                const groupMap = ensureGroupIds(database, row.groups || []);
                const groupIds = (row.groups || []).map((name) => groupMap.get(name)).filter(Boolean);
                setGroupMemberships(database, userId, groupIds);

                const roleMap = ensureRoleIds(database, row.roles || []);
                const roleIds = (row.roles || []).map((name) => roleMap.get(name)).filter(Boolean);
                setRoleAssignments(database, userId, roleIds);

                updatedUserIds.push(userId);
              }
            });
          } catch (error) {
            rows[rowIndex] = normalizeImportMembershipRecord(
              {
                ...row,
                action: "error",
                reasonCode: "unexpected_processing_error",
                errorMessage: String(error.message || error)
              },
              row.id
            );
          }
        }

        const refreshed = summarizeImportMembershipSet(rows);

        let invitesQueued = 0;
        let invitesFailed = 0;

        if (sendInvites && batch.invite_policy === "queue_on_apply") {
          const uniqueUserIds = [...new Set([...createdUserIds, ...updatedUserIds])];
          const inviteResult = queueMemberInvites(database, uniqueUserIds, auth.user.id, {
            expiryHours: inviteExpiryHours
          });
          invitesQueued = inviteResult.queued.length;
          invitesFailed = 0;

          if (inviteResult.queued.length > 0) {
            const ids = inviteResult.queued.map((item) => item.id);
            const placeholders = ids.map(() => "?").join(",");
            const profileRows = database
              .prepare(
                `
                SELECT user_id AS userId, full_name AS fullName
                FROM member_profiles
                WHERE user_id IN (${placeholders})
              `
              )
              .all(...ids);
            const nameMap = new Map(profileRows.map((row) => [row.userId, row.fullName]));

            for (const queued of inviteResult.queued) {
              const firstName = getFirstName(nameMap.get(queued.id), queued.username);
              const inviteUrl = `${config.appBaseUrl}/activate?token=${queued.inviteToken}`;
              const email = buildInviteEmail({
                firstName,
                portalUrl: config.appBaseUrl,
                username: queued.username,
                inviteUrl,
                supportEmail: "support@iwfsa.local"
              });
              sendTransactionalEmail({
                to: queued.email,
                subject: email.subject,
                text: email.text,
                metadata: { template: "member_invite" }
              });
              recordNotificationDelivery(database, {
                userId: queued.id,
                channel: "email",
                eventType: "member_invite",
                status: "sent",
                idempotencyKey: `invite:${queued.inviteTokenId}`
              });
            }
          }

          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'member_invites_queued', 'member_import_batch', ?, ?)
            `
            )
            .run(
              auth.user.id,
              batchId,
              JSON.stringify({
                source_filename: batch.source_filename,
                mode: batch.mode,
                invite_expiry_hours: inviteExpiryHours,
                queued: invitesQueued,
                failed: invitesFailed
              })
            );
        }

        const appliedAt = new Date().toISOString();
        database
          .prepare(
            `
            UPDATE member_import_batches
            SET status = 'applied',
                applied_at = ?,
                applied_by_user_id = ?,
                membership_set_json = ?,
                total_rows = ?,
                create_count = ?,
                update_count = ?,
                skip_count = ?,
                error_count = ?,
                blocking_issue_count = ?,
                has_blocking_issues = ?,
                invites_queued = ?,
                invites_failed = ?
            WHERE batch_id = ?
          `
          )
          .run(
            appliedAt,
            auth.user.id,
            serializeImportMembershipSetJson(rows),
            refreshed.totalRows,
            refreshed.createCount,
            refreshed.updateCount,
            refreshed.skipCount,
            refreshed.errorCount,
            refreshed.blockingIssueCount,
            refreshed.hasBlockingIssues ? 1 : 0,
            invitesQueued,
            invitesFailed,
            batchId
          );

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_import_applied', 'member_import_batch', ?, ?)
          `
          )
          .run(
            auth.user.id,
            batchId,
            JSON.stringify({
              source_filename: batch.source_filename,
              mode: batch.mode,
              default_status: batch.default_status,
              username_policy: batch.username_policy,
              activation_policy: batch.activation_policy,
              invite_policy: batch.invite_policy,
              send_invites: sendInvites,
              invite_expiry_hours: inviteExpiryHours,
              invites_queued: invitesQueued,
              invites_failed: invitesFailed,
              summary: {
                create: refreshed.createCount,
                update: refreshed.updateCount,
                skip: refreshed.skipCount,
                error: refreshed.errorCount
              }
            })
          );

        writeJson(
          response,
          200,
          {
            batch_id: batchId,
            status: "applied",
            applied_at: appliedAt,
            summary: {
              create: refreshed.createCount,
              update: refreshed.updateCount,
              skip: refreshed.skipCount,
              error: refreshed.errorCount
            },
            invites: {
              queued: invitesQueued,
              failed: invitesFailed
            }
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to apply import.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/signup") {
      writeJson(
        response,
        404,
        {
          error: "not_found",
          message: "Self-signup is disabled. Contact an admin for an invitation."
        },
        corsHeaders
      );
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/login") {
      try {
        const payload = await readJsonBody(request);
        const username = typeof payload.username === "string" ? payload.username.trim() : "";
        const password = typeof payload.password === "string" ? payload.password : "";

        if (!username || !password) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Username and password are required." },
            corsHeaders
          );
          return;
        }

        const user = findUserForLogin(database, username);
        if (!user || !verifyPassword(password, user.passwordHash)) {
          writeJson(response, 401, { error: "invalid_credentials", message: "Invalid username or password." }, corsHeaders);
          return;
        }

        if (user.status !== "active") {
          writeJson(response, 403, { error: "inactive_account", message: "Account is not active." }, corsHeaders);
          return;
        }

        const session = createSession(database, user.id);

        writeJson(
          response,
          200,
          {
            authenticated: true,
            token: session.token,
            expiresAt: session.expiresAt,
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
              role: user.role,
              mustChangePassword: Boolean(user.must_change_password),
              mustChangeUsername: Boolean(user.must_change_username)
            }
          },
          corsHeaders
        );
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/logout") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      const revoked = revokeSession(database, auth.token);
      writeJson(response, 200, { loggedOut: true, revoked }, corsHeaders);
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/password") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }

        const payload = await readJsonBody(request);
        const currentPassword = typeof payload.currentPassword === "string" ? payload.currentPassword : "";
        const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

        if (!currentPassword || !newPassword) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Current and new passwords are required." },
            corsHeaders
          );
          return;
        }

        if (newPassword.length < 8) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "New password must be at least 8 characters." },
            corsHeaders
          );
          return;
        }

        const user = database
          .prepare(
            `
            SELECT id, password_hash AS passwordHash
            FROM users
            WHERE id = ?
            LIMIT 1
          `
          )
          .get(auth.user.id);

        if (!user || !verifyPassword(currentPassword, user.passwordHash)) {
          writeJson(
            response,
            403,
            { error: "invalid_credentials", message: "Current password is incorrect." },
            corsHeaders
          );
          return;
        }

        const nextHash = hashPassword(newPassword);
        database
          .prepare(
            `
            UPDATE users
            SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          )
          .run(nextHash, auth.user.id);

        writeJson(response, 200, { updated: true }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/activate") {
      try {
        const payload = await readJsonBody(request);
        const token = typeof payload.token === "string" ? payload.token.trim() : "";
        const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";
        const newUsername = typeof payload.username === "string" ? payload.username.trim() : "";

        if (!token || !newPassword) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Token and new password are required." },
            corsHeaders
          );
          return;
        }

        if (newPassword.length < 8) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "New password must be at least 8 characters." },
            corsHeaders
          );
          return;
        }

        const record = loadTokenRecord(database, "member_invite_tokens", token);
        if (!record || record.usedAt) {
          writeJson(response, 403, { error: "invalid_token", message: "Invite token is invalid." }, corsHeaders);
          return;
        }

        if (new Date(record.expiresAt).getTime() <= Date.now()) {
          writeJson(response, 403, { error: "expired_token", message: "Invite token has expired." }, corsHeaders);
          return;
        }

        const user = database
          .prepare(
            `
            SELECT id, username, desired_status AS desiredStatus, must_change_username AS mustChangeUsername
            FROM users
            WHERE id = ?
            LIMIT 1
          `
          )
          .get(record.userId);

        if (!user) {
          writeJson(response, 404, { error: "not_found" }, corsHeaders);
          return;
        }

        let finalUsername = user.username;
        if (user.mustChangeUsername) {
          if (!newUsername) {
            writeJson(
              response,
              400,
              { error: "validation_error", message: "Username personalization is required." },
              corsHeaders
            );
            return;
          }

          const collision = database
            .prepare("SELECT id FROM users WHERE LOWER(username) = ? AND id != ?")
            .get(newUsername.toLowerCase(), user.id);
          if (collision) {
            writeJson(
              response,
              400,
              { error: "validation_error", message: "Username is already in use." },
              corsHeaders
            );
            return;
          }
          finalUsername = newUsername;
        }

        const nextHash = hashPassword(newPassword);
        const nextStatus = user.desiredStatus === "suspended" ? "suspended" : "active";

        runTransaction(database, () => {
          database
            .prepare(
              `
              UPDATE users
              SET username = ?,
                  password_hash = ?,
                  status = ?,
                  must_change_password = 0,
                  must_change_username = 0,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `
            )
            .run(finalUsername, nextHash, nextStatus, user.id);

          markTokenUsed(database, "member_invite_tokens", record.id);
        });

        writeJson(response, 200, { activated: true }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/auth/reset") {
      try {
        const payload = await readJsonBody(request);
        const token = typeof payload.token === "string" ? payload.token.trim() : "";
        const newPassword = typeof payload.newPassword === "string" ? payload.newPassword : "";

        if (!token || !newPassword) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Token and new password are required." },
            corsHeaders
          );
          return;
        }

        if (newPassword.length < 8) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "New password must be at least 8 characters." },
            corsHeaders
          );
          return;
        }

        const record = loadTokenRecord(database, "password_reset_tokens", token);
        if (!record || record.usedAt) {
          writeJson(response, 403, { error: "invalid_token", message: "Reset token is invalid." }, corsHeaders);
          return;
        }

        if (new Date(record.expiresAt).getTime() <= Date.now()) {
          writeJson(response, 403, { error: "expired_token", message: "Reset token has expired." }, corsHeaders);
          return;
        }

        const nextHash = hashPassword(newPassword);
        runTransaction(database, () => {
          database
            .prepare(
              `
              UPDATE users
              SET password_hash = ?, must_change_password = 0, updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `
            )
            .run(nextHash, record.userId);

          markTokenUsed(database, "password_reset_tokens", record.id);
        });

        writeJson(response, 200, { reset: true }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/event-editor-grants") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const eventId = Number(payload.eventId);
        const userId = Number(payload.userId);

        if (!Number.isInteger(eventId) || !Number.isInteger(userId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event and user are required." }, corsHeaders);
          return;
        }

        const eventRow = database
          .prepare(
            `
            SELECT id, created_by_user_id AS createdByUserId
            FROM events
            WHERE id = ?
            LIMIT 1
          `
          )
          .get(eventId);

        if (!eventRow) {
          writeJson(response, 400, { error: "validation_error", message: "Event does not exist." }, corsHeaders);
          return;
        }

        if (!canManageEventEditorGrants(database, auth.user, eventId, { eventRow })) {
          writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
          return;
        }

        const userRow = database
          .prepare(
            `
            SELECT id, role
            FROM users
            WHERE id = ?
            LIMIT 1
          `
          )
          .get(userId);

        if (!userRow) {
          writeJson(response, 400, { error: "validation_error", message: "User does not exist." }, corsHeaders);
          return;
        }

        if (!["member", "event_editor"].includes(userRow.role)) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "User must be a member or event editor." },
            corsHeaders
          );
          return;
        }

        const existing = database
          .prepare(
            `
            SELECT id
            FROM event_editor_grants
            WHERE event_id = ? AND user_id = ?
            LIMIT 1
          `
          )
          .get(eventId, userId);

        if (!existing) {
          database
            .prepare(
              `
              INSERT INTO event_editor_grants (event_id, user_id, granted_by_user_id)
              VALUES (?, ?, ?)
            `
            )
            .run(eventId, userId, auth.user.id);

          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'event_editor_granted', 'event', ?, ?)
            `
            )
            .run(
              auth.user.id,
              String(eventId),
              JSON.stringify({
                userId,
                actorRole: auth.user.role,
                scope: isAdminRole(auth.user.role) ? "admin" : "event_creator"
              })
            );
        }

        writeJson(response, 200, { granted: true, alreadyGranted: Boolean(existing) }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "DELETE" && requestUrl.pathname === "/api/event-editor-grants") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const eventId = Number(payload.eventId);
        const userId = Number(payload.userId);

        if (!Number.isInteger(eventId) || !Number.isInteger(userId)) {
          writeJson(response, 400, { error: "validation_error", message: "Event and user are required." }, corsHeaders);
          return;
        }

        const eventRow = database
          .prepare(
            `
            SELECT id, created_by_user_id AS createdByUserId
            FROM events
            WHERE id = ?
            LIMIT 1
          `
          )
          .get(eventId);

        if (!eventRow) {
          writeJson(response, 400, { error: "validation_error", message: "Event does not exist." }, corsHeaders);
          return;
        }

        if (!canManageEventEditorGrants(database, auth.user, eventId, { eventRow })) {
          writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
          return;
        }

        const result = database
          .prepare(
            `
            DELETE FROM event_editor_grants
            WHERE event_id = ? AND user_id = ?
          `
          )
          .run(eventId, userId);

        if (result.changes > 0) {
          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'event_editor_revoked', 'event', ?, ?)
            `
            )
            .run(
              auth.user.id,
              String(eventId),
              JSON.stringify({
                userId,
                actorRole: auth.user.role,
                scope: isAdminRole(auth.user.role) ? "admin" : "event_creator"
              })
            );
        }

        writeJson(response, 200, { revoked: result.changes > 0 }, corsHeaders);
      } catch {
        writeJson(response, 400, { error: "invalid_json", message: "Request body must be valid JSON." }, corsHeaders);
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname.startsWith("/api/events/") && requestUrl.pathname.endsWith("/edit-access")) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const eventId = Number(parts[3]);
      if (!Number.isInteger(eventId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event id is required." }, corsHeaders);
        return;
      }

      const allowed = canEditEvent(database, auth.user, eventId);
      writeJson(response, 200, { eventId, canEdit: allowed }, corsHeaders);
      return;
    }

    writeJson(response, 404, { error: "not_found" }, corsHeaders);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(config.port, config.host, resolve);
  });

  const address = server.address();
  const resolvedPort = typeof address === "object" && address ? address.port : config.port;

  return {
    host: config.host,
    port: resolvedPort,
    close: async () =>
      new Promise((resolve, reject) => {
        server.close((error) => {
          clearInterval(reminderDispatchInterval);
          clearInterval(notificationDispatchInterval);
          eventSummaryCache.clear();
          database.close();
          if (error) {
            reject(error);
            return;
          }
          resolve();
        });
      })
  };
}
