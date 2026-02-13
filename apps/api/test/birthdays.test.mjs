import assert from "node:assert/strict";
import test from "node:test";
import { computeNextBirthdayUtc, listUpcomingBirthdays } from "../src/birthdays.mjs";

test("computeNextBirthdayUtc returns today when birthday is today (UTC)", () => {
  const nowMs = Date.UTC(2026, 1, 8, 12, 0, 0);
  const next = computeNextBirthdayUtc({ nowMs, birthdayMonth: 2, birthdayDay: 8 });
  assert.deepEqual(next, { occursOn: "2026-02-08", daysUntil: 0 });
});

test("computeNextBirthdayUtc wraps to next year when birthday already passed (UTC)", () => {
  const nowMs = Date.UTC(2026, 1, 8, 12, 0, 0);
  const next = computeNextBirthdayUtc({ nowMs, birthdayMonth: 2, birthdayDay: 7 });
  assert.deepEqual(next, { occursOn: "2027-02-07", daysUntil: 364 });
});

test("listUpcomingBirthdays filters to window and sorts by soonest", () => {
  const nowMs = Date.UTC(2026, 1, 8, 12, 0, 0);
  const people = [
    { userId: 1, fullName: "Ada Lovelace", birthdayMonth: 2, birthdayDay: 9 },
    { userId: 2, fullName: "Grace Hopper", birthdayMonth: 2, birthdayDay: 8 },
    { userId: 3, fullName: "Katherine Johnson", birthdayMonth: 3, birthdayDay: 1 }
  ];

  const items = listUpcomingBirthdays({ nowMs, windowDays: 14, people });
  assert.equal(items.length, 2);
  assert.equal(items[0].userId, 2);
  assert.equal(items[0].daysUntil, 0);
  assert.equal(items[1].userId, 1);
  assert.equal(items[1].daysUntil, 1);
});

