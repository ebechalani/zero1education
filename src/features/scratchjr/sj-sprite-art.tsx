import type * as React from "react";
import type { SjGlyph } from "./sj-model";

/**
 * The sprite library, drawn as flat SVG.
 *
 * These are the two chapters' cast — TIC the cat, Eric and Lea, the frog and
 * the butterfly that grow and shrink, the duck on a clean sea — redrawn rather
 * than lifted from ScratchJr's own artwork. Emoji would render differently on
 * every machine in the school and blur on the projector; each of these is built
 * from ellipses, circles, rects and paths inside a 0 0 100 100 box, so a sprite
 * can stand on any square of the stage at any size.
 *
 * Two rules the stage depends on:
 *
 * 1. Every sprite faces RIGHT. ScratchJr turns a sprite around by mirroring the
 *    picture, so anything drawn facing left would end up flipped backwards.
 * 2. Every glyph fills the same box and sits on roughly the same ground line,
 *    so Grow and Shrink scale one sprite without shifting it off its square.
 *
 * Colours are literal hex, deliberately outside the theme tokens: a duck is
 * yellow in the dark as well as in the light. A sprite may carry its own
 * `colour` and `accent`, and then the body and the secondary parts are tinted
 * from those instead — but the parts that say what the animal *is* (the duck's
 * bill, the eyes, a child's skin) keep their own colour, so a blue duck is
 * still plainly a duck.
 */

// ── Colours that never tint ─────────────────────────────────────────────────

const INK = "#26221F";
const WHITE = "#FFFFFF";
const SKIN = "#F2C49A";
const HAIR = "#43301F";

/**
 * Mix a colour towards white (amount > 0) or black (amount < 0).
 *
 * Every glyph needs a shadow shade and a belly shade of whatever colour it has
 * been given, and a child picking "purple" for the cat should get a purple cat
 * with purple stripes rather than a purple cat with orange ones.
 */
function shade(hex: string, amount: number): string {
  const match = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hex.trim());
  if (!match) return hex;
  const raw = match[1];
  const full =
    raw.length === 3
      ? `${raw[0]}${raw[0]}${raw[1]}${raw[1]}${raw[2]}${raw[2]}`
      : raw;
  const n = parseInt(full, 16);
  const target = amount < 0 ? 0 : 255;
  const k = Math.min(1, Math.abs(amount));
  const mix = (c: number) => Math.round(c + (target - c) * k);
  const r = mix((n >> 16) & 255);
  const g = mix((n >> 8) & 255);
  const b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

/** The colours one glyph draws itself in. */
interface Tone {
  /** The main mass: the cat's coat, the butterfly's wings, a child's shirt. */
  body: string;
  /** A shadow of the body, for stripes, wings, ears and legs. */
  deep: string;
  /** A pale wash of the body, for bellies, muzzles and highlights. */
  pale: string;
  /** The secondary part: a bill, a collar, a trunk, a pair of shorts. */
  acc: string;
  /** A shadow of that, for feet and shoes. */
  accDeep: string;
}

/** What each glyph looks like when nobody has chosen a colour for it. */
const NATURAL: Record<SjGlyph, { body: string; accent: string }> = {
  cat: { body: "#F2953F", accent: "#F0929F" },
  duck: { body: "#FFD447", accent: "#F08C20" },
  fish: { body: "#4FA8D8", accent: "#2E7FAD" },
  frog: { body: "#5CBF57", accent: "#E8F2AE" },
  butterfly: { body: "#F0729B", accent: "#4E3F86" },
  boy: { body: "#3F7FD6", accent: "#3B4A66" },
  girl: { body: "#E4586F", accent: "#F5C242" },
  ball: { body: "#EE8B32", accent: "#2A1D13" },
  bird: { body: "#5FB0E8", accent: "#F2932B" },
  dog: { body: "#C98A4B", accent: "#E4564A" },
  star: { body: "#FFC24B", accent: "#E8A21C" },
  tree: { body: "#4CB86A", accent: "#8A5A2B" },
};

function tone(glyph: SjGlyph, colour?: string, accent?: string): Tone {
  const natural = NATURAL[glyph];
  const body = colour ?? natural.body;
  const acc = accent ?? natural.accent;
  return {
    body,
    deep: shade(body, -0.28),
    pale: shade(body, 0.55),
    acc,
    accDeep: shade(acc, -0.3),
  };
}

/** The five-pointed star, drawn once and reused for its highlight and outline. */
const STAR = "M50 14l11 23 25 3-18 18 4 25-22-12-22 12 4-25-18-18 25-3z";

// ── The twelve sprites ──────────────────────────────────────────────────────

const ART: Record<SjGlyph, (t: Tone) => React.ReactNode> = {
  /**
   * TIC, ScratchJr's own mascot and the character in nearly every lesson: an
   * orange tabby standing up, looking to the right, ears up and pleased.
   */
  cat: (t) => (
    <>
      <path
        d="M30 74q-18 2-14-18"
        stroke={t.deep}
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="47" cy="64" rx="21" ry="21" fill={t.body} />
      <ellipse cx="52" cy="70" rx="13" ry="14" fill={t.pale} />
      <ellipse cx="40" cy="87" rx="8" ry="5" fill={t.pale} />
      <ellipse cx="58" cy="87" rx="8" ry="5" fill={t.pale} />
      <path
        d="M30 58h11M29 67h10"
        stroke={t.deep}
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="53" cy="32" r="19" fill={t.body} />
      <path d="M41 21l1-17 13 10zM67 21l-1-17-13 10z" fill={t.deep} />
      <path d="M45 19l1-11 8 6zM63 19l-1-11-8 6z" fill={t.acc} />
      <ellipse cx="56" cy="44" rx="13" ry="8" fill={t.pale} />
      <ellipse cx="49" cy="32" rx="3.2" ry="4.2" fill={INK} />
      <ellipse cx="63" cy="32" rx="3.2" ry="4.2" fill={INK} />
      <path d="M51.5 40h9L56 45z" fill={t.acc} />
      <path
        d="M56 45q-4 5-8 1M56 45q4 5 8 1"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M68 42h16M69 47h14M38 43h-12M37 48h-11"
        stroke={t.deep}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),

  /** Swimming to the right on the clean sea of the Grade 1 lesson. */
  duck: (t) => (
    <>
      <path d="M22 56l-14-8 2 18z" fill={t.deep} />
      <path d="M40 79l-8 9h13zM54 79l-8 9h13z" fill={t.accDeep} />
      <ellipse cx="44" cy="62" rx="26" ry="18" fill={t.body} />
      <ellipse cx="66" cy="48" rx="11" ry="14" fill={t.body} />
      <circle cx="72" cy="34" r="13" fill={t.body} />
      <ellipse cx="42" cy="61" rx="14" ry="9" fill={t.pale} />
      <path
        d="M30 63q12 8 24 0"
        stroke={t.deep}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="77" cy="31" r="3" fill={INK} />
      <path d="M82 34l17 4-16 8z" fill={t.acc} />
    </>
  ),

  /** The fish that has something to say about what people drop in the sea. */
  fish: (t) => (
    <>
      <path d="M24 52l-16-14v28z" fill={t.acc} />
      <path d="M44 35q4-13 16-11-5 6-4 13z" fill={t.acc} />
      <path d="M46 68q3 10 13 10-4-6-4-11z" fill={t.acc} />
      <ellipse cx="52" cy="52" rx="28" ry="18" fill={t.body} />
      <ellipse cx="44" cy="50" rx="5" ry="4" fill={t.pale} />
      <path
        d="M64 39q-7 13 0 26"
        stroke={t.deep}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="70" cy="46" r="4.6" fill={WHITE} />
      <circle cx="71.5" cy="46" r="2.4" fill={INK} />
      <path
        d="M78 57q4 1.5 0 4.5"
        stroke={INK}
        strokeWidth="2.2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  /** Half of the Grade 1 pair that grow and shrink. Sitting, eyes on top. */
  frog: (t) => (
    <>
      <path d="M26 56c-13 6-15 20-5 25 5 3 12 1 15-4z" fill={t.deep} />
      <path d="M62 78q11 2 13 9h-15zM40 80q10 2 12 9h-14z" fill={t.deep} />
      <ellipse cx="50" cy="62" rx="27" ry="21" fill={t.body} />
      <ellipse cx="54" cy="74" rx="18" ry="10" fill={t.acc} />
      <circle cx="44" cy="40" r="10" fill={t.body} />
      <circle cx="64" cy="38" r="10" fill={t.body} />
      <circle cx="46" cy="40" r="4" fill={INK} />
      <circle cx="66" cy="38" r="4" fill={INK} />
      <path
        d="M32 56q18 14 36-2"
        stroke={INK}
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  /**
   * The other half of the pair. Drawn from above, the way a child draws one,
   * then tipped over so it flies to the right.
   */
  butterfly: (t) => (
    <g transform="translate(50 50) rotate(72) scale(.86) translate(-50 -50)">
      <ellipse cx="31" cy="38" rx="17" ry="20" fill={t.body} />
      <ellipse cx="69" cy="38" rx="17" ry="20" fill={t.body} />
      <ellipse cx="35" cy="65" rx="13" ry="14" fill={t.deep} />
      <ellipse cx="65" cy="65" rx="13" ry="14" fill={t.deep} />
      <circle cx="31" cy="36" r="6" fill={t.pale} />
      <circle cx="69" cy="36" r="6" fill={t.pale} />
      <ellipse cx="50" cy="50" rx="6" ry="25" fill={t.acc} />
      <circle cx="50" cy="22" r="7" fill={t.acc} />
      <path
        d="M54 17q7-7 12-8M46 17q-7-7-12-8"
        stroke={t.acc}
        strokeWidth="2.4"
        strokeLinecap="round"
        fill="none"
      />
    </g>
  ),

  /** Eric: short hair, shorts, and a wave of the arm as he dances. */
  boy: (t) => (
    <>
      <path
        d="M39 51l-9 16M65 51l10 14"
        stroke={SKIN}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M46 76v13M60 76v13"
        stroke={SKIN}
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <ellipse cx="48" cy="91" rx="7.5" ry="4.5" fill={t.accDeep} />
      <ellipse cx="62" cy="91" rx="7.5" ry="4.5" fill={t.accDeep} />
      <rect x="38" y="66" width="28" height="13" rx="4" fill={t.acc} />
      <rect x="37" y="45" width="30" height="26" rx="9" fill={t.body} />
      <circle cx="38" cy="32" r="3.5" fill={SKIN} />
      <circle cx="52" cy="30" r="15" fill={SKIN} />
      <path
        d="M37 29a15 15 0 0 1 30-2q-4-6-13-5-12 1-17 7z"
        fill={HAIR}
      />
      <circle cx="51" cy="30" r="2.4" fill={INK} />
      <circle cx="61" cy="30" r="2.4" fill={INK} />
      <path
        d="M51 37q5 4 10-1"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  /** Lea: long hair and a dress, so she reads as herself in black and white. */
  girl: (t) => (
    <>
      <ellipse cx="52" cy="36" rx="20" ry="22" fill={HAIR} />
      <path
        d="M41 50l-11 16M65 50l11 14"
        stroke={SKIN}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M46 76v13M60 76v13"
        stroke={SKIN}
        strokeWidth="7.5"
        strokeLinecap="round"
      />
      <ellipse cx="48" cy="91" rx="7.5" ry="4.5" fill={t.acc} />
      <ellipse cx="62" cy="91" rx="7.5" ry="4.5" fill={t.acc} />
      <path d="M40 46h25l11 30q-24 6-47 0z" fill={t.body} />
      <circle cx="53" cy="31" r="14" fill={SKIN} />
      <path
        d="M39 29a14 14 0 0 1 28-2q-6-5-15-3-8 2-13 5z"
        fill={HAIR}
      />
      <circle cx="51" cy="31" r="2.4" fill={INK} />
      <circle cx="61" cy="31" r="2.4" fill={INK} />
      <path
        d="M52 38q5 4 10-1"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  /** The basketball of the bouncing lesson: orange, with the black seams. */
  ball: (t) => (
    <>
      <circle cx="50" cy="52" r="30" fill={t.body} />
      <ellipse
        cx="39"
        cy="38"
        rx="9"
        ry="6"
        fill={t.pale}
        opacity=".45"
        transform="rotate(-28 39 38)"
      />
      <g stroke={t.acc} strokeWidth="3" strokeLinecap="round" fill="none">
        <path d="M20 52h60" />
        <path d="M50 22v60" />
        <path d="M29 31c9 12 9 30 0 42" />
        <path d="M71 31c-9 12-9 30 0 42" />
      </g>
    </>
  ),

  /** A little perching bird — short beak and a crest, so it is not the duck. */
  bird: (t) => (
    <>
      <path d="M24 54l-16-10 3 22z" fill={t.deep} />
      <path
        d="M44 75v9M56 75v9M40 85h9M52 85h9"
        stroke={t.accDeep}
        strokeWidth="3.4"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="48" cy="56" rx="25" ry="20" fill={t.body} />
      <path d="M62 22q1-11 8-14-3 7 1 12z" fill={t.deep} />
      <circle cx="70" cy="36" r="15" fill={t.body} />
      <path d="M36 52c10-8 22-5 27 4-9 8-21 6-27-4z" fill={t.deep} />
      <circle cx="76" cy="32" r="3.2" fill={INK} />
      <path d="M84 38l15 4-14 5z" fill={t.acc} />
    </>
  ),

  /** Side view, walking right, with the collar the stage can tint. */
  dog: (t) => (
    <>
      <path
        d="M22 58q-13-2-11-16"
        stroke={t.deep}
        strokeWidth="7"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 74v13M44 76v11M58 76v11M66 74v13"
        stroke={t.deep}
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <ellipse cx="46" cy="62" rx="26" ry="17" fill={t.body} />
      <path
        d="M60 52q7 7 15 5"
        stroke={t.acc}
        strokeWidth="4.5"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="72" cy="44" r="15" fill={t.body} />
      <path d="M64 32q-12-3-12 10t11 6z" fill={t.deep} />
      <ellipse cx="84" cy="50" rx="11" ry="8" fill={t.pale} />
      <circle cx="76" cy="40" r="3.2" fill={INK} />
      <ellipse cx="92" cy="46" rx="4.6" ry="3.6" fill={INK} />
      <path
        d="M86 54q4 3 8 0"
        stroke={INK}
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </>
  ),

  /** Scenery as often as sprite, so it stays plain: no face, just a star. */
  star: (t) => (
    <>
      <path d={STAR} fill={t.body} />
      <path
        d={STAR}
        fill={t.pale}
        opacity=".5"
        transform="translate(50 53) scale(.5) translate(-50 -53)"
      />
      <path
        d={STAR}
        fill="none"
        stroke={t.acc}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />
    </>
  ),

  /** The garden tree Eric and Lea dance beside. */
  tree: (t) => (
    <>
      <rect x="45" y="56" width="11" height="32" rx="4" fill={t.acc} />
      <circle cx="32" cy="53" r="15" fill={t.deep} />
      <circle cx="68" cy="53" r="15" fill={t.deep} />
      <circle cx="50" cy="42" r="23" fill={t.body} />
      <circle cx="43" cy="34" r="8" fill={t.pale} opacity=".5" />
    </>
  ),
};

/**
 * One sprite, drawn facing right.
 *
 * Decorative by itself: the stage, the chooser and the caption all name the
 * sprite in words beside it, so the picture stays out of the reading order.
 */
export function SjSpriteArt({
  glyph,
  colour,
  accent,
  className,
}: {
  glyph: SjGlyph;
  colour?: string;
  accent?: string;
  className?: string;
}): React.ReactElement {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden focusable="false">
      {ART[glyph](tone(glyph, colour, accent))}
    </svg>
  );
}

/**
 * Plain-language names.
 *
 * A child using ScratchJr may not read them, but a screen reader, a teacher's
 * answer key and the check script all need a word for each picture.
 */
export const SJ_GLYPH_LABEL: Record<SjGlyph, string> = {
  cat: "cat",
  duck: "duck",
  fish: "fish",
  frog: "frog",
  butterfly: "butterfly",
  boy: "boy",
  girl: "girl",
  ball: "basketball",
  bird: "bird",
  dog: "dog",
  star: "star",
  tree: "tree",
};
