import type { SjBackground } from "./sj-model";

/**
 * The background library.
 *
 * ScratchJr ships photographic scenes; these are drawn instead as a stack of
 * horizontal bands, because a band prints flat, scales to a projector without
 * going fuzzy, and stays the same picture in light and dark mode. A duck is
 * yellow and the sea is blue whatever the theme is doing, so every colour here
 * is a literal hex rather than a token.
 *
 * Fractions run 0 at the top of the stage to 1 at the bottom, and the bands of
 * a scene always tile the whole height with no gaps: the last band's `to` is 1.
 * `colour2`, where it appears, is the colour the band shades towards at its
 * lower edge — sky lightening to the horizon, water darkening with depth. A
 * scene ignoring it still reads correctly, since `colour` is always the one
 * carrying the scene.
 *
 * Scenery goes in `props`, placed on the same 20×15 grid the sprites stand on.
 * `SjGlyph` has no sun, so the garden's sun is the star glyph grown large and
 * painted gold — the one place a prop is not what its glyph is named.
 *
 * Every scene is picked so a sprite drawn on top of it keeps its edges: the
 * dark ones are dark enough that bright sprite colours sit forward of them,
 * and the pale ones never climb into the near-white a sprite might be drawn in.
 */
export const SJ_BACKGROUNDS: SjBackground[] = [
  {
    // What a new project opens on, and what Clear puts back.
    id: "blank",
    name: "Blank",
    bands: [{ from: 0, to: 1, colour: "#FFFFFF" }],
  },
  {
    // Grade 1: the duck swims here.
    id: "sea",
    name: "The sea",
    bands: [
      { from: 0, to: 0.44, colour: "#A8DCF5", colour2: "#DCF1FC" },
      { from: 0.44, to: 0.5, colour: "#6FC3EA" },
      { from: 0.5, to: 1, colour: "#2E8BC9", colour2: "#1C6BA8" },
    ],
    props: [{ glyph: "star", at: { x: 17, y: 2 }, size: 90, colour: "#FFC24B" }],
  },
  {
    // The same sea after the rubbish goes in — the fish's warning.
    id: "dirty-sea",
    name: "The dirty sea",
    bands: [
      { from: 0, to: 0.44, colour: "#C9CDAE", colour2: "#E0E2CB" },
      { from: 0.44, to: 0.5, colour: "#8C9455" },
      { from: 0.5, to: 1, colour: "#63713A", colour2: "#414C21" },
    ],
  },
  {
    // Where Eric and Lea dance.
    id: "garden",
    name: "The garden",
    bands: [
      { from: 0, to: 0.58, colour: "#BFE4FA", colour2: "#E9F5FE" },
      { from: 0.58, to: 0.66, colour: "#3E9A48" },
      { from: 0.66, to: 1, colour: "#6FCB6B", colour2: "#55B45A" },
    ],
    props: [{ glyph: "star", at: { x: 17, y: 2 }, size: 95, colour: "#FFC24B" }],
  },
  {
    // The frog and the butterfly live here.
    id: "forest",
    name: "The forest",
    bands: [
      { from: 0, to: 0.55, colour: "#C7E7F0", colour2: "#E6F5F8" },
      { from: 0.55, to: 0.62, colour: "#2E6B3C" },
      { from: 0.62, to: 1, colour: "#3F8A46", colour2: "#2F6E38" },
    ],
    props: [
      { glyph: "tree", at: { x: 3, y: 8 }, size: 110, colour: "#2F7D3E" },
      { glyph: "tree", at: { x: 9, y: 7 }, size: 80, colour: "#3FA65A" },
      { glyph: "tree", at: { x: 17, y: 8 }, size: 120, colour: "#35894A" },
    ],
  },
  {
    // Wall, wooden floor, and the white line the ball is bounced over.
    id: "court",
    name: "The basketball court",
    bands: [
      { from: 0, to: 0.5, colour: "#DCE3EC", colour2: "#C8D4E2" },
      { from: 0.5, to: 0.56, colour: "#9AA8BC" },
      { from: 0.56, to: 0.78, colour: "#E0A85A", colour2: "#D2984C" },
      { from: 0.78, to: 0.81, colour: "#FFFFFF" },
      { from: 0.81, to: 1, colour: "#D2984C", colour2: "#C08238" },
    ],
  },
  {
    // Cream wall over tiles — where the recycling chant is said.
    id: "classroom",
    name: "The classroom",
    bands: [
      { from: 0, to: 0.55, colour: "#F1E7D4", colour2: "#E5D8BE" },
      { from: 0.55, to: 0.6, colour: "#8A6A44" },
      { from: 0.6, to: 1, colour: "#9FB0BE", colour2: "#8496A6" },
    ],
  },
  {
    // Grass, a sandy path across the middle, more grass.
    id: "park",
    name: "The park",
    bands: [
      { from: 0, to: 0.5, colour: "#B7E2FA", colour2: "#E4F3FE" },
      { from: 0.5, to: 0.7, colour: "#66C46A", colour2: "#4FAE59" },
      { from: 0.7, to: 0.8, colour: "#D8C49A", colour2: "#C6AF83" },
      { from: 0.8, to: 1, colour: "#58B85F", colour2: "#47A351" },
    ],
    props: [{ glyph: "tree", at: { x: 3, y: 6 }, size: 90, colour: "#3FA65A" }],
  },
  {
    // Dark, but never black: a bright sprite has to sit forward of it.
    id: "night",
    name: "The night sky",
    bands: [
      { from: 0, to: 0.82, colour: "#151C40", colour2: "#2C3364" },
      { from: 0.82, to: 1, colour: "#26305A", colour2: "#1A2244" },
    ],
    props: [
      { glyph: "star", at: { x: 4, y: 3 }, size: 35, colour: "#FFF3C4" },
      { glyph: "star", at: { x: 9, y: 2 }, size: 28, colour: "#FFF3C4" },
      { glyph: "star", at: { x: 15, y: 4 }, size: 40, colour: "#FFF3C4" },
      { glyph: "star", at: { x: 18, y: 2 }, size: 28, colour: "#FFF3C4" },
    ],
  },
];

/** Look a scene up by id — the chooser and the saved project both store ids. */
export const sjBackground = (id: string): SjBackground | undefined =>
  SJ_BACKGROUNDS.find((background) => background.id === id);
