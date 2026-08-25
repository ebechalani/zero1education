import type { KgGlyph } from "./grid-model";

/**
 * The picture library, drawn as flat SVG.
 *
 * Not emoji: these are printed in the book's own style, they must scale to a
 * projector without going fuzzy, and emoji render differently on every machine
 * in a school. Each is drawn inside a 0 0 100 100 box so any glyph can sit in
 * any square.
 */

const P = ({ d, fill }: { d: string; fill: string }) => <path d={d} fill={fill} />;

export function Glyph({
  name,
  className,
  title,
}: {
  name: KgGlyph;
  className?: string;
  title?: string;
}) {
  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
    >
      {GLYPHS[name]}
    </svg>
  );
}

/** Plain-language names, for screen readers and the teacher's answer key. */
export const GLYPH_LABEL: Record<KgGlyph, string> = {
  dog: "dog",
  bone: "bone",
  cat: "cat",
  ball: "ball",
  tree: "tree",
  house: "house",
  star: "star",
  flower: "flower",
  apple: "apple",
  fish: "fish",
  bird: "bird",
  duck: "duck",
  car: "car",
  sun: "sun",
  robot: "robot",
  cube: "cube",
  plate: "plate of food",
  monkey: "monkey",
  balloon: "balloon",
  bee: "bee",
};

const GLYPHS: Record<KgGlyph, React.ReactNode> = {
  dog: (
    <>
      <ellipse cx="50" cy="62" rx="26" ry="22" fill="#B98040" />
      <ellipse cx="27" cy="46" rx="9" ry="16" fill="#8A5A2B" />
      <ellipse cx="73" cy="46" rx="9" ry="16" fill="#8A5A2B" />
      <circle cx="50" cy="55" r="20" fill="#D9A05B" />
      <circle cx="43" cy="51" r="3.4" fill="#2B1B0E" />
      <circle cx="57" cy="51" r="3.4" fill="#2B1B0E" />
      <ellipse cx="50" cy="63" rx="6" ry="4.5" fill="#2B1B0E" />
      <path d="M50 67v5" stroke="#2B1B0E" strokeWidth="2.5" strokeLinecap="round" />
    </>
  ),
  bone: (
    <>
      <rect x="28" y="44" width="44" height="12" rx="6" fill="#F3F0E7" />
      <circle cx="28" cy="42" r="9" fill="#F3F0E7" />
      <circle cx="28" cy="58" r="9" fill="#F3F0E7" />
      <circle cx="72" cy="42" r="9" fill="#F3F0E7" />
      <circle cx="72" cy="58" r="9" fill="#F3F0E7" />
    </>
  ),
  cat: (
    <>
      <path d="M30 34l4-16 12 10z" fill="#8A8A93" />
      <path d="M70 34l-4-16-12 10z" fill="#8A8A93" />
      <circle cx="50" cy="52" r="24" fill="#A3A3AC" />
      <ellipse cx="41" cy="48" rx="3.2" ry="4.4" fill="#22201F" />
      <ellipse cx="59" cy="48" rx="3.2" ry="4.4" fill="#22201F" />
      <path d="M50 58l-4 3h8z" fill="#E08D9B" />
      <path d="M26 56h-12M26 62h-12M74 56h12M74 62h12" stroke="#6E6E77" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  ball: (
    <>
      <circle cx="50" cy="52" r="26" fill="#E8534A" />
      <path d="M24 52h52" stroke="#FFF" strokeWidth="4" />
      <path d="M50 26a34 34 0 0 1 0 52" stroke="#FFF" strokeWidth="4" fill="none" />
      <path d="M50 26a34 34 0 0 0 0 52" stroke="#FFF" strokeWidth="4" fill="none" />
    </>
  ),
  tree: (
    <>
      <rect x="45" y="58" width="10" height="26" rx="3" fill="#8A5A2B" />
      <circle cx="50" cy="42" r="22" fill="#3FA65A" />
      <circle cx="34" cy="52" r="14" fill="#4CB86A" />
      <circle cx="66" cy="52" r="14" fill="#4CB86A" />
    </>
  ),
  house: (
    <>
      <path d="M50 18L16 48h68z" fill="#E8534A" />
      <rect x="26" y="48" width="48" height="34" fill="#F0D9A8" />
      <rect x="43" y="60" width="14" height="22" rx="2" fill="#8A5A2B" />
      <rect x="30" y="55" width="10" height="10" fill="#7EC8E3" />
      <rect x="60" y="55" width="10" height="10" fill="#7EC8E3" />
    </>
  ),
  star: (
    <P
      d="M50 16l10 22 24 3-17 17 4 24-21-11-21 11 4-24-17-17 24-3z"
      fill="#FFC24B"
    />
  ),
  flower: (
    <>
      <rect x="47" y="54" width="6" height="30" rx="3" fill="#3FA65A" />
      <circle cx="50" cy="34" r="10" fill="#E8534A" />
      <circle cx="34" cy="44" r="10" fill="#F07AA0" />
      <circle cx="66" cy="44" r="10" fill="#F07AA0" />
      <circle cx="40" cy="60" r="10" fill="#F07AA0" />
      <circle cx="60" cy="60" r="10" fill="#F07AA0" />
      <circle cx="50" cy="48" r="9" fill="#FFC24B" />
    </>
  ),
  apple: (
    <>
      <path d="M50 30c-14 0-22 10-22 24s10 26 22 26 22-12 22-26-8-24-22-24z" fill="#E8534A" />
      <rect x="48" y="20" width="4" height="12" rx="2" fill="#8A5A2B" />
      <path d="M52 24c8-6 14-4 14-4s-2 8-14 8z" fill="#3FA65A" />
    </>
  ),
  fish: (
    <>
      <ellipse cx="46" cy="52" rx="26" ry="17" fill="#4FA8D8" />
      <path d="M72 52l16-12v24z" fill="#3E8FBC" />
      <circle cx="34" cy="47" r="3.4" fill="#12303F" />
    </>
  ),
  bird: (
    <>
      <ellipse cx="50" cy="55" rx="22" ry="18" fill="#F0B429" />
      <circle cx="66" cy="42" r="12" fill="#F0B429" />
      <circle cx="70" cy="39" r="3" fill="#3A2A08" />
      <path d="M78 43l10 4-10 4z" fill="#E8534A" />
      <path d="M34 52c8-8 20-6 24 2-8 8-18 6-24-2z" fill="#D99A1F" />
    </>
  ),
  duck: (
    <>
      <ellipse cx="48" cy="60" rx="24" ry="16" fill="#FFD447" />
      <circle cx="68" cy="42" r="13" fill="#FFD447" />
      <circle cx="72" cy="39" r="3" fill="#3A2A08" />
      <path d="M80 44l12 3-12 4z" fill="#F08C20" />
      <path d="M24 66c10 6 30 6 44 0" stroke="#E8B420" strokeWidth="3" fill="none" />
    </>
  ),
  car: (
    <>
      <path d="M20 60h60v12H20z" fill="#4A7DE0" />
      <path d="M32 60l8-16h24l8 16z" fill="#6E9BEA" />
      <circle cx="34" cy="74" r="8" fill="#2B2B33" />
      <circle cx="66" cy="74" r="8" fill="#2B2B33" />
    </>
  ),
  plate: (
    <>
      <ellipse cx="50" cy="58" rx="34" ry="24" fill="#E8EAF0" />
      <ellipse cx="50" cy="55" rx="25" ry="17" fill="#FFF" />
      <ellipse cx="44" cy="52" rx="9" ry="6" fill="#E8534A" />
      <ellipse cx="58" cy="57" rx="7" ry="5" fill="#3FA65A" />
      <ellipse cx="52" cy="46" rx="6" ry="4" fill="#FFC24B" />
    </>
  ),
  monkey: (
    <>
      <circle cx="26" cy="42" r="10" fill="#8A5A2B" />
      <circle cx="74" cy="42" r="10" fill="#8A5A2B" />
      <circle cx="26" cy="42" r="5" fill="#C98A5E" />
      <circle cx="74" cy="42" r="5" fill="#C98A5E" />
      <ellipse cx="50" cy="60" rx="24" ry="21" fill="#8A5A2B" />
      <ellipse cx="50" cy="46" rx="22" ry="19" fill="#A06A33" />
      <ellipse cx="50" cy="56" rx="16" ry="13" fill="#E3B98A" />
      <circle cx="43" cy="45" r="3.4" fill="#2B1B0E" />
      <circle cx="57" cy="45" r="3.4" fill="#2B1B0E" />
      <ellipse cx="46" cy="55" rx="2" ry="2.6" fill="#2B1B0E" />
      <ellipse cx="54" cy="55" rx="2" ry="2.6" fill="#2B1B0E" />
      <path d="M43 62q7 5 14 0" stroke="#2B1B0E" strokeWidth="2.4" fill="none" strokeLinecap="round" />
    </>
  ),
  balloon: (
    <>
      <path d="M50 74q-3 6 0 12" stroke="#8A8A93" strokeWidth="2.4" fill="none" />
      <ellipse cx="50" cy="44" rx="24" ry="29" fill="#E8534A" />
      <ellipse cx="41" cy="34" rx="7" ry="10" fill="#F58A84" />
      <path d="M46 72h8l-4 6z" fill="#B83A32" />
    </>
  ),
  bee: (
    <>
      <ellipse cx="34" cy="38" rx="15" ry="10" fill="#CFE8F5" opacity=".85" transform="rotate(-24 34 38)" />
      <ellipse cx="64" cy="36" rx="15" ry="10" fill="#CFE8F5" opacity=".85" transform="rotate(20 64 36)" />
      <ellipse cx="50" cy="56" rx="24" ry="18" fill="#FFC24B" />
      <path d="M40 41v30M52 39v34" stroke="#2B1B0E" strokeWidth="7" />
      <circle cx="74" cy="50" r="10" fill="#2B1B0E" />
      <circle cx="78" cy="47" r="2.6" fill="#FFF" />
    </>
  ),
  robot: (
    <>
      <rect x="42" y="16" width="16" height="10" rx="4" fill="#8A93A6" />
      <circle cx="50" cy="14" r="5" fill="#FFC24B" />
      <rect x="26" y="26" width="48" height="38" rx="10" fill="#B8C0D0" />
      <rect x="34" y="34" width="32" height="20" rx="6" fill="#2C3446" />
      <circle cx="43" cy="44" r="4" fill="#5CD1F0" />
      <circle cx="57" cy="44" r="4" fill="#5CD1F0" />
      <rect x="16" y="38" width="10" height="20" rx="5" fill="#8A93A6" />
      <rect x="74" y="38" width="10" height="20" rx="5" fill="#8A93A6" />
      <rect x="34" y="64" width="12" height="18" rx="4" fill="#8A93A6" />
      <rect x="54" y="64" width="12" height="18" rx="4" fill="#8A93A6" />
    </>
  ),
  cube: (
    <>
      <path d="M50 18l28 15v34L50 82 22 67V33z" fill="#C98A3E" />
      <path d="M50 18l28 15-28 15-28-15z" fill="#E0A55A" />
      <path d="M50 48v34L22 67V33z" fill="#A96F2C" opacity=".55" />
      <path d="M50 18l28 15-28 15-28-15z" fill="none" stroke="#8A5A2B" strokeWidth="2.5" />
      <path d="M22 33v34l28 15 28-15V33" fill="none" stroke="#8A5A2B" strokeWidth="2.5" />
      <path d="M50 48v34" stroke="#8A5A2B" strokeWidth="2.5" />
    </>
  ),
  sun: (
    <>
      <circle cx="50" cy="50" r="20" fill="#FFC24B" />
      {Array.from({ length: 8 }).map((_, i) => {
        const a = (i * Math.PI) / 4;
        return (
          <line
            key={i}
            x1={50 + Math.cos(a) * 26}
            y1={50 + Math.sin(a) * 26}
            x2={50 + Math.cos(a) * 36}
            y2={50 + Math.sin(a) * 36}
            stroke="#FFB020"
            strokeWidth="6"
            strokeLinecap="round"
          />
        );
      })}
    </>
  ),
};
