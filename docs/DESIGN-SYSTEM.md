# ZERO1 Design System

The visual identity of ZERO1 Education. The brand represents the digital world —
binary, logic, computing, creation — expressed through a **0/1 motif** that appears
structurally (never as decoration spam) across the product.

---

## 1. Identity

- **Wordmark:** `ZERØ1` — set in Space Grotesk with a **slashed zero** (the engineer's
  zero) and the `1` in the world/brand accent. Rendered as an SVG component
  (`components/brand/logo.tsx`), never as plain text.
- **The bit is the atom of the brand.** Progress bars are 8-segment "bit bars"
  (`ProgressBits`). Levels show a binary easter egg (Level 5 → `101₂`). Backgrounds in
  heroes/empty states use a faint generated 0/1 field (`BinaryPattern`). Checkpoint
  results show score as bits filled.
- **Voice:** confident, modern, precise. Playful for Explorer/Builder copy, technical
  and respectful for Creator/Innovator. Never babyish, never corporate-bland.

## 2. Color

Defined as Tailwind v4 `@theme` tokens in `globals.css`. Core families:

| Token | Hex | Use |
|---|---|---|
| `ink-950…600` | `#070B14 → #3C465E` | Dark surfaces, sidebar, Teach Mode, hero |
| `paper` | `#F6F7FB` | App background (light) |
| `brand-500/600/700` | `#3D63FF / #2B4FE0 / #1F3DB8` | Primary actions, links, focus |
| `signal-400/500` | `#22D3EE / #0BC5DB` | Highlights, live states, "bits" |
| `bit-400/500` | `#FFC24B / #FFB020` | XP, achievements, streaks |
| `mint-500` | `#10B981` | Success, mastery |
| `coral-500` | `#F43F5E` | Errors, danger |
| `amber-500` | `#F59E0B` | Warnings, "needs help" |

**World accents** (theme layer on the student app):

| World | Grades | Accent | Feel |
|---|---|---|---|
| Explorer | 0–2 | `#FF6B4A` coral | warm, friendly |
| Builder | 3–5 | `#10B981` emerald | constructive |
| Creator | 6–8 | `#0BC5DB` cyan | inventive |
| Innovator | 9–12 | `#8B5CF6` violet | professional |

Rules: dark ink + one accent per screen region; gradients only in hero/celebration
moments (2 stops, brand→signal); charts use the categorical ramp
`brand-500, signal-500, bit-500, mint-500, violet, coral` with 3:1 minimum contrast.

## 3. Typography

| Role | Font | Notes |
|---|---|---|
| Display / headings | **Space Grotesk** | Geometric, techy; distinctive zero |
| UI / body | **Inter** | Clean, international |
| Code / data / binary | **JetBrains Mono** | Labs, editors, stats, XP numbers |

Scale (rem): 12 / 13.5 / 15 (body) / 17 / 20 / 24 / 30 / 38 / 48. Line-height 1.5 body,
1.15 display. Explorer world raises base size ~15%, Innovator tightens to 14px base in
dense views. Numbers in stats are always mono with `font-variant-numeric: tabular-nums`.

## 4. Space, radius, elevation

- Spacing on a 4px grid; page gutters 16/24/32 (sm/md/lg); section rhythm 48–64.
- Radius: **8px controls, 12px cards, 16px only for hero/celebration surfaces, full for
  pills/avatars.** Not everything is a rounded card — tables, rails, and dense lists sit
  flush on the surface with hairline dividers (`ink-100`).
- Elevation: hairline border + `shadow-sm` at rest; `shadow-md` on pop-overs; one
  brand-tinted glow reserved for the active mission card and primary CTA.

## 5. Iconography & illustration

- Icons: **lucide** at 1.5px stroke, 16/20/24 sizes, `currentColor`.
- Illustrations: inline SVG built from the design tokens (device diagrams, network
  nodes, robot). Flat with hairline strokes + accent fills; no stock 3D blobs.
- Each lab has a glyph badge (chip icon, 0/1 toggle, flow arrows, nodes, shield).

## 6. Motion

- 150ms ease-out for hover/press; 250–350ms for panel/stage transitions;
  spring only for celebration (mission complete, badge unlock).
- Mission stage transitions slide horizontally (forward = left) reinforcing the path.
- Respect `prefers-reduced-motion`: fades only.
- Skeletons shimmer; numbers count up once (600ms) on dashboard mount.

## 7. Components (inventory)

`ui/`: Button (primary / secondary / ghost / danger / world-accent), Card, Stat,
Tabs, Dialog, Dropdown, Tooltip, Toast, Badge, Chip, Avatar, ProgressRing,
ProgressBits, DataTable, EmptyState, Skeleton, Breadcrumb, CommandRail.
`brand/`: Logo, BinaryPattern, WorldBadge, DemoChip.
`charts/`: BarChart, RingChart, Heatmap, Sparkline — hand-rolled SVG, token colors.
Feature components (MissionCard, LessonCard, SkillCard, ActivityPlayer,
QuestionRenderer, LabShell, StudentStatus…) live inside their feature slice.

## 8. World-aware UX rules

Same components, different **posture** via the world theme context:

| Dimension | Explorer | Builder | Creator | Innovator |
|---|---|---|---|---|
| Type base | 17px | 16px | 15px | 14px |
| Density | very airy | airy | balanced | dense |
| Buttons | XL, iconic | large | default | compact |
| Journey map | adventure path | trail + characters | node map | skill tree |
| Celebration | big + audio | big | measured | subtle |
| Reading load | minimal | low | normal | full |

## 9. States & accessibility

- Every async view has skeleton, error (helpful message + retry), and a designed empty
  state (BinaryPattern + one-line guidance + primary action).
- Toasts: bottom-right, aria-live polite, 4s, max 3 stacked.
- Keyboard: full tab order, visible 2px `brand-500` focus ring, Esc closes layers,
  arrow keys drive Teach Mode and sortable activities (dnd-kit keyboard sensor).
- Contrast ≥ 4.5:1 text, ≥ 3:1 UI. Hit targets ≥ 44px (≥ 56px in Explorer).
- All activity feedback is color + icon + text (never color alone).

## 10. Anti-goals

No generic AI-site look: no giant purple gradient heroes inside the app, no endless
identical rounded cards, no emoji-as-design-system, no fake 5-star social proof, no
dead space in work views. Dashboards are **dense enough to be useful, calm enough to
be easy** — that balance is the design bar.
