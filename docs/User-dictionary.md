# User Dictionary

> **Writing standard:** All definitions in this file must be written so a 7th grader (ages 12–13) can understand them. Use short sentences, everyday words, and real-world analogies. Avoid jargon; if a technical term is needed, explain it in plain language right away.

---

## Audit Trail

An **audit trail** is like a security camera for your software. It keeps a permanent record of everything that happens: who did what, when they did it, and what changed. You can't erase or edit it, so it's trustworthy. If something goes wrong, you can look back and see exactly what happened — like rewinding a video.

**Example in this project:**
- The system saves every notification it sends into a table called `notification_deliveries`.
- It also writes down who triggered an action in the `audit_logs` table.
- If an event gets changed, a snapshot is saved so you can undo the change later.

---

## Notification Queue Status

Imagine a line of people waiting to mail letters. The **queue status** tells you how that line is doing:
- **Healthy** = letters are being sent smoothly.
- **Degraded** = some letters are stuck or slow.
- **Attention needed** = something is wrong and needs fixing.

If it's not healthy, check the **Delivery Report** to find out which members didn't get their message.

**Example in this project:**
- The admin console has a "Notification Queue Status" card. It reads counts from the `notification_queue` table — how many jobs are `pending`, `processing`, `sent`, or `failed`.
- The card shows a simple label like "Healthy" or "Attention needed." If there are failures, it tells the admin to open the Delivery Report to see which members were affected.

---

## Notification Delivery Report

This is a list that shows which members got their message and which ones didn't. Think of it like a checklist after mailing party invitations — you can see who received theirs and follow up with anyone who didn't.

**Example in this project:**
- In the admin console, the Delivery Report shows a table with columns: **Member name**, **Email**, **Phone**, **Organisation**, and a **Status** badge (Sent or Failed).
- If a member's message failed, the admin can see their contact details and follow up directly. Technical error details stay hidden — they're stored in `notification_deliveries` and `audit_logs` for developers, not shown in the admin grid.

---

## Transactional Email

A **transactional email** is an automatic message the system sends when something specific happens — like a password reset link or an event confirmation. It's not advertising; it's a direct response to something you did.

**Example in this project:**
- When an admin invites a new member, the system sends an onboarding email using `sendTransactionalEmail()`. The email includes the member's username and a secure link to activate the account.
- When an admin triggers a password reset, another transactional email is sent with a secure, one-time reset link.
- These emails are logged in `notification_deliveries` so the system can track whether they were sent successfully.

---

## Feature Flag

A **feature flag** is like a light switch for new features. You can turn a feature on or off without changing the code. This lets you test things safely or roll out a feature slowly to make sure it works.

**Example in this project:**
- The project has a feature-flag register in `docs/build-playbook.md`. Capabilities like Teams Graph automation (`ENABLE_TEAMS_GRAPH`) and social media posting (`ENABLE_SOCIAL_POSTING`) are flagged off by default.
- This means those features won't run until an admin explicitly enables them — keeping the MVP simple and safe while allowing future expansion.

---

## Profile Visibility

**Profile visibility** means a member chooses who can see each part of her profile. Think of it like curtains in a house: some windows stay closed, some open for members, and some open to the public only after a careful check.

**Example in this project:**
- A member might keep her phone number private, share her work biography with other members, and submit a short public biography for admin review.

---

## Public Profile

A **public profile** is the part of a member's profile that is allowed to appear on the public website. It is not automatic. The member must choose to share it, and an admin must approve it first.

**Example in this project:**
- A member can prepare a short public biography and selected links. Those details stay private until they are reviewed and approved for public display.

---

## Social Link

A **social link** is a link to a person's outside online presence, like LinkedIn, Instagram, a website, a podcast, or an article. It helps show professional identity without copying all that content into the app.

**Example in this project:**
- A member can add her LinkedIn page and choose whether it stays private, is visible to members, or is submitted for public review.

---

## Memorial Section

A **memorial section** is a respectful public space that remembers members who have passed away. It should feel thoughtful and dignified, like a remembrance wall in an important building.

**Example in this project:**
- Admins prepare a tribute, confirm the wording, and publish it only when it is appropriate and approved.

---

## Honorary Member

An **honorary member** is someone the organisation publicly recognises in a special way. This is a ceremonial honour, not just a normal member listing.

**Example in this project:**
- Admins can create an Honorary Members entry with a portrait, short biography, and the reason the person is being recognised.

---

## Conference Memory

**Conference memory** means keeping reflections, lessons, and important links from a conference so the organisation remembers what mattered. It is like saving the best pages from a group notebook.

**Example in this project:**
- Members can share reflections and useful links after a conference. Those notes stay member-only unless someone chooses to share them publicly and an admin approves that use.

---

## Admin Review

**Admin review** means an admin checks content before it becomes public. This is a safety and stewardship step, not a way to take ownership away from the member.

**Example in this project:**
- A member can submit a short profile for public display, but it only appears on the public site after an admin reviews and approves it.

---

## Privacy and Security Controls

These are rules that keep personal information safe:
- **No plaintext secrets** = passwords and keys are scrambled so no one can read them, even in logs.
- **Sensitive spreadsheet handling** = member lists are treated like private documents and protected.

Think of it like locking your diary and not leaving copies lying around.

**Example in this project:**
- Passwords are never stored as plain text. The system uses `hashPassword()` to scramble them before saving to the database. Even developers can't see the original password.
- Member import spreadsheets (CSV files with names, emails, phone numbers) are treated as sensitive data. The system doesn't expose them publicly and follows POPIA (South Africa's privacy law) rules for handling personal information.
- Invite and reset tokens are hashed before storage — the actual token only appears once in the email sent to the member.

---

## Queue-Based Fan-Out with Idempotency Keys

- **Queue-based fan-out** = when one event (like "event published") needs to notify many people, the system adds each notification to a waiting line (queue) and sends them one by one. This keeps the system from getting overloaded.
- **Idempotency key** = a unique ID attached to each job so the system knows not to send the same notification twice, even if something goes wrong and it tries again.

**Example in this project:**
- When an event is published, the system creates a job in the `notification_queue` table with a unique `idempotency_key` (for example, `event_published:42:v1`). A background worker picks up the job, sends notifications to all signed-up members, and records each send in `notification_deliveries`.
- If the worker crashes halfway and restarts, the idempotency key prevents duplicate emails. The system checks: "Did I already process this key?" If yes, it skips it. This is tested in `server.test.mjs` to make sure it really works.

