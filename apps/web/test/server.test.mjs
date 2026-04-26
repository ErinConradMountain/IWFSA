import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { startWebServer } from "../src/server.mjs";
import {
  renderActivationPage,
  renderAdminPage,
  renderMeetingRsvpPage,
  renderMemberPage,
  renderPublicPage,
  renderResetPage
} from "../src/templates.mjs";

const webTestConfig = {
  host: "127.0.0.1",
  port: 0,
  apiBaseUrl: "http://127.0.0.1:4000",
  appBaseUrl: "http://127.0.0.1:3000"
};

test("rendered inline scripts are syntactically valid", () => {
  const pages = [
    ["public", renderPublicPage],
    ["member", renderMemberPage],
    ["admin", renderAdminPage],
    ["activate", renderActivationPage],
    ["reset", renderResetPage],
    ["rsvp", renderMeetingRsvpPage]
  ];

  for (const [pageName, render] of pages) {
    const html = render(webTestConfig);
    const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map((match) => match[1]);

    for (const [index, script] of scripts.entries()) {
      assert.doesNotThrow(
        () => new vm.Script(script, { filename: `${pageName}-inline-${index + 1}.js` }),
        `${pageName} inline script ${index + 1} should compile`
      );
    }
  }
});

test("web routes render baseline surfaces", async () => {
  const server = await startWebServer({
    host: "127.0.0.1",
    port: 0,
    apiBaseUrl: "http://127.0.0.1:4000",
    appBaseUrl: "http://127.0.0.1:3000"
  });

  try {
    const publicResponse = await fetch(`http://${server.host}:${server.port}/`);
    const publicHtml = await publicResponse.text();

    const memberResponse = await fetch(`http://${server.host}:${server.port}/member`);
    const memberHtml = await memberResponse.text();
    const adminResponse = await fetch(`http://${server.host}:${server.port}/admin`);
    const adminHtml = await adminResponse.text();
    const activateResponse = await fetch(`http://${server.host}:${server.port}/activate?token=test`);
    const activateHtml = await activateResponse.text();
    const resetResponse = await fetch(`http://${server.host}:${server.port}/reset?token=test`);
    const resetHtml = await resetResponse.text();
    const rsvpResponse = await fetch(`http://${server.host}:${server.port}/meetings/rsvp?token=test`);
    const rsvpHtml = await rsvpResponse.text();

    assert.equal(publicResponse.status, 200);
    assert.equal(memberResponse.status, 200);
    assert.equal(adminResponse.status, 200);
    assert.equal(activateResponse.status, 200);
    assert.equal(resetResponse.status, 200);
    assert.equal(rsvpResponse.status, 200);
    assert.match(publicHtml, /Public Surface/);
    for (const html of [publicHtml, memberHtml, adminHtml]) {
      assert.doesNotMatch(html, /Build Progress Tracker/);
    }
    assert.match(publicHtml, /public-entry-actions/);
    assert.match(publicHtml, /Member Sign In/);
    assert.match(publicHtml, /Admin Sign In/);
    assert.match(publicHtml, /href="http:\/\/127\.0\.0\.1:3000\/member"/);
    assert.match(publicHtml, /href="http:\/\/127\.0\.0\.1:3000\/admin"/);
    assert.match(memberHtml, /Create events and invite members/);
    assert.match(memberHtml, /nav-link-member/);
    assert.match(memberHtml, /nav-link-admin/);
    assert.match(memberHtml, /role-switcher-active[^>]*>Member Sign In/);
    assert.match(memberHtml, /href="http:\/\/127\.0\.0\.1:3000\/admin"[^>]*>Admin Sign In/);
    assert.match(memberHtml, /data-member-module-link="events"/);
    assert.match(memberHtml, /data-member-module-link="birthdays"/);
    assert.match(memberHtml, /data-member-module-link="notifications"/);
    assert.match(memberHtml, /data-member-module-link="sms"/);
    assert.match(memberHtml, /data-member-module-link="celebrations"/);
    assert.match(memberHtml, /SMS Settings/);
    assert.match(memberHtml, /Celebration Thread/);
    assert.match(memberHtml, /Event window/);
    assert.match(memberHtml, /member-login-credentials/);
    assert.match(memberHtml, /id="member-nav"[^>]*hidden/);
    assert.match(memberHtml, /member-test-usernames/);
    assert.match(memberHtml, /Admin username \(akeida\)/);
    assert.match(memberHtml, /id="member-event-create-form"/);
    assert.match(memberHtml, /Create event and invite members/);
    assert.match(memberHtml, /Publish immediately and send invitations/);
    assert.match(memberHtml, /member-event-invitee-search/);
    assert.match(memberHtml, /member-event-selected-invitees/);
    assert.match(memberHtml, /member-event-attachment/);
    assert.match(memberHtml, /member-birthday-panel/);
    assert.match(memberHtml, /Open Birthday Circle/);
    assert.match(memberHtml, /session-actions-single/);
    assert.match(memberHtml, /session-logout-button member-session-logout/);
    assert.doesNotMatch(memberHtml, /id="member-logout"/);
    assert.doesNotMatch(memberHtml, /Admin console/);
    assert.match(memberHtml, /celebration-confirmations/);
    assert.match(adminHtml, /Admin Console/);
    assert.match(adminHtml, /Access/);
    assert.match(adminHtml, /role-switcher-active[^>]*>Admin Sign In/);
    assert.match(adminHtml, /href="http:\/\/127\.0\.0\.1:3000\/member"[^>]*>Member Sign In/);
    assert.match(adminHtml, /session-actions-single/);
    assert.match(adminHtml, /session-logout-button admin-session-logout/);
    assert.doesNotMatch(adminHtml, /id="admin-logout"/);
    assert.doesNotMatch(adminHtml, /Member portal/);
    assert.match(adminHtml, /ADMIN_MODULES/);
    assert.match(adminHtml, /showAdminModule/);
    assert.match(adminHtml, /clearAdminAuthOnUnauthorized/);
    assert.match(adminHtml, /isStoredAdminSessionExpired/);
    assert.match(adminHtml, /iwfsa_admin_expires_at/);
    assert.match(adminHtml, /json\.expiresAt/);
    assert.match(adminHtml, /loadAdminWorkspace/);
    assert.match(adminHtml, /void loadAdminWorkspace\(\);/);
    assert.match(adminHtml, /data-admin-module-link="members"/);
    assert.match(adminHtml, /data-admin-module-link="imports"/);
    assert.match(adminHtml, /data-admin-module-link="notifications"/);
    assert.match(adminHtml, /data-admin-module-link="reports"/);
    assert.match(adminHtml, /Member Directory/);
    assert.match(adminHtml, /Event Hub/);
    assert.match(adminHtml, /event-invitee-search/);
    assert.match(adminHtml, /event-selected-invitees/);
    assert.match(adminHtml, /event-attachment/);
    assert.match(adminHtml, /event-publish-now/);
    assert.match(adminHtml, /Publish now and email invitations/);
    assert.match(adminHtml, /Notification Delivery Report/);
    assert.match(adminHtml, /Notification Queue Status/);
    assert.match(adminHtml, /Reporting and Exports Dashboard/);
    assert.match(adminHtml, /Celebration Moderators/);
    assert.match(adminHtml, /Member Import \(Excel\)/);
    assert.match(adminHtml, /Membership &amp; Fees/);
    assert.match(adminHtml, /import-membership-cycle-year/);
    assert.match(adminHtml, /import-membership-category-default/);
    assert.match(adminHtml, /import-standing-default/);
    assert.match(adminHtml, /import-detail-membership-year/);
    assert.match(adminHtml, /import-detail-membership-category/);
    assert.match(adminHtml, /import-detail-standing-default/);
    assert.match(adminHtml, /fee-bulk-bar/);
    assert.match(adminHtml, /fee-select-all-members/);
    assert.match(adminHtml, /fee-bulk-apply/);
    assert.match(adminHtml, /fee-bulk-remind/);
    assert.match(adminHtml, /data-fee-audit-id/);
    assert.match(adminHtml, /loadMembershipFeeAudit/);
    assert.match(adminHtml, /Last reminder:/);
    assert.match(adminHtml, /\/api\/admin\/membership-fees\/accounts\/bulk/);
    assert.match(adminHtml, /\/api\/admin\/membership-fees\/dues-reminders/);
    assert.match(adminHtml, /\/api\/admin\/membership-fees\/accounts\/" \+ String\(parsedUserId\) \+ "\/audit/);
    assert.match(adminHtml, /Delete<\/button>/);
    assert.doesNotMatch(adminHtml, /akeida123/);
    assert.doesNotMatch(publicHtml, /memberpass|adminpass|akeida123/);
    assert.doesNotMatch(adminHtml, /memberpass|adminpass|demo_member1/);
    assert.match(activateHtml, /Activate your account/);
    assert.match(resetHtml, /Reset your password/);
    assert.match(rsvpHtml, /Confirm meeting participation/);
  } finally {
    await server.close();
  }
});

test("web serves stylesheet", async () => {
  const server = await startWebServer({
    host: "127.0.0.1",
    port: 0,
    apiBaseUrl: "http://127.0.0.1:4000",
    appBaseUrl: "http://127.0.0.1:3000"
  });

  try {
    const response = await fetch(`http://${server.host}:${server.port}/assets/styles.css`);
    const css = await response.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /text\/css/);
    assert.match(css, /:root/);
    assert.match(css, /@media \(max-width: 900px\)/);
    assert.match(css, /@media \(max-width: 760px\)/);
    assert.match(css, /@media \(max-width: 480px\)/);
    assert.match(css, /\.inline-login-form\s*\{[\s\S]*display:\s*flex/);
    assert.match(css, /\.member-actions input\[type="search"\],[\s\S]*width:\s*100%/);
    assert.match(css, /\.event-toolbar select,[\s\S]*\.event-toolbar button\s*\{[\s\S]*width:\s*100%/);
    assert.match(css, /#member-profile-form,[\s\S]*\.member-event-create-form\s*\{[\s\S]*max-width:\s*none/);
    assert.match(css, /\.login-form input\s*\{[\s\S]*box-sizing:\s*border-box/);
    assert.match(css, /\.public-entry-actions\s*\{[\s\S]*display:\s*flex/);
    assert.match(css, /\.role-switcher\s*\{[\s\S]*border-radius:\s*999px/);
    assert.match(css, /\.role-switcher-active\s*\{[\s\S]*background:\s*var\(--accent\)/);
    assert.match(css, /\.page-member\.member-signed-in \.auth-controls,[\s\S]*\.page-admin\.admin-signed-in \.site-nav \.nav-link-member/);
    assert.match(css, /\.module-nav\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*overflow:\s*visible/);
    assert.match(css, /\.session-actions \.session-logout-button\s*\{[\s\S]*background:\s*var\(--accent\)/);
    assert.match(css, /\.login-form input\[type="checkbox"\],[\s\S]*width:\s*auto/);
    assert.match(css, /\.celebration-confirmations \.inline-checkbox\s*\{[\s\S]*grid-template-columns:\s*auto minmax\(0,\s*1fr\)/);
    assert.match(css, /\.group-picker\s*\{[\s\S]*grid-template-columns:\s*repeat\(auto-fit,\s*minmax\(11rem,\s*1fr\)\)/);
    assert.match(css, /\.group-option\s*\{[\s\S]*overflow-wrap:\s*anywhere/);
    assert.match(css, /\.group-option:has\(input:checked\)\s*\{/);
    assert.match(css, /\.invitee-search-row\s*\{[\s\S]*display:\s*flex/);
    assert.match(css, /\.invitee-result\s*\{[\s\S]*text-align:\s*left/);
    assert.match(css, /\.invitee-chip\s*\{[\s\S]*border-radius:\s*999px/);
    assert.match(css, /\.fee-bulk-bar select,[\s\S]*\.fee-bulk-bar input\s*\{/);
  } finally {
    await server.close();
  }
});
