import { randomBytes } from "node:crypto";

export const EMAIL_OUTBOX_GLOBAL_KEY = "__IWFSA_EMAIL_OUTBOX__";

export function sendTransactionalEmail({ to, subject, text, metadata = {} }) {
  const messageId = `stub_${randomBytes(8).toString("hex")}`;
  const safeMetadata = {
    template: metadata.template || "unknown",
    recipient: to
  };

  console.log(
    JSON.stringify({
      level: "info",
      event: "email_stub_sent",
      messageId,
      subject,
      ...safeMetadata
    })
  );

  const outbox = globalThis[EMAIL_OUTBOX_GLOBAL_KEY];
  if (Array.isArray(outbox)) {
    outbox.push({ to, subject, text, metadata: safeMetadata, messageId });
  }

  return { messageId, accepted: [to], rejected: [] };
}
