# Social Media Posting (Optional) — Birthday Posts + Celebrations

This document describes an optional integration that allows IWFSA admins to draft, approve, schedule, and publish celebratory posts (member birthdays, IWF Global birthdays, and sister-organisation anniversaries) to public social media platforms.

## Goals
- Celebrate members in a consistent, high-quality IWFSA visual style.
- Promote women’s leadership and empowerment with a short, uplifting line.
- Highlight member involvement by including active IWFSA roles/structures.
- Protect members’ privacy and comply with POPIA via explicit consent and auditability.

## Non-goals
- Automating *all* social content.
- Posting without explicit member consent.
- Creating “deepfake” or heavily altered photos; only light, tasteful cropping/toning.

## Platforms (Target)
The goal is to support publishing to as many platforms as practical.

Important: not all platforms offer reliable/official APIs for automated publishing (and many require business accounts, app review, or are limited to certain content types). Therefore, implement this integration as a **capability-driven provider system** (see “Provider Architecture”), with:
- Direct API publishing where officially supported and stable.
- A first-class **manual fallback** (download card + copy caption).
- Optional integration with social management tools (e.g., Buffer/Hootsuite/Sprout) as a bridge for platforms with limited APIs.

### Priority (direct API)
- Meta: Instagram + Facebook Pages (Meta Graph API)
- X
- LinkedIn Pages (where available)
- YouTube Community posts (if supported/approved)

### Additional platforms (best-effort)
These may be supported via direct API, partner APIs, or a social management tool depending on capability and account type:
- Threads
- TikTok
- Pinterest
- Snapchat
- Reddit
- Mastodon / ActivityPub instances
- Bluesky
- Telegram Channels
- WhatsApp Channels

If a platform cannot be posted to programmatically, the Admin UX should still allow “Prepare post” (image + caption) and record “posted manually”.

## Key Constraints (Reality Check)
- **Instagram publishing requires a Business/Creator account** connected to a Facebook Page and an approved Meta app.
- Most platforms require app review, token rotation, and specific permissions/scopes.
- Rate limits apply; retries must be controlled.
- Some platforms restrict automated publishing to specific media types (e.g., video-only), or require a third-party partner program.
- Some platforms provide no official publish API; treat those as “manual/management-tool only”.

## Consent & Privacy Requirements
- Birthday posting is marketing/promotional activity.
- A member must explicitly opt in before:
  - their name and photo appear in public birthday posts, and
  - their IWFSA roles are included in public posts.
- The member portal may still show “members-only” birthdays (if opted in) without enabling social.
- Never publish the year of birth.

Additional sources:
- IWF Global member birthdays (separate directory): treat as individual personal data; require explicit consent for public posting.
- Sister organisations: generally public-facing, but confirm whether logo usage and handle-tagging is allowed before automation.

Recommended per-member settings (see data model):
- `birthdayVisibility`: `hidden` | `membersOnly` | `membersAndSocial`
- `birthdayConsentConfirmedAt`: timestamp

## Admin Workflow
### Entry Points
- From the Admin birthdays list: “Create birthday post” on a member.
- From the Admin member profile: “Birthday post settings” + “Create post”.

### Drafting
- Choose platforms (any connected providers).
- Auto-generate caption from a template.
- Auto-generate a branded image card.
- Show a live preview per platform (aspect ratio + text truncation warnings).

Post types supported:
- Person birthday (IWFSA member)
- Person birthday (IWF Global member)
- Organisation anniversary/celebration (sister organisations)

### Approval & Governance
- Recommended policy:
  - Admin can draft and schedule.
  - ChiefAdmin must approve before publishing to public channels.
- All transitions are audit logged: draft → pendingApproval → approved → scheduled/published.

### Scheduling
- Allow publish now or schedule for the member’s birthday (default: 08:00 local time).
- Support safe re-try strategy and error reporting.

### Automation: Daily Run + Approval Gate (Optional)
To reduce admin effort, the system can automate the *preparation* of posts daily, but must keep an explicit approval gate.

Recommended behavior:
- Daily at a configured time, a background job:
  - finds members with birthday = today (in configured timezone)
  - generates the branded image(s)
  - generates a draft caption from the template
  - creates a `BirthdayPost` in `pendingApproval`
  - creates an `ApprovalRequest`
- Approvers receive:
  - an in-app notification/popup to review/approve, and/or
  - an email with secure approval links

Cutoff handling:
- If not approved by the configured cutoff, do not post.
- Mark the post as “missed approval/cutoff” and notify admins (optional).

### Pre-Approval Override (Approve in Advance)
To reduce daily admin work, approvers can pre-approve upcoming posts.

Rules:
- A pre-approval is tied to an exact content snapshot (caption + rendered asset + platforms + target/date).
- At publish time, the system must re-validate:
  - consent/visibility still permits posting
  - providers are connected and credentials valid
  - the current post snapshot matches the approved snapshot
  - the celebration date still matches the intended month/day
- If validation fails, do not post; surface the item as Pending/Needs Review.

## Content: Caption Template
Captions should:
- Be warm and celebratory.
- Include a leadership/empowerment line.
- Mention member roles succinctly.
- Be editable by admins.

Example template (editable):
- "Happy Birthday, {preferredName}!\n\nThank you for the leadership you bring to IWFSA. May this year amplify your impact and inspire others to lead with courage and purpose.\n\nRoles: {roleList}\n\n#IWFSA #WomenInLeadership"

Notes:
- Use `{roleList}` as a short comma-separated list (2–4 items max; respect `isPublic`).
- If no public roles exist, omit the “Roles:” line.

### Sister Organisation: Caption Template
Organisation celebration posts have a different structure and are addressed to the organisation.

Example template (editable):
- "Happy Anniversary, {orgName}!\n\nWe celebrate your work in advancing women’s leadership and empowerment. Thank you for strengthening our shared mission across borders.\n\nWith solidarity,\nIWFSA\n\n{optionalTags}"

Notes:
- `{optionalTags}` is built from stored handles for that platform (if any) and only if `postingAllowed` is true.

## Visual Design: Branded Birthday Card
### Output
- Generate a shareable image per platform:
  - Square (1080×1080) for Instagram
  - Landscape (1200×675) for Facebook
  - Optional landscape (1600×900) for X

### Layout
- Member portrait as the hero image (tasteful crop, centered, high quality).
- Overlaid text:
  - “Happy Birthday” (or “Celebrating You”) headline
  - Member name
  - Up to 2 role labels (optional)
- IWFSA branding:
  - subtle mark/wordmark placement (bottom corner)
  - brand color gradient band or frame (not overpowering)

### Brand Tokens
If a formal palette is not yet codified, define UI tokens and map to final brand colors later:
- `--iwfsa-primary`
- `--iwfsa-secondary`
- `--iwfsa-accent`
- `--iwfsa-surface`
- `--iwfsa-text`

### Accessibility
- Provide alt text for the image when supported by the platform.
- Ensure readable contrast for overlaid text (use scrims/shadows).

### Sister Organisation: Card Variant
- Use organisation logo/mark as the focal element (if available) on a celebratory background.
- Include:
  - “Celebrating” / “Happy Anniversary” headline
  - Organisation name
  - Country/region (optional)
  - IWFSA branding (subtle)
- If no logo is available, use a neutral IWFSA-branded celebratory design.

## Technical Approach (Implementation-Agnostic)
### Provider Architecture (Recommended)
Model each platform as a provider with explicit capabilities.

Core idea:
- A single “BirthdayPost” is created once.
- Each selected platform becomes a **publish job** (per-platform attempt tracking).
- Providers declare:
  - supported media types (image, text-only, image+caption)
  - scheduling support
  - max caption length and truncation behavior
  - supported aspect ratios/sizes
  - alt-text support
  - mention/hashtag rules

Suggested abstractions:
- `SocialProvider` (interface): `validateDraft()`, `renderAssets()`, `publishNow()`, `schedule()`, `getPreview()`
- `SocialCapability` enum: `imagePost`, `textPost`, `schedule`, `altText`, `firstCommentHashtags`, etc.
- `ProviderAccount` entity: stores per-platform account connection and token metadata (rotates/refreshes as needed)

This allows “all possible platforms” without forcing a one-size-fits-all publish flow.

### Image Rendering
Preferred:
- Generate the card via an SVG/Canvas template rendered server-side to PNG.
- Store output in a `MediaAsset` store (object storage or SharePoint if appropriate).

If a provider requires a different format (e.g., video, different sizes), the provider can request additional renders.

### Publishing
- Use a background queue for scheduled publishing.
- Record per-platform publish attempts in `SocialPublishAttempt`.
- Implement idempotency to avoid duplicates.

For platforms without scheduling support, simulate scheduling via the app queue (store `scheduledForAt` and execute publish at that time).

### Credentials
- Store platform tokens/secrets in a secure secret store.
- Support token rotation without downtime.

Credential types to plan for:
- OAuth2 refresh tokens (most common)
- long-lived page/channel tokens (Meta)
- app keys/secrets + per-account tokens

Never store tokens in plaintext in the database; store references/identifiers to a secret store.

## Failure Modes & Admin UX
- If publishing fails, show:
  - platform
  - reason/error
  - suggested action (reconnect, reauthorize, retry)
- Optional: notify admins on failure.

Approval safety:
- Approval links must be single-use and short-lived.
- If an approval link is forwarded, it should not grant posting power beyond the intended approver (re-auth recommended).

## Manual Fallback
If platform APIs are not ready:
- Allow admins to download the branded image + copy caption text.
- Provide a “posted manually” toggle to record the outcome for audit/history.

## Optional: Social Management Tool Bridge
To maximize platform coverage quickly, integrate with a social management platform (Buffer/Hootsuite/Sprout/etc.) if:
- direct platform APIs are limited, or
- credential/app-review overhead is too high.

In this mode, IWFSA creates the post assets + caption and pushes a draft/scheduled item into the tool (if supported), or exports in a structured format for quick paste.
