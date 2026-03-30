import assert from "node:assert/strict";
import test from "node:test";
import { startWebServer } from "../src/server.mjs";

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
    assert.match(publicHtml, /\/member#events/);
    assert.match(publicHtml, /\/member#birthdays/);
    assert.match(publicHtml, /\/member#sms/);
    assert.match(publicHtml, /\/member#celebrations/);
    assert.match(publicHtml, /\/admin#members/);
    assert.match(publicHtml, /\/admin#imports/);
    assert.match(publicHtml, /\/admin#notifications/);
    assert.match(publicHtml, /\/admin#reports/);
    assert.match(memberHtml, /Member Event Directory/);
    assert.match(memberHtml, /data-member-module-link="events"/);
    assert.match(memberHtml, /data-member-module-link="birthdays"/);
    assert.match(memberHtml, /data-member-module-link="notifications"/);
    assert.match(memberHtml, /data-member-module-link="sms"/);
    assert.match(memberHtml, /data-member-module-link="celebrations"/);
    assert.match(memberHtml, /SMS Settings/);
    assert.match(memberHtml, /Celebration Thread/);
    assert.match(memberHtml, /Event window/);
    assert.match(memberHtml, /member-login-credentials/);
    assert.match(memberHtml, /member-birthday-panel/);
    assert.match(memberHtml, /Open Birthday Circle/);
    assert.match(adminHtml, /Admin Console/);
    assert.match(adminHtml, /Access/);
    assert.match(adminHtml, /data-admin-module-link="members"/);
    assert.match(adminHtml, /data-admin-module-link="imports"/);
    assert.match(adminHtml, /data-admin-module-link="notifications"/);
    assert.match(adminHtml, /data-admin-module-link="reports"/);
    assert.match(adminHtml, /Member Directory/);
    assert.match(adminHtml, /Event Hub/);
    assert.match(adminHtml, /Notification Delivery Report/);
    assert.match(adminHtml, /Notification Queue Status/);
    assert.match(adminHtml, /Reporting and Exports Dashboard/);
    assert.match(adminHtml, /Celebration Moderators/);
    assert.match(adminHtml, /Member Import \(Excel\)/);
    assert.match(adminHtml, /Delete<\/button>/);
    assert.doesNotMatch(adminHtml, /akeida123/);
    assert.doesNotMatch(publicHtml, /memberpass|adminpass|akeida123/);
    assert.doesNotMatch(adminHtml, /memberpass|adminpass|demo_member1/);
    assert.match(activateHtml, /Activate your account/);
    assert.match(resetHtml, /Reset your password/);
    assert.match(rsvpHtml, /Confirm meeting participation/);
    for (const html of [publicHtml, memberHtml, adminHtml, activateHtml, resetHtml, rsvpHtml]) {
      assert.match(html, /addEventListener\('pageshow'.*persisted/, "bfcache reload handler must be present on every page");
    }
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
  } finally {
    await server.close();
  }
});
