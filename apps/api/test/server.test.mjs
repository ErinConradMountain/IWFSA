import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import * as XLSX from "xlsx";
import { runMigrations } from "../src/db/migrate.mjs";
import { openDatabase } from "../src/db/client.mjs";
import { startApiServer } from "../src/server.mjs";
import { hashPassword } from "../src/auth/passwords.mjs";
import { EMAIL_OUTBOX_GLOBAL_KEY } from "../src/notifications/email.mjs";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(check, { timeoutMs = 2500, intervalMs = 25, label = "condition" } = {}) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const value = await check();
    if (value) return value;
    await sleep(intervalMs);
  }
  throw new Error(`Timed out waiting for ${label}.`);
}

function createWorkbookBuffer(rows) {
  const worksheet = XLSX.utils.aoa_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Members");
  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}

function isoDaysFromNow(daysFromNow, durationHours = 0) {
  const nowMs = Date.now();
  const eventMs = nowMs + daysFromNow * 24 * 60 * 60 * 1000 + durationHours * 60 * 60 * 1000;
  return new Date(eventMs).toISOString();
}

function extractTokenFromText(text, pathSegment) {
  const pattern = new RegExp(`${pathSegment}\\?token=([A-Za-z0-9]+)`);
  const match = String(text || "").match(pattern);
  return match ? match[1] : "";
}

function createFakeSharePointClient() {
  let sequence = 1;
  const files = new Map();

  return {
    async uploadEventDocument({ fileName, mimeType, fileBuffer }) {
      const itemId = `fake-item-${sequence}`;
      sequence += 1;
      files.set(itemId, {
        buffer: Buffer.from(fileBuffer),
        mimeType: String(mimeType || "application/octet-stream"),
        fileName: String(fileName || "document.bin")
      });
      return {
        siteId: "fake-site",
        driveId: "fake-drive",
        itemId,
        webUrl: `https://sharepoint.local/${itemId}`
      };
    },
    async downloadEventDocument({ itemId }) {
      const item = files.get(String(itemId || ""));
      if (!item) {
        return new Response("missing", { status: 404 });
      }
      return new Response(item.buffer, {
        status: 200,
        headers: { "content-type": item.mimeType }
      });
    }
  };
}

function createFakeTeamsGraphClient() {
  let sequence = 1;
  const meetings = new Map();

  return {
    async createOnlineMeetingEvent({ title, description, startAt, endAt }) {
      const meetingId = `teams-meeting-${sequence}`;
      const joinUrl = `https://teams.microsoft.com/l/meetup-join/${meetingId}`;
      sequence += 1;
      meetings.set(meetingId, { title, description, startAt, endAt, joinUrl });
      return { meetingId, joinUrl, organizerUpn: "events@iwfsa.local" };
    },
    async updateOnlineMeetingEvent({ meetingId, title, description, startAt, endAt }) {
      const existing = meetings.get(String(meetingId || ""));
      if (!existing) {
        throw new Error("meeting_not_found");
      }
      const nextJoinUrl = existing.joinUrl.replace(/$/, "-updated");
      const nextValue = { title, description, startAt, endAt, joinUrl: nextJoinUrl };
      meetings.set(String(meetingId), nextValue);
      return { meetingId: String(meetingId), joinUrl: nextJoinUrl, organizerUpn: "events@iwfsa.local" };
    }
  };
}

async function createRunningServer(options = {}) {
  const workingDirectory = mkdtempSync(path.join(tmpdir(), "iwfsa-api-"));
  const databasePath = path.join(workingDirectory, "test.db");

  runMigrations({ databasePath });

  const database = openDatabase(databasePath);
  const now = new Date().toISOString();
  database
    .prepare(
      `
      INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `
    )
    .run("member1", "member1@iwfsa.local", hashPassword("memberpass"), "member", now, now);
  database
    .prepare(
      `
      INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `
    )
    .run("editor1", "editor1@iwfsa.local", hashPassword("editorpass"), "event_editor", now, now);
  database
    .prepare(
      `
      INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `
    )
    .run("member2", "member2@iwfsa.local", hashPassword("member2pass"), "member", now, now);
  database
    .prepare(
      `
      INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'active', ?, ?)
    `
    )
    .run("admin1", "admin1@iwfsa.local", hashPassword("adminpass"), "admin", now, now);

  database
    .prepare(
      `
      INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
      VALUES (?, ?, ?, ?, 'not_invited', ?, ?)
    `
    )
    .run("invitee1", "invitee1@iwfsa.local", hashPassword("invitepass"), "member", now, now);

  const memberRow = database.prepare("SELECT id FROM users WHERE username = ?").get("member1");
  const member2Row = database.prepare("SELECT id FROM users WHERE username = ?").get("member2");
  const editorRow = database.prepare("SELECT id FROM users WHERE username = ?").get("editor1");
  const adminRow = database.prepare("SELECT id FROM users WHERE username = ?").get("admin1");
  const inviteeRow = database.prepare("SELECT id FROM users WHERE username = ?").get("invitee1");
  database
    .prepare(
      `
      INSERT INTO events (
        title,
        description,
        start_at,
        end_at,
        venue_type,
        venue_name,
        capacity,
        registration_closes_at,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      "Leadership Roundtable",
      "Member-only strategy discussion.",
      "2026-03-01T10:00:00Z",
      "2026-03-01T12:00:00Z",
      "physical",
      "Johannesburg",
      50,
      "2026-02-28T23:59:59Z",
      "published"
    );

  database.prepare("INSERT INTO groups (name) VALUES (?)").run("Board");
  const boardGroup = database.prepare("SELECT id FROM groups WHERE name = ?").get("Board");
  if (boardGroup?.id && memberRow?.id) {
    database
      .prepare("INSERT INTO group_members (group_id, user_id) VALUES (?, ?)")
      .run(boardGroup.id, memberRow.id);
  }

  database
    .prepare(
      `
      INSERT INTO events (
        title,
        description,
        start_at,
        end_at,
        venue_type,
        venue_name,
        capacity,
        registration_closes_at,
        audience_type,
        status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `
    )
    .run(
      "Board Strategy",
      "Board-only event.",
      "2026-03-05T10:00:00Z",
      "2026-03-05T12:00:00Z",
      "physical",
      "Cape Town",
      20,
      "2026-03-04T23:59:59Z",
      "groups",
      "published"
    );
  const boardEvent = database.prepare("SELECT id FROM events WHERE title = ?").get("Board Strategy");
  if (boardEvent?.id && boardGroup?.id) {
    database
      .prepare("INSERT INTO event_audience_groups (event_id, group_id) VALUES (?, ?)")
      .run(boardEvent.id, boardGroup.id);
  }
  database.close();

  const server = await startApiServer({
    host: "127.0.0.1",
    port: 0,
    databasePath,
    appBaseUrl: "http://127.0.0.1:3000",
    notificationDispatchIntervalMs: 25,
    sharePointClient: options.sharePointClient,
    teamsGraphClient: options.teamsGraphClient,
    teamsGraph: {
      enabled: options.enableTeamsGraph === true,
      tenantId: "test-tenant",
      clientId: "test-client",
      clientSecret: "test-secret",
      organizerUpn: "events@iwfsa.local"
    }
  });

  return {
    server,
    workingDirectory,
    databasePath,
    memberId: memberRow?.id,
    member2Id: member2Row?.id,
    editorId: editorRow?.id,
    adminId: adminRow?.id,
    inviteeId: inviteeRow?.id
  };
}

test("GET /health returns API status", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const response = await fetch(`http://${server.host}:${server.port}/health`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.deepEqual(payload, { status: "ok" });
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("GET /api/events returns published events", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const loginPayload = await login.json();
    const response = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${loginPayload.token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(Array.isArray(payload.items), true);
    assert.equal(payload.items.length, 2);
    const titles = payload.items.map((item) => item.title).sort();
    assert.deepEqual(titles, ["Board Strategy", "Leadership Roundtable"]);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("GET /api/events/:id/calendar.ics returns downloadable calendar content", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    assert.equal(eventsResponse.status, 200);
    const first = (eventsPayload.items || [])[0];
    assert.equal(Boolean(first && first.id), true);

    const response = await fetch(`http://${server.host}:${server.port}/api/events/${first.id}/calendar.ics`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const text = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /text\/calendar/);
    assert.match(text, /BEGIN:VCALENDAR/);
    assert.match(text, /BEGIN:VEVENT/);
    assert.match(text, /DTSTART:/);
    assert.match(text, /DTEND:/);
    assert.match(text, /SUMMARY:/);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("POST /api/auth/login authenticates bootstrap admin", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const response = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "akeida",
        password: "akeida123"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.authenticated, true);
    assert.equal(typeof payload.token, "string");
    assert.equal(payload.user.username, "akeida");
    assert.equal(payload.user.role, "chief_admin");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("POST /api/auth/login rejects invalid credentials", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const response = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        username: "akeida",
        password: "wrong-password"
      })
    });
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error, "invalid_credentials");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("POST /api/auth/logout revokes session token", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const loginResponse = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const loginPayload = await loginResponse.json();
    assert.equal(loginResponse.status, 200);

    const logoutResponse = await fetch(`http://${server.host}:${server.port}/api/auth/logout`, {
      method: "POST",
      headers: { Authorization: `Bearer ${loginPayload.token}` }
    });
    const logoutPayload = await logoutResponse.json();
    assert.equal(logoutResponse.status, 200);
    assert.equal(logoutPayload.loggedOut, true);
    assert.equal(logoutPayload.revoked, true);

    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${loginPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    assert.equal(eventsResponse.status, 401);
    assert.equal(eventsPayload.error, "unauthorized");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("POST /api/auth/signup is disabled (invite/reset only)", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const response = await fetch(`http://${server.host}:${server.port}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "someone", email: "someone@example.com", password: "password123" })
    });
    const payload = await response.json();
    assert.equal(response.status, 404);
    assert.equal(payload.error, "not_found");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("GET /api/events rejects missing auth", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const response = await fetch(`http://${server.host}:${server.port}/api/events`);
    const payload = await response.json();

    assert.equal(response.status, 401);
    assert.equal(payload.error, "unauthorized");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("GET /api/members requires admin role", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const response = await fetch(`http://${server.host}:${server.port}/api/members`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 403);
    assert.equal(payload.error, "forbidden");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("POST /api/members stores group memberships and records audit logs", async () => {
  const { server, workingDirectory, databasePath } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/members`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        fullName: "Group Test Member",
        email: "grouped.member@iwfsa.local",
        groups: ["Board of Directors", "Leadership Development", "board of directors"]
      })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.deepEqual(createPayload.groups, ["Board of Directors", "Leadership Development"]);

    const listResponse = await fetch(`http://${server.host}:${server.port}/api/members`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const listPayload = await listResponse.json();

    assert.equal(listResponse.status, 200);
    const created = listPayload.items.find((item) => item.email === "grouped.member@iwfsa.local");
    assert.ok(created);
    assert.deepEqual(created.groups, ["Board of Directors", "Leadership Development"]);

    const database = openDatabase(databasePath);
    try {
      const creationAudit = database
        .prepare(
          `
          SELECT actor_user_id AS actorUserId, metadata_json AS metadataJson
          FROM audit_logs
          WHERE action_type = 'member_created_manual' AND target_id = ?
          ORDER BY id DESC
          LIMIT 1
        `
        )
        .get(String(createPayload.id));
      assert.ok(creationAudit);
      assert.equal(Number(creationAudit.actorUserId), adminPayload.user.id);
      const creationMetadata = JSON.parse(creationAudit.metadataJson || "{}");
      assert.equal(creationMetadata.email, "grouped.member@iwfsa.local");
      assert.deepEqual(creationMetadata.groups, ["Board of Directors", "Leadership Development"]);

      const inviteAudit = database
        .prepare(
          `
          SELECT actor_user_id AS actorUserId
          FROM audit_logs
          WHERE action_type = 'member_invite_queued' AND target_id = ?
          ORDER BY id DESC
          LIMIT 1
        `
        )
        .get(String(createPayload.id));
      assert.ok(inviteAudit);
      assert.equal(Number(inviteAudit.actorUserId), adminPayload.user.id);
    } finally {
      database.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Member event listing respects audience groups", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const response = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    const titles = payload.items.map((item) => item.title).sort();
    assert.deepEqual(titles, ["Board Strategy", "Leadership Roundtable"]);

    const editorLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "editor1", password: "editorpass" })
    });
    const editorPayload = await editorLogin.json();

    const editorResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${editorPayload.token}` }
    });
    const editorEvents = await editorResponse.json();

    const editorTitles = editorEvents.items.map((item) => item.title).sort();
    assert.deepEqual(editorTitles, ["Leadership Roundtable"]);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("GET /api/admin/event-audiences returns required audience options for admin and members", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const response = await fetch(`http://${server.host}:${server.port}/api/admin/event-audiences`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    const labels = (payload.items || []).map((item) => item.label);
    assert.deepEqual(labels, [
      "All Members",
      "Board of Directors",
      "Member Affairs",
      "Brand and Reputation",
      "Strategic Alliances and Advocacy",
      "Catalytic Strategy and Voice",
      "Leadership Development"
    ]);

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const memberResponse = await fetch(`http://${server.host}:${server.port}/api/admin/event-audiences`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const memberAudiencePayload = await memberResponse.json();

    assert.equal(memberResponse.status, 200);
    const memberLabels = (memberAudiencePayload.items || []).map((item) => item.label);
    assert.deepEqual(memberLabels, labels);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Member can create/edit/publish own draft event and cannot edit another member event unless granted", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();
    assert.equal(adminLogin.status, 200);

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();
    assert.equal(member2Login.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "Member Owned Event",
        description: "Created by a member.",
        startAt: isoDaysFromNow(4),
        endAt: isoDaysFromNow(4, 2),
        venueType: "physical",
        capacity: 12,
        audienceCode: "member_affairs"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.status, "draft");

    const memberEventsResponse = await fetch(`http://${server.host}:${server.port}/api/admin/events`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const memberEventsPayload = await memberEventsResponse.json();
    assert.equal(memberEventsResponse.status, 200);
    const memberEventIds = (memberEventsPayload.items || []).map((item) => item.id);
    assert.equal(memberEventIds.includes(createPayload.id), true);

    const member2EventsResponse = await fetch(`http://${server.host}:${server.port}/api/admin/events`, {
      headers: { Authorization: `Bearer ${member2Payload.token}` }
    });
    const member2EventsPayload = await member2EventsResponse.json();
    assert.equal(member2EventsResponse.status, 200);
    const member2EventIds = (member2EventsPayload.items || []).map((item) => item.id);
    assert.equal(member2EventIds.includes(createPayload.id), false);

    const patchResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ title: "Member Owned Event v2" })
    });
    const patchPayload = await patchResponse.json();
    assert.equal(patchResponse.status, 200);
    assert.equal(patchPayload.updated, true);

    const patchByOtherMemberResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member2Payload.token}`
      },
      body: JSON.stringify({ title: "Should Fail" })
    });
    const patchByOtherMemberPayload = await patchByOtherMemberResponse.json();
    assert.equal(patchByOtherMemberResponse.status, 403);
    assert.equal(patchByOtherMemberPayload.error, "forbidden");

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${memberPayload.token}` }
      }
    );
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.status, "published");

    const memberEventsAfterPublishResponse = await fetch(`http://${server.host}:${server.port}/api/admin/events`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const memberEventsAfterPublishPayload = await memberEventsAfterPublishResponse.json();
    assert.equal(memberEventsAfterPublishResponse.status, 200);
    const memberPublishedEvent = (memberEventsAfterPublishPayload.items || []).find((item) => item.id === createPayload.id);
    assert.ok(memberPublishedEvent);
    assert.equal(memberPublishedEvent.canEdit, true);

    const creatorPatchAfterPublish = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ title: "Creator cannot patch after publish" })
    });
    const creatorPatchAfterPublishPayload = await creatorPatchAfterPublish.json();
    assert.equal(creatorPatchAfterPublish.status, 200);
    assert.equal(creatorPatchAfterPublishPayload.updated, true);
    assert.equal(submitPayload.alreadySubmitted, false);
    assert.equal(submitPayload.alreadyPublished, false);

    const chiefLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const chiefPayload = await chiefLogin.json();
    assert.equal(chiefLogin.status, 200);

    const approveByChiefResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${chiefPayload.token}` }
      }
    );
    const approveByChiefPayload = await approveByChiefResponse.json();
    assert.equal(approveByChiefResponse.status, 404);
    assert.equal(approveByChiefPayload.error, "not_found");

    const creatorGrantResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ eventId: createPayload.id, userId: member2Payload.user.id })
    });
    const creatorGrantPayload = await creatorGrantResponse.json();
    assert.equal(creatorGrantResponse.status, 200);
    assert.equal(creatorGrantPayload.granted, true);

    const patchByGrantedMemberResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member2Payload.token}`
      },
      body: JSON.stringify({ title: "Granted member edit" })
    });
    const patchByGrantedMemberPayload = await patchByGrantedMemberResponse.json();
    assert.equal(patchByGrantedMemberResponse.status, 200);
    assert.equal(patchByGrantedMemberPayload.updated, true);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Member event listing supports week/month/year filters", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    async function createAndPublish(title, startAt, endAt) {
      const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPayload.token}`
        },
        body: JSON.stringify({
          title,
          description: "Window test event",
          startAt,
          endAt,
          venueType: "physical",
          capacity: 20,
          audienceType: "all_members"
        })
      });
      const createPayload = await createResponse.json();
      assert.equal(createResponse.status, 201);

      const submitResponse = await fetch(
        `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminPayload.token}` }
        }
      );
      assert.equal(submitResponse.status, 200);
    }

    await createAndPublish("Window Week Event", isoDaysFromNow(2), isoDaysFromNow(2, 2));
    await createAndPublish("Window Future Event", isoDaysFromNow(45), isoDaysFromNow(45, 2));

    const weekResponse = await fetch(`http://${server.host}:${server.port}/api/events?view=week`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const weekPayload = await weekResponse.json();
    assert.equal(weekResponse.status, 200);
    const weekTitles = weekPayload.items.map((item) => item.title);
    assert.equal(weekTitles.includes("Window Week Event"), true);
    assert.equal(weekTitles.includes("Window Future Event"), false);

    const monthResponse = await fetch(`http://${server.host}:${server.port}/api/events?view=month`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const monthPayload = await monthResponse.json();
    assert.equal(monthResponse.status, 200);
    const monthTitles = monthPayload.items.map((item) => item.title);
    assert.equal(monthTitles.includes("Window Week Event"), true);
    assert.equal(monthTitles.includes("Window Future Event"), false);

    const yearResponse = await fetch(`http://${server.host}:${server.port}/api/events?view=year`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const yearPayload = await yearResponse.json();
    assert.equal(yearResponse.status, 200);
    const yearTitles = yearPayload.items.map((item) => item.title);
    assert.equal(yearTitles.includes("Window Week Event"), true);
    assert.equal(yearTitles.includes("Window Future Event"), true);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event lifecycle follows draft -> publish-on-submit and keeps submit/approve idempotent", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();

    const chiefLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const chiefPayload = await chiefLogin.json();
    assert.equal(chiefLogin.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Draft Summit",
        description: "Draft event.",
        startAt: "2026-04-01T09:00:00Z",
        endAt: "2026-04-01T11:00:00Z",
        venueType: "physical",
        capacity: 10,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();

    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.status, "draft");

    const approveBeforeSubmit = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${chiefPayload.token}` }
      }
    );
    const approveBeforeSubmitPayload = await approveBeforeSubmit.json();
    assert.equal(approveBeforeSubmit.status, 404);
    assert.equal(approveBeforeSubmitPayload.error, "not_found");

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.status, "published");
    assert.equal(submitPayload.alreadySubmitted, false);
    assert.equal(submitPayload.alreadyPublished, false);

    const resubmitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const resubmitPayload = await resubmitResponse.json();
    assert.equal(resubmitResponse.status, 200);
    assert.equal(resubmitPayload.status, "published");
    assert.equal(resubmitPayload.alreadySubmitted, true);
    assert.equal(resubmitPayload.alreadyPublished, true);

    const approveResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${chiefPayload.token}` }
      }
    );
    const approvePayload = await approveResponse.json();
    assert.equal(approveResponse.status, 404);
    assert.equal(approvePayload.error, "not_found");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Audience code mapping and lifecycle audit logs are recorded", async () => {
  const { server, workingDirectory, databasePath } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Audience Audit Event",
        description: "Audience/audit verification",
        startAt: isoDaysFromNow(3),
        endAt: isoDaysFromNow(3, 2),
        venueType: "physical",
        venueName: "Cape Town",
        capacity: 20,
        audienceCode: "board_of_directors"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    assert.equal(submitResponse.status, 200);

    const approveResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    assert.equal(approveResponse.status, 404);

    const database = openDatabase(databasePath);
    try {
      const audienceGroupRows = database
        .prepare(
          `
          SELECT groups.name AS groupName
          FROM event_audience_groups
          JOIN groups ON groups.id = event_audience_groups.group_id
          WHERE event_audience_groups.event_id = ?
        `
        )
        .all(createPayload.id);
      assert.equal(audienceGroupRows.length, 1);
      assert.equal(audienceGroupRows[0].groupName, "Board of Directors");

      const auditRows = database
        .prepare(
          `
          SELECT action_type AS actionType
          FROM audit_logs
          WHERE target_type = 'event' AND target_id = ?
          ORDER BY id
        `
        )
        .all(String(createPayload.id));
      const auditTypes = auditRows.map((row) => row.actionType);
      assert.equal(auditTypes.includes("event_created"), true);
      assert.equal(auditTypes.includes("event_submitted_for_approval"), false);
      assert.equal(auditTypes.includes("event_published"), true);
    } finally {
      database.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event publish notifications are idempotent and visible in admin deliveries", async () => {
  const { server, workingDirectory, databasePath, memberId, member2Id } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Notification Publish Test",
        description: "Ensure publish fan-out is idempotent.",
        startAt: isoDaysFromNow(10),
        endAt: isoDaysFromNow(10, 2),
        venueType: "physical",
        venueName: "Cape Town",
        capacity: 25,
        registrationClosesAt: isoDaysFromNow(9),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      { method: "POST", headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    assert.equal(submitResponse.status, 200);

    await waitFor(
      async () => {
        const queueResponse = await fetch(
          `http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`,
          { headers: { Authorization: `Bearer ${adminPayload.token}` } }
        );
        const queuePayload = await queueResponse.json();
        const row = (queuePayload.items || []).find((item) => item.eventType === "event_published");
        if (!row) return null;
        if (row.status === "sent" || row.status === "failed") return row;
        return null;
      },
      { label: "publish queue dispatch" }
    );

    const deliveryResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const deliveryPayload = await deliveryResponse.json();
    const publishedDeliveries = (deliveryPayload.items || []).filter((item) => item.eventType === "event_published");

    assert.equal(publishedDeliveries.length, 4);
    for (const delivery of publishedDeliveries) {
      assert.equal(delivery.status, "sent");
    }
    const deliveryKey = (row) => `${row.userId}:${row.channel}`;
    const expected = new Set([
      `${memberId}:in_app`,
      `${memberId}:email`,
      `${member2Id}:in_app`,
      `${member2Id}:email`
    ]);
    for (const delivery of publishedDeliveries) {
      expected.delete(deliveryKey(delivery));
    }
    assert.equal(expected.size, 0);

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const notificationResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const notificationPayload = await notificationResponse.json();
    const memberPublished = (notificationPayload.items || []).filter(
      (item) => item.eventType === "event_published" && item.metadata && item.metadata.eventId === createPayload.id
    );
    assert.equal(memberPublished.length, 1);

    const database = openDatabase(databasePath);
    const revisionRow = database
      .prepare(
        `
        SELECT id
        FROM event_revisions
        WHERE event_id = ? AND revision_type = 'publish'
        ORDER BY id DESC
        LIMIT 1
      `
      )
      .get(createPayload.id);
    assert.equal(Number.isInteger(Number(revisionRow?.id)), true);
    const revisionId = Number(revisionRow.id);
    database
      .prepare(
        `
        INSERT INTO notification_queue (idempotency_key, event_type, payload_json, status)
        VALUES (?, 'event_published', ?, 'pending')
      `
      )
      .run(`manual_duplicate:${revisionId}:${Date.now()}`, JSON.stringify({ eventId: createPayload.id, revisionId }));
    database.close();

    await waitFor(
      async () => {
        const queueResponse = await fetch(
          `http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`,
          { headers: { Authorization: `Bearer ${adminPayload.token}` } }
        );
        const queuePayload = await queueResponse.json();
        const published = (queuePayload.items || []).filter((item) => item.eventType === "event_published");
        if (published.length < 2) return null;
        if (published.some((item) => item.status !== "sent" && item.status !== "failed")) return null;
        return published;
      },
      { label: "duplicate publish queue dispatch" }
    );

    const deliveryResponse2 = await fetch(
      `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const deliveryPayload2 = await deliveryResponse2.json();
    const publishedDeliveries2 = (deliveryPayload2.items || []).filter((item) => item.eventType === "event_published");
    assert.equal(publishedDeliveries2.length, 4);

    const notificationResponse2 = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=50`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const notificationPayload2 = await notificationResponse2.json();
    const memberPublished2 = (notificationPayload2.items || []).filter(
      (item) => item.eventType === "event_published" && item.metadata && item.metadata.eventId === createPayload.id
    );
    assert.equal(memberPublished2.length, 1);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event rollback restores snapshot and triggers participant notification deliveries", async () => {
  const { server, workingDirectory, memberId } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Rollback Notification Test",
        description: "Rollback should restore snapshot.",
        startAt: isoDaysFromNow(12),
        endAt: isoDaysFromNow(12, 2),
        venueType: "physical",
        venueName: "Johannesburg",
        capacity: 10,
        registrationClosesAt: isoDaysFromNow(11),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      { method: "POST", headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    assert.equal(submitResponse.status, 200);

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const registerResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({})
    });
    assert.equal(registerResponse.status, 200);

    const originalTitle = "Rollback Notification Test";
    const updatedTitle = "Rollback Notification Test v2";
    const patchResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ title: updatedTitle })
    });
    const patchPayload = await patchResponse.json();
    assert.equal(patchResponse.status, 200);
    assert.equal(patchPayload.updated, true);

    const revisionsResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/events/${createPayload.id}/revisions`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const revisionsPayload = await revisionsResponse.json();
    assert.equal(revisionsResponse.status, 200);
    const updateRevision = (revisionsPayload.items || []).find((item) => item.revisionType === "update");
    assert.equal(Number.isInteger(Number(updateRevision?.id)), true);

    const deliveryCountBefore = await waitFor(
      async () => {
        const deliveryResponse = await fetch(
          `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
          { headers: { Authorization: `Bearer ${adminPayload.token}` } }
        );
        const deliveryPayload = await deliveryResponse.json();
        const items = (deliveryPayload.items || []).filter(
          (item) => item.eventType === "event_updated" && item.userId === memberId
        );
        if (items.length >= 2) return items.length;
        return null;
      },
      { label: "initial event_updated deliveries" }
    );

    const rollbackResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/events/${createPayload.id}/revisions/${updateRevision.id}/rollback`,
      { method: "POST", headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const rollbackPayload = await rollbackResponse.json();
    assert.equal(rollbackResponse.status, 200);
    assert.equal(rollbackPayload.rolledBack, true);

    const adminEventsResponse = await fetch(`http://${server.host}:${server.port}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const adminEventsPayload = await adminEventsResponse.json();
    const rolledBackEvent = (adminEventsPayload.items || []).find((item) => item.id === createPayload.id);
    assert.equal(rolledBackEvent.title, originalTitle);

    await waitFor(
      async () => {
        const notificationResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=50`, {
          headers: { Authorization: `Bearer ${memberPayload.token}` }
        });
        const notificationPayload = await notificationResponse.json();
        const items = (notificationPayload.items || []).filter(
          (item) =>
            item.eventType === "event_updated" &&
            item.metadata &&
            item.metadata.eventId === createPayload.id &&
            String(item.body || "").includes("Event rolled back")
        );
        return items.length > 0 ? items[0] : null;
      },
      { label: "rollback notification for participant" }
    );

    await waitFor(
      async () => {
        const deliveryResponse = await fetch(
          `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
          { headers: { Authorization: `Bearer ${adminPayload.token}` } }
        );
        const deliveryPayload = await deliveryResponse.json();
        const items = (deliveryPayload.items || []).filter(
          (item) => item.eventType === "event_updated" && item.userId === memberId
        );
        if (items.length >= deliveryCountBefore + 2) return items.length;
        return null;
      },
      { label: "rollback event_updated deliveries" }
    );
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("GET /api/birthdays respects consent and window filtering", async () => {
  const { server, workingDirectory, databasePath, memberId, member2Id } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const database = openDatabase(databasePath);
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const inTenDays = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 10));

    database
      .prepare(
        `
        INSERT INTO member_profiles (user_id, full_name, birthday_month, birthday_day, birthday_visibility)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          full_name = excluded.full_name,
          birthday_month = excluded.birthday_month,
          birthday_day = excluded.birthday_day,
          birthday_visibility = excluded.birthday_visibility,
          updated_at = CURRENT_TIMESTAMP
      `
      )
      .run(memberId, "Member One", tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate(), "members_only");

    database
      .prepare(
        `
        INSERT INTO member_profiles (user_id, full_name, birthday_month, birthday_day, birthday_visibility)
        VALUES (?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          full_name = excluded.full_name,
          birthday_month = excluded.birthday_month,
          birthday_day = excluded.birthday_day,
          birthday_visibility = excluded.birthday_visibility,
          updated_at = CURRENT_TIMESTAMP
      `
      )
      .run(member2Id, "Member Two", inTenDays.getUTCMonth() + 1, inTenDays.getUTCDate(), "members_and_social");

    database
      .prepare(
        `
        INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, 'member', 'active', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `
      )
      .run("member3", "member3@iwfsa.local", hashPassword("member3pass"));
    const member3Row = database.prepare("SELECT id FROM users WHERE username = ?").get("member3");
    database
      .prepare(
        `
        INSERT INTO member_profiles (user_id, full_name, birthday_month, birthday_day, birthday_visibility)
        VALUES (?, ?, ?, ?, ?)
      `
      )
      .run(member3Row.id, "Hidden Birthday", tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate(), "hidden");

    database.prepare("INSERT OR IGNORE INTO member_roles (name) VALUES (?)").run("Board");
    const roleRow = database.prepare("SELECT id FROM member_roles WHERE name = ?").get("Board");
    database
      .prepare("INSERT OR IGNORE INTO member_role_assignments (role_id, user_id) VALUES (?, ?)")
      .run(roleRow.id, memberId);
    database.close();

    const response = await fetch(`http://${server.host}:${server.port}/api/birthdays?window=14`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(payload.windowDays, 14);
    assert.equal(Array.isArray(payload.items), true);
    const ids = payload.items.map((item) => item.userId).sort((a, b) => a - b);
    assert.deepEqual(ids, [memberId, member2Id]);

    const memberOne = payload.items.find((item) => item.userId === memberId);
    assert.equal(Array.isArray(memberOne.roles), true);
    assert.equal(memberOne.roles.includes("Board"), true);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("GET /api/birthdays includes photoUrl", async () => {
  const { server, workingDirectory, databasePath, memberId } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const database = openDatabase(databasePath);
    const now = new Date();
    const tomorrow = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
    const photoUrl = "https://example.com/mypic.jpg";

    database
      .prepare(
        `
        INSERT INTO member_profiles (user_id, full_name, birthday_month, birthday_day, birthday_visibility, photo_url)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET
          photo_url = excluded.photo_url,
          birthday_month = excluded.birthday_month,
          birthday_day = excluded.birthday_day,
          birthday_visibility = excluded.birthday_visibility
      `
      )
      .run(memberId, "Member With Photo", tomorrow.getUTCMonth() + 1, tomorrow.getUTCDate(), "members_only", photoUrl);
    database.close();

    const response = await fetch(`http://${server.host}:${server.port}/api/birthdays?window=14`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    const memberItem = payload.items.find(i => i.userId === memberId);
    assert.ok(memberItem, "Member should be found");
    assert.equal(memberItem.photoUrl, photoUrl, "photoUrl should be returned");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event editor can publish own draft and can edit after publish for own events", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const editorLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "editor1", password: "editorpass" })
    });
    const editorPayload = await editorLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${editorPayload.token}`
      },
      body: JSON.stringify({
        title: "Editor Owned Event",
        description: "Created by editor.",
        startAt: isoDaysFromNow(5),
        endAt: isoDaysFromNow(5, 2),
        venueType: "physical",
        capacity: 15,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const patchResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${editorPayload.token}`
      },
      body: JSON.stringify({ title: "Editor Owned Event v2" })
    });
    const patchPayload = await patchResponse.json();
    assert.equal(patchResponse.status, 200);
    assert.equal(patchPayload.updated, true);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${editorPayload.token}` }
      }
    );
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.status, "published");

    const patchAfterPublish = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${editorPayload.token}`
      },
      body: JSON.stringify({ title: "Editor post-publish update should fail" })
    });
    const patchAfterPublishPayload = await patchAfterPublish.json();
    assert.equal(patchAfterPublish.status, 200);
    assert.equal(patchAfterPublishPayload.updated, true);

    const approveByEditor = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${editorPayload.token}` }
      }
    );
    const approveByEditorPayload = await approveByEditor.json();
    assert.equal(approveByEditor.status, 404);
    assert.equal(approveByEditorPayload.error, "not_found");

    const editorEventsResponse = await fetch(`http://${server.host}:${server.port}/api/admin/events`, {
      headers: { Authorization: `Bearer ${editorPayload.token}` }
    });
    const editorEventsPayload = await editorEventsResponse.json();
    assert.equal(editorEventsResponse.status, 200);
    const editorTitles = editorEventsPayload.items.map((item) => item.title);
    assert.equal(editorTitles.includes("Editor post-publish update should fail"), true);

    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const approveByChief = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/approve`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const approveByChiefPayload = await approveByChief.json();
    assert.equal(approveByChief.status, 404);
    assert.equal(approveByChiefPayload.error, "not_found");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Overlapping meeting creation stays allowed and creates clash warning notification for creator", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "Overlap Warning Event",
        description: "Should overlap with the seeded event.",
        startAt: "2026-03-01T11:00:00Z",
        endAt: "2026-03-01T13:00:00Z",
        venueType: "physical",
        capacity: 20,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.status, "draft");
    assert.equal(createPayload.clashWarning?.hasClash, true);
    assert.equal(Number(createPayload.clashWarning?.conflictCount || 0) >= 1, true);
    const conflictTitles = (createPayload.clashWarning?.conflicts || []).map((item) => item.title);
    assert.equal(conflictTitles.includes("Leadership Roundtable"), true);

    const notificationsResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=25`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const notificationsPayload = await notificationsResponse.json();
    assert.equal(notificationsResponse.status, 200);

    const clashNotification = (notificationsPayload.items || []).find(
      (item) =>
        item.eventType === "event_time_conflict_warning" &&
        item.metadata &&
        Number(item.metadata.eventId) === Number(createPayload.id)
    );
    assert.ok(clashNotification);
    assert.equal(Number(clashNotification.metadata.conflictCount || 0) >= 1, true);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event write endpoints enforce server-side chronology and venue validation", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const invalidTimeResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "Invalid Time Event",
        startAt: "2026-03-01T13:00:00Z",
        endAt: "2026-03-01T11:00:00Z",
        venueType: "physical",
        capacity: 10,
        audienceType: "all_members"
      })
    });
    const invalidTimePayload = await invalidTimeResponse.json();
    assert.equal(invalidTimeResponse.status, 400);
    assert.equal(invalidTimePayload.error, "validation_error");
    assert.match(String(invalidTimePayload.message || ""), /End date and time must be later/i);

    const invalidVenueResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "Invalid Venue Event",
        startAt: "2026-03-02T09:00:00Z",
        endAt: "2026-03-02T10:00:00Z",
        venueType: "spaceship",
        capacity: 10,
        audienceType: "all_members"
      })
    });
    const invalidVenuePayload = await invalidVenueResponse.json();
    assert.equal(invalidVenueResponse.status, 400);
    assert.equal(invalidVenuePayload.error, "validation_error");
    assert.match(String(invalidVenuePayload.message || ""), /Venue type must be either physical or online/i);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "Patch Validation Event",
        startAt: "2026-03-03T09:00:00Z",
        endAt: "2026-03-03T10:00:00Z",
        venueType: "physical",
        capacity: 10,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const invalidPatchResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        venueType: "spaceship"
      })
    });
    const invalidPatchPayload = await invalidPatchResponse.json();
    assert.equal(invalidPatchResponse.status, 400);
    assert.equal(invalidPatchPayload.error, "validation_error");
    assert.match(String(invalidPatchPayload.message || ""), /Venue type must be either physical or online/i);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Meeting invitations include RSVP email links and RSVP tokens confirm participation", async () => {
  globalThis[EMAIL_OUTBOX_GLOBAL_KEY] = [];
  const { server, workingDirectory, databasePath, member2Id } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "RSVP Link Meeting",
        description: "Invitation link test.",
        startAt: isoDaysFromNow(8),
        endAt: isoDaysFromNow(8, 2),
        venueType: "physical",
        capacity: 20,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.status, "draft");

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${memberPayload.token}` }
      }
    );
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.status, "published");

    const chiefLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const chiefPayload = await chiefLogin.json();
    assert.equal(chiefLogin.status, 200);

    const tokenRow = await waitFor(
      async () => {
        const database = openDatabase(databasePath);
        try {
          return database
            .prepare(
              `
              SELECT token
              FROM meeting_rsvp_tokens
              WHERE event_id = ? AND user_id = ?
              ORDER BY id DESC
              LIMIT 1
            `
            )
            .get(createPayload.id, member2Id);
        } finally {
          database.close();
        }
      },
      { label: "meeting RSVP token dispatch" }
    );
    assert.ok(tokenRow?.token);

    const expectedRsvpUrl = `http://127.0.0.1:3000/meetings/rsvp?token=${tokenRow.token}`;
    const outbox = globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
    assert.ok(Array.isArray(outbox));
    const inviteEmail = outbox.find(
      (entry) =>
        entry.metadata?.template === "event_published" &&
        entry.to === "member2@iwfsa.local" &&
        String(entry.subject || "").includes("RSVP Link Meeting")
    );
    assert.ok(inviteEmail, "RSVP invite email should be sent to member2");
    assert.ok(String(inviteEmail.text || "").includes(expectedRsvpUrl));
    assert.ok(String(inviteEmail.text || "").includes("Starts:"));
    assert.ok(String(inviteEmail.text || "").includes("Ends:"));
    assert.ok(String(inviteEmail.text || "").includes("Venue:"));
    assert.ok(String(inviteEmail.text || "").includes("Use this link to confirm participation or select 'Cannot attend'."));

    const rsvpGetResponse = await fetch(
      `http://${server.host}:${server.port}/api/meetings/rsvp?token=${encodeURIComponent(tokenRow.token)}`
    );
    const rsvpGetPayload = await rsvpGetResponse.json();
    assert.equal(rsvpGetResponse.status, 405);
    assert.equal(rsvpGetPayload.error, "method_not_allowed");

    const rsvpResponse = await fetch(`http://${server.host}:${server.port}/api/meetings/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenRow.token })
    });
    const rsvpPayload = await rsvpResponse.json();
    assert.equal(rsvpResponse.status, 200);
    assert.equal(rsvpPayload.confirmed, true);
    assert.equal(rsvpPayload.eventId, createPayload.id);
    assert.equal(["confirmed", "waitlisted"].includes(rsvpPayload.status), true);

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();
    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${member2Payload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    assert.equal(eventsResponse.status, 200);
    const invitedMeeting = (eventsPayload.items || []).find((item) => item.id === createPayload.id);
    assert.ok(invitedMeeting);
    assert.equal(["confirmed", "waitlisted"].includes(invitedMeeting.mySignupStatus), true);
  } finally {
    delete globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Meeting RSVP supports explicit decline from invite links", async () => {
  globalThis[EMAIL_OUTBOX_GLOBAL_KEY] = [];
  const { server, workingDirectory, databasePath, member2Id } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "RSVP Decline Meeting",
        description: "Decline action test.",
        startAt: isoDaysFromNow(9),
        endAt: isoDaysFromNow(9, 2),
        venueType: "physical",
        venueName: "IWFSA HQ",
        venueAddress: "Cape Town",
        capacity: 20,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${memberPayload.token}` }
      }
    );
    assert.equal(submitResponse.status, 200);

    const tokenRow = await waitFor(
      async () => {
        const database = openDatabase(databasePath);
        try {
          return database
            .prepare(
              `
              SELECT token
              FROM meeting_rsvp_tokens
              WHERE event_id = ? AND user_id = ?
              ORDER BY id DESC
              LIMIT 1
            `
            )
            .get(createPayload.id, member2Id);
        } finally {
          database.close();
        }
      },
      { label: "meeting RSVP decline token dispatch" }
    );
    assert.ok(tokenRow?.token);

    const declineResponse = await fetch(`http://${server.host}:${server.port}/api/meetings/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenRow.token, action: "decline" })
    });
    const declinePayload = await declineResponse.json();
    assert.equal(declineResponse.status, 200);
    assert.equal(declinePayload.declined, true);
    assert.equal(declinePayload.status, "declined");

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();
    assert.equal(member2Login.status, 200);

    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${member2Payload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    assert.equal(eventsResponse.status, 200);
    const declinedMeeting = (eventsPayload.items || []).find((item) => item.id === createPayload.id);
    assert.equal(declinedMeeting?.mySignupStatus, "cancelled");

    const declineAgainResponse = await fetch(`http://${server.host}:${server.port}/api/meetings/rsvp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: tokenRow.token, action: "decline" })
    });
    const declineAgainPayload = await declineAgainResponse.json();
    assert.equal(declineAgainResponse.status, 200);
    assert.equal(declineAgainPayload.status, "declined");
    assert.equal(declineAgainPayload.idempotent, true);
  } finally {
    delete globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("A member can register for multiple different events", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();
    assert.equal(adminLogin.status, 200);

    const createEvent = async (title, dayOffset) => {
      const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPayload.token}`
        },
        body: JSON.stringify({
          title,
          description: `${title} details`,
          startAt: isoDaysFromNow(dayOffset),
          endAt: isoDaysFromNow(dayOffset, 2),
          venueType: "physical",
          venueName: "IWFSA HQ",
          venueAddress: "Cape Town",
          capacity: 10,
          registrationClosesAt: isoDaysFromNow(dayOffset - 1),
          audienceType: "all_members"
        })
      });
      const createPayload = await createResponse.json();
      assert.equal(createResponse.status, 201);

      const submitResponse = await fetch(
        `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${adminPayload.token}` }
        }
      );
      assert.equal(submitResponse.status, 200);
      return createPayload.id;
    };

    const eventOneId = await createEvent("Multi-event A", 10);
    const eventTwoId = await createEvent("Multi-event B", 12);

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const registerOne = await fetch(`http://${server.host}:${server.port}/api/events/${eventOneId}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({})
    });
    const registerOnePayload = await registerOne.json();
    assert.equal(registerOne.status, 200);
    assert.equal(registerOnePayload.status, "confirmed");

    const registerTwo = await fetch(`http://${server.host}:${server.port}/api/events/${eventTwoId}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({})
    });
    const registerTwoPayload = await registerTwo.json();
    assert.equal(registerTwo.status, 200);
    assert.equal(registerTwoPayload.status, "confirmed");

    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    assert.equal(eventsResponse.status, 200);

    const eventOne = (eventsPayload.items || []).find((item) => item.id === eventOneId);
    const eventTwo = (eventsPayload.items || []).find((item) => item.id === eventTwoId);
    assert.equal(eventOne?.mySignupStatus, "confirmed");
    assert.equal(eventTwo?.mySignupStatus, "confirmed");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Meeting planning endpoints return organizer summary and send scoped updates", async () => {
  globalThis[EMAIL_OUTBOX_GLOBAL_KEY] = [];
  const { server, workingDirectory } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "Planning Workflow Meeting",
        description: "Planning summary and update test.",
        startAt: isoDaysFromNow(6),
        endAt: isoDaysFromNow(6, 2),
        venueType: "physical",
        capacity: 25,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.status, "draft");

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${memberPayload.token}` }
      }
    );
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.status, "published");

    const chiefLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const chiefPayload = await chiefLogin.json();
    assert.equal(chiefLogin.status, 200);

    const planningResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/planning`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const planningPayload = await planningResponse.json();
    assert.equal(planningResponse.status, 200);
    assert.equal(Number(planningPayload.invitedCount || 0) >= 2, true);
    assert.equal(Array.isArray(planningPayload.participants), true);

    const planningMessageResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/planning-message`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberPayload.token}`
        },
        body: JSON.stringify({
          subject: "Please confirm attendance",
          body: "We need final numbers for venue setup.",
          audienceScope: "pending_only"
        })
      }
    );
    const planningMessagePayload = await planningMessageResponse.json();
    assert.equal(planningMessageResponse.status, 200);
    assert.equal(planningMessagePayload.sent, true);
    assert.equal(Number(planningMessagePayload.recipientCount || 0) >= 1, true);

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();
    const notificationsResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=25`, {
      headers: { Authorization: `Bearer ${member2Payload.token}` }
    });
    const notificationsPayload = await notificationsResponse.json();
    assert.equal(notificationsResponse.status, 200);
    const planningNotice = (notificationsPayload.items || []).find(
      (item) =>
        item.eventType === "meeting_planning_update" &&
        item.metadata &&
        Number(item.metadata.eventId) === Number(createPayload.id)
    );
    assert.ok(planningNotice);
  } finally {
    delete globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("DELETE /api/events enforces draft-only creator deletes unless event-scoped or admin rights", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const editorLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "editor1", password: "editorpass" })
    });
    const editorPayload = await editorLogin.json();

    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createDraftResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${editorPayload.token}`
      },
      body: JSON.stringify({
        title: "Editor Delete Draft",
        description: "Draft event for delete rule.",
        startAt: isoDaysFromNow(3),
        endAt: isoDaysFromNow(3, 2),
        venueType: "physical",
        capacity: 10,
        audienceType: "all_members"
      })
    });
    const draftPayload = await createDraftResponse.json();
    assert.equal(createDraftResponse.status, 201);

    const deleteDraftResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${draftPayload.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${editorPayload.token}` }
      }
    );
    const deleteDraftPayload = await deleteDraftResponse.json();
    assert.equal(deleteDraftResponse.status, 200);
    assert.equal(deleteDraftPayload.deleted, true);

    const createPublishResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${editorPayload.token}`
      },
      body: JSON.stringify({
        title: "Editor Delete Published",
        description: "Published event delete rule.",
        startAt: isoDaysFromNow(6),
        endAt: isoDaysFromNow(6, 2),
        venueType: "physical",
        capacity: 25,
        audienceType: "all_members"
      })
    });
    const publishPayload = await createPublishResponse.json();
    assert.equal(createPublishResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${publishPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${editorPayload.token}` }
      }
    );
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.status, "published");

    const deletePublishedByEditor = await fetch(
      `http://${server.host}:${server.port}/api/events/${publishPayload.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${editorPayload.token}` }
      }
    );
    const deletePublishedByEditorPayload = await deletePublishedByEditor.json();
    assert.equal(deletePublishedByEditor.status, 403);
    assert.equal(deletePublishedByEditorPayload.error, "forbidden");

    const grantResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ eventId: publishPayload.id, userId: editorPayload.user.id })
    });
    const grantPayload = await grantResponse.json();
    assert.equal(grantResponse.status, 200);
    assert.equal(grantPayload.granted, true);

    const deletePublishedByGrantedEditor = await fetch(
      `http://${server.host}:${server.port}/api/events/${publishPayload.id}`,
      {
        method: "DELETE",
        headers: { Authorization: `Bearer ${editorPayload.token}` }
      }
    );
    const deletePublishedByGrantedEditorPayload = await deletePublishedByGrantedEditor.json();
    assert.equal(deletePublishedByGrantedEditor.status, 200);
    assert.equal(deletePublishedByGrantedEditorPayload.deleted, true);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("GET /api/time returns server and monotonic time", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const response = await fetch(`http://${server.host}:${server.port}/api/time`);
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.equal(typeof payload.serverTime, "string");
    assert.equal(Number.isFinite(Date.parse(payload.serverTime)), true);
    assert.equal(typeof payload.monotonicMs, "number");
    assert.equal(payload.monotonicMs >= 0, true);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Registration enforces one-signup, atomic capacity, and waitlist promotion", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Capacity Race Event",
        description: "Capacity test event.",
        startAt: isoDaysFromNow(4),
        endAt: isoDaysFromNow(4, 2),
        venueType: "physical",
        capacity: 1,
        registrationClosesAt: isoDaysFromNow(3),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    assert.equal(submitResponse.status, 200);

    const member1Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const member1Payload = await member1Login.json();
    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();

    const [registerOne, registerTwo] = await Promise.all([
      fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${member1Payload.token}`
        },
        body: JSON.stringify({})
      }),
      fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${member2Payload.token}`
        },
        body: JSON.stringify({})
      })
    ]);

    const registerOnePayload = await registerOne.json();
    const registerTwoPayload = await registerTwo.json();
    assert.equal(registerOne.status, 200);
    assert.equal(registerTwo.status, 200);

    const statuses = [registerOnePayload.status, registerTwoPayload.status].sort();
    assert.deepEqual(statuses, ["confirmed", "waitlisted"]);

    const confirmedToken =
      registerOnePayload.status === "confirmed" ? member1Payload.token : member2Payload.token;
    const waitlistedToken =
      registerOnePayload.status === "waitlisted" ? member1Payload.token : member2Payload.token;

    const cancelResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/cancel-registration`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${confirmedToken}` }
      }
    );
    const cancelPayload = await cancelResponse.json();
    assert.equal(cancelResponse.status, 200);
    assert.equal(cancelPayload.promotedUserId !== null, true);

    const waitlistedEventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${waitlistedToken}` }
    });
    const waitlistedEventsPayload = await waitlistedEventsResponse.json();
    const promotedEvent = waitlistedEventsPayload.items.find((item) => item.id === createPayload.id);
    assert.equal(promotedEvent.mySignupStatus, "confirmed");

    const registerAgainResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${waitlistedToken}`
        },
        body: JSON.stringify({})
      }
    );
    const registerAgainPayload = await registerAgainResponse.json();
    assert.equal(registerAgainResponse.status, 200);
    assert.equal(registerAgainPayload.idempotent, true);

    const adminEventsResponse = await fetch(`http://${server.host}:${server.port}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const adminEventsPayload = await adminEventsResponse.json();
    const eventSnapshot = adminEventsPayload.items.find((item) => item.id === createPayload.id);
    assert.equal(eventSnapshot.confirmedCount, 1);
    assert.equal(eventSnapshot.waitlistedCount, 0);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Waitlist promotion remains FIFO across repeated cancellations", async () => {
  const { server, workingDirectory, databasePath } = await createRunningServer();

  try {
    const database = openDatabase(databasePath);
    try {
      const now = new Date().toISOString();
      database
        .prepare(
          `
          INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'active', ?, ?)
        `
        )
        .run("member3", "member3@iwfsa.local", hashPassword("member3pass"), "member", now, now);
    } finally {
      database.close();
    }

    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "FIFO Promotion Event",
        description: "Validate deterministic waitlist promotions.",
        startAt: isoDaysFromNow(6),
        endAt: isoDaysFromNow(6, 2),
        venueType: "physical",
        capacity: 1,
        registrationClosesAt: isoDaysFromNow(5),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    assert.equal(submitResponse.status, 200);

    const member1Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const member1Payload = await member1Login.json();

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();

    const member3Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member3", password: "member3pass" })
    });
    const member3Payload = await member3Login.json();

    const register1 = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member1Payload.token}`
      },
      body: JSON.stringify({})
    });
    const register1Payload = await register1.json();
    assert.equal(register1.status, 200);
    assert.equal(register1Payload.status, "confirmed");

    const register2 = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member2Payload.token}`
      },
      body: JSON.stringify({})
    });
    const register2Payload = await register2.json();
    assert.equal(register2.status, 200);
    assert.equal(register2Payload.status, "waitlisted");

    const register3 = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member3Payload.token}`
      },
      body: JSON.stringify({})
    });
    const register3Payload = await register3.json();
    assert.equal(register3.status, 200);
    assert.equal(register3Payload.status, "waitlisted");

    const cancelFirst = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/cancel-registration`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${member1Payload.token}` }
      }
    );
    const cancelFirstPayload = await cancelFirst.json();
    assert.equal(cancelFirst.status, 200);
    assert.equal(Number(cancelFirstPayload.promotedUserId), Number(member2Payload.user.id));

    const cancelSecond = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/cancel-registration`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${member2Payload.token}` }
      }
    );
    const cancelSecondPayload = await cancelSecond.json();
    assert.equal(cancelSecond.status, 200);
    assert.equal(Number(cancelSecondPayload.promotedUserId), Number(member3Payload.user.id));

    const member3EventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${member3Payload.token}` }
    });
    const member3EventsPayload = await member3EventsResponse.json();
    assert.equal(member3EventsResponse.status, 200);
    const member3Event = (member3EventsPayload.items || []).find((item) => item.id === createPayload.id);
    assert.equal(member3Event?.mySignupStatus, "confirmed");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("High-concurrency registrations do not oversubscribe capacity", async () => {
  const { server, workingDirectory, databasePath } = await createRunningServer();

  try {
    const database = openDatabase(databasePath);
    try {
      const now = new Date().toISOString();
      const insertUser = database.prepare(
        `
        INSERT INTO users (username, email, password_hash, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'active', ?, ?)
      `
      );
      for (let index = 3; index <= 8; index += 1) {
        insertUser.run(
          `member${index}`,
          `member${index}@iwfsa.local`,
          hashPassword(`member${index}pass`),
          "member",
          now,
          now
        );
      }
    } finally {
      database.close();
    }

    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "High Concurrency Capacity Event",
        description: "Stress registration race.",
        startAt: isoDaysFromNow(7),
        endAt: isoDaysFromNow(7, 2),
        venueType: "physical",
        capacity: 3,
        registrationClosesAt: isoDaysFromNow(6),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    assert.equal(submitResponse.status, 200);

    const memberCredentials = [
      { username: "member1", password: "memberpass" },
      { username: "member2", password: "member2pass" },
      { username: "member3", password: "member3pass" },
      { username: "member4", password: "member4pass" },
      { username: "member5", password: "member5pass" },
      { username: "member6", password: "member6pass" },
      { username: "member7", password: "member7pass" },
      { username: "member8", password: "member8pass" }
    ];

    const memberTokens = [];
    for (const credential of memberCredentials) {
      const loginResponse = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credential)
      });
      const loginPayload = await loginResponse.json();
      assert.equal(loginResponse.status, 200);
      memberTokens.push(loginPayload.token);
    }

    const registrationResponses = await Promise.all(
      memberTokens.map((token) =>
        fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({})
        })
      )
    );
    const registrationPayloads = await Promise.all(registrationResponses.map((response) => response.json()));
    for (const response of registrationResponses) {
      assert.equal(response.status, 200);
    }

    const confirmedCount = registrationPayloads.filter((item) => item.status === "confirmed").length;
    const waitlistedCount = registrationPayloads.filter((item) => item.status === "waitlisted").length;
    assert.equal(confirmedCount, 3);
    assert.equal(waitlistedCount, 5);

    const verifyDatabase = openDatabase(databasePath);
    try {
      const summary = verifyDatabase
        .prepare(
          `
          SELECT
            COUNT(*) AS totalRows,
            COUNT(DISTINCT user_id) AS distinctUsers,
            COALESCE(SUM(CASE WHEN status = 'confirmed' THEN 1 ELSE 0 END), 0) AS confirmedCount,
            COALESCE(SUM(CASE WHEN status = 'waitlisted' THEN 1 ELSE 0 END), 0) AS waitlistedCount
          FROM signups
          WHERE event_id = ?
        `
        )
        .get(createPayload.id);

      assert.equal(Number(summary.totalRows || 0), 8);
      assert.equal(Number(summary.distinctUsers || 0), 8);
      assert.equal(Number(summary.confirmedCount || 0), 3);
      assert.equal(Number(summary.waitlistedCount || 0), 5);
    } finally {
      verifyDatabase.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Registration close enforces deadline and supports per-user override", async () => {
  const { server, workingDirectory, memberId, member2Id } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Closed Registration Event",
        description: "Deadline override test.",
        startAt: isoDaysFromNow(5),
        endAt: isoDaysFromNow(5, 2),
        venueType: "physical",
        capacity: 10,
        registrationClosesAt: isoDaysFromNow(-1),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();

    const closedAttempt = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberPayload.token}`
        },
        body: JSON.stringify({})
      }
    );
    const closedPayload = await closedAttempt.json();
    assert.equal(closedAttempt.status, 409);
    assert.equal(closedPayload.error, "registration_closed");

    const overrideResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/registration-overrides`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPayload.token}`
        },
        body: JSON.stringify({
          userId: memberId,
          closesAt: isoDaysFromNow(1),
          reason: "VIP exception"
        })
      }
    );
    const overridePayload = await overrideResponse.json();
    assert.equal(overrideResponse.status, 200);
    assert.equal(overridePayload.saved, true);

    const allowedAttempt = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberPayload.token}`
        },
        body: JSON.stringify({})
      }
    );
    const allowedPayload = await allowedAttempt.json();
    assert.equal(allowedAttempt.status, 200);
    assert.equal(["confirmed", "waitlisted"].includes(allowedPayload.status), true);

    const stillClosedAttempt = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${member2Payload.token}`
        },
        body: JSON.stringify({})
      }
    );
    const stillClosedPayload = await stillClosedAttempt.json();
    assert.equal(stillClosedAttempt.status, 409);
    assert.equal(stillClosedPayload.error, "registration_closed");

    const removeOverride = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/registration-overrides`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPayload.token}`
        },
        body: JSON.stringify({ userId: memberId || member2Id })
      }
    );
    const removeOverridePayload = await removeOverride.json();
    assert.equal(removeOverride.status, 200);
    assert.equal(typeof removeOverridePayload.removed, "boolean");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Personal reminder preferences can be set and dispatched", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Reminder Dispatch Event",
        description: "Reminder test event.",
        startAt: isoDaysFromNow(2),
        endAt: isoDaysFromNow(2, 2),
        venueType: "physical",
        capacity: 10,
        registrationClosesAt: isoDaysFromNow(0.005),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const registerResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberPayload.token}`
        },
        body: JSON.stringify({})
      }
    );
    assert.equal(registerResponse.status, 200);

    const saveReminderResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/reminders`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${memberPayload.token}`
        },
        body: JSON.stringify({ offsetMinutes: [5, 15] })
      }
    );
    const saveReminderPayload = await saveReminderResponse.json();
    assert.equal(saveReminderResponse.status, 200);
    assert.deepEqual(saveReminderPayload.offsets, [15, 5]);

    const dispatchResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/registration-reminders/dispatch`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const dispatchPayload = await dispatchResponse.json();
    assert.equal(dispatchResponse.status, 200);
    assert.equal(typeof dispatchPayload.dispatched.reminderSent, "number");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event editor grant blocks members who are not event creators", async () => {
  const { server, workingDirectory, editorId } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const grantResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ eventId: 1, userId: editorId })
    });
    const grantPayload = await grantResponse.json();

    assert.equal(grantResponse.status, 403);
    assert.equal(grantPayload.error, "forbidden");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event editor grant accepts member targets for event-scoped editing", async () => {
  const { server, workingDirectory, memberId } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const grantResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ eventId: 1, userId: memberId })
    });
    const grantPayload = await grantResponse.json();

    assert.equal(grantResponse.status, 200);
    assert.equal(grantPayload.granted, true);
    assert.equal(grantPayload.alreadyGranted, false);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event editor grant enables edit access", async () => {
  const { server, workingDirectory, editorId, databasePath } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const grantResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ eventId: 1, userId: editorId })
    });
    const grantPayload = await grantResponse.json();
    assert.equal(grantResponse.status, 200);
    assert.equal(grantPayload.granted, true);

    const editorLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "editor1", password: "editorpass" })
    });
    const editorPayload = await editorLogin.json();

    const accessResponse = await fetch(`http://${server.host}:${server.port}/api/events/1/edit-access`, {
      headers: { Authorization: `Bearer ${editorPayload.token}` }
    });
    const accessPayload = await accessResponse.json();

    assert.equal(accessResponse.status, 200);
    assert.equal(accessPayload.canEdit, true);

    const database = openDatabase(databasePath);
    try {
      const auditRows = database
        .prepare(
          `
          SELECT actor_user_id AS actorUserId, target_id AS targetId, metadata_json AS metadataJson
          FROM audit_logs
          WHERE action_type = 'event_editor_granted'
        `
        )
        .all();
      assert.equal(auditRows.length, 1);
      const record = auditRows[0];
      assert.equal(Number(record.actorUserId), adminPayload.user.id);
      assert.equal(record.targetId, "1");
      const metadata = JSON.parse(record.metadataJson || "{}");
      assert.equal(metadata.userId, editorId);
      assert.equal(metadata.actorRole, "chief_admin");
      assert.equal(metadata.scope, "admin");
    } finally {
      database.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event collaboration workspace supports draft notes and internal comments for collaborators only", async () => {
  const { server, workingDirectory, member2Id } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();
    assert.equal(member2Login.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "Collaboration Draft",
        description: "Notes/comments test",
        startAt: isoDaysFromNow(4),
        endAt: isoDaysFromNow(4, 2),
        venueType: "physical",
        capacity: 10,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const member2Forbidden = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/collaboration`,
      { headers: { Authorization: `Bearer ${member2Payload.token}` } }
    );
    const member2ForbiddenPayload = await member2Forbidden.json();
    assert.equal(member2Forbidden.status, 403);
    assert.equal(member2ForbiddenPayload.error, "forbidden");

    const grantResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ eventId: createPayload.id, userId: member2Id })
    });
    const grantPayload = await grantResponse.json();
    assert.equal(grantResponse.status, 200);
    assert.equal(grantPayload.granted, true);

    const getInitial = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/collaboration`,
      { headers: { Authorization: `Bearer ${member2Payload.token}` } }
    );
    const getInitialPayload = await getInitial.json();
    assert.equal(getInitial.status, 200);
    assert.equal(typeof getInitialPayload.draftNotesMarkdown, "string");
    assert.equal(Array.isArray(getInitialPayload.comments), true);

    const saveNotes = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/draft-notes`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${member2Payload.token}`
        },
        body: JSON.stringify({ draftNotesMarkdown: "# Internal notes\n\nWorking draft." })
      }
    );
    const saveNotesPayload = await saveNotes.json();
    assert.equal(saveNotes.status, 200);
    assert.equal(saveNotesPayload.saved, true);

    const postComment = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/internal-comments`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${member2Payload.token}`
        },
        body: JSON.stringify({ bodyMarkdown: "Looks good — please confirm the venue." })
      }
    );
    const postCommentPayload = await postComment.json();
    assert.equal(postComment.status, 201);
    assert.equal(postCommentPayload.created, true);

    const getAfter = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/collaboration`,
      { headers: { Authorization: `Bearer ${member2Payload.token}` } }
    );
    const getAfterPayload = await getAfter.json();
    assert.equal(getAfter.status, 200);
    assert.equal(getAfterPayload.draftNotesMarkdown.includes("Internal notes"), true);
    assert.equal(getAfterPayload.comments.length >= 1, true);
    assert.equal(String(getAfterPayload.comments[0].bodyMarkdown || "").includes("Looks good"), true);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event creator can grant and revoke event-scoped editor rights with creator-scoped audit metadata", async () => {
  const { server, workingDirectory, member2Id, databasePath } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();
    assert.equal(member2Login.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "Creator Grant Event",
        description: "Creator-managed editor assignment.",
        startAt: isoDaysFromNow(4),
        endAt: isoDaysFromNow(4, 2),
        venueType: "physical",
        capacity: 10,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const grantResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ eventId: createPayload.id, userId: member2Id })
    });
    const grantPayload = await grantResponse.json();
    assert.equal(grantResponse.status, 200);
    assert.equal(grantPayload.granted, true);
    assert.equal(grantPayload.alreadyGranted, false);

    const patchByGrantedMember = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member2Payload.token}`
      },
      body: JSON.stringify({ title: "Creator granted editor update" })
    });
    const patchByGrantedMemberPayload = await patchByGrantedMember.json();
    assert.equal(patchByGrantedMember.status, 200);
    assert.equal(patchByGrantedMemberPayload.updated, true);

    const revokeResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ eventId: createPayload.id, userId: member2Id })
    });
    const revokePayload = await revokeResponse.json();
    assert.equal(revokeResponse.status, 200);
    assert.equal(revokePayload.revoked, true);

    const patchAfterRevoke = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member2Payload.token}`
      },
      body: JSON.stringify({ title: "Should be forbidden after revoke" })
    });
    const patchAfterRevokePayload = await patchAfterRevoke.json();
    assert.equal(patchAfterRevoke.status, 403);
    assert.equal(patchAfterRevokePayload.error, "forbidden");

    const database = openDatabase(databasePath);
    try {
      const auditRows = database
        .prepare(
          `
          SELECT action_type AS actionType, metadata_json AS metadataJson
          FROM audit_logs
          WHERE target_type = 'event'
            AND target_id = ?
            AND action_type IN ('event_editor_granted', 'event_editor_revoked')
          ORDER BY id
        `
        )
        .all(String(createPayload.id));
      assert.equal(auditRows.length, 2);
      assert.deepEqual(
        auditRows.map((row) => row.actionType),
        ["event_editor_granted", "event_editor_revoked"]
      );
      for (const row of auditRows) {
        const metadata = JSON.parse(row.metadataJson || "{}");
        assert.equal(metadata.userId, member2Id);
        assert.equal(metadata.actorRole, "member");
        assert.equal(metadata.scope, "event_creator");
      }
    } finally {
      database.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event editor revoke blocks non-creator members", async () => {
  const { server, workingDirectory, editorId } = await createRunningServer();

  try {
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const revokeResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ eventId: 1, userId: editorId })
    });
    const revokePayload = await revokeResponse.json();

    assert.equal(revokeResponse.status, 403);
    assert.equal(revokePayload.error, "forbidden");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Event editor revoke writes audit log", async () => {
  const { server, workingDirectory, editorId, databasePath } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ eventId: 1, userId: editorId })
    });

    const revokeResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ eventId: 1, userId: editorId })
    });
    const revokePayload = await revokeResponse.json();

    assert.equal(revokeResponse.status, 200);
    assert.equal(revokePayload.revoked, true);

    const database = openDatabase(databasePath);
    try {
      const auditRows = database
        .prepare(
          `
          SELECT actor_user_id AS actorUserId, target_id AS targetId, metadata_json AS metadataJson
          FROM audit_logs
          WHERE action_type = 'event_editor_revoked'
        `
        )
        .all();
      assert.equal(auditRows.length, 1);
      const record = auditRows[0];
      assert.equal(Number(record.actorUserId), adminPayload.user.id);
      assert.equal(record.targetId, "1");
      const metadata = JSON.parse(record.metadataJson || "{}");
      assert.equal(metadata.userId, editorId);
      assert.equal(metadata.actorRole, "chief_admin");
      assert.equal(metadata.scope, "admin");
    } finally {
      database.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("RBAC matrix enforces protected event and admin routes across roles", async () => {
  const { server, workingDirectory, editorId } = await createRunningServer();

  try {
    const chiefLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const chiefPayload = await chiefLogin.json();
    assert.equal(chiefLogin.status, 200);

    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();
    assert.equal(adminLogin.status, 200);

    const editorLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "editor1", password: "editorpass" })
    });
    const editorPayload = await editorLogin.json();
    assert.equal(editorLogin.status, 200);

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();
    assert.equal(memberLogin.status, 200);

    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();
    assert.equal(member2Login.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({
        title: "RBAC Matrix Event",
        description: "Role matrix validation.",
        startAt: isoDaysFromNow(5),
        endAt: isoDaysFromNow(5, 2),
        venueType: "physical",
        capacity: 15,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);
    assert.equal(createPayload.status, "draft");

    const member2Patch = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member2Payload.token}`
      },
      body: JSON.stringify({ title: "Unauthorized edit" })
    });
    const member2PatchPayload = await member2Patch.json();
    assert.equal(member2Patch.status, 403);
    assert.equal(member2PatchPayload.error, "forbidden");

    const submitResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.status, "published");

    const approveByAdmin = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const approveByAdminPayload = await approveByAdmin.json();
    assert.equal(approveByAdmin.status, 404);
    assert.equal(approveByAdminPayload.error, "not_found");

    const approveByChief = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/approve`, {
      method: "POST",
      headers: { Authorization: `Bearer ${chiefPayload.token}` }
    });
    const approveByChiefPayload = await approveByChief.json();
    assert.equal(approveByChief.status, 404);
    assert.equal(approveByChiefPayload.error, "not_found");

    const adminMembers = await fetch(`http://${server.host}:${server.port}/api/members`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    assert.equal(adminMembers.status, 200);

    const editorMembers = await fetch(`http://${server.host}:${server.port}/api/members`, {
      headers: { Authorization: `Bearer ${editorPayload.token}` }
    });
    const editorMembersPayload = await editorMembers.json();
    assert.equal(editorMembers.status, 403);
    assert.equal(editorMembersPayload.error, "forbidden");

    const memberGrant = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ eventId: createPayload.id, userId: editorId })
    });
    const memberGrantPayload = await memberGrant.json();
    assert.equal(memberGrant.status, 200);
    assert.equal(memberGrantPayload.granted, true);

    const member2Grant = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member2Payload.token}`
      },
      body: JSON.stringify({ eventId: createPayload.id, userId: editorId })
    });
    const member2GrantPayload = await member2Grant.json();
    assert.equal(member2Grant.status, 403);
    assert.equal(member2GrantPayload.error, "forbidden");

    const adminGrant = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ eventId: createPayload.id, userId: editorId })
    });
    const adminGrantPayload = await adminGrant.json();
    assert.equal(adminGrant.status, 200);
    assert.equal(adminGrantPayload.granted, true);
    assert.equal(adminGrantPayload.alreadyGranted, true);

    const editorPatchGranted = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${editorPayload.token}`
      },
      body: JSON.stringify({ title: "Editor updated granted event" })
    });
    const editorPatchGrantedPayload = await editorPatchGranted.json();
    assert.equal(editorPatchGranted.status, 200);
    assert.equal(editorPatchGrantedPayload.updated, true);

    const editorPatchUngrant = await fetch(`http://${server.host}:${server.port}/api/events/2`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${editorPayload.token}`
      },
      body: JSON.stringify({ title: "Should be denied" })
    });
    const editorPatchUngrantPayload = await editorPatchUngrant.json();
    assert.equal(editorPatchUngrant.status, 403);
    assert.equal(editorPatchUngrantPayload.error, "forbidden");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("User role changes require chief admin and are audit logged with grant revocation details", async () => {
  const { server, workingDirectory, editorId, databasePath } = await createRunningServer();

  try {
    const chiefLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const chiefPayload = await chiefLogin.json();
    assert.equal(chiefLogin.status, 200);

    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();
    assert.equal(adminLogin.status, 200);

    const grantResponse = await fetch(`http://${server.host}:${server.port}/api/event-editor-grants`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chiefPayload.token}`
      },
      body: JSON.stringify({ eventId: 1, userId: editorId })
    });
    const grantPayload = await grantResponse.json();
    assert.equal(grantResponse.status, 200);
    assert.equal(grantPayload.granted, true);

    const nonChiefChange = await fetch(`http://${server.host}:${server.port}/api/admin/users/${editorId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ role: "member" })
    });
    const nonChiefChangePayload = await nonChiefChange.json();
    assert.equal(nonChiefChange.status, 403);
    assert.equal(nonChiefChangePayload.error, "forbidden");

    const roleChange = await fetch(`http://${server.host}:${server.port}/api/admin/users/${editorId}/role`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${chiefPayload.token}`
      },
      body: JSON.stringify({ role: "member" })
    });
    const roleChangePayload = await roleChange.json();
    assert.equal(roleChange.status, 200);
    assert.equal(roleChangePayload.updated, true);
    assert.equal(roleChangePayload.previousRole, "event_editor");
    assert.equal(roleChangePayload.role, "member");
    assert.equal(roleChangePayload.revokedEventEditorGrants, 1);

    const editorLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "editor1", password: "editorpass" })
    });
    const editorPayload = await editorLogin.json();
    assert.equal(editorLogin.status, 200);

    const accessResponse = await fetch(`http://${server.host}:${server.port}/api/events/1/edit-access`, {
      headers: { Authorization: `Bearer ${editorPayload.token}` }
    });
    const accessPayload = await accessResponse.json();
    assert.equal(accessResponse.status, 200);
    assert.equal(accessPayload.canEdit, false);

    const database = openDatabase(databasePath);
    try {
      const auditRow = database
        .prepare(
          `
          SELECT actor_user_id AS actorUserId, target_id AS targetId, metadata_json AS metadataJson
          FROM audit_logs
          WHERE action_type = 'user_role_changed' AND target_id = ?
          ORDER BY id DESC
          LIMIT 1
        `
        )
        .get(String(editorId));
      assert.ok(auditRow);
      assert.equal(Number(auditRow.actorUserId), chiefPayload.user.id);
      assert.equal(auditRow.targetId, String(editorId));
      const metadata = JSON.parse(auditRow.metadataJson || "{}");
      assert.equal(metadata.previousRole, "event_editor");
      assert.equal(metadata.nextRole, "member");
      assert.equal(metadata.revokedEventEditorGrants, 1);
    } finally {
      database.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Cannot demote the last chief admin account", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const chiefLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const chiefPayload = await chiefLogin.json();
    assert.equal(chiefLogin.status, 200);

    const demoteResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/users/${chiefPayload.user.id}/role`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chiefPayload.token}`
        },
        body: JSON.stringify({ role: "admin" })
      }
    );
    const demotePayload = await demoteResponse.json();
    assert.equal(demoteResponse.status, 409);
    assert.equal(demotePayload.error, "invalid_state");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Member import dry-run and apply create members", async () => {
  const { server, workingDirectory, databasePath } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const rows = [
      ["No", "First Name", "Surname", "Email", "Organisation", "Username", "Status", "Groups", "Roles"],
      ["1", "Ada", "Lovelace", "ada@iwfsa.local", "Analytical Ltd", "", "Active", "Board", "Chair"]
    ];
    const workbookBuffer = createWorkbookBuffer(rows);

    const form = new FormData();
    form.set(
      "file",
      new Blob([workbookBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      "members.xlsx"
    );
    form.set("mode", "create_only");

    const dryRunResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/dry-run`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` },
        body: form
      }
    );
    const dryRunPayload = await dryRunResponse.json();

    assert.equal(dryRunResponse.status, 200);
    assert.equal(dryRunPayload.has_blocking_issues, false);
    assert.equal(dryRunPayload.summary.create, 1);

    const applyResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/${dryRunPayload.batch_id}/apply`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPayload.token}`
        },
        body: JSON.stringify({ send_invites: true, invite_expiry_hours: 6 })
      }
    );
    const applyPayload = await applyResponse.json();

    assert.equal(applyResponse.status, 200);
    assert.equal(applyPayload.summary.create, 1);
    assert.equal(applyPayload.invites.queued, 1);
    assert.equal(applyPayload.invites.failed, 0);

    const membersResponse = await fetch(`http://${server.host}:${server.port}/api/members`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const membersPayload = await membersResponse.json();
    assert.equal(membersResponse.status, 200);
    const importedMember = (membersPayload.items || []).find((item) => item.email === "ada@iwfsa.local");
    assert.ok(importedMember);
    assert.equal(importedMember.fullName, "Ada Lovelace");

    const reportResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/${dryRunPayload.batch_id}/report.csv`,
      {
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const reportText = await reportResponse.text();
    assert.equal(reportResponse.status, 200);
    assert.match(String(reportResponse.headers.get("content-type") || ""), /text\/csv/i);
    assert.ok(
      reportText.includes("row_number,action,reason_code,email,full_name,status,organisation,phone,groups,error_message")
    );
    assert.ok(reportText.includes("\"create\""));
    assert.ok(reportText.includes("\"created_new_member\""));
    assert.ok(reportText.includes("\"ada@iwfsa.local\""));

    const database = openDatabase(databasePath);
    try {
      const importedRow = database.prepare("SELECT id FROM users WHERE email = ? LIMIT 1").get("ada@iwfsa.local");
      assert.ok(importedRow);

      const inviteTokenRow = database
        .prepare(
          `
          SELECT token, created_at AS createdAt, expires_at AS expiresAt
          FROM member_invite_tokens
          WHERE user_id = ?
          ORDER BY id DESC
          LIMIT 1
        `
        )
        .get(importedRow.id);
      assert.ok(inviteTokenRow);
      assert.equal(String(inviteTokenRow.token || "").length, 64);

      const expiresAtMs = new Date(inviteTokenRow.expiresAt).getTime();
      const ttlHours = (expiresAtMs - Date.now()) / (60 * 60 * 1000);
      assert.equal(Number.isFinite(ttlHours), true);
      assert.equal(ttlHours > 5.5 && ttlHours < 6.5, true);
    } finally {
      database.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Member import apply blocked by duplicate email", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const rows = [
      ["No", "First Name", "Surname", "Email", "Organisation", "Username", "Status", "Groups", "Roles"],
      ["1", "Ada", "Lovelace", "dup@iwfsa.local", "Analytical Ltd", "", "Active", "", ""],
      ["2", "Grace", "Hopper", "dup@iwfsa.local", "Navy", "", "Active", "", ""]
    ];
    const workbookBuffer = createWorkbookBuffer(rows);

    const form = new FormData();
    form.set(
      "file",
      new Blob([workbookBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      "members.xlsx"
    );

    const dryRunResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/dry-run`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` },
        body: form
      }
    );
    const dryRunPayload = await dryRunResponse.json();

    assert.equal(dryRunResponse.status, 200);
    assert.equal(dryRunPayload.has_blocking_issues, true);

    const applyResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/${dryRunPayload.batch_id}/apply`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPayload.token}`
        },
        body: JSON.stringify({ send_invites: true })
      }
    );
    const applyPayload = await applyResponse.json();

    assert.equal(applyResponse.status, 409);
    assert.equal(applyPayload.error, "blocking_issues");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Member import dry-run reuses saved upload when file is omitted", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const rows = [
      ["No", "First Name", "Surname", "Email", "Organisation", "Username", "Status", "Groups", "Roles"],
      ["1", "Asha", "Nkosi", "asha@iwfsa.local", "IWFSA", "", "Active", "Board", ""]
    ];
    const workbookBuffer = createWorkbookBuffer(rows);

    const firstForm = new FormData();
    firstForm.set(
      "file",
      new Blob([workbookBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      "members.xlsx"
    );

    const firstDryRunResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/dry-run`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` },
        body: firstForm
      }
    );
    const firstDryRunPayload = await firstDryRunResponse.json();
    assert.equal(firstDryRunResponse.status, 200);

    const secondForm = new FormData();
    secondForm.set("reuse_batch_id", firstDryRunPayload.batch_id);
    secondForm.set("mode", "create_only");

    const secondDryRunResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/dry-run`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` },
        body: secondForm
      }
    );
    const secondDryRunPayload = await secondDryRunResponse.json();

    assert.equal(secondDryRunResponse.status, 200);
    assert.equal(secondDryRunPayload.reused_source_batch_id, firstDryRunPayload.batch_id);
    assert.notEqual(secondDryRunPayload.batch_id, firstDryRunPayload.batch_id);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Member import row edits update persisted data before apply", async () => {
  const { server, workingDirectory, databasePath } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const rows = [
      ["No", "First Name", "Surname", "Email", "Organisation", "Username", "Status", "Groups", "Roles"],
      ["1", "Lerato", "Mokoena", "lerato@iwfsa.local", "Legacy Org", "", "Active", "Board", ""]
    ];
    const workbookBuffer = createWorkbookBuffer(rows);

    const form = new FormData();
    form.set(
      "file",
      new Blob([workbookBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      }),
      "members.xlsx"
    );
    form.set("mode", "create_only");

    const dryRunResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/dry-run`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` },
        body: form
      }
    );
    const dryRunPayload = await dryRunResponse.json();
    assert.equal(dryRunResponse.status, 200);

    const dryRunDatabase = openDatabase(databasePath);
    try {
      const batchSnapshot = dryRunDatabase
        .prepare(
          `
          SELECT membership_set_json AS membershipSetJson
          FROM member_import_batches
          WHERE batch_id = ?
          LIMIT 1
        `
        )
        .get(dryRunPayload.batch_id);
      assert.ok(batchSnapshot);
      const membershipSet = JSON.parse(batchSnapshot.membershipSetJson || "[]");
      assert.equal(Array.isArray(membershipSet), true);
      assert.equal(membershipSet.length, 1);

      const legacyRows = dryRunDatabase
        .prepare(
          `
          SELECT COUNT(*) AS count
          FROM member_import_rows
          WHERE batch_id = ?
        `
        )
        .get(dryRunPayload.batch_id);
      assert.equal(Number(legacyRows.count || 0), 0);
    } finally {
      dryRunDatabase.close();
    }

    const rowsResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/${dryRunPayload.batch_id}/rows`,
      {
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const rowsPayload = await rowsResponse.json();
    assert.equal(rowsResponse.status, 200);
    assert.equal(Array.isArray(rowsPayload.items), true);
    assert.equal(rowsPayload.items.length, 1);
    const rowId = rowsPayload.items[0].id;

    const editResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/${dryRunPayload.batch_id}/rows/${rowId}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPayload.token}`
        },
        body: JSON.stringify({
          email: "lerato.updated@iwfsa.local",
          fullName: "Lerato Updated",
          status: "suspended",
          phone: "+27825550000",
          organisation: "Updated Org",
          groups: ["Board of Directors", "Leadership Development"]
        })
      }
    );
    const editPayload = await editResponse.json();

    assert.equal(editResponse.status, 200);
    assert.equal(editPayload.item.email, "lerato.updated@iwfsa.local");
    assert.equal(editPayload.item.fullName, "Lerato Updated");
    assert.equal(editPayload.item.phone, "+27825550000");

    const applyResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/member-imports/${dryRunPayload.batch_id}/apply`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${adminPayload.token}`
        },
        body: JSON.stringify({ send_invites: false })
      }
    );
    const applyPayload = await applyResponse.json();
    assert.equal(applyResponse.status, 200);
    assert.equal(applyPayload.summary.create, 1);

    const database = openDatabase(databasePath);
    try {
      const user = database
        .prepare("SELECT id FROM users WHERE email = ? LIMIT 1")
        .get("lerato.updated@iwfsa.local");
      assert.ok(user);

      const profile = database
        .prepare(
          `
          SELECT full_name AS fullName, company, phone
          FROM member_profiles
          WHERE user_id = ?
          LIMIT 1
        `
        )
        .get(user.id);
      assert.equal(profile.fullName, "Lerato Updated");
      assert.equal(profile.company, "Updated Org");
      assert.equal(profile.phone, "+27825550000");

      const groups = database
        .prepare(
          `
          SELECT groups.name AS name
          FROM group_members
          JOIN groups ON groups.id = group_members.group_id
          WHERE group_members.user_id = ?
          ORDER BY groups.name
        `
        )
        .all(user.id)
        .map((item) => item.name);
      assert.deepEqual(groups, ["Board of Directors", "Leadership Development"]);
    } finally {
      database.close();
    }
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Onboarding invite activates member with token", async () => {
  globalThis[EMAIL_OUTBOX_GLOBAL_KEY] = [];
  const { server, workingDirectory, inviteeId, databasePath } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const inviteResponse = await fetch(`http://${server.host}:${server.port}/api/members/invitations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ userIds: [inviteeId] })
    });
    const invitePayload = await inviteResponse.json();

    assert.equal(inviteResponse.status, 200);
    assert.equal(invitePayload.queued.length, 1);
    assert.equal(typeof invitePayload.queued[0].inviteToken, "undefined");

    const outbox = globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
    assert.ok(Array.isArray(outbox));
    const inviteEmail = outbox.find((entry) => entry.metadata?.template === "member_invite");
    assert.ok(inviteEmail, "invite email should be sent");
    assert.match(inviteEmail.text, /Username:\s+invitee1/);
    const inviteToken = extractTokenFromText(inviteEmail.text, "activate");
    assert.ok(inviteToken);
    const expectedInviteUrl = `http://127.0.0.1:3000/activate?token=${inviteToken}`;
    assert.ok(inviteEmail.text.includes(expectedInviteUrl));

    const database = openDatabase(databasePath);
    try {
      const deliveryRow = database
        .prepare(
          `
          SELECT idempotency_key AS idempotencyKey
          FROM notification_deliveries
          WHERE event_type = 'member_invite'
          ORDER BY id DESC
          LIMIT 1
        `
        )
        .get();
      assert.ok(deliveryRow);
      assert.equal(String(deliveryRow.idempotencyKey || "").includes(inviteToken), false);

      const dispatchAudit = database
        .prepare(
          `
          SELECT metadata_json AS metadataJson
          FROM audit_logs
          WHERE action_type = 'member_invites_dispatch_triggered'
          ORDER BY id DESC
          LIMIT 1
        `
        )
        .get();
      assert.ok(dispatchAudit);
      const dispatchMetadata = JSON.parse(dispatchAudit.metadataJson || "{}");
      assert.equal(dispatchMetadata.queued, 1);
      assert.equal(dispatchMetadata.skipped, 0);
      assert.equal(Array.isArray(dispatchMetadata.userIds), true);
      assert.equal(dispatchMetadata.userIds.includes(inviteeId), true);
    } finally {
      database.close();
    }

    const blockedLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "invitee1", password: "invitepass" })
    });
    const blockedPayload = await blockedLogin.json();
    assert.equal(blockedLogin.status, 403);
    assert.equal(blockedPayload.error, "inactive_account");

    const activateResponse = await fetch(`http://${server.host}:${server.port}/api/auth/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: inviteToken, newPassword: "newpass123" })
    });
    const activatePayload = await activateResponse.json();

    assert.equal(activateResponse.status, 200);
    assert.equal(activatePayload.activated, true);

    const activateAgainResponse = await fetch(`http://${server.host}:${server.port}/api/auth/activate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: inviteToken, newPassword: "newpass456" })
    });
    const activateAgainPayload = await activateAgainResponse.json();
    assert.equal(activateAgainResponse.status, 403);
    assert.equal(activateAgainPayload.error, "invalid_token");

    const loginResponse = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "invitee1", password: "newpass123" })
    });
    const loginPayload = await loginResponse.json();

    assert.equal(loginResponse.status, 200);
    assert.equal(loginPayload.user.username, "invitee1");
  } finally {
    delete globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Credential reset requires token redemption", async () => {
  globalThis[EMAIL_OUTBOX_GLOBAL_KEY] = [];
  const { server, workingDirectory, memberId, databasePath } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const resetResponse = await fetch(`http://${server.host}:${server.port}/api/members/credential-resets`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ userIds: [memberId] })
    });
    const resetPayload = await resetResponse.json();

    assert.equal(resetResponse.status, 200);
    assert.equal(resetPayload.queued.length, 1);
    assert.equal(typeof resetPayload.queued[0].resetToken, "undefined");

    const outbox = globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
    assert.ok(Array.isArray(outbox));
    const resetEmail = outbox.find((entry) => entry.metadata?.template === "member_reset");
    assert.ok(resetEmail, "reset email should be sent");
    const resetToken = extractTokenFromText(resetEmail.text, "reset");
    assert.ok(resetToken);

    const database = openDatabase(databasePath);
    try {
      const deliveryRow = database
        .prepare(
          `
          SELECT idempotency_key AS idempotencyKey
          FROM notification_deliveries
          WHERE event_type = 'member_reset'
          ORDER BY id DESC
          LIMIT 1
        `
        )
        .get();
      assert.ok(deliveryRow);
      assert.equal(String(deliveryRow.idempotencyKey || "").includes(resetToken), false);

      const dispatchAudit = database
        .prepare(
          `
          SELECT metadata_json AS metadataJson
          FROM audit_logs
          WHERE action_type = 'member_credential_resets_dispatch_triggered'
          ORDER BY id DESC
          LIMIT 1
        `
        )
        .get();
      assert.ok(dispatchAudit);
      const dispatchMetadata = JSON.parse(dispatchAudit.metadataJson || "{}");
      assert.equal(dispatchMetadata.queued, 1);
      assert.equal(dispatchMetadata.skipped, 0);
      assert.equal(Array.isArray(dispatchMetadata.userIds), true);
      assert.equal(dispatchMetadata.userIds.includes(memberId), true);
    } finally {
      database.close();
    }

    const loginResponse = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const loginPayload = await loginResponse.json();

    assert.equal(loginResponse.status, 401);
    assert.equal(loginPayload.error, "invalid_credentials");

    const redeemResponse = await fetch(`http://${server.host}:${server.port}/api/auth/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword: "resetpass123" })
    });
    const redeemPayload = await redeemResponse.json();

    assert.equal(redeemResponse.status, 200);
    assert.equal(redeemPayload.reset, true);

    const redeemAgainResponse = await fetch(`http://${server.host}:${server.port}/api/auth/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token: resetToken, newPassword: "resetpass456" })
    });
    const redeemAgainPayload = await redeemAgainResponse.json();
    assert.equal(redeemAgainResponse.status, 403);
    assert.equal(redeemAgainPayload.error, "invalid_token");

    const reloginResponse = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "resetpass123" })
    });
    const reloginPayload = await reloginResponse.json();

    assert.equal(reloginResponse.status, 200);
    assert.equal(reloginPayload.user.username, "member1");
  } finally {
    delete globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

// ======================================================================
// Checkpoint 1.6 - Notifications and Audit Trail validation tests
// ======================================================================

test("Checkpoint 1.6: one in-app send per user/channel/version (idempotency)", async () => {
  const { server, workingDirectory, databasePath, memberId } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Idempotency Check Event",
        description: "Verify one send per user/channel/version.",
        startAt: isoDaysFromNow(15),
        endAt: isoDaysFromNow(15, 2),
        venueType: "physical",
        venueName: "Pretoria",
        capacity: 30,
        registrationClosesAt: isoDaysFromNow(14),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    // Wait for first queue dispatch
    await waitFor(
      async () => {
        const queueResponse = await fetch(
          `http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`,
          { headers: { Authorization: `Bearer ${adminPayload.token}` } }
        );
        const queuePayload = await queueResponse.json();
        const row = (queuePayload.items || []).find(
          (item) => item.eventType === "event_published" && (item.status === "sent" || item.status === "failed")
        );
        return row || null;
      },
      { label: "idempotency first dispatch" }
    );

    // Manually insert a duplicate queue entry for the same event
    const database = openDatabase(databasePath);
    const revisionRow = database
      .prepare("SELECT id FROM event_revisions WHERE event_id = ? AND revision_type = 'publish' ORDER BY id DESC LIMIT 1")
      .get(createPayload.id);
    database
      .prepare("INSERT INTO notification_queue (idempotency_key, event_type, payload_json, status) VALUES (?, 'event_published', ?, 'pending')")
      .run(`duplicate_idempotency_check:${Date.now()}`, JSON.stringify({ eventId: createPayload.id, revisionId: revisionRow.id }));
    database.close();

    await waitFor(
      async () => {
        const queueResponse = await fetch(
          `http://${server.host}:${server.port}/api/admin/notification-queue?limit=100`,
          { headers: { Authorization: `Bearer ${adminPayload.token}` } }
        );
        const queuePayload = await queueResponse.json();
        const published = (queuePayload.items || []).filter((item) => item.eventType === "event_published");
        if (published.some((item) => item.status === "pending" || item.status === "processing")) return null;
        return published;
      },
      { label: "duplicate dispatch completes" }
    );

    // Verify: member still has exactly 1 in-app notification for this event
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const notifResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=100`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const notifPayload = await notifResponse.json();
    const memberPublished = (notifPayload.items || []).filter(
      (item) => item.eventType === "event_published" && item.metadata && item.metadata.eventId === createPayload.id
    );
    assert.equal(memberPublished.length, 1, "Exactly one in-app notification per user/event/version");

    // Verify delivery records: exactly 1 in_app + 1 email per member per version
    const deliveryResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const deliveries = await deliveryResponse.json();
    const memberDeliveries = (deliveries.items || []).filter(
      (item) => item.eventType === "event_published" && item.userId === memberId
    );
    const inAppCount = memberDeliveries.filter((d) => d.channel === "in_app").length;
    const emailCount = memberDeliveries.filter((d) => d.channel === "email").length;
    assert.equal(inAppCount, 1, "Exactly one in_app delivery per user/version");
    assert.equal(emailCount, 1, "Exactly one email delivery per user/version");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.6: event cancellation notifies registered participants", async () => {
  const { server, workingDirectory, memberId, member2Id } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    // Create and publish event
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Cancellation Notify Test",
        description: "Cancel and verify participants are notified.",
        startAt: isoDaysFromNow(20),
        endAt: isoDaysFromNow(20, 2),
        venueType: "physical",
        venueName: "Durban",
        capacity: 25,
        registrationClosesAt: isoDaysFromNow(19),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    // Wait for publish notifications to complete
    await waitFor(
      async () => {
        const qr = await fetch(`http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`, {
          headers: { Authorization: `Bearer ${adminPayload.token}` }
        });
        const qp = await qr.json();
        const row = (qp.items || []).find((item) => item.eventType === "event_published" && item.status === "sent");
        return row || null;
      },
      { label: "publish dispatch for cancel test" }
    );

    // Register member1
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({})
    });

    // Delete/cancel the event
    const deleteResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const deletePayload = await deleteResponse.json();
    assert.equal(deleteResponse.status, 200);
    assert.equal(deletePayload.deleted, true);

    // Verify member1 received cancellation in-app notification
    const notifResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=100`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const notifPayload = await notifResponse.json();
    const cancelNotifs = (notifPayload.items || []).filter(
      (item) => item.eventType === "event_cancelled" && item.metadata && item.metadata.eventId === createPayload.id
    );
    assert.equal(cancelNotifs.length, 1, "Member receives event_cancelled in-app notification");

    // Verify cancellation delivery records exist
    const deliveryResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const deliveries = await deliveryResponse.json();
    const cancelDeliveries = (deliveries.items || []).filter(
      (item) => item.eventType === "event_cancelled" && item.userId === memberId
    );
    assert.ok(cancelDeliveries.length >= 2, "Cancellation generates at least in_app + email delivery records");
    const channels = new Set(cancelDeliveries.map((d) => d.channel));
    assert.ok(channels.has("in_app"), "Cancellation delivery includes in_app");
    assert.ok(channels.has("email"), "Cancellation delivery includes email");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.6: admin notification-queue returns health summary with counts", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    const response = await fetch(`http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const payload = await response.json();

    assert.equal(response.status, 200);
    assert.ok(typeof payload.health === "string", "Queue response includes health label");
    assert.ok(["Healthy", "Degraded", "Attention needed"].includes(payload.health), "Health label is valid");
    assert.ok(typeof payload.counts === "object", "Queue response includes counts object");
    assert.ok(typeof payload.counts.pending === "number", "Counts include pending");
    assert.ok(typeof payload.counts.processing === "number", "Counts include processing");
    assert.ok(typeof payload.counts.sent === "number", "Counts include sent");
    assert.ok(typeof payload.counts.failed === "number", "Counts include failed");
    assert.ok(typeof payload.counts.total === "number", "Counts include total");
    assert.ok(Array.isArray(payload.items), "Queue response includes items array");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.6: admin delivery report includes member-centric data", async () => {
  const { server, workingDirectory, databasePath, memberId } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    // Populate member profile data for member1
    const database = openDatabase(databasePath);
    database
      .prepare(
        `
        INSERT INTO member_profiles (user_id, full_name, company, phone, created_at, updated_at)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        ON CONFLICT(user_id) DO UPDATE SET
          full_name = excluded.full_name,
          company = excluded.company,
          phone = excluded.phone,
          updated_at = CURRENT_TIMESTAMP
      `
      )
      .run(memberId, "Member One", "TestCorp", "+27123456789");
    database.close();

    // Create and publish an event to generate deliveries
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Delivery Report Enrichment Test",
        description: "Verify delivery report includes member data.",
        startAt: isoDaysFromNow(25),
        endAt: isoDaysFromNow(25, 2),
        venueType: "physical",
        venueName: "Stellenbosch",
        capacity: 30,
        registrationClosesAt: isoDaysFromNow(24),
        audienceType: "all_members"
      })
    });
    assert.equal(createResponse.status, 201);
    const createPayload = await createResponse.json();

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    await waitFor(
      async () => {
        const qr = await fetch(`http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`, {
          headers: { Authorization: `Bearer ${adminPayload.token}` }
        });
        const qp = await qr.json();
        const row = (qp.items || []).find(
          (item) => item.eventType === "event_published" && (item.status === "sent" || item.status === "failed")
        );
        return row || null;
      },
      { label: "delivery enrichment dispatch" }
    );

    const deliveryResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const deliveries = await deliveryResponse.json();
    assert.equal(deliveryResponse.status, 200);

    const memberDelivery = (deliveries.items || []).find(
      (item) => item.userId === memberId && item.eventType === "event_published"
    );
    assert.ok(memberDelivery, "Delivery record exists for member");
    assert.equal(memberDelivery.fullName, "Member One", "Delivery includes member full name");
    assert.equal(memberDelivery.organisation, "TestCorp", "Delivery includes organisation");
    assert.equal(memberDelivery.phone, "+27123456789", "Delivery includes phone");
    assert.equal(memberDelivery.email, "member1@iwfsa.local", "Delivery includes email");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.6: waitlist promotion creates in-app notification and email delivery", async () => {
  const { server, workingDirectory, databasePath, memberId, member2Id } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    // Create event with capacity 1 to force waitlist
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Waitlist Promotion Notification Test",
        description: "Verify waitlist promotion creates in-app notification.",
        startAt: isoDaysFromNow(30),
        endAt: isoDaysFromNow(30, 2),
        venueType: "physical",
        venueName: "Cape Town",
        capacity: 1,
        registrationClosesAt: isoDaysFromNow(29),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    await waitFor(
      async () => {
        const qr = await fetch(`http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`, {
          headers: { Authorization: `Bearer ${adminPayload.token}` }
        });
        const qp = await qr.json();
        const row = (qp.items || []).find(
          (item) => item.eventType === "event_published" && (item.status === "sent" || item.status === "failed")
        );
        return row || null;
      },
      { label: "waitlist test publish dispatch" }
    );

    // Member1 registers (fills capacity)
    const member1Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const member1Payload = await member1Login.json();

    const reg1 = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member1Payload.token}`
      },
      body: JSON.stringify({})
    });
    assert.equal(reg1.status, 200);

    // Member2 registers (should be waitlisted)
    const member2Login = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const member2Payload = await member2Login.json();

    const reg2 = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${member2Payload.token}`
      },
      body: JSON.stringify({})
    });
    const reg2Payload = await reg2.json();
    assert.equal(reg2.status, 200);
    assert.equal(reg2Payload.status, "waitlisted");

    // Member1 cancels -> member2 should be promoted
    const cancelResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/cancel-registration`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${member1Payload.token}` }
      }
    );
    const cancelPayload = await cancelResponse.json();
    assert.equal(cancelResponse.status, 200);
    assert.equal(cancelPayload.cancelled, true);

    // Check member2 has in-app notification for waitlist promotion
    const notifResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=100`, {
      headers: { Authorization: `Bearer ${member2Payload.token}` }
    });
    const notifPayload = await notifResponse.json();
    const promotionNotifs = (notifPayload.items || []).filter(
      (item) => item.eventType === "waitlist_promoted"
    );
    assert.equal(promotionNotifs.length, 1, "Promoted member receives in-app waitlist_promoted notification");

    // Check delivery records for promotion (in_app + email)
    const deliveryResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const deliveries = await deliveryResponse.json();
    const promoDeliveries = (deliveries.items || []).filter(
      (item) => item.eventType === "waitlist_promoted" && item.userId === member2Id
    );
    const promoChannels = new Set(promoDeliveries.map((d) => d.channel));
    assert.ok(promoChannels.has("in_app"), "Waitlist promotion has in_app delivery record");
    assert.ok(promoChannels.has("email"), "Waitlist promotion has email delivery record");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.6: event revision snapshots and rollback with notification", async () => {
  const { server, workingDirectory, memberId } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    // Create, publish, register member, then update
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Revision Snapshot Test",
        description: "Test revision snapshot creation.",
        startAt: isoDaysFromNow(18),
        endAt: isoDaysFromNow(18, 2),
        venueType: "physical",
        venueName: "Bloemfontein",
        capacity: 20,
        registrationClosesAt: isoDaysFromNow(17),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    await waitFor(
      async () => {
        const qr = await fetch(`http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`, {
          headers: { Authorization: `Bearer ${adminPayload.token}` }
        });
        const qp = await qr.json();
        const row = (qp.items || []).find(
          (item) => item.eventType === "event_published" && (item.status === "sent" || item.status === "failed")
        );
        return row || null;
      },
      { label: "revision test publish dispatch" }
    );

    // Register member
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({})
    });

    // Patch event title
    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({ title: "Revision Snapshot Updated" })
    });

    // Verify revisions exist (publish + update)
    const revisionsResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/events/${createPayload.id}/revisions`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const revisionsPayload = await revisionsResponse.json();
    assert.equal(revisionsResponse.status, 200);
    const publishRevision = (revisionsPayload.items || []).find((item) => item.revisionType === "publish");
    const updateRevision = (revisionsPayload.items || []).find((item) => item.revisionType === "update");
    assert.ok(publishRevision, "Publish revision exists");
    assert.ok(updateRevision, "Update revision exists");

    // Wait for update notification to process
    await waitFor(
      async () => {
        const dr = await fetch(
          `http://${server.host}:${server.port}/api/admin/notification-deliveries?limit=200`,
          { headers: { Authorization: `Bearer ${adminPayload.token}` } }
        );
        const dp = await dr.json();
        const items = (dp.items || []).filter(
          (item) => item.eventType === "event_updated" && item.userId === memberId
        );
        return items.length >= 2 ? items : null;
      },
      { label: "update notification deliveries" }
    );

    // Rollback to publish revision
    const rollbackResponse = await fetch(
      `http://${server.host}:${server.port}/api/admin/events/${createPayload.id}/revisions/${updateRevision.id}/rollback`,
      { method: "POST", headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    assert.equal(rollbackResponse.status, 200);

    // Verify event title is restored
    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/admin/events`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    const rolledBack = (eventsPayload.items || []).find((item) => item.id === createPayload.id);
    assert.equal(rolledBack.title, "Revision Snapshot Test", "Title restored after rollback");

    // Verify rollback notification arrives for registered member
    await waitFor(
      async () => {
        const nr = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=100`, {
          headers: { Authorization: `Bearer ${memberPayload.token}` }
        });
        const np = await nr.json();
        const items = (np.items || []).filter(
          (item) =>
            item.eventType === "event_updated" &&
            item.metadata &&
            item.metadata.eventId === createPayload.id &&
            String(item.body || "").includes("Event rolled back")
        );
        return items.length > 0 ? items[0] : null;
      },
      { label: "rollback notification for participant" }
    );

    // Verify rollback revision created
    const revisionsAfter = await fetch(
      `http://${server.host}:${server.port}/api/admin/events/${createPayload.id}/revisions`,
      { headers: { Authorization: `Bearer ${adminPayload.token}` } }
    );
    const revisionsAfterPayload = await revisionsAfter.json();
    const rollbackRevision = (revisionsAfterPayload.items || []).find((item) => item.revisionType === "rollback");
    assert.ok(rollbackRevision, "Rollback creates a new revision record");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.6: mark-read works for individual and markAll", async () => {
  const { server, workingDirectory } = await createRunningServer();

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "akeida", password: "akeida123" })
    });
    const adminPayload = await adminLogin.json();

    // Create and publish event to generate notifications for members
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Mark Read Test",
        description: "For testing mark-read.",
        startAt: isoDaysFromNow(22),
        endAt: isoDaysFromNow(22, 2),
        venueType: "physical",
        venueName: "Port Elizabeth",
        capacity: 10,
        registrationClosesAt: isoDaysFromNow(21),
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    await waitFor(
      async () => {
        const qr = await fetch(`http://${server.host}:${server.port}/api/admin/notification-queue?limit=50`, {
          headers: { Authorization: `Bearer ${adminPayload.token}` }
        });
        const qp = await qr.json();
        const row = (qp.items || []).find(
          (item) => item.eventType === "event_published" && (item.status === "sent" || item.status === "failed")
        );
        return row || null;
      },
      { label: "mark-read test dispatch" }
    );

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    // Get unread notifications
    const notifResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=100`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const notifPayload = await notifResponse.json();
    const unread = (notifPayload.items || []).filter((item) => !item.readAt);
    assert.ok(unread.length > 0, "Member has unread notifications");

    // Mark one as read
    const markOneResponse = await fetch(`http://${server.host}:${server.port}/api/notifications/mark-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ notificationIds: [unread[0].id] })
    });
    const markOnePayload = await markOneResponse.json();
    assert.equal(markOneResponse.status, 200);
    assert.equal(markOnePayload.updated, 1);

    // Mark all as read
    const markAllResponse = await fetch(`http://${server.host}:${server.port}/api/notifications/mark-read`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${memberPayload.token}`
      },
      body: JSON.stringify({ markAll: true })
    });
    const markAllPayload = await markAllResponse.json();
    assert.equal(markAllResponse.status, 200);

    // Verify all are now read
    const afterResponse = await fetch(`http://${server.host}:${server.port}/api/notifications?limit=100`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const afterPayload = await afterResponse.json();
    const stillUnread = (afterPayload.items || []).filter((item) => !item.readAt);
    assert.equal(stillUnread.length, 0, "All notifications marked as read");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

// ────────────────────────────────────────────────────────────────
// Checkpoint 1.7 – Calendar Actions and Teams Fallback
// ────────────────────────────────────────────────────────────────

test("Checkpoint 1.7: create online event with Teams link and provider", async () => {
  const { server, workingDirectory } = await createRunningServer();
  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();

    // Create an online event with a Teams join link
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({
        title: "Virtual Strategy Session",
        description: "Online quarterly planning meeting.",
        startAt: "2026-04-01T09:00:00Z",
        endAt: "2026-04-01T11:00:00Z",
        venueType: "online",
        onlineProvider: "Microsoft Teams",
        onlineJoinUrl: "https://teams.microsoft.com/l/meetup-join/abc123",
        hostName: "Admin One",
        capacity: 100,
        registrationClosesAt: "2026-03-31T23:59:59Z"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201, "Online event created");
    assert.ok(createPayload.id, "Event id returned");

    // Fetch the event and verify online fields are present
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    // Publish it first
    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    const onlineEvent = (eventsPayload.items || []).find((e) => e.title === "Virtual Strategy Session");
    assert.ok(onlineEvent, "Online event visible to member");
    assert.equal(onlineEvent.onlineProvider, "Microsoft Teams");
    assert.equal(onlineEvent.onlineJoinUrl, "https://teams.microsoft.com/l/meetup-join/abc123");
    assert.equal(onlineEvent.venueType, "online");
    // Verify all calendar-link-building fields are present
    assert.ok(onlineEvent.startAt, "startAt present");
    assert.ok(onlineEvent.endAt, "endAt present");
    assert.ok(onlineEvent.title, "title present");
    assert.ok(onlineEvent.description, "description present");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.7: ICS download for online event includes join URL, provider, and correct location", async () => {
  const { server, workingDirectory } = await createRunningServer();
  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();

    // Create and publish an online event with Teams
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({
        title: "ICS Online Test Event",
        description: "Testing ICS generation for online events.",
        startAt: "2026-05-10T14:00:00Z",
        endAt: "2026-05-10T16:00:00Z",
        venueType: "online",
        onlineProvider: "Microsoft Teams",
        onlineJoinUrl: "https://teams.microsoft.com/l/meetup-join/ics-test-789",
        hostName: "Test Host",
        capacity: 50,
        registrationClosesAt: "2026-05-09T23:59:59Z"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    // Download the ICS as a member
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const icsResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/calendar.ics`,
      { headers: { Authorization: `Bearer ${memberPayload.token}` } }
    );
    assert.equal(icsResponse.status, 200);
    assert.match(icsResponse.headers.get("content-type") || "", /text\/calendar/);

    const icsText = await icsResponse.text();
    assert.match(icsText, /BEGIN:VCALENDAR/, "ICS starts correctly");
    assert.match(icsText, /BEGIN:VEVENT/, "Contains VEVENT block");
    assert.match(icsText, /DTSTART:20260510T140000Z/, "Correct start time");
    assert.match(icsText, /DTEND:20260510T160000Z/, "Correct end time");
    assert.match(icsText, /SUMMARY:ICS Online Test Event/, "Correct title");
    assert.match(icsText, /LOCATION:Online/, "Location is Online for online venue");
    assert.match(icsText, /teams\.microsoft\.com/, "Join URL in ICS description");
    assert.match(icsText, /Provider: Microsoft Teams/, "Provider in ICS description");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.7: ICS for physical event includes venue in LOCATION", async () => {
  const { server, workingDirectory } = await createRunningServer();
  try {
    // The seed data already has a physical event "Leadership Roundtable" in Johannesburg
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    const physicalEvent = (eventsPayload.items || []).find((e) => e.title === "Leadership Roundtable");
    assert.ok(physicalEvent, "Physical event found");

    const icsResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${physicalEvent.id}/calendar.ics`,
      { headers: { Authorization: `Bearer ${memberPayload.token}` } }
    );
    assert.equal(icsResponse.status, 200);
    const icsText = await icsResponse.text();
    assert.match(icsText, /LOCATION:Johannesburg/, "Physical venue appears in LOCATION");
    assert.ok(!icsText.includes("LOCATION:Online"), "Not marked as Online");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.7: invalid onlineJoinUrl is rejected on create and update", async () => {
  const { server, workingDirectory } = await createRunningServer();
  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();

    // Create with invalid URL
    const createBadUrl = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({
        title: "Bad Link Event",
        startAt: "2026-06-01T09:00:00Z",
        endAt: "2026-06-01T11:00:00Z",
        venueType: "online",
        onlineJoinUrl: "not-a-valid-url",
        capacity: 10
      })
    });
    assert.equal(createBadUrl.status, 400);
    const createBadPayload = await createBadUrl.json();
    assert.match(String(createBadPayload.message || ""), /Online join URL must start with http/i);

    // Create a valid event first, then try to update with invalid URL
    const createOk = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({
        title: "Good Link Event",
        startAt: "2026-06-02T09:00:00Z",
        endAt: "2026-06-02T11:00:00Z",
        venueType: "online",
        onlineJoinUrl: "https://teams.microsoft.com/valid",
        capacity: 10
      })
    });
    const createdEvent = await createOk.json();
    assert.equal(createOk.status, 201);

    // Update with invalid URL
    const patchBadUrl = await fetch(`http://${server.host}:${server.port}/api/events/${createdEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({ onlineJoinUrl: "ftp://bad-protocol" })
    });
    assert.equal(patchBadUrl.status, 400);
    const patchBadPayload = await patchBadUrl.json();
    assert.match(String(patchBadPayload.message || ""), /Online join URL must start with http/i);

    // Update with valid URL succeeds
    const patchOk = await fetch(`http://${server.host}:${server.port}/api/events/${createdEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({ onlineJoinUrl: "https://zoom.us/j/updated-link" })
    });
    assert.equal(patchOk.status, 200);

    // Clearing the URL (empty string) should work
    const patchClear = await fetch(`http://${server.host}:${server.port}/api/events/${createdEvent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({ onlineJoinUrl: "" })
    });
    assert.equal(patchClear.status, 200);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.7: update Teams link is reflected in subsequent ICS download", async () => {
  const { server, workingDirectory } = await createRunningServer();
  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    // Create and publish online event
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({
        title: "Link Update Test",
        startAt: "2026-07-01T10:00:00Z",
        endAt: "2026-07-01T12:00:00Z",
        venueType: "online",
        onlineProvider: "Zoom",
        onlineJoinUrl: "https://zoom.us/j/original-link",
        capacity: 30,
        registrationClosesAt: "2026-06-30T23:59:59Z"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    // ICS should contain original link
    const ics1Response = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/calendar.ics`,
      { headers: { Authorization: `Bearer ${memberPayload.token}` } }
    );
    const ics1 = await ics1Response.text();
    assert.match(ics1, /original-link/, "ICS contains original link");

    // Update the Teams link
    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({
        onlineProvider: "Microsoft Teams",
        onlineJoinUrl: "https://teams.microsoft.com/l/meetup-join/updated-link"
      })
    });

    // ICS should now reflect the updated link and provider
    const ics2Response = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/calendar.ics`,
      { headers: { Authorization: `Bearer ${memberPayload.token}` } }
    );
    const ics2 = await ics2Response.text();
    assert.match(ics2, /updated-link/, "ICS contains updated link");
    assert.match(ics2, /Provider: Microsoft Teams/, "ICS contains updated provider");
    assert.ok(!ics2.includes("original-link"), "Original link no longer in ICS");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 1.7: Teams join link is displayed to members in event listing", async () => {
  const { server, workingDirectory } = await createRunningServer();
  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();
    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    // Create and publish with a Teams link
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${adminPayload.token}` },
      body: JSON.stringify({
        title: "Teams Display Test",
        description: "Checking Teams link visibility.",
        startAt: "2026-08-01T14:00:00Z",
        endAt: "2026-08-01T16:00:00Z",
        venueType: "online",
        onlineProvider: "Microsoft Teams",
        onlineJoinUrl: "https://teams.microsoft.com/l/meetup-join/display-test-456",
        hostName: "Display Host",
        capacity: 25,
        registrationClosesAt: "2026-07-31T23:59:59Z"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });

    // Member fetches events and sees the Teams link
    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    const teamsEvent = (eventsPayload.items || []).find((e) => e.title === "Teams Display Test");
    assert.ok(teamsEvent, "Event visible in listing");
    assert.equal(teamsEvent.onlineJoinUrl, "https://teams.microsoft.com/l/meetup-join/display-test-456");
    assert.equal(teamsEvent.onlineProvider, "Microsoft Teams");
    assert.equal(teamsEvent.venueType, "online");
    assert.equal(teamsEvent.hostName, "Display Host");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 3.1: authorized upload and member download for event documents", async () => {
  const fakeSharePoint = createFakeSharePointClient();
  const { server, workingDirectory } = await createRunningServer({ sharePointClient: fakeSharePoint });

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const form = new FormData();
    form.set("documentType", "agenda");
    form.set("availabilityMode", "immediate");
    form.set("file", new Blob(["Agenda content"], { type: "text/plain" }), "agenda.txt");

    const uploadResponse = await fetch(`http://${server.host}:${server.port}/api/events/1/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` },
      body: form
    });
    const uploadPayload = await uploadResponse.json();
    assert.equal(uploadResponse.status, 201);
    assert.equal(uploadPayload.item.documentType, "agenda");
    assert.equal(uploadPayload.item.fileName, "agenda.txt");

    const listResponse = await fetch(`http://${server.host}:${server.port}/api/events/1/documents`, {
      headers: { Authorization: `Bearer ${memberPayload.token}` }
    });
    const listPayload = await listResponse.json();
    assert.equal(listResponse.status, 200);
    assert.equal(Array.isArray(listPayload.items), true);
    assert.equal(listPayload.items.length, 1);
    assert.equal(listPayload.items[0].available, true);

    const downloadResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/1/documents/${uploadPayload.item.id}/download`,
      {
        headers: { Authorization: `Bearer ${memberPayload.token}` }
      }
    );
    const downloadedText = await downloadResponse.text();
    assert.equal(downloadResponse.status, 200);
    assert.equal(downloadedText, "Agenda content");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 3.1: after_event documents are blocked for members until availability window", async () => {
  const fakeSharePoint = createFakeSharePointClient();
  const { server, workingDirectory } = await createRunningServer({ sharePointClient: fakeSharePoint });

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();

    const memberLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member1", password: "memberpass" })
    });
    const memberPayload = await memberLogin.json();

    const form = new FormData();
    form.set("documentType", "minutes");
    form.set("availabilityMode", "after_event");
    form.set("file", new Blob(["Minutes content"], { type: "text/plain" }), "minutes.txt");

    const uploadResponse = await fetch(`http://${server.host}:${server.port}/api/events/1/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` },
      body: form
    });
    const uploadPayload = await uploadResponse.json();
    assert.equal(uploadResponse.status, 201);

    const memberDownload = await fetch(
      `http://${server.host}:${server.port}/api/events/1/documents/${uploadPayload.item.id}/download`,
      {
        headers: { Authorization: `Bearer ${memberPayload.token}` }
      }
    );
    assert.equal(memberDownload.status, 403);

    const adminDownload = await fetch(
      `http://${server.host}:${server.port}/api/events/1/documents/${uploadPayload.item.id}/download`,
      {
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const adminText = await adminDownload.text();
    assert.equal(adminDownload.status, 200);
    assert.equal(adminText, "Minutes content");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 3.1: audience restrictions apply to event document access", async () => {
  const fakeSharePoint = createFakeSharePointClient();
  const { server, workingDirectory } = await createRunningServer({ sharePointClient: fakeSharePoint });

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();

    const outsiderLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "member2", password: "member2pass" })
    });
    const outsiderPayload = await outsiderLogin.json();

    const form = new FormData();
    form.set("documentType", "attachment");
    form.set("availabilityMode", "immediate");
    form.set("file", new Blob(["Board packet"], { type: "text/plain" }), "board.txt");

    const uploadResponse = await fetch(`http://${server.host}:${server.port}/api/events/2/documents`, {
      method: "POST",
      headers: { Authorization: `Bearer ${adminPayload.token}` },
      body: form
    });
    assert.equal(uploadResponse.status, 201);

    const listResponse = await fetch(`http://${server.host}:${server.port}/api/events/2/documents`, {
      headers: { Authorization: `Bearer ${outsiderPayload.token}` }
    });
    assert.equal(listResponse.status, 404);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 3.2: publish online event auto-creates Teams meeting when feature is enabled", async () => {
  const fakeTeams = createFakeTeamsGraphClient();
  const { server, workingDirectory } = await createRunningServer({
    teamsGraphClient: fakeTeams,
    enableTeamsGraph: true
  });

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();
    assert.equal(adminLogin.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Auto Teams Meeting",
        description: "Graph automation create test",
        startAt: "2026-10-10T10:00:00Z",
        endAt: "2026-10-10T11:00:00Z",
        venueType: "online",
        onlineProvider: "",
        onlineJoinUrl: "",
        capacity: 40,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.status, "published");
    assert.equal(submitPayload.teamsAutomation.automated, true);
    assert.equal(submitPayload.teamsAutomation.mode, "created");

    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    const created = (eventsPayload.items || []).find((item) => item.id === createPayload.id);
    assert.equal(created.onlineProvider, "Microsoft Teams");
    assert.match(String(created.onlineJoinUrl || ""), /teams\.microsoft\.com\/l\/meetup-join/);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 3.2: patching published online event updates existing Teams meeting", async () => {
  const fakeTeams = createFakeTeamsGraphClient();
  const { server, workingDirectory } = await createRunningServer({
    teamsGraphClient: fakeTeams,
    enableTeamsGraph: true
  });

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();
    assert.equal(adminLogin.status, 200);

    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Auto Teams Patch Meeting",
        description: "Graph automation patch test",
        startAt: "2026-11-10T10:00:00Z",
        endAt: "2026-11-10T11:00:00Z",
        venueType: "online",
        onlineProvider: "",
        onlineJoinUrl: "",
        capacity: 40,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    assert.equal(submitResponse.status, 200);

    const beforePatchEventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const beforePatchPayload = await beforePatchEventsResponse.json();
    const beforeItem = (beforePatchPayload.items || []).find((item) => item.id === createPayload.id);
    const beforeJoinUrl = String(beforeItem?.onlineJoinUrl || "");
    assert.ok(beforeJoinUrl);

    const patchResponse = await fetch(`http://${server.host}:${server.port}/api/events/${createPayload.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Auto Teams Patch Meeting v2",
        startAt: "2026-11-10T12:00:00Z",
        endAt: "2026-11-10T13:00:00Z"
      })
    });
    const patchPayload = await patchResponse.json();
    assert.equal(patchResponse.status, 200);
    assert.equal(patchPayload.teamsAutomation.automated, true);
    assert.equal(patchPayload.teamsAutomation.mode, "patched");

    const afterPatchEventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const afterPatchPayload = await afterPatchEventsResponse.json();
    const afterItem = (afterPatchPayload.items || []).find((item) => item.id === createPayload.id);
    assert.ok(afterItem.onlineJoinUrl);
    assert.notEqual(String(afterItem.onlineJoinUrl), beforeJoinUrl);
    assert.match(String(afterItem.onlineJoinUrl), /-updated$/);
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});

test("Checkpoint 3.2: manual join link fallback remains active when present", async () => {
  const fakeTeams = createFakeTeamsGraphClient();
  const { server, workingDirectory } = await createRunningServer({
    teamsGraphClient: fakeTeams,
    enableTeamsGraph: true
  });

  try {
    const adminLogin = await fetch(`http://${server.host}:${server.port}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: "admin1", password: "adminpass" })
    });
    const adminPayload = await adminLogin.json();
    assert.equal(adminLogin.status, 200);

    const manualJoinUrl = "https://teams.microsoft.com/l/meetup-join/manual-link";
    const createResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${adminPayload.token}`
      },
      body: JSON.stringify({
        title: "Manual Teams Fallback",
        description: "Manual URL should be preserved.",
        startAt: "2026-12-10T10:00:00Z",
        endAt: "2026-12-10T11:00:00Z",
        venueType: "online",
        onlineProvider: "Microsoft Teams",
        onlineJoinUrl: manualJoinUrl,
        capacity: 40,
        audienceType: "all_members"
      })
    });
    const createPayload = await createResponse.json();
    assert.equal(createResponse.status, 201);

    const submitResponse = await fetch(
      `http://${server.host}:${server.port}/api/events/${createPayload.id}/submit`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${adminPayload.token}` }
      }
    );
    const submitPayload = await submitResponse.json();
    assert.equal(submitResponse.status, 200);
    assert.equal(submitPayload.teamsAutomation.automated, false);
    assert.equal(submitPayload.teamsAutomation.reason, "manual_join_link");

    const eventsResponse = await fetch(`http://${server.host}:${server.port}/api/events`, {
      headers: { Authorization: `Bearer ${adminPayload.token}` }
    });
    const eventsPayload = await eventsResponse.json();
    const created = (eventsPayload.items || []).find((item) => item.id === createPayload.id);
    assert.equal(created.onlineJoinUrl, manualJoinUrl);
    assert.equal(created.onlineProvider, "Microsoft Teams");
  } finally {
    await server.close();
    rmSync(workingDirectory, { recursive: true, force: true });
  }
});
