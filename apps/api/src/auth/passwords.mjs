import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const HASH_SCHEME = "scrypt-v1";

export function hashPassword(password) {
  if (typeof password !== "string" || password.length < 1) {
    throw new Error("Password is required.");
  }

  const salt = randomBytes(16);
  const derived = scryptSync(password, salt, 64);

  return `${HASH_SCHEME}$${salt.toString("hex")}$${derived.toString("hex")}`;
}

export function verifyPassword(password, encodedHash) {
  if (typeof password !== "string" || typeof encodedHash !== "string") {
    return false;
  }

  const parts = encodedHash.split("$");
  if (parts.length !== 3) {
    return false;
  }

  const [scheme, saltHex, derivedHex] = parts;
  if (scheme !== HASH_SCHEME || !saltHex || !derivedHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const expected = Buffer.from(derivedHex, "hex");
  const actual = scryptSync(password, salt, expected.length);

  if (actual.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(actual, expected);
}
