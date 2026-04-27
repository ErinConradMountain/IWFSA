# 2026-04-27 Work Plan: Member-Controlled Profiles, Connected Sharing, Memorials, Honorary Members, and Unified Sign-In

This document records the work planned for 27 April 2026.

It is the canonical implementation plan for:
- unified sign-in,
- member-controlled profiles,
- social and external links,
- conference sharing and memory,
- honorary members,
- memorial entries.

This plan should guide implementation and related documentation changes.

Central direction:

**Members control their own visible identity; admins govern public presentation; the application protects privacy while allowing dignified public storytelling.**

This plan must stay aligned with:
- `docs/product-requirements.md`
- `docs/roadmap.md`
- `docs/privacy-baseline.md`
- `docs/rbac-permissions.md`
- `docs/ux-notes.md`
- `docs/User-dictionary.md`
- `docs/data-model.md`
- `docs/build-playbook.md`
- `AGENT.md`

## 1) Implementation Purpose

The application should be extended to support five related areas.

### 1.1 Unified sign-in
- Remove separate `Admin Sign in` and `Member Sign in` entry points.
- Use one `Sign in` entry point.
- Route users after login according to their authenticated role.

### 1.2 Member-controlled profiles
- Allow members to shape what other members can see.
- Allow members to decide which profile details remain private, admin-visible, member-visible, submitted for public review, or publicly approved.

### 1.3 Social and external links
- Allow members to add LinkedIn, Instagram, Facebook, websites, publications, podcasts, and other external links.
- Each link must carry its own visibility setting and public-review status.

### 1.4 Conference sharing and memory
- Allow members attending conferences to post feedback, reflections, links, and externally hosted media in a thread.
- Build toward an internal `Conference Memory` space.

### 1.5 Honorary Members and Memorial sections
- Create dignified, beautiful sections for Honorary Members and members who have passed away.
- These sections should carry a strong South African visual identity and remain admin-controlled.

## 2) App Area Breakdown

## Public Surface

Public-facing pages should show only approved content.

Add or prepare:
- Honorary Members section.
- Memorial section.
- Optional public member profile highlights.
- Public-facing social links only where the member has consented.
- South African visual design details, including careful use of flag colours or a flag motif.

Public pages must not reveal:
- private member activity,
- internal conference threads,
- hidden links,
- member-only profile details.

## Member Surface

The member portal should become the member's identity-control space.

Add or prepare:
- `My Profile`
- `Profile Visibility`
- `Social Links`
- `Conference Contributions`
- `Shared Profile Preview`

The member-facing guidance should use wording close to:

> You control what other members can see on your profile. Public display only happens when you choose to share and the content is approved.

## Admin Surface

The admin area should govern public presentation and institutional memory.

Add or prepare:
- Honorary Members management.
- Memorial entries management.
- Public profile review queue.
- Conference memory review tools.
- Audit visibility for sensitive changes.
- Ability to approve, hide, revise, or archive public-facing entries.

Admins should be treated as stewards, not silent owners of member identity.

## 3) Documentation Changes Required

Before implementation, update the documentation so the feature is not treated as an isolated patch.

## Product Requirements

Update product requirements to include:
- unified sign-in,
- member-controlled profiles,
- social links,
- public profile consent,
- conference sharing,
- honorary member section,
- memorial section,
- admin review process.

## Roadmap

Add the following phased items.

### Phase 1: Unified sign-in and member profile foundation
One login flow, role-based routing, and a basic editable member profile.

### Phase 2: Social links and visibility controls
Manual external links with visibility settings.

### Phase 3: Conference sharing
Member conference feedback threads with external links and embedded references.

### Phase 4: Public storytelling workflow
Members submit selected profile elements for public display; admins review.

### Phase 5: Honorary and Memorial sections
Admin-managed public sections with South African design language.

## Privacy Baseline

Add clear privacy principles:
- member profile information is private by default,
- the member chooses visibility,
- public display requires consent,
- admin review is required for public publication,
- internal conference discussion remains member-only unless explicitly approved,
- external links should not be auto-published.

## RBAC Permissions

Clarify permissions:

| Role | Capability |
|------|------------|
| Member | Edit own profile, add links, set visibility, post conference reflections |
| Admin | Review public submissions, manage honorary and memorial entries |
| Chief Admin | Full governance, role oversight, audit review |
| Event Editor | May support conference or event content if explicitly permitted |

## UX Notes

Document the desired experience as:
- calm,
- dignified,
- professional,
- South African,
- member-controlled,
- simple enough for non-technical users.

## User Dictionary

Add plain-language entries for:
- Profile visibility
- Public profile
- Social link
- Memorial section
- Honorary member
- Conference memory
- Admin review

## 4) Technical Change Plan

Implement the smallest complete slice first, then extend.

### Step 1: Simplify Sign-In

Requirement:
- There should be one sign-in page only.
- Remove wording such as `Admin Sign in` and `Member Sign in`.
- Replace it with `Sign in`.

After login, the backend should determine the authenticated role and route accordingly:
- `chief_admin` -> `/admin`
- `admin` -> `/admin`
- `event_editor` -> `/admin` or a relevant event-management area if that surface already exists
- `member` -> `/member`

Expected result:
- The user does not choose a role manually.
- The system determines the role after authentication.

### Step 2: Add Member Profile Management

Requirement:
- Members should be able to edit their own profile.

Profile fields may include:
- display name,
- title,
- organisation,
- short biography,
- professional sector,
- expertise,
- interests,
- optional contact details,
- profile image link,
- public-facing biography,
- member-facing biography.

Visibility controls for each major field should support:
- `private`,
- `visible_to_admins`,
- `visible_to_members`,
- `submitted_for_public_review`,
- `public_approved`.

Expected result:
- A member can build her profile gradually: some details remain private, some are shared with members, and some are prepared for the public surface.

### Step 3: Add Social and External Links

Requirement:
- Members should be able to add manual links first.

Supported link types:
- LinkedIn,
- Instagram,
- Facebook,
- X or Twitter,
- YouTube,
- personal website,
- organisation website,
- publication,
- podcast,
- article,
- other.

Each link should include:
- platform name,
- URL,
- short description,
- visibility setting,
- public-review status.

Privacy rule:
- Links should be hidden by default until the member chooses otherwise.

Expected result:
- Members can connect their professional presence without the application storing heavy content or pulling live feeds.

### Step 4: Add Conference Feedback Threads

Requirement:
- Members attending a conference should be able to share feedback in a thread.

A thread entry may include:
- reflection,
- lesson learned,
- useful link,
- external image link,
- external document link,
- session attended,
- speaker or panel reference,
- suggested follow-up action.

Media handling for the first version:
- Do not store large media files.
- Allow external links to cloud-hosted images, event websites, LinkedIn posts, shared documents, videos, and articles.
- Display them as safe clickable cards or previews only where practical.

Privacy rule:
- Conference threads are member-only by default.
- Public use of any contribution requires member consent and admin approval.

### Step 5: Add Honorary Members Section

Requirement:
- Create an admin-managed section for Honorary Members.

Each honorary member entry may include:
- name,
- title,
- short biography,
- reason for recognition,
- year recognised,
- image link,
- public display status,
- display order.

Public design should feel ceremonial and South African, using cues such as:
- a restrained South African flag accent band,
- warm gold and green highlights,
- dignified card layout,
- portrait space,
- short tribute text,
- a `Recognised for...` field.

Admin control:
- Only admins and chief admins should create or update these entries.

### Step 6: Add Memorial Section

Requirement:
- Create an admin-managed Memorial section for members who have passed away.

Each memorial entry may include:
- name,
- dates where appropriate,
- short tribute,
- role or contribution to IWFSA,
- image link,
- family-approved wording where required,
- public display status,
- display order.

Tone:
- The section should be quiet, respectful, and beautiful.
- It should not feel like a database listing.
- It should feel like an institutional remembrance wall.

Suggested public wording:

> In memory of members whose lives, leadership, and service remain part of the story of IWFSA.

Privacy and consent:
- Admin should publish only details that are appropriate, confirmed, and approved under IWFSA governance practice.

## 5) Data and Permission Principles

Treat this feature set as sensitive member data.

Important rules:
- Member-created profile data is private by default.
- Public display requires member action and admin approval.
- Admin-created honorary and memorial entries require admin-only editing.
- Conference threads are member-only unless reviewed and approved for public storytelling.
- External links should be validated.
- Public pages must never expose hidden profile fields.
- Sensitive admin changes should be audit logged.

## 6) Suggested Smallest Useful Version

Do not attempt automatic social feed pulling in the first implementation.

Build this first:
1. One sign-in page with role-based routing.
2. Member profile editing.
3. Manual social links.
4. Basic visibility settings.
5. Admin-managed Honorary Members.
6. Admin-managed Memorial section.
7. Public display only for approved honorary and memorial entries.
8. Member-only conference feedback thread using text and external links.

This creates a strong foundation without overbuilding.

## 7) Future Extensions

After the first version works, consider:
- public profile preview before submission,
- admin public-profile review queue,
- conference memory wall,
- member achievement highlights,
- automatic social feed connection behind feature flags,
- member-selected import from LinkedIn or Instagram,
- image thumbnail previews from external URLs,
- public storytelling cards,
- annual IWFSA memory archive,
- searchable member expertise directory.

Automatic social feeds should come later, only after the consent model is strong.

## 8) Suggested Development Instruction

Use the following instruction block when turning this plan into code work:

```text
You are working on the IWFSA governance-aware web platform.

Implement a phased foundation for member-controlled profiles, connected sharing, honorary members, memorial entries, and unified sign-in.

Purpose:
Create one sign-in experience, then route users according to their authenticated role. Add member-controlled profile editing, manual social/external links with visibility settings, member-only conference feedback threads, and admin-managed Honorary Members and Memorial sections.

App areas:
- Public Surface: display only approved Honorary Members, Memorial entries, and future approved public profile content.
- Member Surface: allow members to manage their own profile, social links, visibility settings, and conference contributions.
- Admin Surface: allow admins to manage Honorary Members, Memorial entries, public review, and governance controls.

Privacy and permissions:
- Member profile fields are private by default.
- Members control what is visible to other members.
- Public display requires explicit member consent and admin approval.
- Admins may manage Honorary and Memorial sections.
- Public pages must not leak hidden profile fields, internal conference threads, or member-only activity.
- Sensitive admin actions should be audit logged.

Smallest useful version:
1. Replace separate admin/member sign-in wording with a single Sign in flow.
2. Route authenticated users by role after login.
3. Add member profile editing for the logged-in member.
4. Add manual social/external links with visibility settings.
5. Add member-only conference feedback threads with text and external URLs.
6. Add admin-managed Honorary Members entries.
7. Add admin-managed Memorial entries.
8. Show only approved Honorary and Memorial entries publicly.

Documentation:
Update the relevant product requirements, roadmap, privacy baseline, RBAC permissions, UX notes, data model, and user dictionary so the feature is properly recorded.

Implementation guidance:
Use the existing project architecture and patterns. Do not introduce a new framework or parallel system. Add the smallest complete slice, test role permissions, test public data leakage protections, and preserve the existing public, member, and admin surfaces.

Validation:
Run the project's normal lint, typecheck, test, and build checks.
```

## 9) Guiding Principle

This feature should make the IWFSA application feel like a trusted house of memory: members open their own doors, admins guard the public threshold, and the organisation remembers with dignity.