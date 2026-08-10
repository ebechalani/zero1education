# ZERO1 Education — Platform Architecture

> **Learn • Explore • Code • Create** — From Digital Learners to Digital Creators.

This document is the source of truth for how ZERO1 is designed and built. It covers the
product architecture, roles, routing, content model, services layer, and MVP scope.
Companion documents: [DESIGN-SYSTEM.md](./DESIGN-SYSTEM.md) · [FIREBASE.md](./FIREBASE.md)

---

## 1. Product architecture

ZERO1 is **one platform with five surfaces** sharing a single design system, content
engine, and data layer:

| Surface | Audience | Purpose |
|---|---|---|
| **Public site** | Visitors, schools | Marketing, curriculum overview, demo requests |
| **Student app** | Students G0–12 | Mission-based learning, labs, passport, portfolio |
| **Teacher Hub** | Teachers | Classes, curriculum, Teach Mode, launch-to-class, analytics |
| **School Admin** | School administrators | Users, classes, licenses, school-wide reports |
| **ZERO1 Studio** | ZERO1 admin / authors | Authoring CMS, schools, licenses, publishing, system |

The core insight that drives everything: **the book provides the curriculum, ZERO1
provides the experience.** Content is *data*, never UI. Every screen renders whatever
the content engine gives it, which is what makes Grade 0–12 possible without rewriting
the product per grade.

### The engines (build once, reuse everywhere)

1. **Content engine** — lessons are trees of typed blocks (see §5). One renderer
   (`BlockRenderer`) renders any lesson for any grade. Teach Mode and Studio preview
   reuse the same renderer with different chrome.
2. **Activity engine** — one `ActivityPlayer` + per-type validators. Every interactive
   (MCQ, matching, sorting, drag-drop, fill-blank, code…) reports the same generic
   result shape: `{ activityId, attempts, score, correct, timeSpentSec }`.
3. **Lab engine** — a `LabShell` + registry. Each lab (Binary, Computer, Algorithm,
   Network, Cyber, Logic, Web, Python, Database…) is a self-contained module registered
   by ID. Lessons reference labs by ID + config; QR codes on printed books deep-link to
   the same IDs (stable route contract, §4).
4. **Progress engine** — one generic progress store (per student): stage completions,
   activity results, XP events, skill deltas, badges, streak. Dashboards, the Digital
   Passport, portfolio, and teacher analytics are all *projections* of this stream.
5. **Mission engine** — orders a lesson's stages (Discover → Learn → Try It → Lab →
   Challenge → Checkpoint → Create → Complete), gates unlocking, and awards completion.

### Age-based learning worlds

| World | Grades | UX posture |
|---|---|---|
| **ZERO1 Explorer** | 0–2 | Playful — big targets, audio, icons, minimal text |
| **ZERO1 Builder** | 3–5 | Guided — sequences, blocks, characters, adventure path |
| **ZERO1 Creator** | 6–8 | Balanced — real tools with strong scaffolding |
| **ZERO1 Innovator** | 9–12 | Professional — dense, dark-capable, IDE-like |

Worlds are a **theming + density layer**, not four codebases. Each world has an accent
hue, type scale, spacing density, and copy voice (see DESIGN-SYSTEM.md §8). The world is
derived from the student's grade and applied via a theme context on the student app shell.

---

## 2. Roles & permissions

Four roles, one `users` collection, role-based routing + Firestore rules.

| Capability | student | teacher | school_admin | zero1_admin |
|---|---|---|---|---|
| Play lessons, labs, missions | ✅ own grade | ✅ preview any | ✅ preview | ✅ |
| See own progress/passport/portfolio | ✅ | — | — | — |
| See student progress | own only | own classes | own school | all |
| Teach Mode / Launch to Class | — | ✅ | — | ✅ |
| Create assignments, grade projects | — | ✅ own classes | — | ✅ |
| Manage users/classes | — | — | own school | all schools |
| Author/publish curriculum | — | — | — | ✅ |
| Manage schools, licenses | — | — | — | ✅ |

**Tenant isolation:** every user, class, assignment, submission and progress document
carries a `schoolId`. Firestore rules deny any cross-school read/write (FIREBASE.md §4).
Curriculum content is global (published by ZERO1) and read-only for schools.

---

## 3. Routing map

```
/                         Public home            /login                Auth + demo roles
/about /curriculum        Public pages           /for-schools /books
/labs /pricing /contact   Public pages

/student                  Dashboard (Good morning, …)
/student/journey          ZERO1 Journey map (units → mission nodes)
/student/lesson/[id]      Mission player (all stages)
/student/labs             Lab gallery      /student/labs/[labId]
/student/projects         Project briefs + submissions
/student/skills           ZERO1 Digital Passport
/student/portfolio        My ZERO1 Portfolio
/student/achievements     Badges, streaks, XP history

/teacher                  Teacher Hub dashboard
/teacher/classes          My classes       /teacher/classes/[classId]
/teacher/curriculum       Grade → unit → lesson browser
/teacher/lesson/[id]      Lesson detail (objectives, guide, answer keys)
/teacher/teach/[id]       Teach Mode (projector, full-screen)
/teacher/launch/[id]      Launch to Class (live status board)
/teacher/analytics        Class analytics + skill heatmaps

/admin                    School admin (users, classes, licenses, reports)

/studio                   ZERO1 HQ dashboard (schools, licenses, publishing)
/studio/curriculum        Grades → units → lessons tree
/studio/lessons/[id]/edit Block-based Lesson Builder
/studio/schools           Multi-school management
```

### QR / deep-link contract (printed books)

Printed books carry QR codes like `zero1.education/go/g6-u2-l3-lab`. The `/go/[code]`
route resolves **stable codes** through a redirect table (content-addressable, survives
content restructuring). Codes map to `{grade, unit, lesson, target}` where target ∈
`lesson | lab | challenge | checkpoint`. Never encode document IDs in printed QR codes.

---

## 4. Services layer & demo mode

All data access goes through **service interfaces** — UI never touches Firestore
directly. Each service has two adapters:

```
services/
  content-service.ts      getUnit, getLesson, listLessons        ← bundled content (MVP) / Firestore (prod)
  progress-service.ts     recordStage, recordActivity, getSummary ← local store (MVP) / Firestore (prod)
  auth-service.ts         session, role                           ← demo session (MVP) / Firebase Auth (prod)
  classroom-service.ts    classes, rosters, live activity         ← demo data (MVP) / Firestore + RTDB (prod)
```

**Demo mode** (`NEXT_PUBLIC_ZERO1_MODE=demo`, the default until Firebase env vars are
set) uses seeded deterministic demo data and localStorage persistence. It exists so the
product can be evaluated end-to-end with zero setup, and it is cleanly removable: demo
code lives in `lib/demo/` and `content/demo/`, and every screen that shows synthetic
numbers renders a **“Demo data” chip**. Production mode swaps adapters, not screens.

---

## 5. Content architecture

See `src/types/content.ts` for the canonical schema. Shape:

```
Grade → Unit → Lesson → MissionStage[] → Block[]
```

```ts
Lesson {
  id, slug, grade, unitId, title, tagline, description,
  objectives: string[], skillIds: string[], estimatedMinutes, difficulty,
  labId?: string, stages: MissionStage[]
}
MissionStage { id, kind: 'discover'|'learn'|'tryit'|'lab'|'challenge'|'checkpoint'|'create', title, blocks: Block[] }
Block = { id, type, ...typed payload }   // text, heading, image, callout, definition,
                                         // teacherNote, tabs, accordion, diagram, question,
                                         // activity, lab, challenge, project, reflection, …
```

Rules:
- **No lorem ipsum, no hardcoded lesson JSX.** Grade 6 demo content lives in
  `src/content/curriculum/grade-6/` as typed data and renders through the engine.
- Blocks are **versioned by shape** (`type` + optional `v`) so old content renders
  after schema evolution.
- `teacherNote` blocks render only for teacher/author roles.
- Questions embed validation + hints + explanation; the ActivityPlayer owns attempt
  flow (never reveal answers before attempts).

---

## 6. Folder structure

```
src/
  app/                    Routes only — thin pages that compose features
    (marketing)/          Public site + shared marketing layout
    login/
    student/  teacher/  admin/  studio/
    go/[code]/            QR deep-link resolver
  components/
    ui/                   Button, Card, Tabs, Dialog, ProgressRing, Badge, DataTable,
                          Skeleton, EmptyState, Toast, Stat, Tooltip…
    brand/                Logo, BinaryPattern, WorldBadge, ProgressBits
    charts/               BarChart, RingChart, Heatmap, Sparkline (hand-rolled SVG)
    layout/               AppShell, Sidebar, Topbar, PageHeader
  features/               Vertical slices — each owns its components + logic
    mission/              Mission player, stage rail, BlockRenderer, block components
    activities/           ActivityPlayer + question/interaction types
    labs/                 LabShell, registry, individual labs
    passport/  portfolio/  gamification/  journey/
    analytics/  teach-mode/  launch/  studio/
  content/                Typed curriculum data + skills/badges taxonomies + demo data
  services/               Data-access interfaces + adapters
  stores/                 Zustand stores (progress, session, toasts)
  lib/                    utils, xp math, world theming, firebase/, demo/
  types/                  content.ts, user.ts, progress.ts, activity.ts
docs/                     This documentation
firestore.rules           Multi-tenant security rules
```

Principles: routes stay thin; features are vertical slices; `components/ui` is
app-agnostic; **nothing in `features/` imports demo data directly** (only via services).

---

## 7. MVP scope (this build)

Grade 6 · Unit 1 **“Inside the Digital World”** — five full mission lessons:
Computer Systems, Binary Numbers, Algorithms, Networks, Cybersecurity.

Included and functional: public site · login with demo roles · student dashboard,
journey, mission player (all 7 stage types) · 5 interactive labs (Binary, Computer
Assembly, Algorithm, Network, Cybersecurity) + Logic Lab in the gallery · activity
engine (MCQ, multi-select, true/false, matching, sorting, classification drag-drop,
fill-blank) · XP/levels/badges/streak · Digital Passport · Portfolio · Teacher Hub with
class analytics, skill heatmap, question analysis · Teach Mode · Launch-to-Class (demo
simulation) · School admin + ZERO1 Studio dashboards · Studio Lesson Builder
(block editor with reorder, edit, preview, draft/publish to local storage) ·
Firestore rules + Firebase adapters ready for production wiring.

Explicitly deferred (architecture ready): live Firestore/RTDB sync, Python/Web/DB labs
(registry slots exist), Blockly robotics, real file uploads, messaging, multi-language.

## 8. Scale & performance strategy

Server components by default; client components only for interactivity (player,
labs, editors). Curriculum ships as static data → zero reads for content in MVP; in
production it is cached per-deployment (ISR) since published curriculum changes rarely.
Progress writes are event-appends + a single summary doc per student (1 read to render
any dashboard). Analytics are pre-aggregated per class per unit (Cloud Function),
never fan-out reads over students. Pagination + composite indexes on all admin tables.
No real-time listeners outside Launch-to-Class sessions.
