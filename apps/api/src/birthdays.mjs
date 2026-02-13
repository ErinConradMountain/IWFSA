const MS_PER_DAY = 24 * 60 * 60 * 1000;

function utcStartOfDayMs(date) {
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

function isValidMonthDay(year, month, day) {
  if (!Number.isInteger(month) || month < 1 || month > 12) return false;
  if (!Number.isInteger(day) || day < 1 || day > 31) return false;
  const ms = Date.UTC(year, month - 1, day);
  const d = new Date(ms);
  return d.getUTCFullYear() === year && d.getUTCMonth() === month - 1 && d.getUTCDate() === day;
}

export function computeNextBirthdayUtc({ nowMs, birthdayMonth, birthdayDay }) {
  if (!Number.isFinite(nowMs)) return null;
  const month = Number(birthdayMonth);
  const day = Number(birthdayDay);
  if (!Number.isInteger(month) || !Number.isInteger(day)) return null;

  const now = new Date(nowMs);
  const todayStartMs = utcStartOfDayMs(now);
  const year = now.getUTCFullYear();

  if (!isValidMonthDay(year, month, day)) return null;

  const thisYearBirthdayMs = Date.UTC(year, month - 1, day);
  const nextYearBirthdayMs = Date.UTC(year + 1, month - 1, day);
  const occursAtMs = thisYearBirthdayMs < todayStartMs ? nextYearBirthdayMs : thisYearBirthdayMs;
  const daysUntil = Math.floor((occursAtMs - todayStartMs) / MS_PER_DAY);

  return {
    occursOn: new Date(occursAtMs).toISOString().slice(0, 10),
    daysUntil
  };
}

export function listUpcomingBirthdays({ nowMs, windowDays, people }) {
  const window = Number(windowDays);
  if (!Number.isInteger(window) || window <= 0) {
    throw new Error("windowDays must be a positive integer");
  }
  if (!Array.isArray(people) || people.length === 0) return [];

  const results = [];
  for (const person of people) {
    const next = computeNextBirthdayUtc({
      nowMs,
      birthdayMonth: person.birthdayMonth,
      birthdayDay: person.birthdayDay
    });
    if (!next) continue;
    if (next.daysUntil < 0 || next.daysUntil >= window) continue;
    results.push({
      ...person,
      occursOn: next.occursOn,
      daysUntil: next.daysUntil
    });
  }

  results.sort((a, b) => {
    if (a.daysUntil !== b.daysUntil) return a.daysUntil - b.daysUntil;
    const nameA = String(a.fullName || "").toLowerCase();
    const nameB = String(b.fullName || "").toLowerCase();
    if (nameA < nameB) return -1;
    if (nameA > nameB) return 1;
    return Number(a.userId || 0) - Number(b.userId || 0);
  });

  return results;
}

