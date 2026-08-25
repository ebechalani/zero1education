import {
  SJ_BLOCK_CATEGORY,
  SJ_CATEGORIES,
  type SjBlockKind,
  type SjSpeed,
  type SjTriggerKind,
} from "./sj-model";

/**
 * The block pictures.
 *
 * ScratchJr's blocks carry no words at all — a six-year-old who cannot read
 * still has to tell Move Right from Hop at a glance — so each is a single
 * white pictogram on its category colour, drawn in a 24×24 box. They are
 * redrawn here rather than copied: they must print, project and scale, and the
 * shapes are the vocabulary of two whole chapters.
 */

export type SjArtKind = SjBlockKind | SjTriggerKind;

const S = {
  fill: "#fff",
  stroke: "#fff",
  width: 2.4,
  cap: "round" as const,
  join: "round" as const,
};

/** An arrow along the x axis; negative length points left. */
const Arrow = ({ dx }: { dx: number }) => (
  <g
    stroke={S.stroke}
    strokeWidth={S.width}
    strokeLinecap={S.cap}
    strokeLinejoin={S.join}
    fill="none"
  >
    <path d={`M${12 - dx / 2} 12 H${12 + dx / 2}`} />
    <path
      d={
        dx > 0
          ? `M${12 + dx / 2 - 4} 8 L${12 + dx / 2} 12 L${12 + dx / 2 - 4} 16`
          : `M${12 + dx / 2 + 4} 8 L${12 + dx / 2} 12 L${12 + dx / 2 + 4} 16`
      }
    />
  </g>
);

/** An arrow along the y axis; negative length points up. */
const ArrowY = ({ dy }: { dy: number }) => (
  <g
    stroke={S.stroke}
    strokeWidth={S.width}
    strokeLinecap={S.cap}
    strokeLinejoin={S.join}
    fill="none"
  >
    <path d={`M12 ${12 - dy / 2} V${12 + dy / 2}`} />
    <path
      d={
        dy > 0
          ? `M8 ${12 + dy / 2 - 4} L12 ${12 + dy / 2} L16 ${12 + dy / 2 - 4}`
          : `M8 ${12 + dy / 2 + 4} L12 ${12 + dy / 2} L16 ${12 + dy / 2 + 4}`
      }
    />
  </g>
);

/** A curved arrow, used for both turns and both repeats. */
const Curl = ({ way }: { way: 1 | -1 }) => (
  <g
    stroke={S.stroke}
    strokeWidth={S.width}
    strokeLinecap={S.cap}
    strokeLinejoin={S.join}
    fill="none"
    transform={way === -1 ? "scale(-1,1) translate(-24,0)" : undefined}
  >
    <path d="M5.5 13a6.5 6.5 0 1 1 6.5 6.5" />
    <path d="M8.5 9.5 L5.5 13 L2.5 9.5" />
  </g>
);

const ART: Record<SjArtKind, React.ReactNode> = {
  // ── Triggers ──────────────────────────────────────────────────────────────
  "on-flag": (
    <g fill={S.fill}>
      <rect x="5" y="3" width="2.2" height="18" rx="1.1" />
      <path d="M8 4.5c3.5-1.6 6.5 1.6 10 0v7.5c-3.5 1.6-6.5-1.6-10 0z" />
    </g>
  ),
  "on-tap": (
    <g fill="none" stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join}>
      <path d="M10 12.5V6a1.8 1.8 0 0 1 3.6 0v6" />
      <path d="M13.6 10.5a1.6 1.6 0 0 1 3.2 0v2" />
      <path d="M16.8 11.5a1.6 1.6 0 0 1 3.2 0v3.5a5.5 5.5 0 0 1-5.5 5.5h-1.6a5 5 0 0 1-4-2l-2.4-3.2a1.7 1.7 0 0 1 2.6-2.1L10 15" />
    </g>
  ),
  "on-bump": (
    <g stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join} fill="none">
      <circle cx="8" cy="12" r="4" fill={S.fill} stroke="none" />
      <rect x="16" y="4.5" width="3" height="15" rx="1.5" fill={S.fill} stroke="none" />
      <path d="M13 8.5 L14.5 12 L13 15.5" />
    </g>
  ),

  // ── Motion ────────────────────────────────────────────────────────────────
  "move-right": <Arrow dx={14} />,
  "move-left": <Arrow dx={-14} />,
  "move-up": <ArrowY dy={-14} />,
  "move-down": <ArrowY dy={14} />,
  "turn-right": <Curl way={1} />,
  "turn-left": <Curl way={-1} />,
  hop: (
    <g stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join} fill="none">
      <path d="M4 18q8-13 16 0" strokeDasharray="0.1 4" />
      <path d="M4 18q8-13 16 0" opacity=".45" />
      <circle cx="12" cy="7" r="2.6" fill={S.fill} stroke="none" />
    </g>
  ),
  "go-home": (
    <g fill={S.fill}>
      <path d="M12 3.5 3.5 11h2.2v9.5h5V15h2.6v5.5h5V11h2.2z" />
    </g>
  ),

  // ── Looks ─────────────────────────────────────────────────────────────────
  say: (
    <g fill={S.fill}>
      <path d="M4 5.5h16a1.5 1.5 0 0 1 1.5 1.5v7a1.5 1.5 0 0 1-1.5 1.5h-8l-4.5 4v-4H4A1.5 1.5 0 0 1 2.5 14V7A1.5 1.5 0 0 1 4 5.5z" />
    </g>
  ),
  grow: (
    <g stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join} fill="none">
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.4" fill={S.fill} stroke="none" />
      <path d="M4.5 8V4.5H8M16 4.5h3.5V8M19.5 16v3.5H16M8 19.5H4.5V16" />
    </g>
  ),
  shrink: (
    <g stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join} fill="none">
      <rect x="9.75" y="9.75" width="4.5" height="4.5" rx="1" fill={S.fill} stroke="none" />
      <path d="M3.5 3.5 7 7M20.5 3.5 17 7M20.5 20.5 17 17M3.5 20.5 7 17" />
    </g>
  ),
  "reset-size": (
    <g stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join} fill="none">
      <rect x="8.5" y="8.5" width="7" height="7" rx="1.4" fill={S.fill} stroke="none" />
      <path d="M4 6.5h4M4 17.5h4M16 6.5h4M16 17.5h4" opacity=".85" />
    </g>
  ),
  hide: (
    <g stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join} fill="none">
      <path d="M3 12s3.5-5.5 9-5.5 9 5.5 9 5.5-3.5 5.5-9 5.5S3 12 3 12z" opacity=".55" />
      <path d="M4 4l16 16" />
    </g>
  ),
  show: (
    <g stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join} fill="none">
      <path d="M3 12s3.5-5.5 9-5.5 9 5.5 9 5.5-3.5 5.5-9 5.5S3 12 3 12z" />
      <circle cx="12" cy="12" r="2.4" fill={S.fill} stroke="none" />
    </g>
  ),

  // ── Sound ─────────────────────────────────────────────────────────────────
  pop: (
    <g fill={S.fill}>
      <path d="M4 9.5h3.5L12 5.5v13L7.5 14.5H4z" />
      <path
        d="M15.5 9a4.5 4.5 0 0 1 0 6"
        fill="none"
        stroke={S.stroke}
        strokeWidth={S.width}
        strokeLinecap={S.cap}
      />
    </g>
  ),
  "play-sound": (
    <g fill={S.fill}>
      <rect x="9.5" y="3" width="5" height="11" rx="2.5" />
      <path
        d="M6.5 12a5.5 5.5 0 0 0 11 0M12 17.5V21M9 21h6"
        fill="none"
        stroke={S.stroke}
        strokeWidth={S.width}
        strokeLinecap={S.cap}
      />
    </g>
  ),

  // ── Control ───────────────────────────────────────────────────────────────
  wait: (
    <g fill="none" stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join}>
      <circle cx="12" cy="12.5" r="8" />
      <path d="M12 8v4.5l3 2" />
    </g>
  ),
  stop: (
    <g fill={S.fill}>
      <rect x="5.5" y="5.5" width="13" height="13" rx="2" />
    </g>
  ),
  "set-speed": (
    <g fill="none" stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join}>
      <path d="M4 16a8 8 0 1 1 16 0" />
      <path d="M12 15.5 16.5 9.5" />
      <circle cx="12" cy="16" r="1.6" fill={S.fill} stroke="none" />
    </g>
  ),
  repeat: <Curl way={1} />,

  // ── End ───────────────────────────────────────────────────────────────────
  end: (
    <g fill={S.fill}>
      <rect x="4" y="4" width="4" height="4" />
      <rect x="12" y="4" width="4" height="4" />
      <rect x="8" y="8" width="4" height="4" />
      <rect x="16" y="8" width="4" height="4" />
      <rect x="4" y="12" width="4" height="4" />
      <rect x="12" y="12" width="4" height="4" />
      <rect x="8" y="16" width="4" height="4" />
      <rect x="16" y="16" width="4" height="4" />
    </g>
  ),
  "repeat-forever": (
    <g fill="none" stroke={S.stroke} strokeWidth={S.width} strokeLinecap={S.cap} strokeLinejoin={S.join}>
      <path d="M8.2 8.4a5 5 0 1 0 0 7.2c2-1.8 3.6-5.4 5.6-7.2a5 5 0 1 1 0 7.2c-2-1.8-3.6-5.4-5.6-7.2z" />
    </g>
  ),
};

/** The picture alone, for use inside a tile or a caption. */
export function SjArt({ kind, className }: { kind: SjArtKind; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden focusable="false">
      {ART[kind]}
    </svg>
  );
}

/**
 * Plain-language names.
 *
 * Never shown to a child — ScratchJr blocks carry no words, and putting words
 * on them would defeat the point. These exist for screen readers, for the
 * teacher's key, and for the check script's error messages.
 */
export const SJ_BLOCK_NAME: Record<SjArtKind, string> = {
  "on-flag": "start on green flag",
  "on-tap": "start on tap",
  "on-bump": "start on bump",
  "move-right": "move right",
  "move-left": "move left",
  "move-up": "move up",
  "move-down": "move down",
  "turn-right": "turn right",
  "turn-left": "turn left",
  hop: "hop",
  "go-home": "go home",
  say: "say",
  grow: "grow",
  shrink: "shrink",
  "reset-size": "reset size",
  hide: "hide",
  show: "show",
  pop: "pop",
  "play-sound": "play recorded sound",
  wait: "wait",
  stop: "stop",
  "set-speed": "set speed",
  repeat: "repeat",
  end: "end",
  "repeat-forever": "repeat forever",
};

export const SJ_SPEED_NAME: Record<SjSpeed, string> = {
  slow: "slow",
  normal: "normal",
  fast: "fast",
};

/** The colour a block is painted, from its drawer. */
export const sjColour = (kind: SjArtKind): { hex: string; ink: string } =>
  SJ_CATEGORIES[SJ_BLOCK_CATEGORY[kind]];
