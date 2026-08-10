# ZERO1 — Firebase Architecture & Security

Firestore data model, multi-tenant security strategy, and production wiring guide.
The MVP runs in **demo mode** (no Firebase required); this document is the contract
the production adapters implement.

---

## 1. Collection design

**Flat top-level collections with foreign-key IDs** (not deep nesting). Flat
collections keep collection-group queries simple, make security rules uniform, and
avoid the "can't query across parents" trap. Nesting is used in exactly two places
where data is truly parent-owned: `submissions` under assignments, and `versions`
under lessons.

```
users/{uid}                    role, schoolId, classIds[], grade, profile…
schools/{schoolId}             name, plan, seats, branding, status
classes/{classId}              schoolId, teacherIds[], studentIds[], grade, name
licenses/{licenseId}           schoolId, plan, seats, validFrom/To

── Curriculum (global, authored by ZERO1, read-only for schools) ──
grades/{gradeId}               world, title, order
units/{unitId}                 gradeId, title, order, summary, skillIds[]
lessons/{lessonId}             unitId, gradeId, meta + stages[] (block tree), status
lessons/{id}/versions/{v}      immutable published snapshots (rollback, audit)
labs/{labId}                   type, config, gradeRange
questionBank/{questionId}      type, payload, skillIds[], difficulty
skills/{skillId}               category, title, world descriptors
badges/{badgeId}               rule, icon, tier
qrCodes/{code}                 → {grade, unit, lesson, target}  (stable printed links)

── Learning data (tenant-scoped: every doc carries schoolId) ──
progress/{uid_lessonId}        stageStates, activityResults, score, mastery, timeSpent
progressEvents/{eventId}       append-only: {uid, schoolId, type, xp, skillDeltas, ts}
studentSkills/{uid}            skillId → {level 0-100, trend}  (one doc per student)
studentSummaries/{uid}         xp, level, streak, missionsDone, badges[] (1-read dashboard)
assignments/{assignmentId}     schoolId, classId, lessonId/activityId, due, settings
assignments/{id}/submissions/{uid}   files/links/text, status, grade, feedback
liveSessions/{sessionId}       Launch-to-Class: classId, activityId, per-student status
portfolios/{uid}               curated artifacts[] {gradeYear, title, type, ref}
notifications/{notifId}        uid, schoolId, kind, payload, readAt
classAnalytics/{classId_unitId} aggregated mastery, question stats (function-maintained)
```

### Why this shape scales

- **Dashboards are O(1):** `studentSummaries` + `studentSkills` are maintained by a
  Cloud Function on `progressEvents` writes — rendering any dashboard costs 1–2 reads
  regardless of history size.
- **Teacher analytics are O(1):** `classAnalytics` docs are pre-aggregated on progress
  writes (fan-in), never computed by fanning out reads over 30 students at render time.
- **Curriculum is cacheable:** published lessons change rarely; clients fetch via ISR /
  CDN-cached server components, so 10,000 students do not generate 10,000 lesson reads.
- **Append-only events** make XP/streak/mastery recomputable and auditable.

### Composite indexes (firestore.indexes.json)

- `progress`: (schoolId, classId, lessonId) · (uid, updatedAt desc)
- `assignments`: (classId, dueAt) · (schoolId, status, dueAt)
- `progressEvents`: (schoolId, ts desc) · (uid, ts desc)
- `users`: (schoolId, role, lastName)

## 2. Identity & auth

Firebase Auth (email/password + Google for staff; school-provisioned accounts for
students). On user creation a Cloud Function stamps **custom claims**:
`{ role, schoolId }`. Claims — not client data — drive security rules, so a tampered
client can never escalate. Role changes re-stamp claims and revoke tokens.

## 3. Route protection (app layer)

- Middleware verifies the session cookie (Firebase session cookies, httpOnly) and
  redirects unauthenticated users off `/student|/teacher|/admin|/studio`.
- Each role layout re-checks `role` server-side; UI hides what rules would deny anyway.
  **The client is never trusted** — rules are the real boundary.

## 4. Security rules strategy (firestore.rules in repo root)

```
function signedIn()        request.auth != null
function claims()          request.auth.token
function inSchool(id)      claims().schoolId == id
function hasRole(r)        claims().role == r
```

- `users`: read self; teachers read users of their classes; school_admin reads/writes
  only `inSchool(resource.data.schoolId)`; zero1_admin full.
- Curriculum collections: `read: signedIn()` **only `status == 'published'`** unless
  zero1_admin; `write: hasRole('zero1_admin')`.
- `progress*`, `studentSkills`, `studentSummaries`: students read/write **own uid docs
  only** (and writes validated: no self-granted XP fields — XP is function-computed);
  teachers read docs whose `classId` ∈ their classes; school_admin reads own school.
- `assignments`/`submissions`: teacher owns class-scoped writes; students write only
  their own submission before `lockedAt`.
- `liveSessions`: teacher of the class writes; students update only
  `participants.{own uid}`.
- **Every tenant-scoped rule starts with `inSchool()`** — cross-school access is
  impossible even for school admins.

## 5. Storage & uploads

Bucket paths `schools/{schoolId}/submissions/{uid}/{assignmentId}/…`. Rules mirror
Firestore tenant checks. Uploads: allow-list MIME types, 25MB cap, filenames replaced
with generated IDs (original name stored as metadata), image submissions re-encoded by
a Function (strips EXIF). Download URLs are short-lived signed URLs.

## 6. Abuse & privacy

- Rate limiting on auth + submission endpoints (Functions + per-uid counters).
- No third-party trackers in student surfaces; analytics are first-party counts only.
- Children's privacy: no public profiles by default; portfolio showcase is opt-in and
  school-approved; no student emails exposed to other students.

## 7. Going to production (wiring checklist)

Steps 1–6 are implemented in the repo today; step 7 is the remaining server work.

1. **Project** — create it, enable Auth (Email/Password), Firestore and Storage. ✅
2. **Config** — `cp .env.example .env.local`, fill `NEXT_PUBLIC_FIREBASE_*`, set
   `NEXT_PUBLIC_ZERO1_MODE=live`. `isLiveMode()` requires both the flag and the keys, so
   a partial config degrades to demo instead of crashing. ✅
3. **Rules & indexes** — `npm run firebase:deploy`. ✅
4. **Adapters** — `src/services/*` ship both adapters behind one interface and select on
   `isLiveMode()`:
   - `auth-service.ts` — `signInWithEmailAndPassword`, role/schoolId from **custom
     claims**, profile from `users/{uid}`, child-safe error messages.
   - `progress-service.ts` — writes `progress/{uid}_{lessonId}` (merged) plus append-only
     `progressEvents`; reads `studentSummaries/{uid}`.
   - `content-service.ts` / `classroom-service.ts` — bundled + demo adapters.
   The progress store mirrors every local mutation through the service; sync failures are
   logged, never surfaced, so a dropped write can't interrupt a lesson. ✅
5. **Seeding** — `npm run seed:curriculum` (units, lessons, skills, badges, QR codes, plus
   an immutable `versions` snapshot per published lesson) and `npm run seed:school`
   (school, license, class, teacher, admin, 24 students). ✅
6. **Claims** — `npm run set-claims -- <email> <role> <schoolId>` stamps claims and
   revokes existing tokens. ✅
7. **Cloud Functions** — the remaining piece:
   - `stampClaims` — set claims automatically on user creation.
   - `onProgressEvent` — the important one: consume `progressEvents` and maintain
     `studentSummaries` (xp, level, streak), `studentSkills` and earned `badges`. The
     rules deliberately forbid clients from writing these fields, so **until this
     function is deployed, live-mode dashboards read zero** even though progress is
     recorded correctly.
   - `aggregateClassAnalytics` — fan-in to `classAnalytics/{classId}_{unitId}`.
8. **Deploy** — Vercel, with the same env vars set in the project.

### Why aggregates are server-side

If the client could write `xp`, any student could grant themselves a level. Keeping XP,
mastery and badges function-computed is what makes the gamification trustworthy — and it
is also what keeps dashboards O(1): one summary document per student instead of replaying
a full event history on every page load.
