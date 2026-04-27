import assert from "node:assert/strict";
import test from "node:test";
import vm from "node:vm";
import { getPublicBaseUrl } from "../../../api/entry.mjs";
import { startWebServer } from "../src/server.mjs";
import {
  renderActivationPage,
  renderAdminPage,
  renderMeetingRsvpPage,
  renderMemberPage,
  renderPublicPage,
  renderResetPage,
  renderSignInPage
} from "../src/templates.mjs";

const webTestConfig = {
  host: "127.0.0.1",
  port: 0,
  apiBaseUrl: "http://127.0.0.1:4000",
  appBaseUrl: "http://127.0.0.1:3000"
};

test("production deployment uses the public alias as browser API base", () => {
  const originalAppBaseUrl = process.env.APP_BASE_URL;
  const originalVercelEnv = process.env.VERCEL_ENV;
  const originalProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  const originalDeploymentUrl = process.env.VERCEL_URL;

  try {
    delete process.env.APP_BASE_URL;
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "iwfsa-platform.vercel.app";
    process.env.VERCEL_URL = "iwfsa-platform-deployment.vercel.app";

    assert.equal(getPublicBaseUrl(), "https://iwfsa-platform.vercel.app");
  } finally {
    if (originalAppBaseUrl === undefined) delete process.env.APP_BASE_URL;
    else process.env.APP_BASE_URL = originalAppBaseUrl;
    if (originalVercelEnv === undefined) delete process.env.VERCEL_ENV;
    else process.env.VERCEL_ENV = originalVercelEnv;
    if (originalProductionUrl === undefined) delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    else process.env.VERCEL_PROJECT_PRODUCTION_URL = originalProductionUrl;
    if (originalDeploymentUrl === undefined) delete process.env.VERCEL_URL;
    else process.env.VERCEL_URL = originalDeploymentUrl;
  }
});

test("rendered inline scripts are syntactically valid", () => {
  const pages = [
    ["public", renderPublicPage],
    ["member", renderMemberPage],
    ["admin", renderAdminPage],
    ["sign-in", renderSignInPage],
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
    const signInResponse = await fetch(`http://${server.host}:${server.port}/sign-in`);
    const signInHtml = await signInResponse.text();
    const activateResponse = await fetch(`http://${server.host}:${server.port}/activate?token=test`);
    const activateHtml = await activateResponse.text();
    const resetResponse = await fetch(`http://${server.host}:${server.port}/reset?token=test`);
    const resetHtml = await resetResponse.text();
    const rsvpResponse = await fetch(`http://${server.host}:${server.port}/meetings/rsvp?token=test`);
    const rsvpHtml = await rsvpResponse.text();

    assert.equal(publicResponse.status, 200);
    assert.equal(memberResponse.status, 200);
    assert.equal(adminResponse.status, 200);
    assert.equal(signInResponse.status, 200);
    assert.equal(activateResponse.status, 200);
    assert.equal(resetResponse.status, 200);
    assert.equal(rsvpResponse.status, 200);
    assert.match(publicHtml, /Public Service/);
    for (const html of [publicHtml, memberHtml, adminHtml, signInHtml, activateHtml, resetHtml, rsvpHtml]) {
      assert.match(html, /class="brand-logo"/);
      assert.match(html, /\/assets\/iwfsa-logo\.svg/);
    }
    for (const html of [publicHtml, memberHtml, adminHtml]) {
      assert.doesNotMatch(html, /Build Progress Tracker/);
    }
    assert.doesNotMatch(publicHtml, /public-entry-actions/);
    assert.match(publicHtml, /Leading with Purpose\./);
    assert.match(publicHtml, />Legacy<\/a>/);
    assert.match(publicHtml, /href="https:\/\/www\.iwfsa\.co\.za\/"/);
    assert.doesNotMatch(publicHtml, /Member Sign In|Admin Sign In|Choose Member Sign In|View Our Impact/);
    assert.doesNotMatch(publicHtml, /Sign in once and the platform opens the right workspace for your role\./);
    assert.match(signInHtml, /<h1 id="sign-in-title" class="page-title">Sign In<\/h1>/);
    assert.match(signInHtml, /id="sign-in-card"/);
    assert.match(signInHtml, /id="sign-in-drag-handle"/);
    assert.match(signInHtml, /id="prompt-sign-in-form"/);
    assert.match(signInHtml, /id="sign-in-username"/);
    assert.match(signInHtml, /id="sign-in-password"/);
    assert.match(signInHtml, /function setCardPosition\(/);
    assert.match(signInHtml, /function startDrag\(/);
    assert.match(signInHtml, /safeRedirectPath/);
    assert.match(signInHtml, /redirectPath/);
    assert.match(signInHtml, /iwfsa_admin_token/);
    assert.match(signInHtml, /iwfsa_token/);
    assert.match(signInHtml, /Use the form below to access your workspace\./);
    assert.doesNotMatch(signInHtml, /id="prompt-sign-in-button"|id="sign-in-modal"|window\.prompt\(/);
    assert.doesNotMatch(signInHtml, /Member Sign In|Admin Sign In|role-switcher|impersonateAsMember/);
    assert.match(memberHtml, /Create events and invite members/);
    assert.match(memberHtml, /nav-link-sign-in/);
    assert.match(memberHtml, /href="http:\/\/127\.0\.0\.1:3000\/sign-in"/);
    assert.doesNotMatch(memberHtml, /Member Sign In|Admin Sign In|role-switcher|member-login-form|member-test-usernames/);
    assert.match(memberHtml, /data-member-module-link="events"/);
    assert.match(memberHtml, /data-member-module-link="birthdays"/);
    assert.match(memberHtml, /data-member-module-link="notifications"/);
    assert.match(memberHtml, /data-member-module-link="sms"/);
    assert.match(memberHtml, /data-member-module-link="celebrations"/);
    assert.match(memberHtml, /SMS Settings/);
    assert.match(memberHtml, /Celebration Thread/);
    assert.match(memberHtml, /Event window/);
    assert.match(memberHtml, /id="member-nav"[^>]*hidden/);
    assert.match(memberHtml, /id="member-login-status" class="sr-only"/);
    assert.doesNotMatch(memberHtml, /Admin username \(akeida\)/);
    assert.doesNotMatch(memberHtml, /Use admin password to impersonate this member/);
    assert.doesNotMatch(memberHtml, />Not signed in\.<\/p>/);
    assert.match(memberHtml, /id="member-event-create-form"/);
    assert.match(memberHtml, /Professional title/);
    assert.match(memberHtml, /IWFSA position/);
    assert.match(memberHtml, /Short biography/);
    assert.match(memberHtml, /LinkedIn URL/);
    assert.match(memberHtml, /Professional links/);
    assert.match(memberHtml, /Profile visibility/);
    assert.match(memberHtml, /Links visibility/);
    assert.match(memberHtml, /Field visibility overrides/);
    assert.match(memberHtml, /Full name visibility/);
    assert.match(memberHtml, /Create event and invite members/);
    assert.match(memberHtml, /All Active IWFSA Members/);
    assert.match(memberHtml, /hidden class="nav-link nav-link-signout session-nav-signout member-session-logout admin-session-logout"/);
    assert.match(memberHtml, /Search by member name, email, organisation, or group/);
    assert.doesNotMatch(memberHtml, /<option value="board_of_directors">Board of Directors<\/option>/);
    assert.doesNotMatch(memberHtml, /<option value="member_affairs">Member Affairs<\/option>/);
    assert.match(memberHtml, /Publish immediately and send invitations/);
    assert.match(memberHtml, /member-event-invitee-search/);
    assert.match(memberHtml, /member-event-selected-invitees/);
    assert.match(memberHtml, /member-event-attachment/);
    assert.match(memberHtml, /member-birthday-panel/);
    assert.match(memberHtml, /Open Birthday Circle/);
    assert.doesNotMatch(memberHtml, /session-logout-button member-session-logout/);
    assert.ok(
      memberHtml.indexOf('id="member-session-bar"') < memberHtml.indexOf('id="member-nav"'),
      "signed-in area should render before member module navigation"
    );
    assert.ok(
      memberHtml.indexOf('id="member-nav"') < memberHtml.indexOf('id="member-birthday-panel"'),
      "member module navigation should render before the birthday panel"
    );
    assert.doesNotMatch(memberHtml, /id="member-logout"/);
    assert.doesNotMatch(memberHtml, /Admin console/);
    assert.match(memberHtml, /celebration-confirmations/);
    assert.match(adminHtml, /Admin Console/);
    assert.match(adminHtml, /href="http:\/\/127\.0\.0\.1:3000\/sign-in"/);
    assert.doesNotMatch(adminHtml, /Member Sign In|Admin Sign In|role-switcher|admin-login-form|module-access/);
    assert.match(adminHtml, /hidden class="nav-link nav-link-signout session-nav-signout member-session-logout admin-session-logout"/);
    assert.doesNotMatch(adminHtml, /session-logout-button admin-session-logout/);
    assert.doesNotMatch(adminHtml, /id="admin-logout"/);
    assert.doesNotMatch(adminHtml, /Member portal/);
    assert.match(adminHtml, /ADMIN_MODULES/);
    assert.match(adminHtml, /showAdminModule/);
    assert.match(adminHtml, /clearAdminAuthOnUnauthorized/);
    assert.match(adminHtml, /isStoredAdminSessionExpired/);
    assert.match(adminHtml, /iwfsa_admin_expires_at/);
    assert.match(adminHtml, /loadAdminWorkspace/);
    assert.match(adminHtml, /void loadAdminWorkspace\(\);/);
    assert.match(adminHtml, /function formatEventDateTime\(/);
    assert.doesNotMatch(adminHtml, /data-admin-module-link="access"/);
    assert.match(adminHtml, /data-admin-module-link="members"/);
    assert.match(adminHtml, /data-admin-module-link="imports"/);
    assert.match(adminHtml, /data-admin-module-link="notifications"/);
    assert.match(adminHtml, /data-admin-module-link="reports"/);
    assert.match(adminHtml, /Member Directory/);
    assert.match(adminHtml, /Event Hub/);
    assert.match(adminHtml, /<option value="external_stakeholders">External Stakeholders<\/option>/);
    assert.match(adminHtml, /<option value="leadership_development_committee">Leadership Development Committee<\/option>/);
    assert.match(adminHtml, /event-invitee-search/);
    assert.match(adminHtml, /event-selected-invitees/);
    assert.match(adminHtml, /event-attachment/);
    assert.match(adminHtml, /event-publish-now/);
    assert.match(adminHtml, /Publish now and email invitations/);
    assert.match(adminHtml, /Notification Delivery Report/);
    assert.match(adminHtml, /Notification Queue Status/);
    assert.match(adminHtml, /Reporting and Exports Dashboard/);
    assert.match(adminHtml, /Celebration Moderators/);
    assert.match(adminHtml, /Public Profile Review/);
    assert.match(adminHtml, /Historical Figures &amp; Past Members/);
    assert.match(adminHtml, /Honorary Members/);
    assert.match(adminHtml, /Memorial &amp; Past Member Records/);
    assert.match(adminHtml, /Member Import \(Excel\)/);
    assert.match(adminHtml, /Membership &amp; Fees/);
    assert.match(adminHtml, /id="member-status-filter"/);
    assert.match(adminHtml, /id="member-role-filter"/);
    assert.match(adminHtml, /id="member-group-filter"/);
    assert.match(adminHtml, /id="member-sort"/);
    assert.match(adminHtml, /id="member-filter-reset"/);
    assert.match(adminHtml, /id="member-detail-form"/);
    assert.match(adminHtml, /id="member-detail-groups"/);
    assert.match(adminHtml, /member-detail-save/);
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
    assert.match(adminHtml, /function normalizeDisplayText/);
    assert.match(memberHtml, /function normalizeDisplayText/);
    for (const html of [memberHtml, adminHtml]) {
      assert.doesNotMatch(html, /Ã¢|Ã°|â€|â€”|â€“|�/);
    }
    assert.match(activateHtml, /Activate your account/);
    assert.match(activateHtml, /Continue to sign in\./);
    assert.match(activateHtml, /window\.location\.assign\(appBaseUrl \+ "\/sign-in"\)/);
    assert.match(resetHtml, /Reset your password/);
    assert.match(resetHtml, /Continue to sign in\./);
    assert.match(resetHtml, /window\.location\.assign\(appBaseUrl \+ "\/sign-in"\)/);
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
    const logoResponse = await fetch(`http://${server.host}:${server.port}/assets/iwfsa-logo.svg`);
    const logo = await logoResponse.text();

    assert.equal(response.status, 200);
    assert.match(response.headers.get("content-type") || "", /text\/css/);
    assert.equal(logoResponse.status, 200);
    assert.match(logoResponse.headers.get("content-type") || "", /image\/svg\+xml/);
    assert.match(logo, /International Women's Forum South Africa logo/);
    assert.match(css, /:root/);
    assert.match(css, /\.brand-logo\s*\{[\s\S]*width:\s*9\.25rem/);
    assert.match(css, /--nav-warm:\s*#9a4f08/);
    assert.match(css, /nav \.nav-link\s*\{[\s\S]*font-size:\s*0\.9rem/);
    assert.match(css, /\.admin-session-bar\s*\{[\s\S]*background:\s*transparent/);
    assert.match(css, /@media \(max-width: 900px\)/);
    assert.match(css, /@media \(max-width: 760px\)/);
    assert.match(css, /@media \(max-width: 480px\)/);
    assert.match(css, /\.member-actions input\[type="search"\],[\s\S]*width:\s*100%/);
    assert.match(css, /\.member-directory-controls\s*\{[\s\S]*grid-template-columns:/);
    assert.match(css, /\.member-add-form\s*\{[\s\S]*grid-template-columns:/);
    assert.match(css, /\.historical-section\s*\{/);
    assert.match(css, /\.historical-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(css, /\.event-toolbar select,[\s\S]*\.event-toolbar button\s*\{[\s\S]*width:\s*100%/);
    assert.match(css, /#member-profile-form,[\s\S]*\.member-event-create-form\s*\{[\s\S]*max-width:\s*none/);
    assert.match(css, /\.login-form input\s*\{[\s\S]*box-sizing:\s*border-box/);
    assert.match(css, /\.sign-in-stage\s*\{[\s\S]*iwfsa-home\.jpg/);
    assert.match(css, /\.sign-in-card\s*\{[\s\S]*width:\s*min\(19\.5rem,\s*calc\(100% - 2rem\)\)/);
    assert.match(css, /\.sign-in-card-handle\s*\{[\s\S]*cursor:\s*grab/);
    assert.match(css, /\.nav-link-legacy\s*\{/);
    assert.match(css, /\.page-member\.member-signed-in \.site-nav \.nav-link-sign-in,[\s\S]*\.page-admin\.admin-signed-in \.site-nav \.nav-link-sign-in/);
    assert.match(css, /\.page-member\.member-signed-in \.site-nav \.session-nav-signout,[\s\S]*\.page-admin\.admin-signed-in \.site-nav \.session-nav-signout\s*\{[\s\S]*display:\s*inline-flex/);
    assert.doesNotMatch(css, /role-switcher|auth-controls|member-login-form|admin-access-panel|inline-login-form/);
    assert.match(css, /\.member-top-session-bar\s*\{[\s\S]*margin-top:\s*0\.85rem/);
    assert.match(css, /\.module-nav\s*\{[\s\S]*flex-wrap:\s*wrap[\s\S]*overflow:\s*visible/);
    assert.match(css, /\.session-actions \.session-logout-button\s*\{[\s\S]*background:\s*var\(--accent\)/);
    assert.match(css, /\.login-form input\[type="checkbox"\],[\s\S]*width:\s*auto/);
    assert.match(css, /\.celebration-confirmations \.inline-checkbox\s*\{[\s\S]*grid-template-columns:\s*auto minmax\(0,\s*1fr\)/);
    assert.match(css, /\.group-picker\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(css, /\.group-option\s*\{[\s\S]*overflow-wrap:\s*anywhere/);
    assert.match(css, /\.group-option:has\(input:checked\)\s*\{/);
    assert.match(css, /\.invitee-search-row\s*\{[\s\S]*display:\s*flex/);
    assert.match(css, /\.invitee-result\s*\{[\s\S]*text-align:\s*left/);
    assert.match(css, /\.invitee-chip\s*\{[\s\S]*border-radius:\s*999px/);
    assert.match(css, /\.membership-fee-kpis\s*\{[\s\S]*grid-template-columns:\s*repeat\(5,\s*minmax\(0,\s*1fr\)\)/);
    assert.match(css, /\.fee-bulk-bar select,[\s\S]*\.fee-bulk-bar input\s*\{/);
  } finally {
    await server.close();
  }
});
