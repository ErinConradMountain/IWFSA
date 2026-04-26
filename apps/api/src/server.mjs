import http from "node:http";
import { createHash, randomBytes } from "node:crypto";
import { Readable } from "node:stream";
import Busboy from "busboy";
import * as XLSX from "xlsx";
import { hashPassword, verifyPassword } from "./auth/passwords.mjs";
import { ensureBootstrapAdmin } from "./auth/bootstrap-admin.mjs";
import { openDatabase } from "./db/client.mjs";
import { sendTransactionalEmail } from "./notifications/email.mjs";
import { listUpcomingBirthdays } from "./birthdays.mjs";
import { createSharePointClient } from "./integrations/sharepoint.mjs";
import { createTeamsGraphClient } from "./integrations/teams-graph.mjs";
import { createCalendarSyncClient } from "./integrations/calendar-sync.mjs";

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
const EVENT_DOCUMENT_TYPES = new Set(["agenda", "minutes", "attachment"]);
const EVENT_DOCUMENT_AVAILABILITY_MODES = new Set(["immediate", "after_event", "scheduled"]);
const EVENT_DOCUMENT_MEMBER_ACCESS_SCOPES = new Set(["all_visible", "invited_attended"]);
const EVENT_DOCUMENT_MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024;
const MEMBER_PROFILE_PHOTO_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const MEMBER_PROFILE_PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const BIRTHDAY_VISIBILITY_VALUES = new Set(["hidden", "members_only", "members_and_social"]);
const MEMBER_NEWS_STATUSES = new Set(["draft", "published", "archived"]);
const ACCOUNT_STATUS_VALUES = new Set(["active", "blocked", "deactivated", "invited", "not_invited"]);
const MEMBERSHIP_CYCLE_STATUSES = new Set(["draft", "open", "closed", "archived"]);
const MEMBER_FEE_PAYMENT_STATUSES = new Set(["paid", "outstanding", "partial", "waived", "pending_review"]);
const MEMBER_FEE_STANDING_STATUSES = new Set([
  "good_standing",
  "outstanding",
  "partial",
  "waived",
  "pending_review",
  "blocked",
  "deactivated"
]);
const MEMBER_FEE_ACCESS_STATUSES = new Set(["enabled", "blocked", "deactivated"]);
const MEMBER_PORTAL_ELIGIBLE_STANDING = "good_standing";
const EVENT_DOCUMENT_ALLOWED_EXTENSIONS = new Set([
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
]);
const EVENT_DOCUMENT_ALLOWED_MIME_TYPES = new Set([
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
]);
const TEAMS_GRAPH_PROVIDER_LABEL = "Microsoft Teams";
const CALENDAR_SYNC_PROVIDERS = new Set(["google", "outlook"]);
const SMS_QUIET_HOURS_PATTERN = /^([01]\d|2[0-3]):([0-5]\d)$/;
const SMS_DAILY_LIMIT_RANGE = { min: 1, max: 20 };
const SMS_PER_EVENT_LIMIT_RANGE = { min: 1, max: 5 };
const SOCIAL_POST_RULES = Object.freeze([
  "Posts must be respectful and professional.",
  "Posts must be relevant to IWFSA members, events, milestones, or celebrations.",
  "No harassment, abuse, or discriminatory language.",
  "Do not post confidential or personal data without consent."
]);
const SOCIAL_DISALLOWED_TERMS = new Set([
  "idiot",
  "stupid",
  "hate",
  "racist",
  "sexist",
  "trash"
]);

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

function deriveAudiencePresentation(audienceType, groupNames = [], invitees = []) {
  if (audienceType !== "groups") {
    return { audienceCode: "all_members", audienceLabel: "All Members" };
  }

  const inviteeCount = Array.isArray(invitees) ? invitees.length : 0;
  const inviteeLabel = inviteeCount === 1 ? "1 selected member" : `${inviteeCount} selected members`;

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
    return { audienceCode: "groups", audienceLabel: inviteeCount > 0 ? inviteeLabel : "Groups" };
  }

  return {
    audienceCode: "groups",
    audienceLabel: groupNames.join(", ") + (inviteeCount > 0 ? ` + ${inviteeLabel}` : "")
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
  const membershipCycleYearRaw = String(fields.membership_cycle_year || "").trim();
  const membershipCycleYear = membershipCycleYearRaw ? parseMembershipYear(membershipCycleYearRaw) : null;
  const membershipCategoryDefault =
    toNullableTrimmedString(fields.membership_category_default, { maxLength: 160 }) || "Active Member";
  const standingDefault = normalizeMemberFeeStandingStatus(fields.standing_default, "pending_review");

  return {
    mode,
    defaultStatus: normalizedStatus,
    usernamePolicy,
    activationPolicy,
    invitePolicy,
    membershipCycleYear,
    membershipCategoryDefault,
    standingDefault
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

function isPortalMemberRole(role) {
  const normalized = String(role || "").trim().toLowerCase();
  return normalized === "member" || normalized === "event_editor";
}

function normalizeLegacyUserStatus(value) {
  const normalized = String(value || "")
    .trim()
    .toLowerCase();
  if (normalized === "suspended") {
    return "blocked";
  }
  if (normalized === "invited") {
    return "invited";
  }
  if (normalized === "not_invited") {
    return "not_invited";
  }
  return "active";
}

function normalizeAccountStatusValue(accountStatus, legacyStatus = "active") {
  const normalized = String(accountStatus || "")
    .trim()
    .toLowerCase();
  const legacyNormalized = normalizeLegacyUserStatus(legacyStatus);
  if (!ACCOUNT_STATUS_VALUES.has(normalized)) {
    return legacyNormalized;
  }
  if (legacyNormalized !== "active" && normalized === "active") {
    return legacyNormalized;
  }
  return normalized;
}

function loadLatestMemberFeeAccountForUser(database, userId) {
  return database
    .prepare(
      `
      SELECT
        mfa.id AS accountId,
        mfa.membership_cycle_id AS membershipCycleId,
        mfa.payment_status AS paymentStatus,
        mfa.standing_status AS standingStatus,
        mfa.access_status AS accessStatus,
        mfa.amount_due AS amountDue,
        mfa.amount_paid AS amountPaid,
        mfa.balance,
        mfa.last_payment_at AS lastPaymentAt,
        mfa.reviewed_at AS reviewedAt,
        mfa.reviewed_by_user_id AS reviewedByUserId,
        mfa.admin_note AS adminNote,
        mc.membership_year AS membershipYear,
        mc.status AS membershipCycleStatus,
        mc.due_date AS dueDate
      FROM member_fee_accounts AS mfa
      JOIN membership_cycles AS mc ON mc.id = mfa.membership_cycle_id
      WHERE mfa.user_id = ?
      ORDER BY
        CASE mc.status
          WHEN 'open' THEN 0
          WHEN 'draft' THEN 1
          WHEN 'closed' THEN 2
          WHEN 'archived' THEN 3
          ELSE 4
        END,
        mc.membership_year DESC,
        mfa.id DESC
      LIMIT 1
    `
    )
    .get(userId);
}

function resolveMembershipEligibility(database, { userId, role, accountStatus, legacyStatus }) {
  const normalizedRole = String(role || "")
    .trim()
    .toLowerCase();
  const normalizedAccountStatus = normalizeAccountStatusValue(accountStatus, legacyStatus);
  if (!isPortalMemberRole(normalizedRole)) {
    return {
      eligible: true,
      reason: "not_member_role",
      accountStatus: normalizedAccountStatus,
      standingStatus: null,
      accessStatus: null,
      paymentStatus: null,
      membershipCycleId: null,
      membershipYear: null,
      membershipCycleStatus: null,
      enforcedByFeeAccount: false
    };
  }

  if (normalizedAccountStatus !== "active") {
    return {
      eligible: false,
      reason: "account_status",
      accountStatus: normalizedAccountStatus,
      standingStatus: null,
      accessStatus: null,
      paymentStatus: null,
      membershipCycleId: null,
      membershipYear: null,
      membershipCycleStatus: null,
      enforcedByFeeAccount: false
    };
  }

  const latestFeeAccount = loadLatestMemberFeeAccountForUser(database, userId);
  if (!latestFeeAccount) {
    return {
      eligible: true,
      reason: "legacy_default",
      accountStatus: normalizedAccountStatus,
      standingStatus: MEMBER_PORTAL_ELIGIBLE_STANDING,
      accessStatus: "enabled",
      paymentStatus: "pending_review",
      membershipCycleId: null,
      membershipYear: null,
      membershipCycleStatus: null,
      enforcedByFeeAccount: false
    };
  }

  const standingStatus = String(latestFeeAccount.standingStatus || "pending_review").trim().toLowerCase();
  const accessStatus = String(latestFeeAccount.accessStatus || "enabled").trim().toLowerCase();
  const paymentStatus = String(latestFeeAccount.paymentStatus || "pending_review").trim().toLowerCase();
  const standingEligible = standingStatus === MEMBER_PORTAL_ELIGIBLE_STANDING;
  const accessEligible = accessStatus === "enabled";
  return {
    eligible: standingEligible && accessEligible,
    reason: standingEligible && accessEligible ? "eligible" : !standingEligible ? "standing_status" : "access_status",
    accountStatus: normalizedAccountStatus,
    standingStatus,
    accessStatus,
    paymentStatus,
    membershipCycleId: Number(latestFeeAccount.membershipCycleId || 0) || null,
    membershipYear: Number(latestFeeAccount.membershipYear || 0) || null,
    membershipCycleStatus: String(latestFeeAccount.membershipCycleStatus || "").trim().toLowerCase() || null,
    enforcedByFeeAccount: true
  };
}

function filterEligibleMemberUserIds(database, userIds) {
  const ids = Array.isArray(userIds)
    ? [...new Set(userIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))]
    : [];
  if (ids.length === 0) {
    return [];
  }
  const placeholders = ids.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT id, role, status, account_status AS accountStatus
      FROM users
      WHERE id IN (${placeholders})
    `
    )
    .all(...ids);
  const eligible = new Set();
  for (const row of rows) {
    const details = resolveMembershipEligibility(database, {
      userId: row.id,
      role: row.role,
      accountStatus: row.accountStatus,
      legacyStatus: row.status
    });
    if (details.eligible) {
      eligible.add(Number(row.id));
    }
  }
  return ids.filter((id) => eligible.has(id));
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
  if (isPortalMemberRole(user?.role) && user?.membershipEligible === false) {
    writeJson(
      response,
      403,
      {
        error: "membership_not_in_good_standing",
        message: "Member access is restricted to active members in good standing."
      },
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

function formatInviteDateTime(value) {
  const ms = Date.parse(String(value || ""));
  if (!Number.isFinite(ms)) {
    return "TBA";
  }
  return new Date(ms).toISOString();
}

function formatInviteVenue(eventRow) {
  const venueName = eventRow?.venue_name || eventRow?.venueName || "";
  const venueAddress = eventRow?.venue_address || eventRow?.venueAddress || "";
  const venueType = eventRow?.venue_type || eventRow?.venueType || "";
  const onlineJoinUrl = eventRow?.online_join_url || eventRow?.onlineJoinUrl || "";
  if (venueName || venueAddress) {
    return [venueName, venueAddress].filter(Boolean).join(" - ");
  }
  if (venueType === "online" || onlineJoinUrl) {
    return "Online";
  }
  return "TBA";
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
  const provider = eventRow.online_provider || eventRow.onlineProvider;
  if (provider) {
    descriptionParts.push(`Provider: ${provider}`);
  }
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
        OR EXISTS (
          SELECT 1
          FROM event_invitees
          WHERE event_invitees.event_id = events.id
            AND event_invitees.user_id = ?
        )
      )
    `;
    params.push(user?.id || -1, user?.id || -1);
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
  if (row) {
    return true;
  }
  const inviteeRow = database
    .prepare(
      `
      SELECT 1
      FROM event_invitees
      WHERE event_id = ?
        AND user_id = ?
      LIMIT 1
    `
    )
    .get(eventId, userId);
  return Boolean(inviteeRow);
}

function normalizeEventInviteeIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  ];
}

function resolveActiveMemberInviteeIds(database, value) {
  const userIds = normalizeEventInviteeIds(value);
  if (userIds.length === 0) {
    return [];
  }
  const placeholders = userIds.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT id
      FROM users
      WHERE role = 'member'
        AND account_status = 'active'
        AND id IN (${placeholders})
    `
    )
    .all(...userIds);
  const accountActiveIds = rows.map((row) => Number(row.id)).filter((id) => Number.isInteger(id));
  const eligibleIds = new Set(filterEligibleMemberUserIds(database, accountActiveIds));
  if (eligibleIds.size !== userIds.length) {
    const error = new Error("Selected invitees must be active members in good standing.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return userIds.filter((id) => eligibleIds.has(id));
}

function loadEventInviteeUserIds(database, eventId) {
  const rows = database
    .prepare(
      `
      SELECT event_invitees.user_id AS userId
      FROM event_invitees
      JOIN users ON users.id = event_invitees.user_id
      WHERE event_invitees.event_id = ?
        AND users.role = 'member'
        AND users.account_status = 'active'
      ORDER BY event_invitees.user_id ASC
    `
    )
    .all(eventId);
  const rawIds = rows.map((row) => Number(row.userId)).filter((id) => Number.isInteger(id));
  return filterEligibleMemberUserIds(database, rawIds);
}

function setEventInvitees(database, eventId, userIds, actorUserId = null) {
  database.prepare("DELETE FROM event_invitees WHERE event_id = ?").run(eventId);
  const inviteeIds = normalizeEventInviteeIds(userIds);
  if (inviteeIds.length === 0) {
    return;
  }
  const insert = database.prepare(
    "INSERT INTO event_invitees (event_id, user_id, invited_by_user_id) VALUES (?, ?, ?)"
  );
  for (const userId of inviteeIds) {
    insert.run(eventId, userId, actorUserId || null);
  }
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

function loadEventInviteeMap(database, eventIds) {
  const map = new Map();
  if (!Array.isArray(eventIds) || eventIds.length === 0) {
    return map;
  }

  const placeholders = eventIds.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT
        event_invitees.event_id AS eventId,
        users.id AS userId,
        users.username,
        users.email,
        member_profiles.full_name AS fullName,
        member_profiles.company AS organisation
      FROM event_invitees
      JOIN users ON users.id = event_invitees.user_id
      LEFT JOIN member_profiles ON member_profiles.user_id = users.id
      WHERE event_invitees.event_id IN (${placeholders})
        AND users.role = 'member'
        AND users.account_status = 'active'
      ORDER BY event_invitees.event_id,
        CASE WHEN member_profiles.full_name IS NULL OR member_profiles.full_name = '' THEN 1 ELSE 0 END,
        member_profiles.full_name,
        users.username
    `
    )
    .all(...eventIds);

  const eligibleIdSet = new Set(
    filterEligibleMemberUserIds(
      database,
      rows.map((row) => Number(row.userId)).filter((id) => Number.isInteger(id))
    )
  );
  for (const row of rows) {
    if (!eligibleIdSet.has(Number(row.userId))) {
      continue;
    }
    if (!map.has(row.eventId)) {
      map.set(row.eventId, []);
    }
    map.get(row.eventId).push({
      userId: Number(row.userId),
      username: row.username || "",
      email: row.email || "",
      fullName: row.fullName || "",
      organisation: row.organisation || ""
    });
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
  const inviteeMap = loadEventInviteeMap(database, eventIds);
  const nowMs = Date.now();
  const viewerIsAdmin = isAdminRole(user?.role || "");

  return items.map((item) => {
    const summary = getEventSignupSummary(database, item.id, summaryCache);
    const signup = signupMap.get(item.id) || null;
    const overrideClosesAt = overrideMap.get(item.id) || null;
    const audienceMeta = audienceGroupMap.get(item.id) || { groupIds: [], groupNames: [] };
    const audienceInvitees = inviteeMap.get(item.id) || [];
    const audiencePresentation = deriveAudiencePresentation(item.audienceType, audienceMeta.groupNames, audienceInvitees);
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
      audienceInviteeIds: audienceInvitees.map((invitee) => invitee.userId),
      audienceInvitees,
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
        users.account_status AS accountStatus,
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

  const accountStatus = normalizeAccountStatusValue(session.accountStatus, session.status);
  if (accountStatus !== "active") {
    return null;
  }

  const membership = resolveMembershipEligibility(database, {
    userId: session.userId,
    role: session.role,
    accountStatus,
    legacyStatus: session.status
  });

  session.accountStatus = accountStatus;
  session.membershipEligible = membership.eligible;
  session.membershipStanding = membership.standingStatus;
  session.membershipAccessStatus = membership.accessStatus;
  session.membershipPaymentStatus = membership.paymentStatus;
  session.membershipCycleId = membership.membershipCycleId;
  session.membershipYear = membership.membershipYear;
  session.membershipCycleStatus = membership.membershipCycleStatus;

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
      accountStatus: session.accountStatus,
      membershipEligible: session.membershipEligible !== false,
      membershipStanding: session.membershipStanding || null,
      membershipAccessStatus: session.membershipAccessStatus || null,
      membershipPaymentStatus: session.membershipPaymentStatus || null,
      membershipCycleId: session.membershipCycleId || null,
      membershipYear: session.membershipYear || null,
      membershipCycleStatus: session.membershipCycleStatus || null,
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
        account_status AS accountStatus,
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

function toAuthUserPayload(user, membership = null) {
  const accountStatus = normalizeAccountStatusValue(user?.accountStatus, user?.status);
  const membershipState =
    membership ||
    {
      eligible: true,
      standingStatus: null,
      accessStatus: null,
      paymentStatus: null,
      membershipCycleId: null,
      membershipYear: null,
      membershipCycleStatus: null
    };
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    accountStatus,
    membershipEligible: membershipState.eligible !== false,
    membershipStanding: membershipState.standingStatus || null,
    membershipAccessStatus: membershipState.accessStatus || null,
    membershipPaymentStatus: membershipState.paymentStatus || null,
    membershipCycleId: membershipState.membershipCycleId || null,
    membershipYear: membershipState.membershipYear || null,
    membershipCycleStatus: membershipState.membershipCycleStatus || null,
    mustChangePassword: Boolean(user.must_change_password),
    mustChangeUsername: Boolean(user.must_change_username)
  };
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
        users.account_status AS accountStatus,
        users.created_at AS createdAt,
        users.updated_at AS updatedAt,
        member_profiles.full_name AS fullName,
        member_profiles.company AS company,
        member_profiles.phone AS phone,
        member_profiles.photo_url AS photoUrl,
        member_profiles.birthday_month AS birthdayMonth,
        member_profiles.birthday_day AS birthdayDay,
        member_profiles.birthday_visibility AS birthdayVisibility,
        member_profiles.profile_confirmed_at AS profileConfirmedAt
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

  const roleRows = database
    .prepare(
      `
      SELECT
        member_role_assignments.user_id AS userId,
        member_roles.name AS name
      FROM member_role_assignments
      JOIN member_roles ON member_roles.id = member_role_assignments.role_id
      WHERE member_role_assignments.user_id IN (${placeholders})
      ORDER BY member_roles.name
    `
    )
    .all(...ids);

  const rolesByUser = new Map();
  for (const row of roleRows) {
    if (!rolesByUser.has(row.userId)) {
      rolesByUser.set(row.userId, []);
    }
    rolesByUser.get(row.userId).push(row.name);
  }

  return members.map((member) => {
    const membership = resolveMembershipEligibility(database, {
      userId: member.id,
      role: member.role,
      accountStatus: member.accountStatus,
      legacyStatus: member.status
    });
    return {
      ...member,
      accountStatus: normalizeAccountStatusValue(member.accountStatus, member.status),
      membershipEligible: membership.eligible,
      membershipStanding: membership.standingStatus || null,
      membershipAccessStatus: membership.accessStatus || null,
      membershipPaymentStatus: membership.paymentStatus || null,
      membershipCycleId: membership.membershipCycleId || null,
      membershipYear: membership.membershipYear || null,
      membershipCycleStatus: membership.membershipCycleStatus || null,
      organisation: member.company || "",
      groups: groupsByUser.get(member.id) || [],
      roles: rolesByUser.get(member.id) || []
    };
  });
}

function listActiveMemberDirectory(database, { search = "", limit = 80 } = {}) {
  const term = String(search || "").trim().toLowerCase();
  const maxLimit = Math.max(1, Math.min(Number(limit || 80), 150));
  return listMembers(database)
    .filter((member) => {
      if (member.accountStatus !== "active") {
        return false;
      }
      if (!member.membershipEligible) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        member.fullName,
        member.username,
        member.email,
        member.organisation,
        ...(Array.isArray(member.groups) ? member.groups : [])
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(term);
    })
    .slice(0, maxLimit)
    .map((member) => ({
      id: Number(member.id),
      userId: Number(member.id),
      username: member.username || "",
      email: member.email || "",
      fullName: member.fullName || "",
      organisation: member.organisation || "",
      groups: Array.isArray(member.groups) ? member.groups : [],
      membershipStanding: member.membershipStanding || null,
      membershipCycleYear: Number(member.membershipYear || 0) || null
    }));
}

function normalizeMembershipCycleStatus(value, fallback = "draft") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (!MEMBERSHIP_CYCLE_STATUSES.has(normalized)) {
    const error = new Error("membership cycle status must be draft, open, closed, or archived.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return normalized;
}

function normalizeMemberFeePaymentStatus(value, fallback = "pending_review") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (!MEMBER_FEE_PAYMENT_STATUSES.has(normalized)) {
    const error = new Error("payment status is invalid.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return normalized;
}

function normalizeMemberFeeStandingStatus(value, fallback = "pending_review") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (!MEMBER_FEE_STANDING_STATUSES.has(normalized)) {
    const error = new Error("standing status is invalid.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return normalized;
}

function normalizeMemberFeeAccessStatus(value, fallback = "enabled") {
  const normalized = String(value || fallback)
    .trim()
    .toLowerCase();
  if (!MEMBER_FEE_ACCESS_STATUSES.has(normalized)) {
    const error = new Error("access status is invalid.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return normalized;
}

function parseMembershipYear(value, fallback = new Date().getUTCFullYear()) {
  if (value === undefined || value === null || value === "") {
    return Number(fallback);
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 2000 || parsed > 2100) {
    const error = new Error("membershipYear must be between 2000 and 2100.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return parsed;
}

function defaultDueDateForMembershipYear(membershipYear) {
  return `${String(membershipYear)}-03-31`;
}

function normalizeMembershipDueDate(value, membershipYear) {
  const raw = String(value || "").trim();
  if (!raw) {
    return defaultDueDateForMembershipYear(membershipYear);
  }
  const parsed = Date.parse(raw);
  if (!Number.isFinite(parsed)) {
    const error = new Error("dueDate must be a valid date.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return new Date(parsed).toISOString().slice(0, 10);
}

function toMembershipCycleResponseItem(row) {
  if (!row) {
    return null;
  }
  return {
    id: Number(row.id),
    membershipYear: Number(row.membershipYear || row.membership_year || 0) || null,
    dueDate: String(row.dueDate || row.due_date || ""),
    status: String(row.status || "draft"),
    createdAt: row.createdAt || row.created_at || null,
    updatedAt: row.updatedAt || row.updated_at || null
  };
}

function loadMembershipCycleByYear(database, membershipYear) {
  return database
    .prepare(
      `
      SELECT
        id,
        membership_year AS membershipYear,
        due_date AS dueDate,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM membership_cycles
      WHERE membership_year = ?
      LIMIT 1
    `
    )
    .get(membershipYear);
}

function loadOpenMembershipCycle(database) {
  return database
    .prepare(
      `
      SELECT
        id,
        membership_year AS membershipYear,
        due_date AS dueDate,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM membership_cycles
      WHERE status = 'open'
      ORDER BY membership_year DESC, id DESC
      LIMIT 1
    `
    )
    .get();
}

function loadLatestMembershipCycle(database) {
  return database
    .prepare(
      `
      SELECT
        id,
        membership_year AS membershipYear,
        due_date AS dueDate,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM membership_cycles
      ORDER BY membership_year DESC, id DESC
      LIMIT 1
    `
    )
    .get();
}

function loadPreferredMembershipCycle(database, requestedMembershipYear = null) {
  if (requestedMembershipYear !== null && requestedMembershipYear !== undefined && requestedMembershipYear !== "") {
    return loadMembershipCycleByYear(database, parseMembershipYear(requestedMembershipYear, requestedMembershipYear));
  }
  return loadOpenMembershipCycle(database) || loadLatestMembershipCycle(database) || null;
}

function ensureMembershipCycleForImport(database, { membershipYear, actorUserId }) {
  if (!membershipYear) {
    return null;
  }
  const parsedYear = parseMembershipYear(membershipYear);
  const existing = loadMembershipCycleByYear(database, parsedYear);
  if (existing) {
    return existing;
  }
  const dueDate = defaultDueDateForMembershipYear(parsedYear);
  runTransaction(database, () => {
    database
      .prepare(
        `
        UPDATE membership_cycles
        SET status = 'closed', updated_at = CURRENT_TIMESTAMP
        WHERE status = 'open' AND membership_year != ?
      `
      )
      .run(parsedYear);
    database
      .prepare(
        `
        INSERT INTO membership_cycles (membership_year, due_date, status, created_at, updated_at)
        VALUES (?, ?, 'open', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(parsedYear, dueDate);
    database
      .prepare(
        `
        INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
        VALUES (?, 'membership_cycle_created_from_import', 'membership_cycle', ?, ?)
      `
      )
      .run(
        actorUserId,
        String(parsedYear),
        JSON.stringify({
          membershipYear: parsedYear,
          dueDate,
          status: "open"
        })
      );
  });
  return loadMembershipCycleByYear(database, parsedYear);
}

function listMembershipCycles(database, { limit = 30 } = {}) {
  const maxLimit = Math.max(1, Math.min(Number(limit || 30), 200));
  return database
    .prepare(
      `
      SELECT
        id,
        membership_year AS membershipYear,
        due_date AS dueDate,
        status,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM membership_cycles
      ORDER BY membership_year DESC, id DESC
      LIMIT ?
    `
    )
    .all(maxLimit)
    .map((row) => toMembershipCycleResponseItem(row));
}

function loadMemberFeeAccountForCycle(database, { userId, membershipCycleId }) {
  return database
    .prepare(
      `
      SELECT
        id,
        user_id AS userId,
        membership_cycle_id AS membershipCycleId,
        amount_due AS amountDue,
        amount_paid AS amountPaid,
        balance,
        payment_status AS paymentStatus,
        standing_status AS standingStatus,
        access_status AS accessStatus,
        last_payment_at AS lastPaymentAt,
        reviewed_by_user_id AS reviewedByUserId,
        reviewed_at AS reviewedAt,
        admin_note AS adminNote,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM member_fee_accounts
      WHERE user_id = ? AND membership_cycle_id = ?
      LIMIT 1
    `
    )
    .get(userId, membershipCycleId);
}

function loadMembershipCategoryAssignments(database, userIds) {
  const ids = Array.isArray(userIds)
    ? [...new Set(userIds.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0))]
    : [];
  if (ids.length === 0) {
    return new Map();
  }
  const placeholders = ids.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT
        member_category_assignments.user_id AS userId,
        membership_categories.id AS categoryId,
        membership_categories.name AS categoryName
      FROM member_category_assignments
      JOIN membership_categories ON membership_categories.id = member_category_assignments.membership_category_id
      WHERE member_category_assignments.user_id IN (${placeholders})
        AND member_category_assignments.ends_at IS NULL
      ORDER BY member_category_assignments.updated_at DESC, member_category_assignments.id DESC
    `
    )
    .all(...ids);
  const map = new Map();
  for (const row of rows) {
    if (map.has(Number(row.userId))) {
      continue;
    }
    map.set(Number(row.userId), {
      categoryId: Number(row.categoryId || 0) || null,
      categoryName: String(row.categoryName || "Active Member")
    });
  }
  return map;
}

function normalizeMembershipCategoryName(value) {
  return toNullableTrimmedString(value, { maxLength: 160 }) || "Active Member";
}

function ensureMembershipCategory(database, name) {
  const categoryName = normalizeMembershipCategoryName(name);
  const existing = database
    .prepare("SELECT id, name FROM membership_categories WHERE LOWER(name) = LOWER(?) LIMIT 1")
    .get(categoryName);
  if (existing) {
    return { id: Number(existing.id), name: existing.name || categoryName };
  }
  const result = database
    .prepare(
      `
      INSERT INTO membership_categories (name, is_default, is_active, created_at, updated_at)
      VALUES (?, 0, 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    )
    .run(categoryName);
  return { id: Number(result.lastInsertRowid), name: categoryName };
}

function assignMembershipCategory(database, { userId, categoryName }) {
  const parsedUserId = Number(userId);
  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return null;
  }
  const category = ensureMembershipCategory(database, categoryName);
  database
    .prepare(
      `
      UPDATE member_category_assignments
      SET ends_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
        AND ends_at IS NULL
        AND membership_category_id != ?
    `
    )
    .run(parsedUserId, category.id);
  database
    .prepare(
      `
      INSERT INTO member_category_assignments (
        user_id,
        membership_category_id,
        starts_at,
        created_at,
        updated_at
      )
      SELECT ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      WHERE NOT EXISTS (
        SELECT 1
        FROM member_category_assignments
        WHERE user_id = ?
          AND membership_category_id = ?
          AND ends_at IS NULL
      )
    `
    )
    .run(parsedUserId, category.id, parsedUserId, category.id);
  return category;
}

function loadMembershipDuesReminderMap(database, userIds) {
  const ids = normalizeMembershipFeeUserIds(userIds);
  if (ids.length === 0) {
    return new Map();
  }
  const placeholders = ids.map(() => "?").join(",");
  const rows = database
    .prepare(
      `
      SELECT
        user_id AS userId,
        status,
        channel,
        created_at AS createdAt
      FROM notification_deliveries
      WHERE event_type = 'membership_dues_reminder'
        AND user_id IN (${placeholders})
      ORDER BY datetime(created_at) DESC, id DESC
    `
    )
    .all(...ids);
  const map = new Map();
  for (const row of rows) {
    const userId = Number(row.userId);
    if (!map.has(userId)) {
      map.set(userId, {
        status: row.status || "",
        channel: row.channel || "",
        sentAt: row.createdAt || null
      });
    }
  }
  return map;
}

function listMemberStandingAudit(database, { userId, membershipCycleId = null, limit = 20 } = {}) {
  const parsedUserId = Number(userId);
  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0) {
    return [];
  }
  const maxLimit = Math.max(1, Math.min(Number(limit || 20), 100));
  const params = [parsedUserId];
  let cycleClause = "";
  if (membershipCycleId) {
    cycleClause = "AND member_standing_audit.membership_cycle_id = ?";
    params.push(Number(membershipCycleId));
  }
  params.push(maxLimit);
  return database
    .prepare(
      `
      SELECT
        member_standing_audit.id,
        member_standing_audit.user_id AS userId,
        member_standing_audit.membership_cycle_id AS membershipCycleId,
        membership_cycles.membership_year AS membershipYear,
        member_standing_audit.previous_payment_status AS previousPaymentStatus,
        member_standing_audit.next_payment_status AS nextPaymentStatus,
        member_standing_audit.previous_standing_status AS previousStandingStatus,
        member_standing_audit.next_standing_status AS nextStandingStatus,
        member_standing_audit.previous_access_status AS previousAccessStatus,
        member_standing_audit.next_access_status AS nextAccessStatus,
        member_standing_audit.reason,
        member_standing_audit.actor_user_id AS actorUserId,
        users.username AS actorUsername,
        member_standing_audit.created_at AS createdAt
      FROM member_standing_audit
      LEFT JOIN users ON users.id = member_standing_audit.actor_user_id
      LEFT JOIN membership_cycles ON membership_cycles.id = member_standing_audit.membership_cycle_id
      WHERE member_standing_audit.user_id = ?
        ${cycleClause}
      ORDER BY datetime(member_standing_audit.created_at) DESC, member_standing_audit.id DESC
      LIMIT ?
    `
    )
    .all(...params)
    .map((row) => ({
      id: Number(row.id),
      userId: Number(row.userId),
      membershipCycleId: Number(row.membershipCycleId),
      membershipYear: Number(row.membershipYear || 0) || null,
      previousPaymentStatus: row.previousPaymentStatus || null,
      nextPaymentStatus: row.nextPaymentStatus || null,
      previousStandingStatus: row.previousStandingStatus || null,
      nextStandingStatus: row.nextStandingStatus || null,
      previousAccessStatus: row.previousAccessStatus || null,
      nextAccessStatus: row.nextAccessStatus || null,
      reason: row.reason || null,
      actorUserId: Number(row.actorUserId || 0) || null,
      actorUsername: row.actorUsername || "",
      createdAt: row.createdAt || null
    }));
}

function listMembershipFeeAccountsByCycle(database, membershipCycleId) {
  if (!Number.isInteger(Number(membershipCycleId)) || Number(membershipCycleId) <= 0) {
    return [];
  }
  return database
    .prepare(
      `
      SELECT
        id,
        user_id AS userId,
        membership_cycle_id AS membershipCycleId,
        amount_due AS amountDue,
        amount_paid AS amountPaid,
        balance,
        payment_status AS paymentStatus,
        standing_status AS standingStatus,
        access_status AS accessStatus,
        last_payment_at AS lastPaymentAt,
        reviewed_by_user_id AS reviewedByUserId,
        reviewed_at AS reviewedAt,
        admin_note AS adminNote,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM member_fee_accounts
      WHERE membership_cycle_id = ?
      ORDER BY user_id ASC
    `
    )
    .all(Number(membershipCycleId));
}

function toMembershipFeesMemberItem(member, { cycle, accountByUserId, categoryByUserId, reminderByUserId = new Map() }) {
  const userId = Number(member.id);
  const account = accountByUserId.get(userId) || null;
  const category = categoryByUserId.get(userId) || { categoryId: null, categoryName: "Active Member" };
  const reminder = reminderByUserId.get(userId) || null;
  const accountStatus = normalizeAccountStatusValue(member.accountStatus, member.status);
  const paymentStatus = String(account?.paymentStatus || member.membershipPaymentStatus || "pending_review");
  const standingStatus = String(account?.standingStatus || member.membershipStanding || "pending_review");
  const accessStatus = String(account?.accessStatus || member.membershipAccessStatus || "enabled");
  const amountDue = Number(account?.amountDue || 0);
  const amountPaid = Number(account?.amountPaid || 0);
  const balance = Number(account?.balance ?? amountDue - amountPaid);
  const profileComplete =
    Boolean(member.profileConfirmedAt) ||
    (Boolean(String(member.fullName || "").trim()) &&
      Boolean(String(member.organisation || "").trim()) &&
      Boolean(String(member.phone || "").trim()));
  const committeeLabels = [...new Set([...(member.groups || []), ...(member.roles || [])].filter(Boolean))];
  return {
    userId,
    username: member.username || "",
    fullName: member.fullName || "",
    email: member.email || "",
    phone: member.phone || "",
    company: member.organisation || "",
    membershipYear: cycle?.membershipYear || member.membershipYear || null,
    membershipCategoryId: category.categoryId,
    membershipCategory: category.categoryName || "Active Member",
    committeeLabels,
    accountStatus,
    paymentStatus,
    standingStatus,
    accessStatus,
    amountDue,
    amountPaid,
    balance,
    lastPaymentAt: account?.lastPaymentAt || null,
    reviewedAt: account?.reviewedAt || null,
    reviewedByUserId: Number(account?.reviewedByUserId || 0) || null,
    adminNote: account?.adminNote || null,
    lastDuesReminderAt: reminder?.sentAt || null,
    lastDuesReminderStatus: reminder?.status || null,
    lastDuesReminderChannel: reminder?.channel || null,
    profileComplete,
    profileConfirmedAt: member.profileConfirmedAt || null,
    membershipEligible: accountStatus === "active" && standingStatus === "good_standing" && accessStatus === "enabled"
  };
}

function listMembershipFeeMembers(database, { cycle = null, filters = {} } = {}) {
  const members = listMembers(database);
  const memberIds = members.map((member) => Number(member.id)).filter((id) => Number.isInteger(id));
  const accountByUserId = new Map(
    listMembershipFeeAccountsByCycle(database, cycle?.id || 0).map((row) => [Number(row.userId), row])
  );
  const categoryByUserId = loadMembershipCategoryAssignments(database, memberIds);
  const reminderByUserId = loadMembershipDuesReminderMap(database, memberIds);
  const term = String(filters.search || "")
    .trim()
    .toLowerCase();
  const standingFilter = String(filters.standingStatus || "all")
    .trim()
    .toLowerCase();
  const accountStatusFilter = String(filters.accountStatus || "all")
    .trim()
    .toLowerCase();
  const categoryFilter = String(filters.category || "")
    .trim()
    .toLowerCase();
  const profileFilter = String(filters.profileCompletion || "all")
    .trim()
    .toLowerCase();
  const maxLimit = Math.max(1, Math.min(Number(filters.limit || 300), 1000));
  return members
    .map((member) => toMembershipFeesMemberItem(member, { cycle, accountByUserId, categoryByUserId, reminderByUserId }))
    .filter((item) => {
      if (standingFilter !== "all" && standingFilter && item.standingStatus !== standingFilter) {
        return false;
      }
      if (accountStatusFilter !== "all" && accountStatusFilter && item.accountStatus !== accountStatusFilter) {
        return false;
      }
      if (categoryFilter && String(item.membershipCategory || "").toLowerCase() !== categoryFilter) {
        return false;
      }
      if (profileFilter === "complete" && !item.profileComplete) {
        return false;
      }
      if (profileFilter === "incomplete" && item.profileComplete) {
        return false;
      }
      if (!term) {
        return true;
      }
      const haystack = [
        item.fullName,
        item.username,
        item.email,
        item.company,
        item.membershipCategory,
        ...(Array.isArray(item.committeeLabels) ? item.committeeLabels : [])
      ]
        .map((value) => String(value || "").toLowerCase())
        .join(" ");
      return haystack.includes(term);
    })
    .slice(0, maxLimit);
}

function buildMembershipFeesOverview(database, cycle) {
  const items = listMembershipFeeMembers(database, { cycle, filters: { limit: 5000 } });
  const summary = {
    totalMembers: items.length,
    activeMembers: items.filter((item) => item.accountStatus === "active").length,
    goodStandingMembers: items.filter((item) => item.accountStatus === "active" && item.standingStatus === "good_standing")
      .length,
    outstandingMembers: items.filter((item) =>
      ["outstanding", "partial", "pending_review"].includes(String(item.standingStatus || ""))
    ).length,
    blockedMembers: items.filter((item) => item.accountStatus === "blocked" || item.accessStatus === "blocked").length,
    deactivatedMembers: items.filter((item) => item.accountStatus === "deactivated" || item.accessStatus === "deactivated")
      .length,
    onboardingMembers: items.filter((item) => item.accountStatus === "invited" || item.accountStatus === "not_invited")
      .length,
    feesCollected: items.reduce((sum, item) => sum + Number(item.amountPaid || 0), 0),
    outstandingBalance: items.reduce((sum, item) => sum + Math.max(0, Number(item.balance || 0)), 0)
  };
  return {
    cycle: toMembershipCycleResponseItem(cycle),
    summary
  };
}

function parseMemberFeeMoney(value, fallback = 0) {
  if (value === undefined || value === null || value === "") {
    return Number(fallback || 0);
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) {
    const error = new Error("Amounts must be numbers greater than or equal to 0.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return Number(parsed);
}

function normalizeMembershipFeeUserIds(value) {
  if (!Array.isArray(value)) {
    return [];
  }
  return [
    ...new Set(
      value
        .map((item) => Number(item))
        .filter((item) => Number.isInteger(item) && item > 0)
    )
  ];
}

function applyMemberFeeAccountUpdate(database, { actorUserId, userId, cycle, payload }) {
  const parsedUserId = Number(userId);
  const userRow = database
    .prepare(
      `
      SELECT id, username, email, role, status, account_status AS accountStatus
      FROM users
      WHERE id = ?
      LIMIT 1
    `
    )
    .get(parsedUserId);
  if (!userRow || userRow.role !== "member") {
    const error = new Error("Member not found.");
    error.httpStatus = 404;
    error.code = "not_found";
    throw error;
  }

  const previous = loadMemberFeeAccountForCycle(database, { userId: parsedUserId, membershipCycleId: cycle.id });
  const amountDue = parseMemberFeeMoney(payload.amountDue, previous?.amountDue || 0);
  const amountPaid = parseMemberFeeMoney(payload.amountPaid, previous?.amountPaid || 0);
  const balance =
    payload.balance !== undefined && payload.balance !== null && payload.balance !== ""
      ? Number(payload.balance)
      : Number(amountDue - amountPaid);
  if (!Number.isFinite(balance)) {
    const error = new Error("balance must be numeric.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }

  const paymentStatus = normalizeMemberFeePaymentStatus(payload.paymentStatus, previous?.paymentStatus || "pending_review");
  const standingStatus = normalizeMemberFeeStandingStatus(payload.standingStatus, previous?.standingStatus || "pending_review");
  const accessStatus = normalizeMemberFeeAccessStatus(payload.accessStatus, previous?.accessStatus || "enabled");
  const adminNote =
    payload.adminNote !== undefined ? toNullableTrimmedString(payload.adminNote, { maxLength: 2000 }) : previous?.adminNote || null;
  const reason = toNullableTrimmedString(payload.reason, { maxLength: 500 }) || "admin_update";
  const lastPaymentAtRaw =
    payload.lastPaymentAt !== undefined ? String(payload.lastPaymentAt || "").trim() : String(previous?.lastPaymentAt || "").trim();
  const lastPaymentAt = lastPaymentAtRaw ? new Date(lastPaymentAtRaw).toISOString() : null;
  const standingChanged =
    String(previous?.standingStatus || "pending_review") !== standingStatus ||
    String(previous?.accessStatus || "enabled") !== accessStatus ||
    String(previous?.paymentStatus || "pending_review") !== paymentStatus;

  const nextAccountStatus = accessStatus === "enabled" ? "active" : accessStatus === "blocked" ? "blocked" : "deactivated";
  const nextLegacyStatus = nextAccountStatus === "active" ? "active" : "suspended";
  const reviewedAt = new Date().toISOString();

  runTransaction(database, () => {
    database
      .prepare(
        `
        INSERT INTO member_fee_accounts (
          user_id,
          membership_cycle_id,
          amount_due,
          amount_paid,
          balance,
          payment_status,
          standing_status,
          access_status,
          last_payment_at,
          reviewed_by_user_id,
          reviewed_at,
          admin_note,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id, membership_cycle_id) DO UPDATE SET
          amount_due = excluded.amount_due,
          amount_paid = excluded.amount_paid,
          balance = excluded.balance,
          payment_status = excluded.payment_status,
          standing_status = excluded.standing_status,
          access_status = excluded.access_status,
          last_payment_at = excluded.last_payment_at,
          reviewed_by_user_id = excluded.reviewed_by_user_id,
          reviewed_at = excluded.reviewed_at,
          admin_note = excluded.admin_note,
          updated_at = CURRENT_TIMESTAMP
      `
      )
      .run(
        parsedUserId,
        cycle.id,
        amountDue,
        amountPaid,
        balance,
        paymentStatus,
        standingStatus,
        accessStatus,
        lastPaymentAt,
        actorUserId,
        reviewedAt,
        adminNote
      );

    database
      .prepare(
        `
        UPDATE users
        SET account_status = ?,
            status = ?,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `
      )
      .run(nextAccountStatus, nextLegacyStatus, parsedUserId);

    if (standingChanged) {
      database
        .prepare(
          `
          INSERT INTO member_standing_audit (
            user_id,
            membership_cycle_id,
            previous_payment_status,
            next_payment_status,
            previous_standing_status,
            next_standing_status,
            previous_access_status,
            next_access_status,
            reason,
            actor_user_id,
            created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `
        )
        .run(
          parsedUserId,
          cycle.id,
          previous?.paymentStatus || null,
          paymentStatus,
          previous?.standingStatus || null,
          standingStatus,
          previous?.accessStatus || null,
          accessStatus,
          reason,
          actorUserId
        );
    }

    const transaction = payload.transaction;
    if (transaction && typeof transaction === "object") {
      const transactionType = String(transaction.transactionType || "").trim().toLowerCase();
      const allowedTransactionTypes = new Set(["payment", "waiver", "credit", "adjustment", "reversal"]);
      if (!allowedTransactionTypes.has(transactionType)) {
        const error = new Error("transaction.transactionType is invalid.");
        error.httpStatus = 400;
        error.code = "validation_error";
        throw error;
      }
      const transactionAmount = Number(transaction.amount);
      if (!Number.isFinite(transactionAmount) || transactionAmount === 0) {
        const error = new Error("transaction.amount must be a non-zero number.");
        error.httpStatus = 400;
        error.code = "validation_error";
        throw error;
      }
      const refreshedAccount = loadMemberFeeAccountForCycle(database, { userId: parsedUserId, membershipCycleId: cycle.id });
      database
        .prepare(
          `
          INSERT INTO member_fee_transactions (
            member_fee_account_id,
            transaction_type,
            amount,
            reference_text,
            notes,
            recorded_by_user_id,
            recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
        `
        )
        .run(
          refreshedAccount.id,
          transactionType,
          transactionAmount,
          toNullableTrimmedString(transaction.referenceText, { maxLength: 160 }),
          toNullableTrimmedString(transaction.notes, { maxLength: 1000 }),
          actorUserId
        );
    }

    database
      .prepare(
        `
        INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
        VALUES (?, 'membership_fee_account_updated', 'user', ?, ?)
      `
      )
      .run(
        actorUserId,
        String(parsedUserId),
        JSON.stringify({
          membershipCycleId: cycle.id,
          membershipYear: cycle.membershipYear,
          previous: previous
            ? {
                paymentStatus: previous.paymentStatus,
                standingStatus: previous.standingStatus,
                accessStatus: previous.accessStatus,
                amountDue: Number(previous.amountDue || 0),
                amountPaid: Number(previous.amountPaid || 0),
                balance: Number(previous.balance || 0)
              }
            : null,
          next: {
            paymentStatus,
            standingStatus,
            accessStatus,
            amountDue,
            amountPaid,
            balance,
            accountStatus: nextAccountStatus
          },
          reason
        })
      );
  });

  const refreshedAccount = loadMemberFeeAccountForCycle(database, { userId: parsedUserId, membershipCycleId: cycle.id });
  if (standingChanged) {
    createAdminActivityNotifications(database, {
      eventType: "membership_standing_changed",
      title: "Membership standing changed",
      body: `${userRow.username || userRow.email || "Member"} is now ${standingStatus} with ${accessStatus} access.`,
      metadata: {
        userId: parsedUserId,
        membershipCycleId: cycle.id,
        membershipYear: cycle.membershipYear,
        paymentStatus,
        standingStatus,
        accessStatus,
        reason
      },
      idempotencyKey: `membership_standing_changed:${cycle.id}:${parsedUserId}:${reviewedAt}`
    });
  }
  return {
    userId: parsedUserId,
    username: userRow.username,
    email: userRow.email,
    accountStatus: nextAccountStatus,
    paymentStatus: refreshedAccount.paymentStatus,
    standingStatus: refreshedAccount.standingStatus,
    accessStatus: refreshedAccount.accessStatus,
    amountDue: Number(refreshedAccount.amountDue || 0),
    amountPaid: Number(refreshedAccount.amountPaid || 0),
    balance: Number(refreshedAccount.balance || 0),
    lastPaymentAt: refreshedAccount.lastPaymentAt || null,
    reviewedAt: refreshedAccount.reviewedAt || null,
    reviewedByUserId: Number(refreshedAccount.reviewedByUserId || 0) || null,
    adminNote: refreshedAccount.adminNote || null
  };
}

function formatMembershipMoney(value) {
  return `R ${Number(value || 0).toFixed(2)}`;
}

function loadActiveAdminUserIds(database) {
  return database
    .prepare(
      `
      SELECT id
      FROM users
      WHERE role IN ('admin', 'chief_admin')
        AND account_status = 'active'
      ORDER BY id ASC
    `
    )
    .all()
    .map((row) => Number(row.id))
    .filter((id) => Number.isInteger(id) && id > 0);
}

function createAdminActivityNotifications(database, { eventType, title, body, metadata = {}, idempotencyKey }) {
  const adminIds = loadActiveAdminUserIds(database);
  for (const adminId of adminIds) {
    createInAppNotification(database, {
      userId: adminId,
      eventType,
      title,
      body,
      metadata,
      idempotencyKey: `${idempotencyKey}:${adminId}`
    });
  }
  return adminIds.length;
}

function enqueueMembershipDuesReminders(database, { cycle, userIds, actorUserId, reason }) {
  const ids = normalizeMembershipFeeUserIds(userIds);
  if (ids.length === 0) {
    return { requested: 0, queued: 0, skipped: 0 };
  }
  const placeholders = ids.map(() => "?").join(",");
  const memberRows = database
    .prepare(
      `
      SELECT id
      FROM users
      WHERE role = 'member'
        AND id IN (${placeholders})
    `
    )
    .all(...ids);
  const memberIds = memberRows.map((row) => Number(row.id)).filter((id) => Number.isInteger(id));
  const queuedAt = new Date().toISOString();
  let queued = 0;

  for (const userId of memberIds) {
    const account = loadMemberFeeAccountForCycle(database, { userId, membershipCycleId: cycle.id });
    const dispatchId = randomBytes(8).toString("hex");
    const inserted = enqueueNotification(database, {
      idempotencyKey: `membership_dues_reminder:${cycle.id}:${userId}:${dispatchId}`,
      eventType: "membership_dues_reminder",
      payload: {
        dispatchId,
        userId,
        membershipCycleId: cycle.id,
        membershipYear: cycle.membershipYear,
        dueDate: cycle.dueDate,
        amountDue: Number(account?.amountDue || 0),
        amountPaid: Number(account?.amountPaid || 0),
        balance: Number(account?.balance || 0),
        paymentStatus: account?.paymentStatus || "pending_review",
        standingStatus: account?.standingStatus || "pending_review",
        reason: reason || "dues_reminder",
        queuedAt
      }
    });
    if (inserted) {
      queued += 1;
    }
  }

  database
    .prepare(
      `
      INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
      VALUES (?, 'membership_dues_reminders_queued', 'membership_cycle', ?, ?)
    `
    )
    .run(
      actorUserId,
      String(cycle.id),
      JSON.stringify({
        membershipCycleId: cycle.id,
        membershipYear: cycle.membershipYear,
        requested: ids.length,
        queued,
        skipped: Math.max(0, ids.length - queued),
        userIds: memberIds,
        reason: reason || "dues_reminder"
      })
    );

  if (queued > 0) {
    createAdminActivityNotifications(database, {
      eventType: "membership_dues_reminders_queued",
      title: "Membership dues reminders queued",
      body: `${queued} dues reminder(s) queued for ${cycle.membershipYear}.`,
      metadata: {
        membershipCycleId: cycle.id,
        membershipYear: cycle.membershipYear,
        requested: ids.length,
        queued,
        skipped: Math.max(0, ids.length - queued),
        userIds: memberIds,
        reason: reason || "dues_reminder"
      },
      idempotencyKey: `membership_dues_reminders_queued:${cycle.id}:${Date.now()}`
    });
  }

  return { requested: ids.length, queued, skipped: Math.max(0, ids.length - queued) };
}

function upsertImportedMemberFeeAccount(database, { userId, cycle, standingStatus, actorUserId, reason }) {
  const parsedUserId = Number(userId);
  if (!Number.isInteger(parsedUserId) || parsedUserId <= 0 || !cycle) {
    return false;
  }
  const normalizedStanding = normalizeMemberFeeStandingStatus(standingStatus, "pending_review");
  const paymentStatus =
    normalizedStanding === "good_standing"
      ? "paid"
      : normalizedStanding === "waived"
        ? "waived"
        : normalizedStanding === "partial"
          ? "partial"
          : normalizedStanding === "outstanding" || normalizedStanding === "blocked" || normalizedStanding === "deactivated"
            ? "outstanding"
            : "pending_review";
  const accessStatus =
    normalizedStanding === "blocked" ? "blocked" : normalizedStanding === "deactivated" ? "deactivated" : "enabled";
  const reviewedAt = new Date().toISOString();
  database
    .prepare(
      `
      INSERT INTO member_fee_accounts (
        user_id,
        membership_cycle_id,
        payment_status,
        standing_status,
        access_status,
        reviewed_by_user_id,
        reviewed_at,
        admin_note,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, membership_cycle_id) DO UPDATE SET
        payment_status = excluded.payment_status,
        standing_status = excluded.standing_status,
        access_status = excluded.access_status,
        reviewed_by_user_id = excluded.reviewed_by_user_id,
        reviewed_at = excluded.reviewed_at,
        admin_note = excluded.admin_note,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .run(
      parsedUserId,
      cycle.id,
      paymentStatus,
      normalizedStanding,
      accessStatus,
      actorUserId,
      reviewedAt,
      reason || "created_from_member_import"
    );
  return true;
}

function toNullableTrimmedString(value, { maxLength = 160 } = {}) {
  if (value === undefined || value === null) {
    return null;
  }
  const trimmed = String(value).trim();
  if (!trimmed) {
    return null;
  }
  return trimmed.slice(0, Math.max(1, maxLength));
}

function toOptionalInteger(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) {
    return null;
  }
  return parsed;
}

function isValidBirthdayMonthDay(month, day) {
  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }
  if (!Number.isInteger(day) || day < 1 || day > 31) {
    return false;
  }
  const probe = new Date(Date.UTC(2000, month - 1, day));
  return probe.getUTCMonth() === month - 1 && probe.getUTCDate() === day;
}

function normalizeBirthdayVisibility(value, fallback = "hidden") {
  const visibility = String(value || "").trim().toLowerCase();
  if (!visibility) {
    return fallback;
  }
  if (!BIRTHDAY_VISIBILITY_VALUES.has(visibility)) {
    const error = new Error("birthdayVisibility must be hidden, members_only, or members_and_social.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return visibility;
}

function mapInvitationStatus(signupStatus) {
  if (signupStatus === "confirmed") {
    return "confirmed";
  }
  if (signupStatus === "waitlisted") {
    return "waitlisted";
  }
  if (signupStatus === "cancelled") {
    return "declined";
  }
  return "awaiting_response";
}

function loadMemberProfile(database, userId) {
  return database
    .prepare(
      `
      SELECT
        users.id AS userId,
        users.username,
        users.email,
        member_profiles.full_name AS fullName,
        member_profiles.company AS company,
        member_profiles.phone AS phone,
        member_profiles.photo_url AS photoUrl,
        member_profiles.birthday_month AS birthdayMonth,
        member_profiles.birthday_day AS birthdayDay,
        member_profiles.birthday_visibility AS birthdayVisibility,
        member_profiles.updated_at AS profileUpdatedAt
      FROM users
      LEFT JOIN member_profiles ON member_profiles.user_id = users.id
      WHERE users.id = ?
      LIMIT 1
    `
    )
    .get(userId);
}

function toMemberProfileResponse(profileRow) {
  return {
    userId: Number(profileRow?.userId || 0),
    username: String(profileRow?.username || ""),
    email: String(profileRow?.email || ""),
    fullName: String(profileRow?.fullName || ""),
    company: String(profileRow?.company || ""),
    phone: String(profileRow?.phone || ""),
    photoUrl: profileRow?.photoUrl || null,
    birthdayMonth: Number.isInteger(Number(profileRow?.birthdayMonth)) ? Number(profileRow.birthdayMonth) : null,
    birthdayDay: Number.isInteger(Number(profileRow?.birthdayDay)) ? Number(profileRow.birthdayDay) : null,
    birthdayVisibility: String(profileRow?.birthdayVisibility || "hidden"),
    updatedAt: profileRow?.profileUpdatedAt || null
  };
}

function upsertMemberProfile(database, userId, profile) {
  database
    .prepare(
      `
      INSERT INTO member_profiles (
        user_id,
        full_name,
        company,
        phone,
        photo_url,
        birthday_month,
        birthday_day,
        birthday_visibility,
        birthday_consent_confirmed_at,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        full_name = excluded.full_name,
        company = excluded.company,
        phone = excluded.phone,
        photo_url = excluded.photo_url,
        birthday_month = excluded.birthday_month,
        birthday_day = excluded.birthday_day,
        birthday_visibility = excluded.birthday_visibility,
        birthday_consent_confirmed_at = excluded.birthday_consent_confirmed_at,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .run(
      userId,
      profile.fullName,
      profile.company,
      profile.phone,
      profile.photoUrl,
      profile.birthdayMonth,
      profile.birthdayDay,
      profile.birthdayVisibility,
      profile.birthdayConsentConfirmedAt
    );
}

function normalizeMemberNewsStatus(value, fallback = "draft") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (!MEMBER_NEWS_STATUSES.has(normalized)) {
    const error = new Error("status must be draft, published, or archived.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return normalized;
}

function normalizeMemberNewsStatusFilter(value, fallback = "all") {
  const normalized = String(value || "").trim().toLowerCase();
  if (!normalized) {
    return fallback;
  }
  if (normalized === "all") {
    return "all";
  }
  if (!MEMBER_NEWS_STATUSES.has(normalized)) {
    const error = new Error("status filter must be all, draft, published, or archived.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return normalized;
}

function toMemberNewsResponseItem(newsRow, { memberView = false } = {}) {
  const status = String(newsRow?.status || "draft");
  const publishedAt = newsRow?.publishedAt || null;
  const isPinned = Number(newsRow?.isPinned || 0) === 1;
  const pinnedAt = newsRow?.pinnedAt || null;
  return {
    id: Number(newsRow?.id || 0),
    eventType: memberView ? "organisation_news" : "admin_news",
    title: String(newsRow?.title || "IWFSA Update"),
    body: String(newsRow?.bodyText || newsRow?.body || ""),
    status,
    isPinned,
    pinnedAt,
    source: memberView ? "admin_news" : "admin_console",
    createdAt: publishedAt || newsRow?.createdAt || null,
    publishedAt,
    updatedAt: newsRow?.updatedAt || null,
    authorUserId: Number(newsRow?.authorUserId || 0),
    authorUsername: String(newsRow?.authorUsername || ""),
    updatedByUserId: Number(newsRow?.updatedByUserId || 0) || null,
    updatedByUsername: newsRow?.updatedByUsername || null
  };
}

function loadMemberNewsPost(database, newsId) {
  return database
    .prepare(
      `
      SELECT
        member_news_posts.id,
        member_news_posts.title,
        member_news_posts.body_text AS bodyText,
        member_news_posts.status,
        member_news_posts.is_pinned AS isPinned,
        member_news_posts.pinned_at AS pinnedAt,
        member_news_posts.published_at AS publishedAt,
        member_news_posts.created_at AS createdAt,
        member_news_posts.updated_at AS updatedAt,
        member_news_posts.author_user_id AS authorUserId,
        member_news_posts.updated_by_user_id AS updatedByUserId,
        author.username AS authorUsername,
        updater.username AS updatedByUsername
      FROM member_news_posts
      LEFT JOIN users AS author ON author.id = member_news_posts.author_user_id
      LEFT JOIN users AS updater ON updater.id = member_news_posts.updated_by_user_id
      WHERE member_news_posts.id = ?
      LIMIT 1
    `
    )
    .get(newsId);
}

function listAdminNewsPosts(database, { status = "all", limit = 50 } = {}) {
  const maxLimit = Math.max(1, Math.min(Number(limit || 50), 200));
  const normalizedStatus = normalizeMemberNewsStatusFilter(status, "all");
  const baseSql = `
    SELECT
      member_news_posts.id,
      member_news_posts.title,
      member_news_posts.body_text AS bodyText,
      member_news_posts.status,
      member_news_posts.is_pinned AS isPinned,
      member_news_posts.pinned_at AS pinnedAt,
      member_news_posts.published_at AS publishedAt,
      member_news_posts.created_at AS createdAt,
      member_news_posts.updated_at AS updatedAt,
      member_news_posts.author_user_id AS authorUserId,
      member_news_posts.updated_by_user_id AS updatedByUserId,
      author.username AS authorUsername,
      updater.username AS updatedByUsername
    FROM member_news_posts
    LEFT JOIN users AS author ON author.id = member_news_posts.author_user_id
    LEFT JOIN users AS updater ON updater.id = member_news_posts.updated_by_user_id
  `;
  const orderSql = `
    ORDER BY
      member_news_posts.is_pinned DESC,
      member_news_posts.pinned_at DESC,
      CASE member_news_posts.status
        WHEN 'published' THEN 0
        WHEN 'draft' THEN 1
        ELSE 2
      END,
      COALESCE(member_news_posts.published_at, member_news_posts.updated_at, member_news_posts.created_at) DESC,
      member_news_posts.id DESC
    LIMIT ?
  `;
  const rows =
    normalizedStatus === "all"
      ? database.prepare(`${baseSql}\n${orderSql}`).all(maxLimit)
      : database.prepare(`${baseSql}\nWHERE member_news_posts.status = ?\n${orderSql}`).all(normalizedStatus, maxLimit);
  return rows.map((row) => toMemberNewsResponseItem(row));
}

function listPublishedMemberNewsItems(database, { limit = 8 } = {}) {
  const maxLimit = Math.max(1, Math.min(Number(limit || 8), 30));
  const rows = database
    .prepare(
      `
      SELECT
        member_news_posts.id,
        member_news_posts.title,
        member_news_posts.body_text AS bodyText,
        member_news_posts.status,
        member_news_posts.is_pinned AS isPinned,
        member_news_posts.pinned_at AS pinnedAt,
        member_news_posts.published_at AS publishedAt,
        member_news_posts.created_at AS createdAt,
        member_news_posts.updated_at AS updatedAt,
        member_news_posts.author_user_id AS authorUserId,
        author.username AS authorUsername
      FROM member_news_posts
      LEFT JOIN users AS author ON author.id = member_news_posts.author_user_id
      WHERE member_news_posts.status = 'published'
      ORDER BY
        member_news_posts.is_pinned DESC,
        member_news_posts.pinned_at DESC,
        COALESCE(member_news_posts.published_at, member_news_posts.created_at) DESC,
        member_news_posts.id DESC
      LIMIT ?
    `
    )
    .all(maxLimit);

  return rows.map((row) => toMemberNewsResponseItem(row, { memberView: true }));
}

function listMemberNotificationNewsItems(database, userId, { limit = 8 } = {}) {
  const maxLimit = Math.max(1, Math.min(Number(limit || 8), 30));
  return database
    .prepare(
      `
      SELECT
        id,
        event_type AS eventType,
        title,
        body,
        created_at AS createdAt,
        read_at AS readAt
      FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ?
    `
    )
    .all(userId, maxLimit)
    .map((row) => ({
      id: Number(row.id),
      eventType: String(row.eventType || "news"),
      title: String(row.title || "IWFSA Update"),
      body: String(row.body || ""),
      source: "notifications",
      createdAt: row.createdAt,
      publishedAt: null,
      readAt: row.readAt || null
    }));
}

function listMemberBirthdayHighlights(database, { windowDays = 30, limit = 5 } = {}) {
  const rows = database
    .prepare(
      `
      SELECT
        users.id AS userId,
        member_profiles.full_name AS fullName,
        member_profiles.photo_url AS photoUrl,
        member_profiles.birthday_month AS birthdayMonth,
        member_profiles.birthday_day AS birthdayDay,
        member_profiles.birthday_visibility AS birthdayVisibility
      FROM users
      JOIN member_profiles ON member_profiles.user_id = users.id
      WHERE users.role = 'member'
        AND users.account_status = 'active'
        AND member_profiles.birthday_visibility IN ('members_only', 'members_and_social')
        AND member_profiles.birthday_month IS NOT NULL
        AND member_profiles.birthday_day IS NOT NULL
    `
    )
    .all();

  const eligibleIdSet = new Set(
    filterEligibleMemberUserIds(
      database,
      rows.map((row) => Number(row.userId)).filter((id) => Number.isInteger(id))
    )
  );
  const list = listUpcomingBirthdays({
    nowMs: Date.now(),
    windowDays: Math.max(1, Math.min(Number(windowDays || 30), 60)),
    people: rows.filter((row) => eligibleIdSet.has(Number(row.userId)))
  });

  return list.slice(0, Math.max(1, Math.min(Number(limit || 5), 20))).map((item) => ({
    userId: Number(item.userId),
    fullName: String(item.fullName || "Member"),
    photoUrl: item.photoUrl || null,
    occursOn: item.occursOn,
    daysUntil: Number(item.daysUntil || 0)
  }));
}
function ensureSeedMembers(database) {
  const seedPassword = "IwfsaTest2026!";
  const seedMembers = [
    {
      username: "nomsa",
      email: "nomsa.dlamini@example.com",
      fullName: "Nomsa Dlamini",
      company: "Ubuntu Ventures",
      phone: "+27821234567",
      roles: ["Full Member"],
      groups: ["Member Affairs"]
    },
    {
      username: "thandi",
      email: "thandi.vandyk@example.com",
      fullName: "Thandi van Dyk",
      company: "SageBridge Consulting",
      phone: "+27721234567",
      roles: ["Associate Member"],
      groups: ["Brand and Reputation"]
    },
    {
      username: "zara",
      email: "zara.patel@example.com",
      fullName: "Zara Patel",
      company: "Grove Holdings",
      phone: "+27831234567",
      roles: ["Board Member"],
      groups: ["Board of Directors"]
    },
    {
      username: "lerato",
      email: "lerato.maseko@example.com",
      fullName: "Lerato Maseko",
      company: "Maseko & Co.",
      phone: "+27841234567",
      roles: ["Full Member"],
      groups: ["Strategic Alliances and Advocacy"]
    },
    {
      username: "naledi",
      email: "naledi.khumalo@example.com",
      fullName: "Naledi Khumalo",
      company: "Khumalo Legal",
      phone: "+27851234567",
      roles: ["Associate Member"],
      groups: ["Leadership Development"]
    },
    {
      username: "ava",
      email: "ava.naidoo@example.com",
      fullName: "Ava Naidoo",
      company: "Naidoo Partners",
      phone: "+27861234567",
      roles: ["Full Member"],
      groups: ["Catalytic Strategy and Voice"]
    }
  ];
  const seedUsernames = seedMembers.map((member) => member.username);
  const seedEmails = seedMembers.map((member) => String(member.email || "").toLowerCase());
  const usernamePlaceholders = seedUsernames.map(() => "?").join(",");
  const emailPlaceholders = seedEmails.map(() => "?").join(",");
  const existingSeedRows =
    seedUsernames.length === 0 && seedEmails.length === 0
      ? []
      : database
          .prepare(
            `
            SELECT id, username, email
            FROM users
            WHERE username IN (${usernamePlaceholders})
               OR LOWER(email) IN (${emailPlaceholders})
          `
          )
          .all(...seedUsernames, ...seedEmails);
  const existingSeedByUsername = new Map();
  const existingSeedByEmail = new Map();
  for (const row of existingSeedRows) {
    const rowId = Number(row.id);
    if (!Number.isInteger(rowId) || rowId <= 0) {
      continue;
    }
    const usernameKey = String(row.username || "").trim().toLowerCase();
    const emailKey = String(row.email || "").trim().toLowerCase();
    if (usernameKey) {
      existingSeedByUsername.set(usernameKey, rowId);
    }
    if (emailKey) {
      existingSeedByEmail.set(emailKey, rowId);
    }
  }
  const passwordHash = hashPassword(seedPassword);
  let insertedCount = 0;
  const allGroups = seedMembers.flatMap((member) => member.groups || []);
  const allRoles = seedMembers.flatMap((member) => member.roles || []);

  runTransaction(database, () => {
    const groupMap = ensureGroupIds(database, allGroups);
    const roleMap = ensureRoleIds(database, allRoles);
    const insertUser = database.prepare(
      `
      INSERT INTO users (
        username,
        email,
        password_hash,
        role,
        account_status,
        status,
        desired_status,
        must_change_password,
        must_change_username,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, 'member', 'active', 'active', 'active', 0, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    );
    const refreshSeedUserCredentials = database.prepare(
      `
      UPDATE users
      SET
        username = ?,
        email = ?,
        password_hash = ?,
        role = 'member',
        account_status = 'active',
        status = 'active',
        desired_status = 'active',
        must_change_password = 0,
        must_change_username = 0,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    );
    const insertProfile = database.prepare(
      `
      INSERT INTO member_profiles (user_id, full_name, company, phone, created_at, updated_at)
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
    `
    );

    for (const seed of seedMembers) {
      const email = String(seed.email || "").toLowerCase();
      const usernameKey = String(seed.username || "").trim().toLowerCase();
      const emailKey = String(email || "").trim().toLowerCase();
      let userId = existingSeedByUsername.get(usernameKey) || existingSeedByEmail.get(emailKey) || null;
      if (Number.isInteger(userId) && userId > 0) {
        refreshSeedUserCredentials.run(seed.username, email, passwordHash, userId);
      } else {
        const insertResult = insertUser.run(seed.username, email, passwordHash);
        userId = Number(insertResult.lastInsertRowid);
        insertedCount += 1;
        insertProfile.run(userId, seed.fullName, seed.company || null, seed.phone || null);
      }
      if (Number.isInteger(userId) && userId > 0) {
        existingSeedByUsername.set(usernameKey, userId);
        existingSeedByEmail.set(emailKey, userId);
      }

      if (!Number.isInteger(userId) || userId <= 0) {
        continue;
      }

      const groupIds = (seed.groups || [])
        .map((name) => groupMap.get(name))
        .filter((id) => Number.isInteger(id));
      setGroupMemberships(database, userId, groupIds);

      const roleIds = (seed.roles || [])
        .map((name) => roleMap.get(name))
        .filter((id) => Number.isInteger(id));
      setRoleAssignments(database, userId, roleIds);
    }
  });

  return {
    seeded: insertedCount > 0,
    count: insertedCount
  };
}

function queueMemberInvites(database, userIds, actorUserId, { expiryHours = 72 } = {}) {
  if (userIds.length === 0) {
    return { queued: [], skipped: [] };
  }

  const placeholders = userIds.map(() => "?").join(",");
  const members = database
    .prepare(
      `
      SELECT id, username, email, status, account_status AS accountStatus
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
        SET status = 'invited',
            account_status = 'invited',
            must_change_password = 1,
            updated_at = CURRENT_TIMESTAMP
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

  const eligible = members.filter((member) => {
    const accountStatus = normalizeAccountStatusValue(member.accountStatus, member.status);
    return accountStatus === "active" || accountStatus === "blocked";
  });
  const eligibleIds = eligible.map((member) => member.id);
  const skipped = members
    .filter((member) => !eligibleIds.includes(member.id))
    .map((member) => ({
      id: member.id,
      username: member.username,
      email: member.email,
      status: normalizeAccountStatusValue(member.accountStatus, member.status),
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

function sanitizeEventDocumentFileName(fileName) {
  const cleaned = String(fileName || "")
    .trim()
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, " ");
  return cleaned || `event-document-${Date.now()}.bin`;
}

function extractFileExtension(fileName) {
  const normalized = String(fileName || "").trim().toLowerCase();
  const lastDot = normalized.lastIndexOf(".");
  if (lastDot <= 0 || lastDot === normalized.length - 1) {
    return "";
  }
  return normalized.slice(lastDot + 1);
}

function isAllowedEventDocumentUpload(fileName, mimeType) {
  const extension = extractFileExtension(fileName);
  if (extension && EVENT_DOCUMENT_ALLOWED_EXTENSIONS.has(extension)) {
    return true;
  }

  const normalizedMimeType = String(mimeType || "")
    .trim()
    .toLowerCase();
  if (normalizedMimeType && EVENT_DOCUMENT_ALLOWED_MIME_TYPES.has(normalizedMimeType)) {
    return true;
  }

  return false;
}

function buildEventDocumentFolderPath(eventRow, eventId) {
  const startMs = parseIsoToMs(eventRow?.start_at || eventRow?.startAt);
  const year = Number.isFinite(startMs) ? new Date(startMs).getUTCFullYear() : new Date().getUTCFullYear();
  const normalizedId = String(eventId).padStart(6, "0");
  return `${year}/EVT-${normalizedId}`;
}

function resolveEventDocumentAvailability(eventRow, mode, scheduledAt, offsetMinutes = 0) {
  if (mode === "scheduled") {
    const scheduledMs = parseIsoToMs(scheduledAt);
    if (scheduledMs === null) {
      const error = new Error("Provide a valid scheduled availability date/time.");
      error.httpStatus = 400;
      error.code = "validation_error";
      throw error;
    }
    return new Date(scheduledMs).toISOString();
  }

  if (mode === "after_event") {
    const endMs = parseIsoToMs(eventRow?.end_at || eventRow?.endAt);
    if (endMs === null) {
      const error = new Error("Event end time is required for after-event availability.");
      error.httpStatus = 409;
      error.code = "invalid_state";
      throw error;
    }
    const safeOffset = Number.isInteger(Number(offsetMinutes)) ? Number(offsetMinutes) : 0;
    return new Date(endMs + Math.max(0, safeOffset) * 60 * 1000).toISOString();
  }

  return new Date().toISOString();
}

function canUserViewEvent(database, user, eventRow, eventId) {
  if (!user || !eventRow) {
    return false;
  }
  if (isAdminRole(user.role)) {
    return true;
  }
  if (canEditEvent(database, user, eventId, { eventRow })) {
    return true;
  }
  if (eventRow.status !== "published") {
    return false;
  }
  if (eventRow.audience_type === "groups") {
    return canUserAccessGroupedEvent(database, eventId, user.id);
  }
  return true;
}

function isEventDocumentAvailable(documentRow, { nowMs = Date.now() } = {}) {
  const availableFromMs = parseIsoToMs(documentRow?.available_from || documentRow?.availableFrom);
  if (availableFromMs === null) {
    return true;
  }
  return availableFromMs <= nowMs;
}

function listEventDocuments(database, eventId, { includeRemoved = false } = {}) {
  let sql = `
    SELECT
      id,
      event_id AS eventId,
      document_type AS documentType,
      file_name AS fileName,
      mime_type AS mimeType,
      size_bytes AS sizeBytes,
      checksum_sha256 AS checksumSha256,
      sharepoint_site_id AS sharePointSiteId,
      sharepoint_drive_id AS sharePointDriveId,
      sharepoint_item_id AS sharePointItemId,
      sharepoint_web_url AS sharePointWebUrl,
      availability_mode AS availabilityMode,
      available_from AS availableFrom,
      published_at AS publishedAt,
      published_by_user_id AS publishedByUserId,
      member_access_scope AS memberAccessScope,
      uploaded_by_user_id AS uploadedByUserId,
      removed_at AS removedAt,
      removed_by_user_id AS removedByUserId,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM event_documents
    WHERE event_id = ?
  `;
  if (!includeRemoved) {
    sql += " AND removed_at IS NULL";
  }
  sql += " ORDER BY datetime(created_at) DESC, id DESC";
  return database.prepare(sql).all(eventId);
}

function loadEventDocument(database, eventId, documentId) {
  return database
    .prepare(
      `
      SELECT
        id,
        event_id AS eventId,
        document_type AS documentType,
        file_name AS fileName,
        mime_type AS mimeType,
        size_bytes AS sizeBytes,
        checksum_sha256 AS checksumSha256,
        sharepoint_site_id AS sharePointSiteId,
        sharepoint_drive_id AS sharePointDriveId,
        sharepoint_item_id AS sharePointItemId,
        sharepoint_web_url AS sharePointWebUrl,
        availability_mode AS availabilityMode,
        available_from AS availableFrom,
        published_at AS publishedAt,
        published_by_user_id AS publishedByUserId,
        member_access_scope AS memberAccessScope,
        uploaded_by_user_id AS uploadedByUserId,
        removed_at AS removedAt,
        removed_by_user_id AS removedByUserId,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM event_documents
      WHERE event_id = ? AND id = ?
      LIMIT 1
    `
    )
    .get(eventId, documentId);
}

function toEventDocumentResponseItem(item, { includeInternal = false, nowMs = Date.now() } = {}) {
  const available = isEventDocumentAvailable(item, { nowMs });
  const payload = {
    id: item.id,
    eventId: item.eventId,
    documentType: item.documentType,
    fileName: item.fileName,
    mimeType: item.mimeType,
    sizeBytes: Number(item.sizeBytes || 0),
    availabilityMode: item.availabilityMode,
    availableFrom: item.availableFrom,
    available: Boolean(available),
    published: Boolean(item.publishedAt),
    publishedAt: item.publishedAt || null,
    memberAccessScope: item.memberAccessScope || "all_visible",
    createdAt: item.createdAt,
    updatedAt: item.updatedAt,
    removedAt: item.removedAt || null
  };
  if (includeInternal) {
    payload.sharePoint = {
      siteId: item.sharePointSiteId,
      driveId: item.sharePointDriveId,
      itemId: item.sharePointItemId,
      webUrl: item.sharePointWebUrl || ""
    };
  }
  return payload;
}

function normalizeEventDocumentMemberAccessScope(value, fallback = "all_visible") {
  const scope = String(value ?? fallback)
    .trim()
    .toLowerCase();
  if (!EVENT_DOCUMENT_MEMBER_ACCESS_SCOPES.has(scope)) {
    const error = new Error("memberAccessScope must be all_visible or invited_attended.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return scope;
}

function isEventDocumentPublished(documentRow) {
  return Boolean(documentRow?.publishedAt || documentRow?.published_at);
}

function hasEventAttendanceStatus(database, eventId, userId, status = "attended") {
  const row = database
    .prepare(
      `
      SELECT attendance_status AS attendanceStatus
      FROM event_attendance
      WHERE event_id = ? AND user_id = ?
      LIMIT 1
    `
    )
    .get(eventId, userId);
  return String(row?.attendanceStatus || "").trim().toLowerCase() === String(status || "").trim().toLowerCase();
}

function canMemberDownloadEventDocument(database, { eventId, userId, documentRow }) {
  const scope = String(documentRow?.memberAccessScope || documentRow?.member_access_scope || "all_visible")
    .trim()
    .toLowerCase();
  if (scope !== "invited_attended") {
    return true;
  }
  return hasEventAttendanceStatus(database, eventId, userId, "attended");
}

function listEventAttendance(database, eventId) {
  return database
    .prepare(
      `
      SELECT
        users.id AS userId,
        users.username AS username,
        users.email AS email,
        signups.status AS signupStatus,
        event_attendance.attendance_status AS attendanceStatus,
        event_attendance.marked_at AS markedAt,
        event_attendance.updated_at AS updatedAt
      FROM users
      LEFT JOIN signups ON signups.event_id = ? AND signups.user_id = users.id
      LEFT JOIN event_attendance ON event_attendance.event_id = ? AND event_attendance.user_id = users.id
      WHERE users.role IN ('member', 'event_editor', 'admin', 'chief_admin')
        AND users.account_status = 'active'
        AND (signups.id IS NOT NULL)
      ORDER BY LOWER(COALESCE(users.username, users.email, '')) ASC
    `
    )
    .all(eventId, eventId);
}

function parseBooleanInput(value, fallback = false) {
  if (value === undefined || value === null || value === "") {
    return Boolean(fallback);
  }
  if (typeof value === "boolean") {
    return value;
  }
  if (typeof value === "number") {
    return value !== 0;
  }
  const normalized = String(value).trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return Boolean(fallback);
}

function parseNumberInRange(value, { min, max, fallback, label }) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < min || parsed > max) {
    const error = new Error(`${label} must be between ${min} and ${max}.`);
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return parsed;
}

function normalizeQuietHourValue(value, fallback) {
  const source = value === undefined || value === null || value === "" ? fallback : value;
  const normalized = String(source || "").trim();
  if (!SMS_QUIET_HOURS_PATTERN.test(normalized)) {
    const error = new Error("Quiet hours must use HH:MM (24-hour) format.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return normalized;
}

function normalizeSmsPhone(value) {
  const normalized = String(value || "")
    .trim()
    .replace(/[^\d+]/g, "");
  if (!normalized) {
    return "";
  }
  if (!/^\+\d{8,15}$/.test(normalized)) {
    const error = new Error("Phone number must be in international format, for example +27123456789.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return normalized;
}

function loadSmsPreference(database, userId) {
  return database
    .prepare(
      `
      SELECT
        user_id AS userId,
        enabled,
        phone_number AS phoneNumber,
        daily_limit AS dailyLimit,
        per_event_limit AS perEventLimit,
        quiet_hours_start AS quietHoursStart,
        quiet_hours_end AS quietHoursEnd,
        allow_urgent AS allowUrgent,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM sms_notification_preferences
      WHERE user_id = ?
      LIMIT 1
    `
    )
    .get(userId);
}

function upsertSmsPreference(database, userId, payload) {
  database
    .prepare(
      `
      INSERT INTO sms_notification_preferences (
        user_id,
        enabled,
        phone_number,
        daily_limit,
        per_event_limit,
        quiet_hours_start,
        quiet_hours_end,
        allow_urgent,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id) DO UPDATE SET
        enabled = excluded.enabled,
        phone_number = excluded.phone_number,
        daily_limit = excluded.daily_limit,
        per_event_limit = excluded.per_event_limit,
        quiet_hours_start = excluded.quiet_hours_start,
        quiet_hours_end = excluded.quiet_hours_end,
        allow_urgent = excluded.allow_urgent,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .run(
      userId,
      payload.enabled ? 1 : 0,
      payload.phoneNumber || null,
      payload.dailyLimit,
      payload.perEventLimit,
      payload.quietHoursStart,
      payload.quietHoursEnd,
      payload.allowUrgent ? 1 : 0
    );
}

function resolveSmsPreferencePayload(payload, existing = null) {
  const enabled = parseBooleanInput(payload?.enabled, existing?.enabled === 1);
  const phoneCandidate =
    payload?.phoneNumber !== undefined ? payload?.phoneNumber : existing?.phoneNumber;
  const phoneNumber = normalizeSmsPhone(phoneCandidate);
  if (enabled && !phoneNumber) {
    const error = new Error("A valid phone number is required when SMS is enabled.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }

  return {
    enabled,
    phoneNumber,
    dailyLimit: parseNumberInRange(payload?.dailyLimit, {
      min: SMS_DAILY_LIMIT_RANGE.min,
      max: SMS_DAILY_LIMIT_RANGE.max,
      fallback: Number(existing?.dailyLimit || 3),
      label: "dailyLimit"
    }),
    perEventLimit: parseNumberInRange(payload?.perEventLimit, {
      min: SMS_PER_EVENT_LIMIT_RANGE.min,
      max: SMS_PER_EVENT_LIMIT_RANGE.max,
      fallback: Number(existing?.perEventLimit || 1),
      label: "perEventLimit"
    }),
    quietHoursStart: normalizeQuietHourValue(payload?.quietHoursStart, existing?.quietHoursStart || "21:00"),
    quietHoursEnd: normalizeQuietHourValue(payload?.quietHoursEnd, existing?.quietHoursEnd || "07:00"),
    allowUrgent: parseBooleanInput(payload?.allowUrgent, existing?.allowUrgent !== 0)
  };
}

function toSmsPreferenceResponse(row, userId) {
  return {
    userId: Number(row?.userId || userId || 0),
    enabled: Boolean(Number(row?.enabled || 0)),
    phoneNumber: String(row?.phoneNumber || ""),
    dailyLimit: Number(row?.dailyLimit || 3),
    perEventLimit: Number(row?.perEventLimit || 1),
    quietHoursStart: String(row?.quietHoursStart || "21:00"),
    quietHoursEnd: String(row?.quietHoursEnd || "07:00"),
    allowUrgent: Boolean(Number(row?.allowUrgent ?? 1)),
    updatedAt: row?.updatedAt || null
  };
}

function parseQuietHoursToMinutes(value) {
  const match = String(value || "").trim().match(SMS_QUIET_HOURS_PATTERN);
  if (!match) {
    return null;
  }
  return Number(match[1]) * 60 + Number(match[2]);
}

function isInQuietHours(nowMinutes, quietStartMinutes, quietEndMinutes) {
  if (quietStartMinutes === null || quietEndMinutes === null || quietStartMinutes === quietEndMinutes) {
    return false;
  }
  if (quietStartMinutes < quietEndMinutes) {
    return nowMinutes >= quietStartMinutes && nowMinutes < quietEndMinutes;
  }
  return nowMinutes >= quietStartMinutes || nowMinutes < quietEndMinutes;
}

function countSmsSentSince(database, userId, sinceIso) {
  const row = database
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM sms_delivery_logs
      WHERE user_id = ? AND status = 'sent' AND datetime(created_at) >= datetime(?)
    `
    )
    .get(userId, sinceIso);
  return Number(row?.count || 0);
}

function countSmsSentForEventSince(database, userId, eventId, sinceIso) {
  if (!Number.isInteger(Number(eventId)) || Number(eventId) <= 0) {
    return 0;
  }
  const row = database
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM sms_delivery_logs
      WHERE user_id = ? AND event_id = ? AND status = 'sent' AND datetime(created_at) >= datetime(?)
    `
    )
    .get(userId, Number(eventId), sinceIso);
  return Number(row?.count || 0);
}

function recordSmsDeliveryLog(database, { userId, eventId = null, eventType, status, phoneNumber, messageText, reason = null, metadata = null }) {
  const excerpt = String(messageText || "").trim().slice(0, 180);
  database
    .prepare(
      `
      INSERT INTO sms_delivery_logs (
        user_id,
        event_id,
        event_type,
        status,
        phone_number,
        message_excerpt,
        blocked_reason,
        metadata_json,
        created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `
    )
    .run(
      userId,
      Number.isInteger(Number(eventId)) ? Number(eventId) : null,
      String(eventType || "notification"),
      String(status || "blocked"),
      phoneNumber || null,
      excerpt || null,
      reason || null,
      metadata ? JSON.stringify(metadata) : null
    );
}

function maybeLogSmsForNotification(database, { userId, eventId = null, eventType, messageText, urgent = false }) {
  const preference = loadSmsPreference(database, userId);
  if (!preference || Number(preference.enabled || 0) !== 1) {
    return;
  }
  const phoneNumber = String(preference.phoneNumber || "").trim();
  if (!phoneNumber) {
    recordSmsDeliveryLog(database, {
      userId,
      eventId,
      eventType,
      status: "blocked",
      reason: "missing_phone",
      messageText,
      metadata: { urgent: Boolean(urgent) }
    });
    return;
  }

  const now = new Date();
  const todayStartIso = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString();
  const sentToday = countSmsSentSince(database, userId, todayStartIso);
  if (sentToday >= Number(preference.dailyLimit || 0)) {
    recordSmsDeliveryLog(database, {
      userId,
      eventId,
      eventType,
      status: "blocked",
      phoneNumber,
      reason: "daily_limit_reached",
      messageText,
      metadata: { sentToday, dailyLimit: Number(preference.dailyLimit || 0), urgent: Boolean(urgent) }
    });
    return;
  }

  if (eventId && countSmsSentForEventSince(database, userId, eventId, todayStartIso) >= Number(preference.perEventLimit || 0)) {
    recordSmsDeliveryLog(database, {
      userId,
      eventId,
      eventType,
      status: "blocked",
      phoneNumber,
      reason: "per_event_limit_reached",
      messageText,
      metadata: { perEventLimit: Number(preference.perEventLimit || 0), urgent: Boolean(urgent) }
    });
    return;
  }

  if (!urgent || Number(preference.allowUrgent || 0) !== 1) {
    const nowMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const quietStartMinutes = parseQuietHoursToMinutes(preference.quietHoursStart);
    const quietEndMinutes = parseQuietHoursToMinutes(preference.quietHoursEnd);
    if (isInQuietHours(nowMinutes, quietStartMinutes, quietEndMinutes)) {
      recordSmsDeliveryLog(database, {
        userId,
        eventId,
        eventType,
        status: "blocked",
        phoneNumber,
        reason: "quiet_hours",
        messageText,
        metadata: {
          nowUtcMinutes: nowMinutes,
          quietHoursStart: preference.quietHoursStart,
          quietHoursEnd: preference.quietHoursEnd,
          urgent: Boolean(urgent)
        }
      });
      return;
    }
  }

  recordSmsDeliveryLog(database, {
    userId,
    eventId,
    eventType,
    status: "sent",
    phoneNumber,
    messageText,
    metadata: { urgent: Boolean(urgent) }
  });
}

function normalizeSocialPostBody(value) {
  const text = String(value || "").trim();
  if (!text) {
    const error = new Error("Post body is required.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  if (text.length < 8) {
    const error = new Error("Post body must be at least 8 characters.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  if (text.length > 600) {
    const error = new Error("Post body must be 600 characters or fewer.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  const lowered = text.toLowerCase();
  for (const term of SOCIAL_DISALLOWED_TERMS) {
    if (lowered.includes(term)) {
      const error = new Error("Post does not meet community respect rules.");
      error.httpStatus = 400;
      error.code = "validation_error";
      throw error;
    }
  }
  return text;
}

function loadSocialModerators(database) {
  return database
    .prepare(
      `
      SELECT
        social_moderators.user_id AS userId,
        social_moderators.assigned_by_user_id AS assignedByUserId,
        social_moderators.created_at AS createdAt,
        users.username AS username,
        users.email AS email
      FROM social_moderators
      JOIN users ON users.id = social_moderators.user_id
      ORDER BY datetime(social_moderators.created_at) DESC, social_moderators.user_id DESC
    `
    )
    .all();
}

function isSocialModerator(database, userId) {
  if (!Number.isInteger(Number(userId)) || Number(userId) <= 0) {
    return false;
  }
  const row = database
    .prepare(
      `
      SELECT user_id AS userId
      FROM social_moderators
      WHERE user_id = ?
      LIMIT 1
    `
    )
    .get(Number(userId));
  return Boolean(row?.userId);
}

function canModerateSocial(database, user) {
  if (!user) {
    return false;
  }
  if (isAdminRole(user.role)) {
    return true;
  }
  return isSocialModerator(database, user.id);
}

function listSocialCelebrationPosts(database, { includeRemoved = false, limit = 100 } = {}) {
  let sql = `
    SELECT
      social_celebration_posts.id,
      social_celebration_posts.author_user_id AS authorUserId,
      social_celebration_posts.body_text AS bodyText,
      social_celebration_posts.created_at AS createdAt,
      social_celebration_posts.updated_at AS updatedAt,
      social_celebration_posts.removed_at AS removedAt,
      social_celebration_posts.removed_by_user_id AS removedByUserId,
      social_celebration_posts.removed_reason AS removedReason,
      author.username AS authorUsername,
      author.email AS authorEmail
    FROM social_celebration_posts
    JOIN users author ON author.id = social_celebration_posts.author_user_id
    WHERE 1 = 1
  `;
  if (!includeRemoved) {
    sql += " AND social_celebration_posts.removed_at IS NULL";
  }
  sql += " ORDER BY datetime(social_celebration_posts.created_at) DESC, social_celebration_posts.id DESC LIMIT ?";
  return database.prepare(sql).all(limit);
}

function buildAdminEngagementReport(database, windowDays = 30) {
  const safeWindowDays = Math.min(Math.max(Number(windowDays || 30), 7), 180);
  const sinceIso = new Date(Date.now() - safeWindowDays * 24 * 60 * 60 * 1000).toISOString();

  const memberRow = database
    .prepare(
      `
      SELECT
        COUNT(*) AS activeMembers
      FROM users
      WHERE role = 'member' AND account_status = 'active'
    `
    )
    .get();

  const smsOptInRow = database
    .prepare(
      `
      SELECT COUNT(*) AS count
      FROM sms_notification_preferences
      WHERE enabled = 1
    `
    )
    .get();

  const smsRow = database
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) AS sentCount,
        COALESCE(SUM(CASE WHEN status = 'blocked' THEN 1 ELSE 0 END), 0) AS blockedCount,
        COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failedCount
      FROM sms_delivery_logs
      WHERE datetime(created_at) >= datetime(?)
    `
    )
    .get(sinceIso);

  const socialRow = database
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN removed_at IS NULL THEN 1 ELSE 0 END), 0) AS postCount,
        COALESCE(SUM(CASE WHEN removed_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS removedCount
      FROM social_celebration_posts
      WHERE datetime(created_at) >= datetime(?)
    `
    )
    .get(sinceIso);

  const eventRow = database
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END), 0) AS publishedCount
      FROM events
      WHERE datetime(created_at) >= datetime(?)
    `
    )
    .get(sinceIso);

  const signupRow = database
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmedCount,
        COALESCE(SUM(CASE WHEN status = 'waitlisted' THEN 1 ELSE 0 END), 0) AS waitlistedCount
      FROM signups
      WHERE datetime(created_at) >= datetime(?)
    `
    )
    .get(sinceIso);

  const attendanceRow = database
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN attendance_status = 'attended' THEN 1 ELSE 0 END), 0) AS attendedCount
      FROM event_attendance
      WHERE datetime(updated_at) >= datetime(?)
    `
    )
    .get(sinceIso);

  const documentRow = database
    .prepare(
      `
      SELECT
        COALESCE(SUM(CASE WHEN published_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS publishedDocuments,
        COALESCE(SUM(CASE WHEN member_access_scope = 'invited_attended' AND published_at IS NOT NULL THEN 1 ELSE 0 END), 0) AS restrictedDocuments
      FROM event_documents
      WHERE datetime(created_at) >= datetime(?)
    `
    )
    .get(sinceIso);

  const topEvents = database
    .prepare(
      `
      SELECT
        events.id,
        events.title,
        COALESCE(SUM(CASE WHEN signups.status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmedCount,
        COALESCE(SUM(CASE WHEN signups.status = 'waitlisted' THEN 1 ELSE 0 END), 0) AS waitlistedCount,
        COALESCE(SUM(CASE WHEN event_attendance.attendance_status = 'attended' THEN 1 ELSE 0 END), 0) AS attendedCount
      FROM events
      LEFT JOIN signups ON signups.event_id = events.id
      LEFT JOIN event_attendance ON event_attendance.event_id = events.id AND event_attendance.user_id = signups.user_id
      WHERE datetime(events.created_at) >= datetime(?)
      GROUP BY events.id
      ORDER BY confirmedCount DESC, attendedCount DESC, events.id DESC
      LIMIT 10
    `
    )
    .all(sinceIso)
    .map((row) => ({
      id: Number(row.id),
      title: row.title || "Untitled Event",
      confirmedCount: Number(row.confirmedCount || 0),
      waitlistedCount: Number(row.waitlistedCount || 0),
      attendedCount: Number(row.attendedCount || 0)
    }));

  const recentSms = database
    .prepare(
      `
      SELECT
        sms_delivery_logs.id,
        sms_delivery_logs.user_id AS userId,
        sms_delivery_logs.event_id AS eventId,
        sms_delivery_logs.event_type AS eventType,
        sms_delivery_logs.status,
        sms_delivery_logs.blocked_reason AS blockedReason,
        sms_delivery_logs.created_at AS createdAt,
        users.username AS username,
        users.email AS email
      FROM sms_delivery_logs
      LEFT JOIN users ON users.id = sms_delivery_logs.user_id
      ORDER BY datetime(sms_delivery_logs.created_at) DESC, sms_delivery_logs.id DESC
      LIMIT 40
    `
    )
    .all()
    .map((row) => ({
      id: Number(row.id),
      userId: Number(row.userId || 0),
      eventId: Number(row.eventId || 0) || null,
      eventType: row.eventType || "",
      status: row.status || "",
      blockedReason: row.blockedReason || null,
      createdAt: row.createdAt,
      username: row.username || "",
      email: row.email || ""
    }));

  return {
    windowDays: safeWindowDays,
    sinceIso,
    summary: {
      activeMembers: Number(memberRow?.activeMembers || 0),
      smsOptInMembers: Number(smsOptInRow?.count || 0),
      smsSent: Number(smsRow?.sentCount || 0),
      smsBlocked: Number(smsRow?.blockedCount || 0),
      smsFailed: Number(smsRow?.failedCount || 0),
      socialPosts: Number(socialRow?.postCount || 0),
      socialRemoved: Number(socialRow?.removedCount || 0),
      publishedEvents: Number(eventRow?.publishedCount || 0),
      confirmedSignups: Number(signupRow?.confirmedCount || 0),
      waitlistedSignups: Number(signupRow?.waitlistedCount || 0),
      attendedMembers: Number(attendanceRow?.attendedCount || 0),
      publishedDocuments: Number(documentRow?.publishedDocuments || 0),
      restrictedDocuments: Number(documentRow?.restrictedDocuments || 0)
    },
    topEvents,
    recentSms
  };
}

function escapeCsvCell(value) {
  const text = String(value ?? "");
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function loadEventOnlineMeeting(database, eventId) {
  return database
    .prepare(
      `
      SELECT
        id,
        event_id AS eventId,
        provider,
        organizer_upn AS organizerUpn,
        external_meeting_id AS externalMeetingId,
        join_url AS joinUrl,
        created_at AS createdAt,
        updated_at AS updatedAt
      FROM event_online_meetings
      WHERE event_id = ?
      LIMIT 1
    `
    )
    .get(eventId);
}

function upsertEventOnlineMeeting(database, eventId, payload) {
  database
    .prepare(
      `
      INSERT INTO event_online_meetings (
        event_id,
        provider,
        organizer_upn,
        external_meeting_id,
        join_url,
        created_at,
        updated_at
      )
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(event_id) DO UPDATE SET
        provider = excluded.provider,
        organizer_upn = excluded.organizer_upn,
        external_meeting_id = excluded.external_meeting_id,
        join_url = excluded.join_url,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .run(
      eventId,
      String(payload.provider || "microsoft_teams_graph"),
      String(payload.organizerUpn || ""),
      String(payload.externalMeetingId || ""),
      String(payload.joinUrl || "")
    );
}

function normalizeCalendarProvider(value) {
  const provider = String(value || "").trim().toLowerCase();
  if (!CALENDAR_SYNC_PROVIDERS.has(provider)) {
    const error = new Error("Calendar provider must be google or outlook.");
    error.httpStatus = 400;
    error.code = "validation_error";
    throw error;
  }
  return provider;
}

function listCalendarConnections(database, userId) {
  return database
    .prepare(
      `
      SELECT
        provider,
        status,
        external_account_email AS externalAccountEmail,
        token_expires_at AS tokenExpiresAt,
        scope,
        updated_at AS updatedAt,
        revoked_at AS revokedAt
      FROM calendar_sync_connections
      WHERE user_id = ?
      ORDER BY provider ASC
    `
    )
    .all(userId);
}

function loadCalendarConnection(database, userId, provider) {
  return database
    .prepare(
      `
      SELECT
        id,
        provider,
        status,
        external_account_email AS externalAccountEmail,
        access_token AS accessToken,
        refresh_token AS refreshToken,
        token_expires_at AS tokenExpiresAt,
        scope,
        updated_at AS updatedAt
      FROM calendar_sync_connections
      WHERE user_id = ? AND provider = ?
      LIMIT 1
    `
    )
    .get(userId, provider);
}

function upsertCalendarConnection(database, userId, provider, tokenData) {
  const expiresAtIso =
    Number.isFinite(tokenData?.expiresInSeconds) && Number(tokenData.expiresInSeconds) > 0
      ? new Date(Date.now() + Number(tokenData.expiresInSeconds) * 1000).toISOString()
      : null;
  database
    .prepare(
      `
      INSERT INTO calendar_sync_connections (
        user_id,
        provider,
        status,
        external_account_email,
        access_token,
        refresh_token,
        token_expires_at,
        scope,
        created_at,
        updated_at,
        revoked_at
      ) VALUES (?, ?, 'active', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, NULL)
      ON CONFLICT(user_id, provider) DO UPDATE SET
        status = 'active',
        external_account_email = excluded.external_account_email,
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        token_expires_at = excluded.token_expires_at,
        scope = excluded.scope,
        updated_at = CURRENT_TIMESTAMP,
        revoked_at = NULL
    `
    )
    .run(
      userId,
      provider,
      String(tokenData?.accountEmail || ""),
      String(tokenData?.accessToken || ""),
      String(tokenData?.refreshToken || ""),
      expiresAtIso,
      String(tokenData?.scope || "")
    );
}

function revokeCalendarConnection(database, userId, provider) {
  database
    .prepare(
      `
      UPDATE calendar_sync_connections
      SET
        status = 'revoked',
        revoked_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP,
        access_token = NULL,
        refresh_token = NULL,
        token_expires_at = NULL
      WHERE user_id = ? AND provider = ?
    `
    )
    .run(userId, provider);
}

function createCalendarOauthState(database, userId, provider) {
  const stateToken = randomBytes(18).toString("hex");
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  database
    .prepare(
      `
      INSERT INTO calendar_sync_oauth_states (user_id, provider, state_token, expires_at)
      VALUES (?, ?, ?, ?)
    `
    )
    .run(userId, provider, stateToken, expiresAt);
  return { stateToken, expiresAt };
}

function consumeCalendarOauthState(database, userId, provider, stateToken) {
  const record = database
    .prepare(
      `
      SELECT id, expires_at AS expiresAt, used_at AS usedAt
      FROM calendar_sync_oauth_states
      WHERE user_id = ? AND provider = ? AND state_token = ?
      LIMIT 1
    `
    )
    .get(userId, provider, stateToken);
  if (!record) {
    return null;
  }
  if (record.usedAt) {
    return null;
  }
  const expiresAtMs = parseIsoToMs(record.expiresAt);
  if (expiresAtMs === null || expiresAtMs <= Date.now()) {
    return null;
  }
  database
    .prepare(
      `
      UPDATE calendar_sync_oauth_states
      SET used_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    )
    .run(record.id);
  return record;
}

function loadCalendarSyncMapping(database, userId, eventId, provider) {
  return database
    .prepare(
      `
      SELECT
        id,
        external_event_id AS externalEventId,
        status
      FROM calendar_sync_mappings
      WHERE user_id = ? AND event_id = ? AND provider = ?
      LIMIT 1
    `
    )
    .get(userId, eventId, provider);
}

function upsertCalendarSyncMapping(database, userId, eventId, provider, externalEventId, status = "active") {
  database
    .prepare(
      `
      INSERT INTO calendar_sync_mappings (
        user_id,
        event_id,
        provider,
        external_event_id,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, event_id, provider) DO UPDATE SET
        external_event_id = excluded.external_event_id,
        status = excluded.status,
        updated_at = CURRENT_TIMESTAMP
    `
    )
    .run(userId, eventId, provider, externalEventId, status);
}

function markCalendarSyncMappingCancelled(database, userId, eventId, provider) {
  database
    .prepare(
      `
      UPDATE calendar_sync_mappings
      SET status = 'cancelled', updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND event_id = ? AND provider = ?
    `
    )
    .run(userId, eventId, provider);
}

function recordCalendarSyncFailure(database, { userId, eventId = null, provider, operation, errorCode, errorMessage }) {
  database
    .prepare(
      `
      INSERT INTO calendar_sync_failures (
        user_id,
        event_id,
        provider,
        operation,
        error_code,
        error_message
      ) VALUES (?, ?, ?, ?, ?, ?)
    `
    )
    .run(userId, eventId, provider, operation, errorCode || null, String(errorMessage || "").slice(0, 2000) || null);
}

function markCalendarSyncFailuresResolved(database, { userId, eventId = null, provider }) {
  if (eventId === null) {
    database
      .prepare(
        `
        UPDATE calendar_sync_failures
        SET resolved_at = CURRENT_TIMESTAMP
        WHERE user_id = ? AND provider = ? AND resolved_at IS NULL
      `
      )
      .run(userId, provider);
    return;
  }
  database
    .prepare(
      `
      UPDATE calendar_sync_failures
      SET resolved_at = CURRENT_TIMESTAMP
      WHERE user_id = ? AND event_id = ? AND provider = ? AND resolved_at IS NULL
    `
    )
    .run(userId, eventId, provider);
}

function buildCalendarSyncEventPayload(eventRow) {
  const venue = formatInviteVenue(eventRow);
  return {
    id: Number(eventRow.id),
    title: String(eventRow.title || ""),
    description: String(eventRow.description || ""),
    startAt: String(eventRow.start_at || ""),
    endAt: String(eventRow.end_at || ""),
    location: venue,
    onlineJoinUrl: String(eventRow.online_join_url || ""),
    hostName: String(eventRow.host_name || "")
  };
}

async function syncCalendarForUserEvent(database, {
  calendarSyncClient,
  userId,
  eventId,
  operation,
  actorUserId = null
}) {
  if (!calendarSyncClient) {
    return { attempted: false, synced: false, reason: "disabled" };
  }
  const eventRow = loadEvent(database, eventId);
  if (!eventRow) {
    return { attempted: false, synced: false, reason: "event_not_found" };
  }
  const providerRows = listCalendarConnections(database, userId).filter((item) => item.status === "active");
  if (providerRows.length === 0) {
    return { attempted: false, synced: false, reason: "not_connected" };
  }
  const eventPayload = buildCalendarSyncEventPayload(eventRow);
  for (const row of providerRows) {
    const provider = row.provider;
    const connection = loadCalendarConnection(database, userId, provider);
    const mapping = loadCalendarSyncMapping(database, userId, eventId, provider);
    try {
      if (operation === "cancel") {
        if (mapping) {
          await calendarSyncClient.cancelCalendarEvent({ provider, connection, mapping, event: eventPayload });
          markCalendarSyncMappingCancelled(database, userId, eventId, provider);
        }
      } else {
        const outcome = await calendarSyncClient.upsertCalendarEvent({
          provider,
          connection,
          mapping,
          event: eventPayload
        });
        const externalEventId = String(outcome?.externalEventId || mapping?.externalEventId || "").trim();
        if (!externalEventId) {
          throw new Error("calendar_sync_missing_external_id");
        }
        upsertCalendarSyncMapping(database, userId, eventId, provider, externalEventId, "active");
      }
      markCalendarSyncFailuresResolved(database, { userId, eventId, provider });
      database
        .prepare(
          `
          INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
          VALUES (?, 'calendar_sync_success', 'event', ?, ?)
        `
        )
        .run(
          actorUserId,
          String(eventId),
          JSON.stringify({ userId, provider, operation })
        );
    } catch (error) {
      recordCalendarSyncFailure(database, {
        userId,
        eventId,
        provider,
        operation: operation === "cancel" ? "cancel" : mapping ? "update" : "insert",
        errorCode: error.code || "calendar_sync_failed",
        errorMessage: error.message || String(error)
      });
      createInAppNotification(database, {
        userId,
        eventType: "calendar_sync_failed",
        title: "Calendar sync issue",
        body: `Unable to ${operation === "cancel" ? "cancel" : "sync"} "${eventRow.title}" to your ${provider} calendar.`,
        metadata: { eventId, provider, operation },
        idempotencyKey: `calendar_sync_failed:${provider}:${operation}:${eventId}:${userId}`
      });
    }
  }
  return { attempted: true, synced: true };
}

async function syncCalendarForEventParticipants(database, {
  calendarSyncClient,
  eventId,
  operation,
  actorUserId = null
}) {
  if (!calendarSyncClient) {
    return;
  }
  const participantRows = database
    .prepare(
      `
      SELECT user_id AS userId
      FROM signups
      WHERE event_id = ? AND status = 'confirmed'
      ORDER BY user_id ASC
    `
    )
    .all(eventId);
  for (const row of participantRows) {
    await syncCalendarForUserEvent(database, {
      calendarSyncClient,
      userId: Number(row.userId),
      eventId,
      operation,
      actorUserId
    });
  }
}

async function syncTeamsMeetingForEvent(database, {
  teamsGraphClient,
  eventId,
  actorUserId = null
}) {
  if (!teamsGraphClient) {
    return { attempted: false, automated: false, reason: "disabled" };
  }

  const eventRow = loadEvent(database, eventId);
  if (!eventRow) {
    return { attempted: false, automated: false, reason: "event_not_found" };
  }
  if (eventRow.status !== "published") {
    return { attempted: false, automated: false, reason: "not_published" };
  }
  if (eventRow.venue_type !== "online") {
    return { attempted: false, automated: false, reason: "not_online" };
  }

  const existing = loadEventOnlineMeeting(database, eventId);
  const manualJoinUrl = String(eventRow.online_join_url || "").trim();
  if (!existing && manualJoinUrl) {
    return { attempted: false, automated: false, reason: "manual_join_link" };
  }

  const graphPayload = {
    title: eventRow.title,
    description: eventRow.description || "",
    startAt: eventRow.start_at,
    endAt: eventRow.end_at
  };
  const result = existing
    ? await teamsGraphClient.updateOnlineMeetingEvent({
        meetingId: existing.externalMeetingId,
        ...graphPayload
      })
    : await teamsGraphClient.createOnlineMeetingEvent(graphPayload);

  const joinUrl = String(result.joinUrl || "").trim();
  if (!joinUrl || !/^https?:\/\//i.test(joinUrl)) {
    const error = new Error("Teams automation returned an invalid join URL.");
    error.code = "teams_graph_invalid_join_url";
    error.httpStatus = 502;
    throw error;
  }

  database
    .prepare(
      `
      UPDATE events
      SET online_provider = ?, online_join_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `
    )
    .run(TEAMS_GRAPH_PROVIDER_LABEL, joinUrl, eventId);

  upsertEventOnlineMeeting(database, eventId, {
    provider: "microsoft_teams_graph",
    organizerUpn: result.organizerUpn || existing?.organizerUpn || "",
    externalMeetingId: result.meetingId || existing?.externalMeetingId || "",
    joinUrl
  });

  database
    .prepare(
      `
      INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
      VALUES (?, 'event_teams_meeting_synced', 'event', ?, ?)
    `
    )
    .run(
      actorUserId,
      String(eventId),
      JSON.stringify({
        mode: existing ? "patched" : "created",
        provider: "microsoft_teams_graph"
      })
    );

  return { attempted: true, automated: true, mode: existing ? "patched" : "created" };
}

function loadEventAudienceUserIds(database, eventId, audienceType) {
  if (audienceType === "groups") {
    const rows = database
      .prepare(
        `
        SELECT DISTINCT userId
        FROM (
          SELECT group_members.user_id AS userId
          FROM event_audience_groups
          JOIN group_members ON group_members.group_id = event_audience_groups.group_id
          JOIN users ON users.id = group_members.user_id
           WHERE event_audience_groups.event_id = ?
             AND users.role = 'member'
             AND users.account_status = 'active'
           UNION
           SELECT event_invitees.user_id AS userId
           FROM event_invitees
           JOIN users ON users.id = event_invitees.user_id
           WHERE event_invitees.event_id = ?
             AND users.role = 'member'
             AND users.account_status = 'active'
         )
         ORDER BY userId ASC
      `
      )
      .all(eventId, eventId);
    return filterEligibleMemberUserIds(database, rows.map((row) => Number(row.userId)));
  }

  const rows = database
    .prepare(
      `
      SELECT id AS userId
      FROM users
      WHERE role = 'member' AND account_status = 'active'
    `
    )
    .all();
  return filterEligibleMemberUserIds(database, rows.map((row) => Number(row.userId)));
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
    groupIds: groupRows.map((row) => row.groupId),
    inviteeUserIds: loadEventInviteeUserIds(database, eventId)
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
          const startsAtLabel = formatInviteDateTime(eventRow.start_at);
          const endsAtLabel = formatInviteDateTime(eventRow.end_at);
          const venueLabel = formatInviteVenue(eventRow);
          const hostLabel = eventRow.host_name || "TBA";
          const descriptionLabel = eventRow.description ? String(eventRow.description) : "No description provided.";
          const body =
            `Starts ${startsAtLabel}. Ends ${endsAtLabel}. Venue: ${venueLabel}. Host: ${hostLabel}.` +
            (rsvpUrl ? ` Confirm participation: ${rsvpUrl}` : "");
          createInAppNotification(database, {
            userId,
            eventType: row.eventType,
            title,
            body,
            metadata: { eventId: eventRow.id, rsvpUrl },
            idempotencyKey
          });
          maybeLogSmsForNotification(database, {
            userId,
            eventId: eventRow.id,
            eventType: row.eventType,
            messageText: `${title}. ${body}`,
            urgent: false
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
                `Meeting: ${eventRow.title}\n` +
                `Starts: ${startsAtLabel}\n` +
                `Ends: ${endsAtLabel}\n` +
                `Venue: ${venueLabel}\n` +
                `Host: ${hostLabel}\n` +
                `Details: ${descriptionLabel}\n\n` +
                (rsvpUrl
                  ? `RSVP link: ${rsvpUrl}\nUse this link to confirm participation or select 'Cannot attend'.\n\n`
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
          maybeLogSmsForNotification(database, {
            userId,
            eventId: eventRow.id,
            eventType: row.eventType,
            messageText: `${title}. ${body}`,
            urgent: false
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

      if (row.eventType === "event_cancelled") {
        const eventTitle = payload.eventTitle || "Unknown event";
        const userIds = Array.isArray(payload.userIds) ? payload.userIds : [];
        const contactMap = loadUserContacts(database, userIds);
        for (const userId of userIds) {
          const cancelKey = `event_cancelled:${payload.eventId}:${userId}`;
          createInAppNotification(database, {
            userId,
            eventType: row.eventType,
            title: `Event cancelled: ${eventTitle}`,
            body: `The event "${eventTitle}" has been cancelled. If you had registered, your registration is no longer active.`,
            metadata: { eventId: payload.eventId, eventTitle },
            idempotencyKey: cancelKey
          });
          maybeLogSmsForNotification(database, {
            userId,
            eventId: payload.eventId,
            eventType: row.eventType,
            messageText: `Event cancelled: ${eventTitle}. Check the member portal for details.`,
            urgent: true
          });

          const contact = contactMap.get(userId);
          const emailKey = `event_cancelled_email:${payload.eventId}:${userId}`;
          if (contact && contact.email) {
            try {
              sendTransactionalEmail({
                to: contact.email,
                subject: `IWFSA Event Cancelled – ${eventTitle}`,
                text:
                  `Hello ${contact.fullName || contact.username || "Member"},\n\n` +
                  `The event "${eventTitle}" has been cancelled.\n` +
                  `If you had registered, your registration is no longer active.\n\n` +
                  `We apologise for any inconvenience.\n\nRegards,\nIWFSA Admin`,
                metadata: { template: "event_cancelled" }
              });
              recordNotificationDelivery(database, {
                userId,
                channel: "email",
                eventType: row.eventType,
                status: "sent",
                idempotencyKey: emailKey
              });
            } catch (emailError) {
              recordNotificationDelivery(database, {
                userId,
                channel: "email",
                eventType: row.eventType,
                status: "failed",
                idempotencyKey: emailKey,
                errorMessage: String(emailError.message || emailError)
              });
              errors.push(`email_failed:${userId}`);
            }
          } else {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: "missing_email"
            });
            errors.push(`missing_email:${userId}`);
          }
        }
      }

      if (row.eventType === "membership_dues_reminder") {
        const userId = Number(payload.userId || 0);
        const cycle = payload.membershipCycleId
          ? database
              .prepare(
                `
                SELECT
                  id,
                  membership_year AS membershipYear,
                  due_date AS dueDate,
                  status,
                  created_at AS createdAt,
                  updated_at AS updatedAt
                FROM membership_cycles
                WHERE id = ?
                LIMIT 1
              `
              )
              .get(Number(payload.membershipCycleId))
          : null;
        if (!Number.isInteger(userId) || userId <= 0 || !cycle) {
          throw new Error("Membership dues reminder target not found.");
        }
        const contact = loadUserContacts(database, [userId]).get(userId);
        const account = loadMemberFeeAccountForCycle(database, { userId, membershipCycleId: cycle.id });
        const amountDue = Number(account?.amountDue ?? payload.amountDue ?? 0);
        const amountPaid = Number(account?.amountPaid ?? payload.amountPaid ?? 0);
        const balance = Number(account?.balance ?? payload.balance ?? amountDue - amountPaid);
        const dueDate = cycle.dueDate || payload.dueDate || `${cycle.membershipYear}-03-31`;
        const title = `Membership dues reminder: ${cycle.membershipYear}`;
        const body =
          `Membership fees for ${cycle.membershipYear} are due by ${dueDate}. ` +
          `Current balance: ${formatMembershipMoney(balance)}.`;
        const dispatchId = payload.dispatchId || String(row.id);
        const inAppKey = `membership_dues_reminder:${dispatchId}:${userId}`;
        createInAppNotification(database, {
          userId,
          eventType: row.eventType,
          title,
          body,
          metadata: {
            membershipCycleId: cycle.id,
            membershipYear: cycle.membershipYear,
            dueDate,
            amountDue,
            amountPaid,
            balance
          },
          idempotencyKey: inAppKey
        });

        const emailKey = `membership_dues_reminder_email:${dispatchId}:${userId}`;
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
        } else {
          try {
            sendTransactionalEmail({
              to: contact.email,
              subject: title,
              text:
                `Hello ${contact.fullName || contact.username || "Member"},\n\n` +
                `${body}\n\n` +
                "Please contact IWFSA Admin if you have already paid or need assistance.\n\n" +
                "Regards,\nIWFSA Admin",
              metadata: { template: "membership_dues_reminder" }
            });
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "sent",
              idempotencyKey: emailKey
            });
          } catch (emailError) {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: row.eventType,
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: String(emailError.message || emailError)
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
      : responseStatus === "declined"
        ? `${responderName} indicated they are unable to attend "${eventRow.title}".`
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

function declineMeetingRsvpByToken(database, { token, summaryCache }) {
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

  const eventRow = loadEvent(database, tokenRecord.eventId);
  if (!eventRow) {
    const error = new Error("Event not found.");
    error.httpStatus = 404;
    error.code = "not_found";
    throw error;
  }

  const existingSignup = loadSignupRecord(database, tokenRecord.eventId, tokenRecord.userId);
  let idempotent = true;
  let promotedUserId = null;
  let previousStatus = existingSignup?.status || "pending";

  if (existingSignup && (existingSignup.status === "confirmed" || existingSignup.status === "waitlisted")) {
    const cancellation = cancelMemberRegistration(database, {
      eventId: tokenRecord.eventId,
      userId: tokenRecord.userId,
      summaryCache
    });
    idempotent = false;
    promotedUserId = cancellation?.promoted?.userId || null;
    previousStatus = existingSignup.status;
  } else if (!existingSignup) {
    database
      .prepare(
        `
        INSERT INTO signups (event_id, user_id, status, created_at, updated_at)
        VALUES (?, ?, 'cancelled', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run(tokenRecord.eventId, tokenRecord.userId);
    idempotent = false;
    previousStatus = "pending";
  } else if (existingSignup.status === "cancelled") {
    previousStatus = "cancelled";
  }

  if (!tokenRecord.usedAt) {
    markMeetingRsvpTokenUsed(database, tokenRecord.id);
  }

  createInAppNotification(database, {
    userId: tokenRecord.userId,
    eventType: "meeting_rsvp_declined",
    title: "RSVP recorded",
    body: `You indicated you are unable to attend "${eventRow.title}".`,
    metadata: { eventId: Number(tokenRecord.eventId), status: "declined" },
    idempotencyKey: `meeting_rsvp_declined:${tokenRecord.eventId}:${tokenRecord.userId}`
  });

  notifyMeetingOrganizerAboutResponse(database, {
    eventRow,
    responderUserId: tokenRecord.userId,
    responseStatus: "declined"
  });

  database
    .prepare(
      `
      INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
      VALUES (?, 'meeting_rsvp_declined', 'event', ?, ?)
    `
    )
    .run(
      tokenRecord.userId,
      String(tokenRecord.eventId),
      JSON.stringify({
        previousStatus,
        promotedUserId,
        idempotent,
        source: "email_link"
      })
    );

  return {
    eventId: tokenRecord.eventId,
    userId: tokenRecord.userId,
    eventTitle: eventRow.title,
    startAt: eventRow.start_at,
    status: "declined",
    promotedUserId,
    idempotent
  };
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
          createInAppNotification(database, {
            userId: promoted.userId,
            eventType: "waitlist_promoted",
            title: `Waitlist promotion: ${eventRow.title}`,
            body: `A space has opened for "${eventRow.title}" and your registration is now confirmed.`,
            metadata: { eventId },
            idempotencyKey: `waitlist_promoted:${eventId}:${promoted.userId}`
          });

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
            idempotencyKey: `waitlist_promoted_email:${eventId}:${promoted?.userId || "unknown"}`
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
  const seedMembersEnabled = config.seedMembersEnabled !== false;
  try {
    ensureBootstrapAdmin(database);
    if (seedMembersEnabled) {
      ensureSeedMembers(database);
    }
  } catch (error) {
    console.error(
      JSON.stringify({
        level: "error",
        event: "bootstrap_seed_failed",
        message: String(error.message || error)
      })
    );
  }
  const sharePointClient =
    config.sharePointClient ||
    createSharePointClient(config.sharePoint || {}, {
      fetchImpl: config.fetchImpl || fetch
    });
  const teamsGraphClient =
    config.teamsGraphClient ||
    createTeamsGraphClient(config.teamsGraph || {}, {
      fetchImpl: config.fetchImpl || fetch
    });
  const calendarSyncClient =
    config.calendarSyncClient ||
    createCalendarSyncClient(config.calendarSync || {}, {
      fetchImpl: config.fetchImpl || fetch
    });
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

    if (request.method === "GET" && requestUrl.pathname === "/api/member/profile") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const profileRow = loadMemberProfile(database, auth.user.id);
      if (!profileRow) {
        writeJson(response, 404, { error: "not_found", message: "Member profile not found." }, corsHeaders);
        return;
      }

      writeJson(response, 200, { item: toMemberProfileResponse(profileRow) }, corsHeaders);
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname === "/api/member/profile") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const profileRow = loadMemberProfile(database, auth.user.id);
        if (!profileRow) {
          writeJson(response, 404, { error: "not_found", message: "Member profile not found." }, corsHeaders);
          return;
        }

        const current = toMemberProfileResponse(profileRow);
        const fullName =
          payload.fullName !== undefined
            ? toNullableTrimmedString(payload.fullName, { maxLength: 160 })
            : toNullableTrimmedString(current.fullName, { maxLength: 160 });
        if (!fullName) {
          writeJson(response, 400, { error: "validation_error", message: "Full name is required." }, corsHeaders);
          return;
        }

        const company =
          payload.company !== undefined
            ? toNullableTrimmedString(payload.company, { maxLength: 180 })
            : toNullableTrimmedString(current.company, { maxLength: 180 });
        const phone =
          payload.phone !== undefined
            ? toNullableTrimmedString(payload.phone, { maxLength: 48 })
            : toNullableTrimmedString(current.phone, { maxLength: 48 });

        const birthdayVisibility =
          payload.birthdayVisibility !== undefined
            ? normalizeBirthdayVisibility(payload.birthdayVisibility, current.birthdayVisibility || "hidden")
            : normalizeBirthdayVisibility(current.birthdayVisibility || "hidden", "hidden");

        let birthdayMonth = current.birthdayMonth;
        let birthdayDay = current.birthdayDay;
        const clearBirthday = parseBooleanInput(payload.clearBirthday, false);
        const birthdayTouched =
          clearBirthday || payload.birthdayMonth !== undefined || payload.birthdayDay !== undefined;

        if (birthdayTouched) {
          if (clearBirthday) {
            birthdayMonth = null;
            birthdayDay = null;
          } else {
            const nextMonth = toOptionalInteger(payload.birthdayMonth);
            const nextDay = toOptionalInteger(payload.birthdayDay);
            if (!Number.isInteger(nextMonth) || !Number.isInteger(nextDay)) {
              writeJson(
                response,
                400,
                { error: "validation_error", message: "Birthday month and day must both be provided." },
                corsHeaders
              );
              return;
            }
            if (!isValidBirthdayMonthDay(nextMonth, nextDay)) {
              writeJson(response, 400, { error: "validation_error", message: "Birthday is not valid." }, corsHeaders);
              return;
            }
            birthdayMonth = nextMonth;
            birthdayDay = nextDay;
          }
        }

        if ((birthdayMonth === null) !== (birthdayDay === null)) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Birthday month and day must both be set or both be empty." },
            corsHeaders
          );
          return;
        }

        const birthdayConsentConfirmedAt =
          birthdayMonth !== null && birthdayDay !== null && birthdayVisibility !== "hidden"
            ? new Date().toISOString()
            : null;

        upsertMemberProfile(database, auth.user.id, {
          fullName,
          company,
          phone,
          photoUrl: current.photoUrl,
          birthdayMonth,
          birthdayDay,
          birthdayVisibility,
          birthdayConsentConfirmedAt
        });

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_profile_updated', 'user', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(auth.user.id),
            JSON.stringify({
              fullName,
              hasCompany: Boolean(company),
              hasPhone: Boolean(phone),
              birthdayMonth,
              birthdayDay,
              birthdayVisibility
            })
          );

        const refreshed = loadMemberProfile(database, auth.user.id);
        writeJson(response, 200, { updated: true, item: toMemberProfileResponse(refreshed) }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/member/profile/photo") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      let formData;
      try {
        formData = await readMultipartForm(request, { maxFileSizeBytes: MEMBER_PROFILE_PHOTO_MAX_FILE_SIZE_BYTES });
      } catch (error) {
        if (String(error.message || error) === "file_too_large") {
          writeJson(response, 413, { error: "file_too_large", message: "Photo exceeds the size limit." }, corsHeaders);
          return;
        }
        writeJson(response, 400, { error: "invalid_form", message: "Unable to parse photo upload." }, corsHeaders);
        return;
      }

      if (!formData.file?.buffer || formData.file.buffer.length === 0) {
        writeJson(response, 400, { error: "validation_error", message: "Photo file is required." }, corsHeaders);
        return;
      }

      const mimeType = String(formData.file.mimeType || "").trim().toLowerCase();
      if (!MEMBER_PROFILE_PHOTO_MIME_TYPES.has(mimeType)) {
        writeJson(
          response,
          400,
          { error: "validation_error", message: "Photo must be jpeg, png, webp, or gif." },
          corsHeaders
        );
        return;
      }

      const profileRow = loadMemberProfile(database, auth.user.id);
      if (!profileRow) {
        writeJson(response, 404, { error: "not_found", message: "Member profile not found." }, corsHeaders);
        return;
      }

      const current = toMemberProfileResponse(profileRow);
      const photoUrl = `data:${mimeType};base64,${formData.file.buffer.toString("base64")}`;

      upsertMemberProfile(database, auth.user.id, {
        fullName: toNullableTrimmedString(current.fullName, { maxLength: 160 }) || auth.user.username,
        company: toNullableTrimmedString(current.company, { maxLength: 180 }),
        phone: toNullableTrimmedString(current.phone, { maxLength: 48 }),
        photoUrl,
        birthdayMonth: current.birthdayMonth,
        birthdayDay: current.birthdayDay,
        birthdayVisibility: normalizeBirthdayVisibility(current.birthdayVisibility || "hidden", "hidden"),
        birthdayConsentConfirmedAt:
          current.birthdayMonth && current.birthdayDay && current.birthdayVisibility !== "hidden"
            ? new Date().toISOString()
            : null
      });

      database
        .prepare(
          `
          INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
          VALUES (?, 'member_profile_photo_uploaded', 'user', ?, ?)
        `
        )
        .run(auth.user.id, String(auth.user.id), JSON.stringify({ mimeType, size: formData.file.buffer.length }));

      writeJson(response, 200, { updated: true, photoUrl }, corsHeaders);
      return;
    }

    if (request.method === "DELETE" && requestUrl.pathname === "/api/member/profile/photo") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const profileRow = loadMemberProfile(database, auth.user.id);
      if (!profileRow) {
        writeJson(response, 404, { error: "not_found", message: "Member profile not found." }, corsHeaders);
        return;
      }

      const current = toMemberProfileResponse(profileRow);
      upsertMemberProfile(database, auth.user.id, {
        fullName: toNullableTrimmedString(current.fullName, { maxLength: 160 }) || auth.user.username,
        company: toNullableTrimmedString(current.company, { maxLength: 180 }),
        phone: toNullableTrimmedString(current.phone, { maxLength: 48 }),
        photoUrl: null,
        birthdayMonth: current.birthdayMonth,
        birthdayDay: current.birthdayDay,
        birthdayVisibility: normalizeBirthdayVisibility(current.birthdayVisibility || "hidden", "hidden"),
        birthdayConsentConfirmedAt:
          current.birthdayMonth && current.birthdayDay && current.birthdayVisibility !== "hidden"
            ? new Date().toISOString()
            : null
      });

      database
        .prepare(
          `
          INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
          VALUES (?, 'member_profile_photo_removed', 'user', ?, ?)
        `
        )
        .run(auth.user.id, String(auth.user.id), JSON.stringify({ removed: true }));

      writeJson(response, 200, { updated: true, photoUrl: null }, corsHeaders);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/member/home") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const decoratedEvents = decorateEventsForViewer(
        database,
        listPublishedEvents(database, auth.user, ""),
        auth.user,
        eventSummaryCache
      );
      const nowMs = Date.now();
      const invites = decoratedEvents
        .filter((item) => {
          const endAtMs = parseIsoToMs(item.endAt);
          return endAtMs === null || endAtMs >= nowMs - 6 * 60 * 60 * 1000;
        })
        .sort((left, right) => {
          const leftMs = parseIsoToMs(left.startAt) || 0;
          const rightMs = parseIsoToMs(right.startAt) || 0;
          return leftMs - rightMs;
        })
        .slice(0, 12)
        .map((item) => ({
          id: Number(item.id),
          title: String(item.title || "Untitled Event"),
          startAt: item.startAt,
          endAt: item.endAt,
          venueType: item.venueType,
          venueName: item.venueName || null,
          venueAddress: item.venueAddress || null,
          onlineJoinUrl: item.onlineJoinUrl || null,
          registrationClosesAt: item.countdownEndsAt || item.registrationClosesAt || null,
          invitationStatus: mapInvitationStatus(item.mySignupStatus),
          mySignupStatus: item.mySignupStatus,
          audienceLabel: item.audienceLabel || "All Members"
        }));

      const awaitingResponseCount = invites.filter((item) => item.invitationStatus === "awaiting_response").length;

      let newsItems = listPublishedMemberNewsItems(database, { limit: 8 });
      if (newsItems.length === 0) {
        newsItems = listMemberNotificationNewsItems(database, auth.user.id, { limit: 8 });
      }
      if (newsItems.length === 0) {
        newsItems = invites.slice(0, 4).map((invite) => ({
          id: invite.id,
          eventType: "event_invite",
          title: `Invitation: ${invite.title}`,
          body: "You have an event invitation in your member portal.",
          createdAt: invite.startAt,
          readAt: null
        }));
      }

      const birthdayHighlights = listMemberBirthdayHighlights(database, { windowDays: 30, limit: 5 });

      writeJson(
        response,
        200,
        {
          generatedAt: new Date().toISOString(),
          invites: {
            total: invites.length,
            awaitingResponse: awaitingResponseCount,
            items: invites
          },
          news: {
            total: newsItems.length,
            items: newsItems
          },
          birthdays: {
            total: birthdayHighlights.length,
            items: birthdayHighlights
          }
        },
        corsHeaders
      );
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/member/directory") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }
      if (!requireActivationClear(auth.user, response, corsHeaders)) {
        return;
      }

      const search = requestUrl.searchParams.get("search") || "";
      const limit = Number(requestUrl.searchParams.get("limit") || 80);
      const items = listActiveMemberDirectory(database, { search, limit });
      writeJson(response, 200, { items }, corsHeaders);
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/calendar-sync/connections") {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }
      const items = listCalendarConnections(database, auth.user.id).map((row) => ({
        provider: row.provider,
        status: row.status,
        externalAccountEmail: row.externalAccountEmail || null,
        tokenExpiresAt: row.tokenExpiresAt || null,
        scope: row.scope || "",
        updatedAt: row.updatedAt,
        revokedAt: row.revokedAt || null
      }));
      writeJson(
        response,
        200,
        {
          featureEnabled: Boolean(config.calendarSync?.enabled),
          items
        },
        corsHeaders
      );
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/calendar-sync/oauth/start") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        const payload = await readJsonBody(request);
        const provider = normalizeCalendarProvider(payload.provider);
        const state = createCalendarOauthState(database, auth.user.id, provider);
        const start = calendarSyncClient.createAuthorizationRequest({
          provider,
          state: state.stateToken
        });
        writeJson(
          response,
          200,
          {
            provider,
            state: state.stateToken,
            expiresAt: state.expiresAt,
            authorizationUrl: start.authorizationUrl
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "calendar_sync_start_failed", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/calendar-sync/oauth/callback") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        const payload = await readJsonBody(request);
        const provider = normalizeCalendarProvider(payload.provider);
        const stateToken = String(payload.state || "").trim();
        const code = String(payload.code || "").trim();
        if (!stateToken || !code) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "State token and OAuth code are required." },
            corsHeaders
          );
          return;
        }
        const state = consumeCalendarOauthState(database, auth.user.id, provider, stateToken);
        if (!state) {
          writeJson(
            response,
            403,
            { error: "invalid_state", message: "OAuth state is invalid or expired." },
            corsHeaders
          );
          return;
        }
        const tokenData = await calendarSyncClient.exchangeCode({ provider, code });
        upsertCalendarConnection(database, auth.user.id, provider, tokenData);
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'calendar_sync_connected', 'user', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(auth.user.id),
            JSON.stringify({ provider })
          );
        writeJson(response, 200, { connected: true, provider }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "calendar_sync_connect_failed", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/calendar-sync/disconnect") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        const payload = await readJsonBody(request);
        const provider = normalizeCalendarProvider(payload.provider);
        try {
          await calendarSyncClient.revokeConnection({ provider });
        } catch {
          // Keep local revocation authoritative even when provider revoke endpoint fails.
        }
        revokeCalendarConnection(database, auth.user.id, provider);
        markCalendarSyncFailuresResolved(database, { userId: auth.user.id, provider });
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'calendar_sync_disconnected', 'user', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(auth.user.id),
            JSON.stringify({ provider })
          );
        writeJson(response, 200, { disconnected: true, provider }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "calendar_sync_disconnect_failed", message: String(error.message || error) },
          corsHeaders
        );
      }
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

    if (request.method === "GET" && /^\/api\/events\/\d+\/documents$/.test(requestUrl.pathname)) {
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
      if (!eventRow || !canUserViewEvent(database, auth.user, eventRow, eventId)) {
        writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
        return;
      }

      const includeInternal = canEditEvent(database, auth.user, eventId, { eventRow });
      const items = listEventDocuments(database, eventId)
        .filter((item) => {
          if (includeInternal) {
            return true;
          }
          if (!isEventDocumentPublished(item)) {
            return false;
          }
          return canMemberDownloadEventDocument(database, {
            eventId,
            userId: auth.user.id,
            documentRow: item
          });
        })
        .map((item) => toEventDocumentResponseItem(item, { includeInternal }));
      writeJson(response, 200, { items }, corsHeaders);
      return;
    }

    if (request.method === "POST" && /^\/api\/events\/\d+\/documents$/.test(requestUrl.pathname)) {
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
        writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
        return;
      }
      if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
        writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
        return;
      }

      let formData;
      try {
        formData = await readMultipartForm(request, { maxFileSizeBytes: EVENT_DOCUMENT_MAX_FILE_SIZE_BYTES });
      } catch (error) {
        if (String(error.message || error) === "file_too_large") {
          writeJson(response, 413, { error: "file_too_large", message: "Upload exceeds size limit." }, corsHeaders);
          return;
        }
        writeJson(response, 400, { error: "invalid_form", message: "Unable to parse upload." }, corsHeaders);
        return;
      }

      if (!formData.file?.buffer || !formData.file.filename) {
        writeJson(response, 400, { error: "validation_error", message: "Document file is required." }, corsHeaders);
        return;
      }

      const documentType = String(formData.fields.documentType || "attachment")
        .trim()
        .toLowerCase();
      if (!EVENT_DOCUMENT_TYPES.has(documentType)) {
        writeJson(
          response,
          400,
          { error: "validation_error", message: "documentType must be agenda, minutes, or attachment." },
          corsHeaders
        );
        return;
      }

      const availabilityMode = String(formData.fields.availabilityMode || "immediate")
        .trim()
        .toLowerCase();
      if (!EVENT_DOCUMENT_AVAILABILITY_MODES.has(availabilityMode)) {
        writeJson(
          response,
          400,
          { error: "validation_error", message: "availabilityMode must be immediate, after_event, or scheduled." },
          corsHeaders
        );
        return;
      }

      try {
        const safeFileName = sanitizeEventDocumentFileName(formData.file.filename);
        const fileBuffer = formData.file.buffer;
        const mimeType = String(formData.file.mimeType || "application/octet-stream").trim();
        if (!isAllowedEventDocumentUpload(safeFileName, mimeType)) {
          writeJson(
            response,
            400,
            {
              error: "validation_error",
              message: "Unsupported file type. Upload a document format such as PDF, Word, Excel, PowerPoint, CSV, or TXT."
            },
            corsHeaders
          );
          return;
        }
        const sizeBytes = Number(fileBuffer.byteLength || 0);
        const checksumSha256 = createHash("sha256").update(fileBuffer).digest("hex");
        const publishNow = parseBooleanInput(formData.fields.publishNow, true);
        const memberAccessScope = normalizeEventDocumentMemberAccessScope(formData.fields.memberAccessScope, "all_visible");
        const availableFrom = resolveEventDocumentAvailability(
          eventRow,
          availabilityMode,
          formData.fields.availableFrom,
          Number(formData.fields.availabilityOffsetMinutes || 0)
        );

        const uploaded = await sharePointClient.uploadEventDocument({
          folderPath: buildEventDocumentFolderPath(eventRow, eventId),
          fileName: safeFileName,
          mimeType,
          fileBuffer
        });

        const insertResult = database
          .prepare(
            `
            INSERT INTO event_documents (
              event_id,
              document_type,
              file_name,
              mime_type,
              size_bytes,
              checksum_sha256,
              sharepoint_site_id,
              sharepoint_drive_id,
              sharepoint_item_id,
              sharepoint_web_url,
              availability_mode,
              available_from,
              published_at,
              published_by_user_id,
              member_access_scope,
              uploaded_by_user_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `
          )
          .run(
            eventId,
            documentType,
            safeFileName,
            mimeType,
            sizeBytes,
            checksumSha256,
            uploaded.siteId,
            uploaded.driveId,
            uploaded.itemId,
            uploaded.webUrl || null,
            availabilityMode,
            availableFrom,
            publishNow ? new Date().toISOString() : null,
            publishNow ? auth.user.id : null,
            memberAccessScope,
            auth.user.id
          );

        const documentId = Number(insertResult.lastInsertRowid);
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_document_uploaded', 'event_document', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(documentId),
            JSON.stringify({
              eventId,
              documentType,
              fileName: safeFileName,
              sizeBytes,
              availabilityMode,
              availableFrom,
              publishedNow: publishNow,
              memberAccessScope
            })
          );

        const created = loadEventDocument(database, eventId, documentId);
        writeJson(
          response,
          201,
          { created: true, item: toEventDocumentResponseItem(created, { includeInternal: true }) },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 502),
          {
            error: error.code || "sharepoint_upload_failed",
            message: String(error.message || "Unable to upload document.")
          },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && /^\/api\/events\/\d+\/documents\/\d+\/download$/.test(requestUrl.pathname)) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const eventId = Number(parts[3]);
      const documentId = Number(parts[5]);
      if (!Number.isInteger(eventId) || !Number.isInteger(documentId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event and document id are required." }, corsHeaders);
        return;
      }

      const eventRow = loadEvent(database, eventId);
      if (!eventRow || !canUserViewEvent(database, auth.user, eventRow, eventId)) {
        writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
        return;
      }

      const documentRow = loadEventDocument(database, eventId, documentId);
      if (!documentRow || documentRow.removedAt) {
        writeJson(response, 404, { error: "not_found", message: "Document not found." }, corsHeaders);
        return;
      }

      const canEdit = canEditEvent(database, auth.user, eventId, { eventRow });
      if (!canEdit && !isEventDocumentPublished(documentRow)) {
        writeJson(response, 403, { error: "forbidden", message: "Document is not published yet." }, corsHeaders);
        return;
      }
      if (!isEventDocumentAvailable(documentRow) && !canEdit) {
        writeJson(response, 403, { error: "forbidden", message: "Document is not available yet." }, corsHeaders);
        return;
      }
      if (
        !canEdit &&
        !canMemberDownloadEventDocument(database, {
          eventId,
          userId: auth.user.id,
          documentRow
        })
      ) {
        writeJson(
          response,
          403,
          { error: "forbidden", message: "This document is restricted to invited members marked as attended." },
          corsHeaders
        );
        return;
      }

      try {
        const upstream = await sharePointClient.downloadEventDocument({
          siteId: documentRow.sharePointSiteId,
          driveId: documentRow.sharePointDriveId,
          itemId: documentRow.sharePointItemId
        });
        if (!upstream.ok || !upstream.body) {
          writeJson(
            response,
            502,
            { error: "sharepoint_download_failed", message: "Unable to retrieve document from SharePoint." },
            corsHeaders
          );
          return;
        }

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_document_downloaded', 'event_document', ?, ?)
          `
          )
          .run(auth.user.id, String(documentId), JSON.stringify({ eventId }));

        response.writeHead(200, {
          ...corsHeaders,
          "Content-Type": documentRow.mimeType || upstream.headers.get("content-type") || "application/octet-stream",
          "Content-Disposition": `attachment; filename="${sanitizeEventDocumentFileName(documentRow.fileName)}"`
        });

        const bodyStream =
          typeof upstream.body.pipe === "function"
            ? upstream.body
            : Readable.fromWeb(upstream.body);
        bodyStream.on("error", () => {
          if (!response.writableEnded) {
            response.end();
          }
        });
        bodyStream.pipe(response);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 502),
          {
            error: error.code || "sharepoint_download_failed",
            message: String(error.message || "Unable to download document.")
          },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "DELETE" && /^\/api\/events\/\d+\/documents\/\d+$/.test(requestUrl.pathname)) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const eventId = Number(parts[3]);
      const documentId = Number(parts[5]);
      if (!Number.isInteger(eventId) || !Number.isInteger(documentId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event and document id are required." }, corsHeaders);
        return;
      }

      const eventRow = loadEvent(database, eventId);
      if (!eventRow) {
        writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
        return;
      }
      if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
        writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
        return;
      }

      const documentRow = loadEventDocument(database, eventId, documentId);
      if (!documentRow || documentRow.removedAt) {
        writeJson(response, 404, { error: "not_found", message: "Document not found." }, corsHeaders);
        return;
      }

      const result = database
        .prepare(
          `
          UPDATE event_documents
          SET removed_at = CURRENT_TIMESTAMP,
              removed_by_user_id = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND event_id = ? AND removed_at IS NULL
        `
        )
        .run(auth.user.id, documentId, eventId);

      if (result.changes > 0) {
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_document_removed', 'event_document', ?, ?)
          `
          )
          .run(auth.user.id, String(documentId), JSON.stringify({ eventId }));
      }

      writeJson(response, 200, { removed: result.changes > 0 }, corsHeaders);
      return;
    }

    if (request.method === "POST" && /^\/api\/events\/\d+\/documents\/\d+\/publish$/.test(requestUrl.pathname)) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const eventId = Number(parts[3]);
      const documentId = Number(parts[5]);
      if (!Number.isInteger(eventId) || !Number.isInteger(documentId)) {
        writeJson(response, 400, { error: "validation_error", message: "Event and document id are required." }, corsHeaders);
        return;
      }

      const eventRow = loadEvent(database, eventId);
      if (!eventRow) {
        writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
        return;
      }
      if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
        writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
        return;
      }

      const documentRow = loadEventDocument(database, eventId, documentId);
      if (!documentRow || documentRow.removedAt) {
        writeJson(response, 404, { error: "not_found", message: "Document not found." }, corsHeaders);
        return;
      }

      try {
        const payload = await readJsonBody(request);
        const memberAccessScope = normalizeEventDocumentMemberAccessScope(
          payload.memberAccessScope,
          documentRow.memberAccessScope || "all_visible"
        );
        const publishAtSource = String(payload.publishAt || "").trim();
        const publishAt = publishAtSource ? new Date(publishAtSource).toISOString() : new Date().toISOString();
        if (!Number.isFinite(Date.parse(publishAt))) {
          writeJson(response, 400, { error: "validation_error", message: "publishAt must be a valid ISO date/time." }, corsHeaders);
          return;
        }
        database
          .prepare(
            `
            UPDATE event_documents
            SET
              published_at = ?,
              published_by_user_id = ?,
              member_access_scope = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ? AND event_id = ? AND removed_at IS NULL
          `
          )
          .run(publishAt, auth.user.id, memberAccessScope, documentId, eventId);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_document_published', 'event_document', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(documentId),
            JSON.stringify({ eventId, memberAccessScope, publishAt })
          );

        const refreshed = loadEventDocument(database, eventId, documentId);
        writeJson(
          response,
          200,
          { published: true, item: toEventDocumentResponseItem(refreshed, { includeInternal: true }) },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && /^\/api\/events\/\d+\/attendance$/.test(requestUrl.pathname)) {
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
        writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
        return;
      }
      if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
        writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
        return;
      }

      const items = listEventAttendance(database, eventId).map((row) => ({
        userId: Number(row.userId),
        username: row.username || null,
        email: row.email || null,
        signupStatus: row.signupStatus || "pending",
        attendanceStatus: row.attendanceStatus || "unmarked",
        markedAt: row.markedAt || null,
        updatedAt: row.updatedAt || null
      }));
      writeJson(response, 200, { eventId, items }, corsHeaders);
      return;
    }

    if (request.method === "PUT" && /^\/api\/events\/\d+\/attendance$/.test(requestUrl.pathname)) {
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
        writeJson(response, 404, { error: "not_found", message: "Event not found." }, corsHeaders);
        return;
      }
      if (!canEditEvent(database, auth.user, eventId, { eventRow })) {
        writeJson(response, 403, { error: "forbidden", message: "Insufficient permissions." }, corsHeaders);
        return;
      }

      try {
        const payload = await readJsonBody(request);
        const sourceRecords = Array.isArray(payload.records) ? payload.records : [payload];
        if (!sourceRecords.length) {
          writeJson(response, 400, { error: "validation_error", message: "At least one attendance record is required." }, corsHeaders);
          return;
        }

        const normalizedRecords = sourceRecords.map((item) => {
          const userId = Number(item?.userId);
          const attendanceStatus = String(item?.attendanceStatus || "")
            .trim()
            .toLowerCase();
          if (!Number.isInteger(userId) || userId <= 0) {
            const error = new Error("Each attendance record must include a valid userId.");
            error.httpStatus = 400;
            error.code = "validation_error";
            throw error;
          }
          if (!["attended", "absent", "excused"].includes(attendanceStatus)) {
            const error = new Error("attendanceStatus must be attended, absent, or excused.");
            error.httpStatus = 400;
            error.code = "validation_error";
            throw error;
          }
          return { userId, attendanceStatus };
        });

        runTransaction(
          database,
          () => {
            const upsert = database.prepare(
              `
              INSERT INTO event_attendance (
                event_id,
                user_id,
                attendance_status,
                marked_by_user_id,
                marked_at,
                updated_at
              )
              VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT(event_id, user_id) DO UPDATE SET
                attendance_status = excluded.attendance_status,
                marked_by_user_id = excluded.marked_by_user_id,
                marked_at = CURRENT_TIMESTAMP,
                updated_at = CURRENT_TIMESTAMP
            `
            );

            for (const record of normalizedRecords) {
              const signupRow = database
                .prepare(
                  `
                  SELECT id
                  FROM signups
                  WHERE event_id = ? AND user_id = ?
                  LIMIT 1
                `
                )
                .get(eventId, record.userId);
              if (!signupRow) {
                const error = new Error(`User ${record.userId} has no RSVP record for this event.`);
                error.httpStatus = 400;
                error.code = "validation_error";
                throw error;
              }
              upsert.run(eventId, record.userId, record.attendanceStatus, auth.user.id);
            }
          },
          { immediate: true }
        );

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'event_attendance_updated', 'event', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(eventId),
            JSON.stringify({
              records: normalizedRecords
            })
          );

        const items = listEventAttendance(database, eventId).map((row) => ({
          userId: Number(row.userId),
          username: row.username || null,
          email: row.email || null,
          signupStatus: row.signupStatus || "pending",
          attendanceStatus: row.attendanceStatus || "unmarked",
          markedAt: row.markedAt || null,
          updatedAt: row.updatedAt || null
        }));
        writeJson(response, 200, { eventId, updated: normalizedRecords.length, items }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
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
              AND users.account_status = 'active'
              AND member_profiles.birthday_visibility IN ('hidden', 'members_only', 'members_and_social')
              AND member_profiles.birthday_month IS NOT NULL
              AND member_profiles.birthday_day IS NOT NULL
            GROUP BY users.id
          `
          )
          .all();

        const eligibleIdSet = new Set(
          filterEligibleMemberUserIds(
            database,
            rows.map((row) => Number(row.userId)).filter((id) => Number.isInteger(id))
          )
        );
        const people = rows
          .filter((row) => eligibleIdSet.has(Number(row.userId)))
          .map((row) => ({
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

    if (request.method === "GET" && requestUrl.pathname === "/api/notifications/sms-settings") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        if (!requireActivationClear(auth.user, response, corsHeaders)) {
          return;
        }

        const existing = loadSmsPreference(database, auth.user.id);
        const fallbackPhoneRow = database
          .prepare(
            `
            SELECT phone
            FROM member_profiles
            WHERE user_id = ?
            LIMIT 1
          `
          )
          .get(auth.user.id);
        let fallbackPhone = "";
        try {
          fallbackPhone = normalizeSmsPhone(fallbackPhoneRow?.phone || "");
        } catch {
          fallbackPhone = "";
        }
        const payload = toSmsPreferenceResponse(
          existing || {
            userId: auth.user.id,
            enabled: 0,
            phoneNumber: fallbackPhone || "",
            dailyLimit: 3,
            perEventLimit: 1,
            quietHoursStart: "21:00",
            quietHoursEnd: "07:00",
            allowUrgent: 1
          },
          auth.user.id
        );

        writeJson(
          response,
          200,
          {
            item: payload,
            limits: {
              daily: SMS_DAILY_LIMIT_RANGE,
              perEvent: SMS_PER_EVENT_LIMIT_RANGE
            }
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 500),
          { error: error.code || "internal_error", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "PUT" && requestUrl.pathname === "/api/notifications/sms-settings") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        if (!requireActivationClear(auth.user, response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const existing = loadSmsPreference(database, auth.user.id);
        const next = resolveSmsPreferencePayload(payload, existing || null);
        upsertSmsPreference(database, auth.user.id, next);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'sms_preferences_updated', 'user', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(auth.user.id),
            JSON.stringify({
              enabled: Boolean(next.enabled),
              dailyLimit: next.dailyLimit,
              perEventLimit: next.perEventLimit,
              quietHoursStart: next.quietHoursStart,
              quietHoursEnd: next.quietHoursEnd,
              allowUrgent: Boolean(next.allowUrgent)
            })
          );

        const refreshed = loadSmsPreference(database, auth.user.id);
        writeJson(response, 200, { updated: true, item: toSmsPreferenceResponse(refreshed, auth.user.id) }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/social/celebrations") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        if (!requireActivationClear(auth.user, response, corsHeaders)) {
          return;
        }

        const limit = Math.min(Math.max(Number(requestUrl.searchParams.get("limit") || 80), 1), 200);
        const canModerate = canModerateSocial(database, auth.user);
        const items = listSocialCelebrationPosts(database, { limit }).map((row) => ({
          id: Number(row.id),
          authorUserId: Number(row.authorUserId),
          authorUsername: row.authorUsername || "",
          authorEmail: row.authorEmail || "",
          bodyText: row.bodyText || "",
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
          canDelete: canModerate
        }));
        writeJson(
          response,
          200,
          {
            rules: SOCIAL_POST_RULES,
            canModerate,
            items
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 500),
          { error: error.code || "internal_error", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/social/celebrations") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
          return;
        }
        if (!requireActivationClear(auth.user, response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        if (!parseBooleanInput(payload.acknowledgeRules, false)) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Please acknowledge the community posting rules." },
            corsHeaders
          );
          return;
        }
        if (!parseBooleanInput(payload.relevantToIwfsa, false)) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Posts must be relevant to IWFSA activities." },
            corsHeaders
          );
          return;
        }
        const bodyText = normalizeSocialPostBody(payload.bodyText);

        const result = database
          .prepare(
            `
            INSERT INTO social_celebration_posts (author_user_id, body_text, created_at, updated_at)
            VALUES (?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
          )
          .run(auth.user.id, bodyText);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'social_post_created', 'social_post', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(result.lastInsertRowid),
            JSON.stringify({ length: bodyText.length })
          );

        const created = database
          .prepare(
            `
            SELECT
              social_celebration_posts.id,
              social_celebration_posts.author_user_id AS authorUserId,
              social_celebration_posts.body_text AS bodyText,
              social_celebration_posts.created_at AS createdAt,
              social_celebration_posts.updated_at AS updatedAt,
              users.username AS authorUsername,
              users.email AS authorEmail
            FROM social_celebration_posts
            JOIN users ON users.id = social_celebration_posts.author_user_id
            WHERE social_celebration_posts.id = ?
            LIMIT 1
          `
          )
          .get(result.lastInsertRowid);

        writeJson(
          response,
          201,
          {
            created: true,
            item: {
              id: Number(created.id),
              authorUserId: Number(created.authorUserId),
              authorUsername: created.authorUsername || "",
              authorEmail: created.authorEmail || "",
              bodyText: created.bodyText || "",
              createdAt: created.createdAt,
              updatedAt: created.updatedAt,
              canDelete: canModerateSocial(database, auth.user)
            }
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "DELETE" && /^\/api\/social\/celebrations\/\d+$/.test(requestUrl.pathname)) {
      const auth = requireAuth(database, request, response, corsHeaders);
      if (!auth) {
        return;
      }
      if (!requireRole(auth.user, INTERNAL_PORTAL_ROLES, response, corsHeaders)) {
        return;
      }
      if (!requireActivationClear(auth.user, response, corsHeaders)) {
        return;
      }
      if (!canModerateSocial(database, auth.user)) {
        writeJson(response, 403, { error: "forbidden", message: "Moderator permissions are required." }, corsHeaders);
        return;
      }

      const parts = requestUrl.pathname.split("/");
      const postId = Number(parts[4]);
      if (!Number.isInteger(postId)) {
        writeJson(response, 400, { error: "validation_error", message: "Post id is required." }, corsHeaders);
        return;
      }

      const result = database
        .prepare(
          `
          UPDATE social_celebration_posts
          SET removed_at = CURRENT_TIMESTAMP,
              removed_by_user_id = ?,
              removed_reason = ?,
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ? AND removed_at IS NULL
        `
        )
        .run(auth.user.id, "moderator_action", postId);

      if (result.changes > 0) {
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'social_post_removed', 'social_post', ?, ?)
          `
          )
          .run(auth.user.id, String(postId), JSON.stringify({ reason: "moderator_action" }));
      }

      writeJson(response, 200, { removed: result.changes > 0 }, corsHeaders);
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

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/news") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ADMIN_ROLES, response, corsHeaders)) {
          return;
        }

        const statusFilter = normalizeMemberNewsStatusFilter(requestUrl.searchParams.get("status"), "all");
        const limit = Math.max(1, Math.min(Number(requestUrl.searchParams.get("limit") || 50), 200));
        const items = listAdminNewsPosts(database, { status: statusFilter, limit });
        writeJson(response, 200, { status: statusFilter, limit, items }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 500),
          { error: error.code || "internal_error", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/admin/news") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ADMIN_ROLES, response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const title = toNullableTrimmedString(payload.title, { maxLength: 180 });
        const bodyText = toNullableTrimmedString(payload.body, { maxLength: 5000 });
        const status = normalizeMemberNewsStatus(payload.status, "draft");
        const isPinned = parseBooleanInput(payload.isPinned, false);
        if (!title) {
          writeJson(response, 400, { error: "validation_error", message: "title is required." }, corsHeaders);
          return;
        }
        if (!bodyText) {
          writeJson(response, 400, { error: "validation_error", message: "body is required." }, corsHeaders);
          return;
        }
        const publishedAt = status === "published" ? new Date().toISOString() : null;
        const pinnedAt = isPinned ? new Date().toISOString() : null;

        const result = database
          .prepare(
            `
            INSERT INTO member_news_posts (
              title,
              body_text,
              status,
              is_pinned,
              pinned_at,
              published_at,
              author_user_id,
              updated_by_user_id,
              created_at,
              updated_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
          `
          )
          .run(title, bodyText, status, isPinned ? 1 : 0, pinnedAt, publishedAt, auth.user.id, auth.user.id);

        const newsId = Number(result.lastInsertRowid);
        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_news_created', 'member_news', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(newsId),
            JSON.stringify({ status, isPinned, pinnedAt, publishedAt, titleLength: title.length, bodyLength: bodyText.length })
          );

        const created = loadMemberNewsPost(database, newsId);
        writeJson(response, 201, { created: true, item: toMemberNewsResponseItem(created) }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "PATCH" && /^\/api\/admin\/news\/\d+$/.test(requestUrl.pathname)) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ADMIN_ROLES, response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const newsId = Number(parts[4]);
        if (!Number.isInteger(newsId) || newsId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "News id is required." }, corsHeaders);
          return;
        }

        const existing = loadMemberNewsPost(database, newsId);
        if (!existing) {
          writeJson(response, 404, { error: "not_found", message: "News post not found." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const hasTitle = payload.title !== undefined;
        const hasBody = payload.body !== undefined;
        const hasStatus = payload.status !== undefined;
        const hasPinned = payload.isPinned !== undefined;
        if (!hasTitle && !hasBody && !hasStatus && !hasPinned) {
          writeJson(response, 400, { error: "validation_error", message: "No fields to update." }, corsHeaders);
          return;
        }

        const nextTitle = hasTitle
          ? toNullableTrimmedString(payload.title, { maxLength: 180 })
          : toNullableTrimmedString(existing.title, { maxLength: 180 });
        const nextBodyText = hasBody
          ? toNullableTrimmedString(payload.body, { maxLength: 5000 })
          : toNullableTrimmedString(existing.bodyText, { maxLength: 5000 });
        if (!nextTitle) {
          writeJson(response, 400, { error: "validation_error", message: "title is required." }, corsHeaders);
          return;
        }
        if (!nextBodyText) {
          writeJson(response, 400, { error: "validation_error", message: "body is required." }, corsHeaders);
          return;
        }

        const nextStatus = hasStatus
          ? normalizeMemberNewsStatus(payload.status, existing.status || "draft")
          : normalizeMemberNewsStatus(existing.status || "draft", "draft");
        let nextPublishedAt = existing.publishedAt || null;
        if (nextStatus === "published" && !nextPublishedAt) {
          nextPublishedAt = new Date().toISOString();
        } else if (hasStatus && nextStatus === "draft") {
          nextPublishedAt = null;
        }
        const nextIsPinned = hasPinned ? parseBooleanInput(payload.isPinned, false) : Number(existing.isPinned || 0) === 1;
        let nextPinnedAt = existing.pinnedAt || null;
        if (nextIsPinned && !nextPinnedAt) {
          nextPinnedAt = new Date().toISOString();
        }
        if (!nextIsPinned) {
          nextPinnedAt = null;
        }

        database
          .prepare(
            `
            UPDATE member_news_posts
            SET
              title = ?,
              body_text = ?,
              status = ?,
              is_pinned = ?,
              pinned_at = ?,
              published_at = ?,
              updated_by_user_id = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          )
          .run(nextTitle, nextBodyText, nextStatus, nextIsPinned ? 1 : 0, nextPinnedAt, nextPublishedAt, auth.user.id, newsId);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_news_updated', 'member_news', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(newsId),
            JSON.stringify({
              previousStatus: existing.status || "draft",
              status: nextStatus,
              previousIsPinned: Number(existing.isPinned || 0) === 1,
              isPinned: nextIsPinned,
              pinnedAt: nextPinnedAt,
              publishedAt: nextPublishedAt,
              titleChanged: nextTitle !== String(existing.title || ""),
              bodyChanged: nextBodyText !== String(existing.bodyText || "")
            })
          );

        const refreshed = loadMemberNewsPost(database, newsId);
        writeJson(response, 200, { updated: true, item: toMemberNewsResponseItem(refreshed) }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && /^\/api\/admin\/news\/\d+\/publish$/.test(requestUrl.pathname)) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ADMIN_ROLES, response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const newsId = Number(parts[4]);
        if (!Number.isInteger(newsId) || newsId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "News id is required." }, corsHeaders);
          return;
        }

        const existing = loadMemberNewsPost(database, newsId);
        if (!existing) {
          writeJson(response, 404, { error: "not_found", message: "News post not found." }, corsHeaders);
          return;
        }

        const publishAt = existing.publishedAt || new Date().toISOString();
        const isPinned = Number(existing.isPinned || 0) === 1;
        const pinnedAt = isPinned ? existing.pinnedAt || new Date().toISOString() : null;
        database
          .prepare(
            `
            UPDATE member_news_posts
            SET
              status = 'published',
              is_pinned = ?,
              pinned_at = ?,
              published_at = ?,
              updated_by_user_id = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          )
          .run(isPinned ? 1 : 0, pinnedAt, publishAt, auth.user.id, newsId);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_news_published', 'member_news', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(newsId),
            JSON.stringify({
              previousStatus: existing.status || "draft",
              isPinned,
              pinnedAt,
              publishedAt: publishAt
            })
          );

        const refreshed = loadMemberNewsPost(database, newsId);
        writeJson(response, 200, { published: true, item: toMemberNewsResponseItem(refreshed) }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 500),
          { error: error.code || "internal_error", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && /^\/api\/admin\/news\/\d+\/archive$/.test(requestUrl.pathname)) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ADMIN_ROLES, response, corsHeaders)) {
          return;
        }

        const parts = requestUrl.pathname.split("/");
        const newsId = Number(parts[4]);
        if (!Number.isInteger(newsId) || newsId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "News id is required." }, corsHeaders);
          return;
        }

        const existing = loadMemberNewsPost(database, newsId);
        if (!existing) {
          writeJson(response, 404, { error: "not_found", message: "News post not found." }, corsHeaders);
          return;
        }

        database
          .prepare(
            `
            UPDATE member_news_posts
            SET
              status = 'archived',
              is_pinned = 0,
              pinned_at = NULL,
              updated_by_user_id = ?,
              updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `
          )
          .run(auth.user.id, newsId);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'member_news_archived', 'member_news', ?, ?)
          `
          )
          .run(
            auth.user.id,
            String(newsId),
            JSON.stringify({
              previousStatus: existing.status || "draft",
              previousIsPinned: Number(existing.isPinned || 0) === 1
            })
          );

        const refreshed = loadMemberNewsPost(database, newsId);
        writeJson(response, 200, { archived: true, item: toMemberNewsResponseItem(refreshed) }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 500),
          { error: error.code || "internal_error", message: String(error.message || error) },
          corsHeaders
        );
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
              users.email AS email,
              member_profiles.full_name AS fullName,
              member_profiles.phone AS phone,
              member_profiles.company AS organisation
            FROM notification_deliveries
            LEFT JOIN users ON users.id = notification_deliveries.user_id
            LEFT JOIN member_profiles ON member_profiles.user_id = notification_deliveries.user_id
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

        const counts = database
          .prepare(
            `
            SELECT
              COALESCE(SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END), 0) AS pending,
              COALESCE(SUM(CASE WHEN status = 'processing' THEN 1 ELSE 0 END), 0) AS processing,
              COALESCE(SUM(CASE WHEN status = 'sent' THEN 1 ELSE 0 END), 0) AS sent,
              COALESCE(SUM(CASE WHEN status = 'failed' THEN 1 ELSE 0 END), 0) AS failed
            FROM notification_queue
          `
          )
          .get();

        const total = (counts.pending || 0) + (counts.processing || 0) + (counts.sent || 0) + (counts.failed || 0);
        let healthLabel = "Healthy";
        if ((counts.failed || 0) > 0 && (counts.failed || 0) >= (counts.sent || 1)) {
          healthLabel = "Attention needed";
        } else if ((counts.failed || 0) > 0 || (counts.processing || 0) > 5) {
          healthLabel = "Degraded";
        }

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

        writeJson(
          response,
          200,
          {
            health: healthLabel,
            counts: { pending: counts.pending, processing: counts.processing, sent: counts.sent, failed: counts.failed, total },
            items: rows
          },
          corsHeaders
        );
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

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/reports/dashboard") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const windowDays = Number(requestUrl.searchParams.get("days") || 30);
        const report = buildAdminEngagementReport(database, windowDays);
        writeJson(response, 200, report, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load reporting dashboard.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/reports/dashboard.csv") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const windowDays = Number(requestUrl.searchParams.get("days") || 30);
        const report = buildAdminEngagementReport(database, windowDays);
        const header = [
          "window_days",
          "since_utc",
          "active_members",
          "sms_opt_in_members",
          "sms_sent",
          "sms_blocked",
          "sms_failed",
          "social_posts",
          "social_removed",
          "published_events",
          "confirmed_signups",
          "waitlisted_signups",
          "attended_members",
          "published_documents",
          "restricted_documents"
        ];
        const values = [
          report.windowDays,
          report.sinceIso,
          report.summary.activeMembers,
          report.summary.smsOptInMembers,
          report.summary.smsSent,
          report.summary.smsBlocked,
          report.summary.smsFailed,
          report.summary.socialPosts,
          report.summary.socialRemoved,
          report.summary.publishedEvents,
          report.summary.confirmedSignups,
          report.summary.waitlistedSignups,
          report.summary.attendedMembers,
          report.summary.publishedDocuments,
          report.summary.restrictedDocuments
        ];
        const csv = `${header.map(escapeCsvCell).join(",")}\r\n${values.map(escapeCsvCell).join(",")}\r\n`;
        response.writeHead(200, {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="admin-dashboard-${report.windowDays}d.csv"`
        });
        response.end(csv);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to export dashboard report.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/social/moderators") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const items = loadSocialModerators(database).map((row) => ({
          userId: Number(row.userId),
          username: row.username || "",
          email: row.email || "",
          assignedByUserId: Number(row.assignedByUserId || 0) || null,
          createdAt: row.createdAt
        }));
        writeJson(response, 200, { items }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to load moderators.", details: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/admin/social/moderators") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const payload = await readJsonBody(request);
        const userId = Number(payload.userId);
        if (!Number.isInteger(userId) || userId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "userId is required." }, corsHeaders);
          return;
        }

        const userRow = database
          .prepare(
            `
            SELECT id, role, status, account_status AS accountStatus
            FROM users
            WHERE id = ?
            LIMIT 1
          `
          )
          .get(userId);
        if (!userRow || normalizeAccountStatusValue(userRow.accountStatus, userRow.status) !== "active") {
          writeJson(response, 404, { error: "not_found", message: "User not found." }, corsHeaders);
          return;
        }
        if (!INTERNAL_PORTAL_ROLES.includes(String(userRow.role || ""))) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Moderator must be an internal portal role." },
            corsHeaders
          );
          return;
        }

        database
          .prepare(
            `
            INSERT INTO social_moderators (user_id, assigned_by_user_id, created_at)
            VALUES (?, ?, CURRENT_TIMESTAMP)
            ON CONFLICT(user_id) DO UPDATE SET
              assigned_by_user_id = excluded.assigned_by_user_id
          `
          )
          .run(userId, auth.user.id);

        database
          .prepare(
            `
            INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
            VALUES (?, 'social_moderator_assigned', 'user', ?, ?)
          `
          )
          .run(auth.user.id, String(userId), JSON.stringify({}));

        writeJson(response, 200, { assigned: true, userId }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "DELETE" && /^\/api\/admin\/social\/moderators\/\d+$/.test(requestUrl.pathname)) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const parts = requestUrl.pathname.split("/");
        const userId = Number(parts[5]);
        if (!Number.isInteger(userId) || userId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "userId is required." }, corsHeaders);
          return;
        }

        const result = database
          .prepare(
            `
            DELETE FROM social_moderators
            WHERE user_id = ?
          `
          )
          .run(userId);

        if (result.changes > 0) {
          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'social_moderator_removed', 'user', ?, ?)
            `
            )
            .run(auth.user.id, String(userId), JSON.stringify({}));
        }

        writeJson(response, 200, { removed: result.changes > 0, userId }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          500,
          { error: "internal_error", message: "Unable to remove moderator.", details: String(error.message || error) },
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
        const groupNamesInput = Array.isArray(payload.groupNames)
          ? payload.groupNames.map((name) => String(name || "").trim()).filter(Boolean)
          : [];
        const hasGroupNames = groupNamesInput.length > 0;
        const inviteeIdsInput =
          payload.inviteeUserIds !== undefined ? payload.inviteeUserIds : payload.audienceUserIds;
        if (hasGroupNames) {
          const groupMap = ensureGroupIds(database, groupNamesInput);
          groupIds = groupNamesInput
            .map((name) => Number(groupMap.get(name)))
            .filter((id) => Number.isInteger(id));
          audienceType = "groups";
        }
        const audienceCode = normalizeAudienceCode(payload.audienceCode);
        if (audienceCode && !hasGroupNames) {
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
        const inviteeUserIds = resolveActiveMemberInviteeIds(database, inviteeIdsInput);
        if (inviteeUserIds.length > 0 && audienceType === "all_members" && groupIds.length === 0) {
          audienceType = "groups";
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

        if (onlineJoinUrl && !/^https?:\/\//i.test(onlineJoinUrl)) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Online join URL must start with http:// or https://." },
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

        if (audienceType === "groups" && groupIds.length === 0 && inviteeUserIds.length === 0) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Select at least one group or individual member for targeted events." },
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
          setEventInvitees(database, eventId, inviteeUserIds, auth.user.id);
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
              inviteeCount: audienceType === "groups" ? inviteeUserIds.length : 0,
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
            inviteeUserIds: audienceType === "groups" ? inviteeUserIds : [],
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
          message: "Use POST /api/meetings/rsvp to confirm or decline participation."
        },
        { ...corsHeaders, Allow: "POST" }
      );
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/meetings/rsvp") {
      try {
        const payload = await readJsonBody(request);
        const token = String(payload.token || "").trim();
        const action = String(payload.action || "confirm").trim().toLowerCase();
        if (action !== "confirm" && action !== "decline") {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "RSVP action must be either 'confirm' or 'decline'." },
            corsHeaders
          );
          return;
        }
        const result =
          action === "decline"
            ? declineMeetingRsvpByToken(database, { token, summaryCache: eventSummaryCache })
            : confirmMeetingRsvpByToken(database, { token, summaryCache: eventSummaryCache });
        if (action === "decline") {
          await syncCalendarForUserEvent(database, {
            calendarSyncClient,
            userId: Number(result.userId),
            eventId: Number(result.eventId),
            operation: "cancel",
            actorUserId: Number(result.userId)
          });
          if (Number.isInteger(Number(result.promotedUserId)) && Number(result.promotedUserId) > 0) {
            await syncCalendarForUserEvent(database, {
              calendarSyncClient,
              userId: Number(result.promotedUserId),
              eventId: Number(result.eventId),
              operation: "upsert",
              actorUserId: Number(result.userId)
            });
          }
        } else if (result.status === "confirmed") {
          await syncCalendarForUserEvent(database, {
            calendarSyncClient,
            userId: Number(result.userId),
            eventId: Number(result.eventId),
            operation: "upsert",
            actorUserId: Number(result.userId)
          });
        }
        writeJson(
          response,
          200,
          {
            confirmed: action === "confirm",
            declined: action === "decline",
            ...result
          },
          corsHeaders
        );
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
              rsvpText = `\n\nRSVP link: ${rsvpUrl} (confirm participation or select 'Cannot attend')`;
            }
          }

          const startsAtLabel = formatInviteDateTime(snapshot.eventRow.start_at);
          const endsAtLabel = formatInviteDateTime(snapshot.eventRow.end_at);
          const venueLabel = formatInviteVenue(snapshot.eventRow);
          const hostLabel = snapshot.eventRow.host_name || "TBA";

          try {
            sendTransactionalEmail({
              to: recipient.email,
              subject: `Meeting update: ${snapshot.eventRow.title} - ${subject}`,
              text:
                `${body}\n\n` +
                `Meeting starts: ${startsAtLabel}\n` +
                `Meeting ends: ${endsAtLabel}\n` +
                `Venue: ${venueLabel}\n` +
                `Host: ${hostLabel}.${rsvpText}\n\n` +
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
          if (registration.signupStatus === "confirmed") {
            await syncCalendarForUserEvent(database, {
              calendarSyncClient,
              userId: auth.user.id,
              eventId,
              operation: "upsert",
              actorUserId: auth.user.id
            });
          }
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
        await syncCalendarForUserEvent(database, {
          calendarSyncClient,
          userId: auth.user.id,
          eventId,
          operation: "cancel",
          actorUserId: auth.user.id
        });
        if (Number.isInteger(Number(cancellation.promoted?.userId || 0)) && Number(cancellation.promoted?.userId || 0) > 0) {
          await syncCalendarForUserEvent(database, {
            calendarSyncClient,
            userId: Number(cancellation.promoted.userId),
            eventId,
            operation: "upsert",
            actorUserId: auth.user.id
          });
        }
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
        const currentInviteeUserIds = loadEventInviteeUserIds(database, eventId);
        let nextAudienceType = payload.audienceType === "groups" ? "groups" : eventRow.audience_type;
        let nextGroupIds = Array.isArray(payload.groupIds)
          ? payload.groupIds.map((id) => Number(id)).filter((id) => Number.isInteger(id))
          : null;
        const hasInviteeIdsInput = payload.inviteeUserIds !== undefined || payload.audienceUserIds !== undefined;
        let nextInviteeUserIds = hasInviteeIdsInput
          ? resolveActiveMemberInviteeIds(
              database,
              payload.inviteeUserIds !== undefined ? payload.inviteeUserIds : payload.audienceUserIds
            )
          : null;
        const groupNamesInput = Array.isArray(payload.groupNames)
          ? payload.groupNames.map((name) => String(name || "").trim()).filter(Boolean)
          : [];
        const hasGroupNames = groupNamesInput.length > 0;
        if (hasGroupNames) {
          const groupMap = ensureGroupIds(database, groupNamesInput);
          nextGroupIds = groupNamesInput
            .map((name) => Number(groupMap.get(name)))
            .filter((id) => Number.isInteger(id));
          nextAudienceType = "groups";
        }
        const audienceCode = payload.audienceCode !== undefined ? normalizeAudienceCode(payload.audienceCode) : "";
        if (audienceCode && !hasGroupNames) {
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
          if (!hasInviteeIdsInput && nextAudienceType === "all_members") {
            nextInviteeUserIds = [];
          }
        }
        const effectiveInviteeUserIds = Array.isArray(nextInviteeUserIds)
          ? nextInviteeUserIds
          : currentInviteeUserIds;
        const effectiveGroupIdsForAudience = Array.isArray(nextGroupIds) ? nextGroupIds : currentGroupIds;
        if (
          effectiveInviteeUserIds.length > 0 &&
          nextAudienceType === "all_members" &&
          effectiveGroupIdsForAudience.length === 0 &&
          hasInviteeIdsInput
        ) {
          nextAudienceType = "groups";
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
          groupIds: nextGroupIds,
          inviteeUserIds: nextInviteeUserIds
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
        const effectiveNextInviteeUserIds = Array.isArray(next.inviteeUserIds)
          ? next.inviteeUserIds
          : currentInviteeUserIds;
        if (Array.isArray(next.inviteeUserIds) && !hasSameIntegerSet(currentInviteeUserIds, effectiveNextInviteeUserIds)) {
          changes.push("Audience members changed");
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

        if (next.onlineJoinUrl && !/^https?:\/\//i.test(next.onlineJoinUrl)) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Online join URL must start with http:// or https://." },
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
          const effectiveInviteeIds = Array.isArray(next.inviteeUserIds) ? next.inviteeUserIds : currentInviteeUserIds;
          if (effectiveGroupIds.length === 0 && effectiveInviteeIds.length === 0) {
            writeJson(
              response,
              400,
              { error: "validation_error", message: "Select at least one group or individual member for targeted events." },
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
        if (Array.isArray(next.inviteeUserIds)) {
          setEventInvitees(
            database,
            eventId,
            next.audienceType === "groups" ? next.inviteeUserIds : [],
            auth.user.id
          );
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
                audienceCode: audienceCode || (next.audienceType === "all_members" ? "all_members" : "groups"),
                inviteeCount: next.audienceType === "groups" ? effectiveNextInviteeUserIds.length : 0
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

        let teamsAutomation = { attempted: false, automated: false, reason: "not_applicable" };
        if (eventRow.status === "published" && changes.length > 0 && next.venueType === "online") {
          try {
            teamsAutomation = await syncTeamsMeetingForEvent(database, {
              teamsGraphClient,
              eventId,
              actorUserId: auth.user.id
            });
          } catch (teamsError) {
            teamsAutomation = {
              attempted: true,
              automated: false,
              reason: teamsError.code || "automation_failed"
            };
          }
        }
        if (eventRow.status === "published" && changes.length > 0) {
          await syncCalendarForEventParticipants(database, {
            calendarSyncClient,
            eventId,
            operation: "upsert",
            actorUserId: auth.user.id
          });
        }

        writeJson(response, 200, { updated: true, teamsAutomation }, corsHeaders);
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

      // Collect participants before deletion so we can notify them
      const participantUserIds =
        eventRow.status === "published" ? loadEventParticipantUserIds(database, eventId) : [];
      const participantContacts =
        participantUserIds.length > 0 ? loadUserContacts(database, participantUserIds) : new Map();

      // Snapshot before delete for audit / revision record
      const preDeleteSnapshot = buildEventSnapshot(database, eventId);
      if (eventRow.status === "published" && preDeleteSnapshot) {
        insertEventRevision(database, {
          eventId,
          revisionType: "cancel",
          snapshot: preDeleteSnapshot,
          actorUserId: auth.user.id
        });
      }
      if (eventRow.status === "published" && participantUserIds.length > 0) {
        for (const participantUserId of participantUserIds) {
          await syncCalendarForUserEvent(database, {
            calendarSyncClient,
            userId: Number(participantUserId),
            eventId,
            operation: "cancel",
            actorUserId: auth.user.id
          });
        }
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

        // Notify registered participants about cancelled/deleted event
        for (const userId of participantUserIds) {
          const cancelKey = `event_cancelled:${eventId}:${userId}`;
          createInAppNotification(database, {
            userId,
            eventType: "event_cancelled",
            title: `Event cancelled: ${eventRow.title}`,
            body: `The event "${eventRow.title}" has been cancelled. If you had registered, your registration is no longer active.`,
            metadata: { eventId, eventTitle: eventRow.title },
            idempotencyKey: cancelKey
          });

          const contact = participantContacts.get(userId);
          const emailKey = `event_cancelled_email:${eventId}:${userId}`;
          if (contact && contact.email) {
            try {
              sendTransactionalEmail({
                to: contact.email,
                subject: `IWFSA Event Cancelled – ${eventRow.title}`,
                text:
                  `Hello ${contact.fullName || contact.username || "Member"},\n\n` +
                  `The event "${eventRow.title}" has been cancelled.\n` +
                  `If you had registered, your registration is no longer active.\n\n` +
                  `We apologise for any inconvenience.\n\nRegards,\nIWFSA Admin`,
                metadata: { template: "event_cancelled" }
              });
              recordNotificationDelivery(database, {
                userId,
                channel: "email",
                eventType: "event_cancelled",
                status: "sent",
                idempotencyKey: emailKey
              });
            } catch (emailError) {
              recordNotificationDelivery(database, {
                userId,
                channel: "email",
                eventType: "event_cancelled",
                status: "failed",
                idempotencyKey: emailKey,
                errorMessage: String(emailError.message || emailError)
              });
            }
          } else {
            recordNotificationDelivery(database, {
              userId,
              channel: "email",
              eventType: "event_cancelled",
              status: "failed",
              idempotencyKey: emailKey,
              errorMessage: "missing_email"
            });
          }
        }
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
        let teamsAutomation = { attempted: false, automated: false, reason: "not_applicable" };
        let notificationDispatch = { attempted: false, completed: false };
        if (submission.submitted && !submission.alreadyPublished) {
          notificationDispatch.attempted = true;
          try {
            teamsAutomation = await syncTeamsMeetingForEvent(database, {
              teamsGraphClient,
              eventId,
              actorUserId: auth.user.id
            });
          } catch (teamsError) {
            teamsAutomation = {
              attempted: true,
              automated: false,
              reason: teamsError.code || "automation_failed"
            };
          }
          await syncCalendarForEventParticipants(database, {
            calendarSyncClient,
            eventId,
            operation: "upsert",
            actorUserId: auth.user.id
          });
          try {
            processNotificationQueue(database, { appBaseUrl: config.appBaseUrl });
            notificationDispatch.completed = true;
          } catch (notificationError) {
            console.error(
              JSON.stringify({
                level: "error",
                event: "event_publish_notification_dispatch_failed",
                eventId,
                message: String(notificationError.message || notificationError)
              })
            );
          }
        }
        writeJson(
          response,
          200,
          {
            status: submission.status,
            alreadySubmitted: submission.alreadySubmitted,
            alreadyPublished: submission.alreadyPublished,
            teamsAutomation,
            notificationDispatch
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

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/membership-fees/cycles") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const limit = Math.max(1, Math.min(Number(requestUrl.searchParams.get("limit") || 30), 200));
        const items = listMembershipCycles(database, { limit });
        const activeCycle = loadOpenMembershipCycle(database) || (items.length > 0 ? items[0] : null);
        writeJson(
          response,
          200,
          {
            items,
            activeCycle: activeCycle ? toMembershipCycleResponseItem(activeCycle) : null
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 500),
          { error: error.code || "internal_error", message: String(error.message || "Unable to load membership cycles.") },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/admin/membership-fees/cycles") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const membershipYear = parseMembershipYear(payload.membershipYear);
        const status = normalizeMembershipCycleStatus(payload.status, "open");
        const dueDate = normalizeMembershipDueDate(payload.dueDate, membershipYear);
        let cycle = null;
        let created = false;
        let closedOpenCycles = 0;

        runTransaction(database, () => {
          const existing = loadMembershipCycleByYear(database, membershipYear);
          if (status === "open") {
            const closeResult = database
              .prepare(
                `
                UPDATE membership_cycles
                SET status = 'closed', updated_at = CURRENT_TIMESTAMP
                WHERE status = 'open' AND membership_year != ?
              `
              )
              .run(membershipYear);
            closedOpenCycles = Number(closeResult.changes || 0);
          }

          if (existing) {
            database
              .prepare(
                `
                UPDATE membership_cycles
                SET due_date = ?, status = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
              `
              )
              .run(dueDate, status, existing.id);
          } else {
            database
              .prepare(
                `
                INSERT INTO membership_cycles (membership_year, due_date, status, created_at, updated_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              `
              )
              .run(membershipYear, dueDate, status);
            created = true;
          }

          cycle = loadMembershipCycleByYear(database, membershipYear);

          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'membership_cycle_upserted', 'membership_cycle', ?, ?)
            `
            )
            .run(
              auth.user.id,
              String(cycle?.id || membershipYear),
              JSON.stringify({
                membershipYear,
                dueDate,
                status,
                created,
                closedOpenCycles
              })
            );
        });

        writeJson(
          response,
          created ? 201 : 200,
          {
            created,
            closedOpenCycles,
            item: toMembershipCycleResponseItem(cycle)
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/membership-fees/overview") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const requestedYearRaw = requestUrl.searchParams.get("membershipYear");
        const cycle = loadPreferredMembershipCycle(database, requestedYearRaw);
        if (!cycle) {
          writeJson(
            response,
            200,
            {
              cycle: null,
              summary: {
                totalMembers: 0,
                activeMembers: 0,
                goodStandingMembers: 0,
                outstandingMembers: 0,
                blockedMembers: 0,
                deactivatedMembers: 0,
                onboardingMembers: 0,
                feesCollected: 0,
                outstandingBalance: 0
              }
            },
            corsHeaders
          );
          return;
        }
        writeJson(response, 200, buildMembershipFeesOverview(database, cycle), corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 500),
          {
            error: error.code || "internal_error",
            message: String(error.message || "Unable to load membership overview.")
          },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "GET" && requestUrl.pathname === "/api/admin/membership-fees/members") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const requestedYearRaw = requestUrl.searchParams.get("membershipYear");
        const cycle = loadPreferredMembershipCycle(database, requestedYearRaw);
        const filters = {
          search: requestUrl.searchParams.get("search") || "",
          standingStatus: requestUrl.searchParams.get("standingStatus") || "all",
          accountStatus: requestUrl.searchParams.get("accountStatus") || "all",
          category: requestUrl.searchParams.get("category") || "",
          profileCompletion: requestUrl.searchParams.get("profileCompletion") || "all",
          limit: Number(requestUrl.searchParams.get("limit") || 300)
        };
        const items = listMembershipFeeMembers(database, { cycle, filters });
        writeJson(
          response,
          200,
          {
            cycle: toMembershipCycleResponseItem(cycle),
            total: items.length,
            items
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 500),
          { error: error.code || "internal_error", message: String(error.message || "Unable to load member fee records.") },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/admin/membership-fees/accounts/bulk") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const userIds = normalizeMembershipFeeUserIds(payload.userIds);
        if (userIds.length === 0) {
          writeJson(response, 400, { error: "validation_error", message: "Select at least one member." }, corsHeaders);
          return;
        }
        if (userIds.length > 250) {
          writeJson(response, 400, { error: "validation_error", message: "Bulk updates are limited to 250 members." }, corsHeaders);
          return;
        }
        const requestedYearRaw = payload.membershipYear ?? requestUrl.searchParams.get("membershipYear");
        const cycle = loadPreferredMembershipCycle(database, requestedYearRaw);
        if (!cycle) {
          writeJson(
            response,
            409,
            { error: "invalid_state", message: "Create a membership cycle before updating member fee records." },
            corsHeaders
          );
          return;
        }

        const patchPayload = {
          paymentStatus: payload.paymentStatus,
          standingStatus: payload.standingStatus,
          accessStatus: payload.accessStatus,
          amountDue: payload.amountDue,
          amountPaid: payload.amountPaid,
          adminNote: payload.adminNote,
          reason: toNullableTrimmedString(payload.reason, { maxLength: 500 }) || "bulk_membership_fee_update"
        };
        const updated = [];
        const failed = [];
        for (const userId of userIds) {
          try {
            updated.push(
              applyMemberFeeAccountUpdate(database, {
                actorUserId: auth.user.id,
                userId,
                cycle,
                payload: patchPayload
              })
            );
          } catch (error) {
            failed.push({
              userId,
              error: error.code || "update_failed",
              message: String(error.message || error)
            });
          }
        }

        writeJson(
          response,
          failed.length > 0 && updated.length === 0 ? 400 : 200,
          {
            updated: updated.length,
            failed: failed.length,
            cycle: toMembershipCycleResponseItem(cycle),
            items: updated,
            errors: failed
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "POST" && requestUrl.pathname === "/api/admin/membership-fees/dues-reminders") {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }

        const payload = await readJsonBody(request);
        const userIds = normalizeMembershipFeeUserIds(payload.userIds);
        if (userIds.length === 0) {
          writeJson(response, 400, { error: "validation_error", message: "Select at least one member." }, corsHeaders);
          return;
        }
        if (userIds.length > 250) {
          writeJson(response, 400, { error: "validation_error", message: "Dues reminders are limited to 250 members." }, corsHeaders);
          return;
        }
        const requestedYearRaw = payload.membershipYear ?? requestUrl.searchParams.get("membershipYear");
        const cycle = loadPreferredMembershipCycle(database, requestedYearRaw);
        if (!cycle) {
          writeJson(
            response,
            409,
            { error: "invalid_state", message: "Create a membership cycle before sending dues reminders." },
            corsHeaders
          );
          return;
        }

        const result = enqueueMembershipDuesReminders(database, {
          cycle,
          userIds,
          actorUserId: auth.user.id,
          reason: toNullableTrimmedString(payload.reason, { maxLength: 500 }) || "dues_reminder"
        });
        writeJson(response, 202, { cycle: toMembershipCycleResponseItem(cycle), ...result }, corsHeaders);
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (
      request.method === "GET" &&
      requestUrl.pathname.startsWith("/api/admin/membership-fees/accounts/") &&
      requestUrl.pathname.endsWith("/audit")
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
        if (parts.length !== 7 || parts[5] === "") {
          writeJson(response, 400, { error: "validation_error", message: "Member user id is required." }, corsHeaders);
          return;
        }
        const userId = Number(parts[5]);
        if (!Number.isInteger(userId) || userId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "Member user id is required." }, corsHeaders);
          return;
        }
        const requestedYearRaw = requestUrl.searchParams.get("membershipYear");
        const cycle = requestedYearRaw ? loadPreferredMembershipCycle(database, requestedYearRaw) : null;
        const items = listMemberStandingAudit(database, {
          userId,
          membershipCycleId: cycle?.id || null,
          limit: Number(requestUrl.searchParams.get("limit") || 20)
        });
        writeJson(
          response,
          200,
          {
            userId,
            cycle: cycle ? toMembershipCycleResponseItem(cycle) : null,
            items
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
      }
      return;
    }

    if (request.method === "PATCH" && requestUrl.pathname.startsWith("/api/admin/membership-fees/accounts/")) {
      try {
        const auth = requireAuth(database, request, response, corsHeaders);
        if (!auth) {
          return;
        }
        if (!requireRole(auth.user, ["admin", "chief_admin"], response, corsHeaders)) {
          return;
        }
        const parts = requestUrl.pathname.split("/");
        if (parts.length !== 6 || parts[5] === "") {
          writeJson(response, 400, { error: "validation_error", message: "Member user id is required." }, corsHeaders);
          return;
        }
        const userId = Number(parts[5]);
        if (!Number.isInteger(userId) || userId <= 0) {
          writeJson(response, 400, { error: "validation_error", message: "Member user id is required." }, corsHeaders);
          return;
        }

        const userRow = database
          .prepare(
            `
            SELECT id, username, email, role, status, account_status AS accountStatus
            FROM users
            WHERE id = ?
            LIMIT 1
          `
          )
          .get(userId);
        if (!userRow || userRow.role !== "member") {
          writeJson(response, 404, { error: "not_found", message: "Member not found." }, corsHeaders);
          return;
        }

        const payload = await readJsonBody(request);
        const requestedYearRaw = payload.membershipYear ?? requestUrl.searchParams.get("membershipYear");
        const cycle = loadPreferredMembershipCycle(database, requestedYearRaw);
        if (!cycle) {
          writeJson(
            response,
            409,
            { error: "invalid_state", message: "Create a membership cycle before updating member fee records." },
            corsHeaders
          );
          return;
        }

        const previous = loadMemberFeeAccountForCycle(database, { userId, membershipCycleId: cycle.id });
        const parseMoney = (value, fallback = 0) => {
          if (value === undefined || value === null || value === "") {
            return Number(fallback || 0);
          }
          const parsed = Number(value);
          if (!Number.isFinite(parsed) || parsed < 0) {
            const error = new Error("Amounts must be numbers greater than or equal to 0.");
            error.httpStatus = 400;
            error.code = "validation_error";
            throw error;
          }
          return Number(parsed);
        };

        const amountDue = parseMoney(payload.amountDue, previous?.amountDue || 0);
        const amountPaid = parseMoney(payload.amountPaid, previous?.amountPaid || 0);
        const balance =
          payload.balance !== undefined && payload.balance !== null && payload.balance !== ""
            ? Number(payload.balance)
            : Number(amountDue - amountPaid);
        if (!Number.isFinite(balance)) {
          writeJson(response, 400, { error: "validation_error", message: "balance must be numeric." }, corsHeaders);
          return;
        }

        const paymentStatus = normalizeMemberFeePaymentStatus(payload.paymentStatus, previous?.paymentStatus || "pending_review");
        const standingStatus = normalizeMemberFeeStandingStatus(
          payload.standingStatus,
          previous?.standingStatus || "pending_review"
        );
        const accessStatus = normalizeMemberFeeAccessStatus(payload.accessStatus, previous?.accessStatus || "enabled");
        const adminNote =
          payload.adminNote !== undefined ? toNullableTrimmedString(payload.adminNote, { maxLength: 2000 }) : previous?.adminNote || null;
        const reason = toNullableTrimmedString(payload.reason, { maxLength: 500 }) || "admin_update";
        const lastPaymentAtRaw =
          payload.lastPaymentAt !== undefined ? String(payload.lastPaymentAt || "").trim() : String(previous?.lastPaymentAt || "").trim();
        const lastPaymentAt = lastPaymentAtRaw ? new Date(lastPaymentAtRaw).toISOString() : null;
        const standingChanged =
          String(previous?.standingStatus || "pending_review") !== standingStatus ||
          String(previous?.accessStatus || "enabled") !== accessStatus ||
          String(previous?.paymentStatus || "pending_review") !== paymentStatus;

        const nextAccountStatus =
          accessStatus === "enabled" ? "active" : accessStatus === "blocked" ? "blocked" : "deactivated";
        const nextLegacyStatus = nextAccountStatus === "active" ? "active" : "suspended";
        const reviewedAt = new Date().toISOString();

        runTransaction(database, () => {
          database
            .prepare(
              `
              INSERT INTO member_fee_accounts (
                user_id,
                membership_cycle_id,
                amount_due,
                amount_paid,
                balance,
                payment_status,
                standing_status,
                access_status,
                last_payment_at,
                reviewed_by_user_id,
                reviewed_at,
                admin_note,
                created_at,
                updated_at
              ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
              ON CONFLICT(user_id, membership_cycle_id) DO UPDATE SET
                amount_due = excluded.amount_due,
                amount_paid = excluded.amount_paid,
                balance = excluded.balance,
                payment_status = excluded.payment_status,
                standing_status = excluded.standing_status,
                access_status = excluded.access_status,
                last_payment_at = excluded.last_payment_at,
                reviewed_by_user_id = excluded.reviewed_by_user_id,
                reviewed_at = excluded.reviewed_at,
                admin_note = excluded.admin_note,
                updated_at = CURRENT_TIMESTAMP
            `
            )
            .run(
              userId,
              cycle.id,
              amountDue,
              amountPaid,
              balance,
              paymentStatus,
              standingStatus,
              accessStatus,
              lastPaymentAt,
              auth.user.id,
              reviewedAt,
              adminNote
            );

          database
            .prepare(
              `
              UPDATE users
              SET account_status = ?,
                  status = ?,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `
            )
            .run(nextAccountStatus, nextLegacyStatus, userId);

          if (standingChanged) {
            database
              .prepare(
                `
                INSERT INTO member_standing_audit (
                  user_id,
                  membership_cycle_id,
                  previous_payment_status,
                  next_payment_status,
                  previous_standing_status,
                  next_standing_status,
                  previous_access_status,
                  next_access_status,
                  reason,
                  actor_user_id,
                  created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `
              )
              .run(
                userId,
                cycle.id,
                previous?.paymentStatus || null,
                paymentStatus,
                previous?.standingStatus || null,
                standingStatus,
                previous?.accessStatus || null,
                accessStatus,
                reason,
                auth.user.id
              );
          }

          const transaction = payload.transaction;
          if (transaction && typeof transaction === "object") {
            const transactionType = String(transaction.transactionType || "").trim().toLowerCase();
            const allowedTransactionTypes = new Set(["payment", "waiver", "credit", "adjustment", "reversal"]);
            if (!allowedTransactionTypes.has(transactionType)) {
              const error = new Error("transaction.transactionType is invalid.");
              error.httpStatus = 400;
              error.code = "validation_error";
              throw error;
            }
            const transactionAmount = Number(transaction.amount);
            if (!Number.isFinite(transactionAmount) || transactionAmount === 0) {
              const error = new Error("transaction.amount must be a non-zero number.");
              error.httpStatus = 400;
              error.code = "validation_error";
              throw error;
            }
            const refreshedAccount = loadMemberFeeAccountForCycle(database, { userId, membershipCycleId: cycle.id });
            database
              .prepare(
                `
                INSERT INTO member_fee_transactions (
                  member_fee_account_id,
                  transaction_type,
                  amount,
                  reference_text,
                  notes,
                  recorded_by_user_id,
                  recorded_at
                ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
              `
              )
              .run(
                refreshedAccount.id,
                transactionType,
                transactionAmount,
                toNullableTrimmedString(transaction.referenceText, { maxLength: 160 }),
                toNullableTrimmedString(transaction.notes, { maxLength: 1000 }),
                auth.user.id
              );
          }

          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'membership_fee_account_updated', 'user', ?, ?)
            `
            )
            .run(
              auth.user.id,
              String(userId),
              JSON.stringify({
                membershipCycleId: cycle.id,
                membershipYear: cycle.membershipYear,
                previous: previous
                  ? {
                      paymentStatus: previous.paymentStatus,
                      standingStatus: previous.standingStatus,
                      accessStatus: previous.accessStatus,
                      amountDue: Number(previous.amountDue || 0),
                      amountPaid: Number(previous.amountPaid || 0),
                      balance: Number(previous.balance || 0)
                    }
                  : null,
                next: {
                  paymentStatus,
                  standingStatus,
                  accessStatus,
                  amountDue,
                  amountPaid,
                  balance,
                  accountStatus: nextAccountStatus
                },
                reason
              })
            );
        });

        const refreshedAccount = loadMemberFeeAccountForCycle(database, { userId, membershipCycleId: cycle.id });
        writeJson(
          response,
          200,
          {
            updated: true,
            cycle: toMembershipCycleResponseItem(cycle),
            item: {
              userId,
              username: userRow.username,
              email: userRow.email,
              accountStatus: nextAccountStatus,
              paymentStatus: refreshedAccount.paymentStatus,
              standingStatus: refreshedAccount.standingStatus,
              accessStatus: refreshedAccount.accessStatus,
              amountDue: Number(refreshedAccount.amountDue || 0),
              amountPaid: Number(refreshedAccount.amountPaid || 0),
              balance: Number(refreshedAccount.balance || 0),
              lastPaymentAt: refreshedAccount.lastPaymentAt || null,
              reviewedAt: refreshedAccount.reviewedAt || null,
              reviewedByUserId: Number(refreshedAccount.reviewedByUserId || 0) || null,
              adminNote: refreshedAccount.adminNote || null
            }
          },
          corsHeaders
        );
      } catch (error) {
        writeJson(
          response,
          Number(error.httpStatus || 400),
          { error: error.code || "invalid_json", message: String(error.message || error) },
          corsHeaders
        );
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
              account_status,
              status,
              desired_status,
              must_change_password,
              must_change_username,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, 'member', 'invited', 'invited', 'active', 1, 0, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
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
              membership_cycle_year,
              membership_category_default,
              standing_default,
              membership_set_json,
              total_rows,
              create_count,
              update_count,
              skip_count,
              error_count,
              blocking_issue_count,
              has_blocking_issues
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
            options.membershipCycleYear,
            options.membershipCategoryDefault,
            options.standingDefault,
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
              invite_policy: options.invitePolicy,
              membership_cycle_year: options.membershipCycleYear,
              membership_category_default: options.membershipCategoryDefault,
              standing_default: options.standingDefault
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
            membership_cycle_year: options.membershipCycleYear,
            membership_category_default: options.membershipCategoryDefault,
            standing_default: options.standingDefault,
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
            membership_cycle_year AS membershipCycleYear,
            membership_category_default AS membershipCategoryDefault,
            standing_default AS standingDefault,
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
          membership_cycle_year: batch.membershipCycleYear || null,
          membership_category_default: batch.membershipCategoryDefault || "Active Member",
          standing_default: batch.standingDefault || "pending_review",
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
              },
              membership_cycle_year: batch.membership_cycle_year || null,
              membership_category_default: batch.membership_category_default || "Active Member",
              standing_default: batch.standing_default || "pending_review"
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
        const importMembershipYear = batch.membership_cycle_year ? parseMembershipYear(batch.membership_cycle_year) : null;
        const importCycle = importMembershipYear
          ? ensureMembershipCycleForImport(database, { membershipYear: importMembershipYear, actorUserId: auth.user.id })
          : null;
        const importCategoryDefault = normalizeMembershipCategoryName(batch.membership_category_default || "Active Member");
        const importStandingDefault = normalizeMemberFeeStandingStatus(batch.standing_default, "pending_review");

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
                      account_status,
                      status,
                      desired_status,
                      must_change_password,
                      must_change_username,
                      created_at,
                      updated_at
                    ) VALUES (?, ?, ?, 'member', ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                  `
                  )
                  .run(
                    row.username,
                    row.email,
                    hashPassword(tempPassword),
                    status === "suspended" ? "blocked" : status === "not_invited" ? "not_invited" : "invited",
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
                assignMembershipCategory(database, { userId, categoryName: importCategoryDefault });
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
                  .prepare("SELECT id, status, account_status AS accountStatus, username FROM users WHERE id = ?")
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
                    SET username = ?,
                        desired_status = ?,
                        status = ?,
                        account_status = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                  `
                  )
                  .run(
                    usernameUpdate,
                    desiredStatus,
                    statusUpdate,
                    statusUpdate === "suspended"
                      ? "blocked"
                      : String(current.accountStatus || "") === "invited" || String(current.accountStatus || "") === "not_invited"
                        ? String(current.accountStatus || "not_invited")
                        : "active",
                    userId
                  );

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
                assignMembershipCategory(database, { userId, categoryName: importCategoryDefault });

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
        const feeAccountUserIds = [...new Set([...createdUserIds, ...updatedUserIds])];
        let feeAccountsCreated = 0;
        if (importCycle) {
          for (const userId of feeAccountUserIds) {
            if (
              upsertImportedMemberFeeAccount(database, {
                userId,
                cycle: importCycle,
                standingStatus: importStandingDefault,
                actorUserId: auth.user.id,
                reason: "created_from_member_import"
              })
            ) {
              feeAccountsCreated += 1;
            }
          }
        }

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
              membership_cycle_year: importMembershipYear,
              membership_category_default: importCategoryDefault,
              standing_default: importStandingDefault,
              fee_accounts_created: feeAccountsCreated,
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
            },
            membership_cycle_year: importMembershipYear,
            membership_category_default: importCategoryDefault,
            standing_default: importStandingDefault,
            fee_accounts_created: feeAccountsCreated
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
        const impersonateAsMember = payload.impersonateAsMember === true;
        const adminUsername = typeof payload.adminUsername === "string" ? payload.adminUsername.trim() : "";

        if (!username || !password) {
          writeJson(
            response,
            400,
            { error: "validation_error", message: "Username and password are required." },
            corsHeaders
          );
          return;
        }

        if (impersonateAsMember) {
          if (!adminUsername) {
            writeJson(
              response,
              400,
              { error: "validation_error", message: "Admin username is required for impersonation." },
              corsHeaders
            );
            return;
          }

          const targetUser = findUserForLogin(database, username);
          if (!targetUser || targetUser.role !== "member") {
            writeJson(
              response,
              401,
              { error: "invalid_credentials", message: "Invalid username or password." },
              corsHeaders
            );
            return;
          }

          const targetAccountStatus = normalizeAccountStatusValue(targetUser.accountStatus, targetUser.status);
          if (targetAccountStatus !== "active") {
            writeJson(
              response,
              403,
              { error: "inactive_account", message: "Target member account is not active." },
              corsHeaders
            );
            return;
          }
          const targetMembership = resolveMembershipEligibility(database, {
            userId: targetUser.id,
            role: targetUser.role,
            accountStatus: targetAccountStatus,
            legacyStatus: targetUser.status
          });
          if (!targetMembership.eligible) {
            writeJson(
              response,
              403,
              {
                error: "membership_not_in_good_standing",
                message: "Target member does not currently have portal access."
              },
              corsHeaders
            );
            return;
          }

          const adminUser = findUserForLogin(database, adminUsername);
          const adminAccountStatus = normalizeAccountStatusValue(adminUser?.accountStatus, adminUser?.status);
          const adminHasAccess =
            Boolean(adminUser) &&
            isAdminRole(adminUser.role) &&
            adminAccountStatus === "active" &&
            verifyPassword(password, adminUser.passwordHash);

          if (!adminHasAccess) {
            writeJson(
              response,
              401,
              { error: "invalid_credentials", message: "Invalid username or password." },
              corsHeaders
            );
            return;
          }

          const session = createSession(database, targetUser.id);

          database
            .prepare(
              `
              INSERT INTO audit_logs (actor_user_id, action_type, target_type, target_id, metadata_json)
              VALUES (?, 'member_impersonation_login', 'user', ?, ?)
            `
            )
            .run(
              adminUser.id,
              String(targetUser.id),
              JSON.stringify({
                admin_username: adminUser.username,
                admin_role: adminUser.role,
                target_username: targetUser.username
              })
            );

          writeJson(
            response,
            200,
            {
              authenticated: true,
              token: session.token,
              expiresAt: session.expiresAt,
              user: toAuthUserPayload(targetUser, targetMembership),
              impersonation: {
                active: true,
                adminUser: {
                  id: adminUser.id,
                  username: adminUser.username,
                  role: adminUser.role
                }
              }
            },
            corsHeaders
          );
          return;
        }

        const user = findUserForLogin(database, username);
        if (!user || !verifyPassword(password, user.passwordHash)) {
          writeJson(response, 401, { error: "invalid_credentials", message: "Invalid username or password." }, corsHeaders);
          return;
        }

        const accountStatus = normalizeAccountStatusValue(user.accountStatus, user.status);
        if (accountStatus !== "active") {
          writeJson(response, 403, { error: "inactive_account", message: "Account is not active." }, corsHeaders);
          return;
        }
        const membership = resolveMembershipEligibility(database, {
          userId: user.id,
          role: user.role,
          accountStatus,
          legacyStatus: user.status
        });
        if (isPortalMemberRole(user.role) && !membership.eligible) {
          writeJson(
            response,
            403,
            {
              error: "membership_not_in_good_standing",
              message: "Portal access is restricted to active members in good standing."
            },
            corsHeaders
          );
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
            user: toAuthUserPayload(user, membership),
            impersonation: null
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
        const nextAccountStatus = nextStatus === "active" ? "active" : "blocked";

        runTransaction(database, () => {
          database
            .prepare(
              `
              UPDATE users
              SET username = ?,
                  password_hash = ?,
                  status = ?,
                  account_status = ?,
                  must_change_password = 0,
                  must_change_username = 0,
                  updated_at = CURRENT_TIMESTAMP
              WHERE id = ?
            `
            )
            .run(finalUsername, nextHash, nextStatus, nextAccountStatus, user.id);

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
