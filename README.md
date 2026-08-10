# ZERO1 Education

**Learn • Explore • Code • Create** — *From Digital Learners to Digital Creators.*

An interactive ICT & Computer Science learning ecosystem for **Grade 0 through Grade 12**.
Not an online textbook: students learn through missions, simulations, coding, challenges
and projects, while teachers get classroom presentation tools and real analytics.

---

## Quick start

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:3000 and click **Log in**. No Firebase setup is required —
the app ships in **demo mode** with four sample identities:

| Role | Demo user | Lands on |
|---|---|---|
| Student | Maya Haddad (Grade 6) | `/student` |
| Teacher | Rana Khoury | `/teacher` |
| School Administrator | Nadine Chami | `/admin` |
| ZERO1 Admin / Author | Eddy Bachaalany | `/studio` |

Demo progress persists in `localStorage`. Clear site data to reset a student.

## What's in this build

**Student** — dashboard, ZERO1 Journey map, the mission player (Discover → Learn →
Try It → Lab → Challenge → Checkpoint → Create), ZERO1 Digital Passport, portfolio,
achievements, projects.

**ZERO1 Labs (6 live)** — Binary switchboard, Build-a-Computer, Algorithm rover maze,
Network builder with live validation, Cyber phishing inbox, Logic gate playground.
Web / Python / Database labs are registered slots, in development.

**Teacher Hub** — dashboard with actionable warnings, class roster with per-student
drill-down, analytics (topic mastery, hardest questions, student × topic heatmap),
curriculum browser, lesson kits with answer keys, **Teach Mode** (projector presenter
with timer, reveal controls and teacher notes), **Launch to Class** (live status board).

**School Admin** — school overview, people, classes, licenses & reports.

**ZERO1 Studio** — HQ dashboard with the print→interactive conversion pipeline,
full G0–12 curriculum tree, and the **block-based Lesson Builder** (drag to reorder,
per-block inspector, student/teacher preview, draft, publish, version history).

**Curriculum** — the real ZERO1 scope. All ~60 units from the printed 2023 edition are
catalogued across G0–12. Grade 6 **“Inside the Digital World”** is fully authored as five
interactive missions: Computer Systems · Binary Numbers · Algorithms · Networks ·
Cybersecurity.

## Architecture

Read these before changing anything structural:

- [docs/SETUP.md](docs/SETUP.md) — connect Firebase and publish, step by step
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — product & content architecture, engines, routing, folders
- [docs/DESIGN-SYSTEM.md](docs/DESIGN-SYSTEM.md) — brand, color, type, motion, component inventory
- [docs/FIREBASE.md](docs/FIREBASE.md) — Firestore model, security rules, production wiring

The load-bearing idea: **curriculum is data, never UI.** Lessons are trees of typed
blocks (`src/types/content.ts`). One `BlockRenderer` powers the student player, Teach
Mode and Studio preview. One `ActivityPlayer` handles every interaction type. One
`LabShell` + registry hosts every lab. That is what makes 13 grade levels tractable.

```
src/
  app/          routes (thin) — (marketing) · login · student · teacher · admin · studio · go
  components/   ui · brand · charts · layout
  features/     mission · activities · labs · studio · illustrations
  content/      curriculum (real G0–12 catalog + Grade 6 missions) · skills · badges · demo
  services/     data-access interfaces + demo/Firestore adapters
  stores/       zustand: progress · session · studio
  lib/          utils · xp · worlds · gamification · firebase
  types/        content · user · progress
```

## Going live with Firebase

> **New here? Follow [docs/SETUP.md](docs/SETUP.md)** — the click-by-click walkthrough for
> connecting Firebase and publishing the site. The summary below is the short version.

The app runs on Firebase the moment it's configured — auth, Firestore reads and progress
writes all switch adapters automatically. Nothing in the UI changes.

**1. Create the project.** In the [Firebase console](https://console.firebase.google.com):
new project → enable **Authentication** (Email/Password), **Cloud Firestore**, **Storage**.

**2. Point the app at it.**

```bash
cp .env.example .env.local
```

Fill the `NEXT_PUBLIC_FIREBASE_*` values from *Project settings → Your apps → Web app*,
and set `NEXT_PUBLIC_ZERO1_MODE=live`. (Live mode only activates when the mode is `live`
**and** the required keys are present — a half-filled file safely stays in demo mode.)

**3. Deploy the security rules and indexes.**

```bash
npm run firebase:deploy
```

**4. Add admin credentials for the seed scripts.** *Project settings → Service accounts →
Generate new private key*, saved as `service-account.json` in the repo root (gitignored).

**5. Seed the curriculum** — all units, lessons, skills, badges and QR codes:

```bash
npm run seed:curriculum
```

**6. Seed a school** — creates the school, a class, a teacher, an admin and 24 students:

```bash
npm run seed:school
```

**7. Make yourself a ZERO1 admin** (after creating your own account in the console):

```bash
npm run set-claims -- you@zero1.education zero1_admin zero1-hq
```

Roles come from **custom claims**, not from profile documents, so a tampered client can
never escalate — the same token the rules read is the one the app trusts.

### What still needs Cloud Functions

XP, levels, streaks, skill mastery and badges are deliberately **not** client-writable —
the rules reject those fields. The client writes `progress/{uid}_{lessonId}` documents and
append-only `progressEvents`; an `onProgressEvent` function aggregates them into
`studentSummaries`, `studentSkills` and `classAnalytics`. Until you deploy it, live mode
records progress correctly but the aggregate dashboards read zero. See
[docs/FIREBASE.md](docs/FIREBASE.md) §7.

Demo code is isolated in `src/content/demo/` and the demo service adapters, so it can be
removed without touching any screen. Every screen showing synthetic numbers renders a
**Demo data** chip — no fake statistic is ever presented as real.

## Printed book integration

QR codes in the printed books resolve through `/go/[code]` — short, stable, human-typable
codes that never contain document IDs, so reprints keep working after content changes.
Manage them in Studio → QR Codes.

## Scripts

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run lint
```

```bash
npm run typecheck
```

Firebase CLI scripts (need `service-account.json`): `seed:curriculum`, `seed:school`,
`set-claims`, `firebase:deploy`.

## Tech

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 ·
Zustand · dnd-kit · lucide-react · Firebase · deploys to Vercel.
