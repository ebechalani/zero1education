"use client";

import { cn } from "@/lib/utils";
import {
  Check,
  Columns2,
  Eye,
  Keyboard,
  Lightbulb,
  Monitor,
  RefreshCw,
  Smartphone,
  Sparkles,
  Tablet,
  Terminal,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { LabShell } from "./lab-shell";

// ── Public types ────────────────────────────────────────────────────────────

export interface WebLabSource {
  html: string;
  css: string;
  js: string;
}

export interface StyleRuleSnapshot {
  /** e.g. ".card, .card h2" */
  selector: string;
  /** declared property names, e.g. ["background", "border-radius"] */
  props: string[];
  /** full rule text, truncated */
  text: string;
}

export interface HeadingSnapshot {
  /** "h1" … "h6" */
  tag: string;
  text: string;
}

/**
 * A structured description of the rendered preview, collected *inside* the
 * sandboxed iframe and posted back to this component.
 *
 * The preview frame is sandboxed without `allow-same-origin`, so its document
 * is opaque to us — we can never touch `iframe.contentDocument`. Everything the
 * checklist knows about the student's page arrives through this snapshot.
 */
export interface PreviewSnapshot {
  /** lowercase tag name → how many of them are in the body */
  tagCounts: Record<string, number>;
  elementCount: number;
  headings: HeadingSnapshot[];
  /** heading text only, in document order — convenience mirror of `headings` */
  headingTexts: string[];
  buttonTexts: string[];
  /** visible text of the page, trimmed and truncated */
  textContent: string;
  classNames: string[];
  ids: string[];
  /** top-level CSS rules from the student's stylesheet */
  styleRules: StyleRuleSnapshot[];
  /** every property name declared anywhere in the stylesheet */
  styleProps: string[];
  /** computed styles of <body> (resolved values, e.g. "rgb(238, 243, 255)") */
  bodyStyle: { backgroundColor: string; color: string; fontFamily: string };
  /** computed background of <html>, so `html { background: … }` still counts */
  rootBackgroundColor: string;
  /** click/pointer listeners registered through addEventListener */
  clickHandlerCount: number;
  /** elements carrying an inline onclick="…" attribute */
  inlineClickCount: number;
}

export interface WebLabTask {
  id: string;
  label: string;
  /**
   * Runs in the parent page against the snapshot posted back by the preview.
   * (A sandboxed cross-origin iframe cannot expose a live `Document`, so tasks
   * are checked against the snapshot instead — see `PreviewSnapshot`.)
   */
  test: (snapshot: PreviewSnapshot) => boolean;
  hint: string;
}

export interface WebLabConfig {
  html?: string;
  css?: string;
  js?: string;
  tasks?: WebLabTask[];
}

// ── Starter project ─────────────────────────────────────────────────────────

const STARTER_HEADING = "My First Web Page";

/**
 * The built-in "My First Web Page" project. Exported so lessons can reuse the
 * same starting point (e.g. a Try-It block that continues where the lab left off).
 */
export const WEB_LAB_STARTER: WebLabSource = {
  html: `<!-- HTML is the structure of the page.
     Every tag is a labelled box that holds content. -->

<h1>${STARTER_HEADING}</h1>
<p>Hi! I am learning how the web is built at ZERO1.</p>

<!-- A card is just a box we can style with CSS. -->
<div class="card">
  <h2>Bit of the day</h2>
  <p id="fact">Press the button and I will tell you something.</p>
  <button id="factBtn" class="btn">Tell me a fact</button>
</div>
`,
  css: `/* CSS decides how the page looks.
   Change a colour or a number and watch the preview. */

body {
  font-family: system-ui, sans-serif;
  color: #1e2946;
  line-height: 1.6;
  margin: 0;
  padding: 24px;
  /* Your turn: add a background colour here. */
}

h1 {
  color: #2b4fe0;
  margin-bottom: 4px;
}

.card {
  max-width: 340px;
  margin-top: 20px;
  padding: 16px;
  background: #ffffff;
  border: 1px solid #c6ccde;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(11, 17, 32, 0.12);
}

.btn {
  margin-top: 12px;
  padding: 8px 14px;
  border: 0;
  border-radius: 8px;
  background: #2b4fe0;
  color: #ffffff;
  font-size: 15px;
  cursor: pointer;
}

.btn:hover {
  background: #1f3db8;
}
`,
  js: `// JavaScript makes the page do things.

// A list of facts to choose from.
const facts = [
  "The word 'bit' is short for binary digit.",
  "The first web page went online in 1991 and still works today.",
  "Colours in CSS can be names, hex codes or rgb() values.",
];

// Find the button and the paragraph by their id.
const button = document.getElementById("factBtn");
const factText = document.getElementById("fact");

// Run this every time the button is clicked.
button.addEventListener("click", function () {
  const pick = Math.floor(Math.random() * facts.length);
  factText.textContent = facts[pick];
  console.log("Showed fact number", pick + 1);
});
`,
};

// ── Snapshot helpers (exported for lesson-authored tasks) ───────────────────

export function countTag(snapshot: PreviewSnapshot, tag: string): number {
  return snapshot.tagCounts[tag.toLowerCase()] ?? 0;
}

/** True when the stylesheet has a rule whose selector mentions `selector`. */
export function hasStyleRule(
  snapshot: PreviewSnapshot,
  selector: string,
  property?: string,
): boolean {
  const needle = selector.trim().toLowerCase();
  return snapshot.styleRules.some((rule) => {
    if (!rule.selector.toLowerCase().includes(needle)) return false;
    if (!property) return true;
    return rule.props.includes(property.trim().toLowerCase());
  });
}

export function hasStyleProp(snapshot: PreviewSnapshot, property: string): boolean {
  return snapshot.styleProps.includes(property.trim().toLowerCase());
}

export function hasClickHandler(snapshot: PreviewSnapshot): boolean {
  return snapshot.clickHandlerCount > 0 || snapshot.inlineClickCount > 0;
}

/** A colour a human would actually see — not `transparent` / alpha 0. */
export function isPaintedColor(value: string): boolean {
  const v = value.trim().toLowerCase();
  if (!v || v === "transparent" || v === "none") return false;
  if (v.startsWith("rgba")) {
    const parts = v.slice(v.indexOf("(") + 1, v.lastIndexOf(")")).split(",");
    const alpha = Number(parts[3]);
    if (Number.isFinite(alpha) && alpha === 0) return false;
  }
  return true;
}

function headingOf(snapshot: PreviewSnapshot, tag: string): string {
  return snapshot.headings.find((h) => h.tag === tag)?.text.trim() ?? "";
}

/** The checklist that ships with the built-in starter project. */
export const WEB_LAB_DEFAULT_TASKS: WebLabTask[] = [
  {
    id: "heading",
    label: "The page has a main heading",
    test: (s) => countTag(s, "h1") >= 1,
    hint: "A main heading looks like this in the HTML pane: <h1>Hello</h1>",
  },
  {
    id: "own-title",
    label: "The heading says something of your own",
    test: (s) => {
      const text = headingOf(s, "h1");
      return (
        text.length >= 3 && text.toLowerCase() !== STARTER_HEADING.toLowerCase()
      );
    },
    hint: "Change the words between <h1> and </h1> — your name, your club, your game. Anything that is yours.",
  },
  {
    id: "background",
    label: "The page has a background colour",
    test: (s) =>
      isPaintedColor(s.bodyStyle.backgroundColor) ||
      isPaintedColor(s.rootBackgroundColor),
    hint: "In the CSS pane, inside body { }, add a line: background: #eef3ff;  (any colour works)",
  },
  {
    id: "list",
    label: "A list with at least three items",
    test: (s) =>
      countTag(s, "ul") + countTag(s, "ol") >= 1 && countTag(s, "li") >= 3,
    hint: "In the HTML pane write <ul>, then three lines like <li>Football</li>, then close it with </ul>.",
  },
  {
    id: "click",
    label: "A button that reacts when it is clicked",
    test: (s) => countTag(s, "button") >= 1 && hasClickHandler(s),
    hint: 'Keep a <button> in the HTML, then in the JS pane give it a listener: button.addEventListener("click", function () { … })',
  },
];

// ── The script injected into the preview ────────────────────────────────────
//
// Runs before the student's code. It (1) forwards console output and errors to
// the parent, (2) counts click listeners, and (3) posts a structured snapshot
// of the rendered document so the checklist can be evaluated in the parent.
//
// NOTE: this is a template literal, so any backslash must be doubled. It is
// written without regular expressions on purpose to keep it escape-free.
const PREVIEW_RUNTIME = `(function () {
  var MAX_TEXT = 4000;
  var clickHandlers = 0;
  var nativeAdd = EventTarget.prototype.addEventListener;

  function post(payload) {
    try {
      payload.__zero1 = true;
      parent.postMessage(payload, "*");
    } catch (err) {}
  }

  function fmt(value, depth) {
    try {
      if (value === null) return "null";
      if (value === undefined) return "undefined";
      var t = typeof value;
      if (t === "string") return depth === 0 ? value : JSON.stringify(value);
      if (t === "number" || t === "boolean" || t === "bigint") return String(value);
      if (t === "function") return "function " + (value.name || "anonymous") + "()";
      if (t === "symbol") return value.toString();
      if (value instanceof Error) return value.name + ": " + value.message;
      if (value.nodeType === 1) return "<" + value.tagName.toLowerCase() + ">";
      if (depth > 2) return Array.isArray(value) ? "[...]" : "{...}";
      var i;
      if (Array.isArray(value)) {
        var items = [];
        for (i = 0; i < value.length && i < 20; i++) items.push(fmt(value[i], depth + 1));
        if (value.length > 20) items.push("...");
        return "[" + items.join(", ") + "]";
      }
      var keys = Object.keys(value);
      var pairs = [];
      for (i = 0; i < keys.length && i < 12; i++) {
        pairs.push(keys[i] + ": " + fmt(value[keys[i]], depth + 1));
      }
      if (keys.length > 12) pairs.push("...");
      return "{ " + pairs.join(", ") + " }";
    } catch (err) {
      return "[value could not be shown]";
    }
  }

  function emit(level, args) {
    var parts = [];
    for (var i = 0; i < args.length; i++) parts.push(fmt(args[i], 0));
    var text = parts.join(" ");
    if (text.length > MAX_TEXT) text = text.slice(0, MAX_TEXT) + " ...";
    post({ type: "console", level: level, text: text });
  }

  var levels = ["log", "info", "warn", "error", "debug"];
  for (var l = 0; l < levels.length; l++) {
    (function (name) {
      var original = console[name];
      console[name] = function () {
        emit(name === "debug" ? "log" : name, arguments);
        if (original) {
          try { original.apply(console, arguments); } catch (err) {}
        }
      };
    })(levels[l]);
  }

  // Modal dialogs are blocked by the sandbox, so send them to the console strip
  // instead of failing silently.
  window.alert = function (message) { emit("info", ["alert:", message]); };
  window.confirm = function (message) { emit("info", ["confirm:", message]); return true; };
  window.prompt = function (message) { emit("info", ["prompt:", message]); return null; };

  function collect() {
    var body = document.body;
    var all = body ? body.getElementsByTagName("*") : [];
    var tagCounts = {};
    var classNames = {};
    var ids = {};
    var i;
    var el;
    for (i = 0; i < all.length; i++) {
      el = all[i];
      var tag = el.tagName.toLowerCase();
      tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      if (el.id) ids[el.id] = true;
      if (el.classList) {
        for (var c = 0; c < el.classList.length; c++) classNames[el.classList[c]] = true;
      }
    }

    var headings = [];
    var hs = document.querySelectorAll("h1,h2,h3,h4,h5,h6");
    for (i = 0; i < hs.length && i < 40; i++) {
      headings.push({
        tag: hs[i].tagName.toLowerCase(),
        text: (hs[i].textContent || "").trim().slice(0, 200)
      });
    }

    var buttonTexts = [];
    var bs = document.querySelectorAll("button, input[type=button], input[type=submit]");
    for (i = 0; i < bs.length && i < 40; i++) {
      buttonTexts.push(String(bs[i].textContent || bs[i].value || "").trim().slice(0, 120));
    }

    var styleRules = [];
    var styleProps = {};
    var sheets = document.styleSheets;
    for (i = 0; i < sheets.length; i++) {
      var rules = null;
      try { rules = sheets[i].cssRules; } catch (err) { rules = null; }
      if (!rules) continue;
      for (var r = 0; r < rules.length && styleRules.length < 120; r++) {
        var rule = rules[r];
        if (!rule || !rule.selectorText || !rule.style) continue;
        var props = [];
        for (var p = 0; p < rule.style.length; p++) {
          props.push(rule.style[p]);
          styleProps[rule.style[p]] = true;
        }
        styleRules.push({
          selector: String(rule.selectorText),
          props: props,
          text: String(rule.cssText).slice(0, 400)
        });
      }
    }

    var bodyCs = body ? getComputedStyle(body) : null;
    var rootCs = document.documentElement ? getComputedStyle(document.documentElement) : null;
    var text = "";
    if (body) text = String(body.innerText || body.textContent || "").trim().slice(0, MAX_TEXT);

    return {
      tagCounts: tagCounts,
      elementCount: all.length,
      headings: headings,
      buttonTexts: buttonTexts,
      textContent: text,
      classNames: Object.keys(classNames).slice(0, 80),
      ids: Object.keys(ids).slice(0, 80),
      styleRules: styleRules,
      styleProps: Object.keys(styleProps).slice(0, 160),
      bodyStyle: {
        backgroundColor: bodyCs ? bodyCs.backgroundColor : "",
        color: bodyCs ? bodyCs.color : "",
        fontFamily: bodyCs ? bodyCs.fontFamily : ""
      },
      rootBackgroundColor: rootCs ? rootCs.backgroundColor : "",
      clickHandlerCount: clickHandlers,
      inlineClickCount: document.querySelectorAll("[onclick]").length
    };
  }

  var scheduled = null;
  var lastSent = 0;
  function report() {
    if (scheduled) return;
    var wait = Math.max(60, 250 - (Date.now() - lastSent));
    scheduled = setTimeout(function () {
      scheduled = null;
      lastSent = Date.now();
      try { post({ type: "snapshot", data: collect() }); } catch (err) {}
    }, wait);
  }
  window.__zero1Report = report;

  // Internal listeners are registered with the original method so they never
  // inflate the click-handler count the checklist reads.
  nativeAdd.call(window, "error", function (event) {
    var message = event && event.message ? event.message : "Something went wrong in your script";
    // The line number is relative to the whole generated document; the parent
    // maps it back to a line in the JS pane before showing it.
    post({
      type: "console",
      level: "error",
      text: message,
      line: event && event.lineno ? event.lineno : 0
    });
  });
  nativeAdd.call(window, "unhandledrejection", function (event) {
    post({ type: "console", level: "error", text: "Unfinished promise: " + fmt(event ? event.reason : null, 1) });
  });
  nativeAdd.call(document, "click", function () { report(); }, true);
  nativeAdd.call(document, "input", function () { report(); }, true);
  nativeAdd.call(window, "load", function () { report(); });
  nativeAdd.call(document, "DOMContentLoaded", function () {
    try {
      var observer = new MutationObserver(function () { report(); });
      observer.observe(document.documentElement, {
        childList: true, subtree: true, attributes: true, characterData: true
      });
    } catch (err) {}
    report();
  });

  EventTarget.prototype.addEventListener = function (type) {
    if (type === "click" || type === "mousedown" || type === "pointerdown") clickHandlers++;
    return nativeAdd.apply(this, arguments);
  };
})();`;

function escapeClosingTag(code: string, tag: "script" | "style"): string {
  return code.replace(new RegExp("</(" + tag + ")", "gi"), "<\\/$1");
}

/**
 * Assembles the preview document and reports how many lines sit above the
 * student's script, so runtime errors can be reported against *their* line
 * numbers rather than the generated document's.
 */
function buildDoc(
  source: WebLabSource,
  runNonce: number,
): { doc: string; jsLineOffset: number } {
  const head = [
    "<!doctype html>",
    '<html lang="en"><head><meta charset="utf-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1" />',
    "<style>" + escapeClosingTag(source.css, "style") + "<\/style>",
    "<script>" + PREVIEW_RUNTIME + "<\/script>",
    "</head><body>",
    "<!-- run " + runNonce + " -->",
    source.html,
  ].join("\n");
  const doc = [
    head,
    "<script>" + escapeClosingTag(source.js, "script") + "<\/script>",
    "<script>window.__zero1Report && window.__zero1Report();<\/script>",
    "</body></html>",
  ].join("\n");
  // The opening <script> tag and the first line of the student's JS share a
  // document line, so line 1 of the JS pane is document line jsLineOffset + 1.
  return { doc, jsLineOffset: head.split("\n").length };
}

// ── Defensive narrowing of anything that arrives from outside ───────────────

function readString(value: unknown, fallback: string): string {
  return typeof value === "string" ? value : fallback;
}

function readStringArray(value: unknown, cap: number): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string").slice(0, cap);
}

function readConfig(config: unknown): WebLabSource & { tasks: WebLabTask[] } {
  const c = (config ?? {}) as Record<string, unknown>;
  const rawTasks = Array.isArray(c.tasks) ? (c.tasks as unknown[]) : null;
  const tasks: WebLabTask[] = rawTasks
    ? rawTasks
        .map((entry) => {
          const task = entry as Partial<WebLabTask> | null;
          if (
            !task ||
            typeof task.id !== "string" ||
            typeof task.label !== "string" ||
            typeof task.test !== "function"
          ) {
            return null;
          }
          return {
            id: task.id,
            label: task.label,
            test: task.test,
            hint: readString(task.hint, "Look back at the lesson example, then try one small change at a time."),
          };
        })
        .filter((task): task is WebLabTask => task !== null)
    : WEB_LAB_DEFAULT_TASKS;
  return {
    html: readString(c.html, WEB_LAB_STARTER.html),
    css: readString(c.css, WEB_LAB_STARTER.css),
    js: readString(c.js, WEB_LAB_STARTER.js),
    tasks,
  };
}

function normalizeSnapshot(raw: unknown): PreviewSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const tagCounts: Record<string, number> = {};
  if (r.tagCounts && typeof r.tagCounts === "object") {
    for (const [key, value] of Object.entries(r.tagCounts as Record<string, unknown>)) {
      if (typeof value === "number" && Number.isFinite(value)) {
        tagCounts[key.toLowerCase()] = value;
      }
    }
  }

  const headings: HeadingSnapshot[] = Array.isArray(r.headings)
    ? (r.headings as unknown[])
        .map((h) => {
          const item = h as Record<string, unknown> | null;
          if (!item) return null;
          return {
            tag: readString(item.tag, "").toLowerCase(),
            text: readString(item.text, ""),
          };
        })
        .filter((h): h is HeadingSnapshot => h !== null && h.tag !== "")
        .slice(0, 40)
    : [];

  const styleRules: StyleRuleSnapshot[] = Array.isArray(r.styleRules)
    ? (r.styleRules as unknown[])
        .map((entry) => {
          const item = entry as Record<string, unknown> | null;
          if (!item || typeof item.selector !== "string") return null;
          return {
            selector: item.selector,
            props: readStringArray(item.props, 60).map((p) => p.toLowerCase()),
            text: readString(item.text, ""),
          };
        })
        .filter((rule): rule is StyleRuleSnapshot => rule !== null)
        .slice(0, 120)
    : [];

  const bodyStyleRaw = (r.bodyStyle ?? {}) as Record<string, unknown>;
  const asCount = (value: unknown) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0;

  return {
    tagCounts,
    elementCount: asCount(r.elementCount),
    headings,
    headingTexts: headings.map((h) => h.text),
    buttonTexts: readStringArray(r.buttonTexts, 40),
    textContent: readString(r.textContent, ""),
    classNames: readStringArray(r.classNames, 80),
    ids: readStringArray(r.ids, 80),
    styleRules,
    styleProps: readStringArray(r.styleProps, 160).map((p) => p.toLowerCase()),
    bodyStyle: {
      backgroundColor: readString(bodyStyleRaw.backgroundColor, ""),
      color: readString(bodyStyleRaw.color, ""),
      fontFamily: readString(bodyStyleRaw.fontFamily, ""),
    },
    rootBackgroundColor: readString(r.rootBackgroundColor, ""),
    clickHandlerCount: asCount(r.clickHandlerCount),
    inlineClickCount: asCount(r.inlineClickCount),
  };
}

// ── Console model ───────────────────────────────────────────────────────────

type ConsoleLevel = "log" | "info" | "warn" | "error";
const CONSOLE_LEVELS: ConsoleLevel[] = ["log", "info", "warn", "error"];
const MAX_MESSAGES = 120;

interface ConsoleMessage {
  id: number;
  level: ConsoleLevel;
  text: string;
  repeats: number;
}

// ── Editor pane ─────────────────────────────────────────────────────────────

type PaneId = "html" | "css" | "js";

const PANES: { id: PaneId; label: string; dot: string; help: string }[] = [
  {
    id: "html",
    label: "HTML",
    dot: "bg-coral-500",
    help: "Structure — the content and the tags that hold it",
  },
  {
    id: "css",
    label: "CSS",
    dot: "bg-brand-500",
    help: "Style — colours, spacing and layout",
  },
  {
    id: "js",
    label: "JS",
    dot: "bg-bit-500",
    help: "Behaviour — what happens when something changes",
  },
];

function CodeEditor({
  paneId,
  value,
  onChange,
  trapActive,
  onEscape,
  onRearm,
}: {
  paneId: PaneId;
  value: string;
  onChange: (next: string) => void;
  trapActive: boolean;
  /** Esc is a one-shot escape hatch: the next Tab leaves the editor. */
  onEscape: () => void;
  /** Re-arms the tab trap when the student comes back to the editor. */
  onRearm: () => void;
}) {
  /** Replace [from,to) with `text`, keeping the browser's native undo history. */
  const applyEdit = useCallback(
    (
      el: HTMLTextAreaElement,
      from: number,
      to: number,
      text: string,
      selStart: number,
      selEnd: number,
    ) => {
      el.focus();
      el.setSelectionRange(from, to);
      let inserted = false;
      try {
        inserted = document.execCommand("insertText", false, text);
      } catch {
        inserted = false;
      }
      if (!inserted) {
        el.setRangeText(text, from, to, "end");
        onChange(el.value);
      }
      el.setSelectionRange(selStart, selEnd);
    },
    [onChange],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Escape") {
      onEscape();
      return;
    }
    if (event.key !== "Tab" || !trapActive) return;

    const el = event.currentTarget;
    const { value: text, selectionStart: start, selectionEnd: end } = el;
    const spansLines = text.slice(start, end).includes("\n");
    event.preventDefault();

    if (!spansLines && !event.shiftKey) {
      applyEdit(el, start, end, "  ", start + 2, start + 2);
      return;
    }

    const lineStart = text.lastIndexOf("\n", Math.max(0, start - 1)) + 1;
    const lines = text.slice(lineStart, end).split("\n");
    const next = event.shiftKey
      ? lines
          .map((line) =>
            line.startsWith("  ")
              ? line.slice(2)
              : line.startsWith(" ")
                ? line.slice(1)
                : line,
          )
          .join("\n")
      : lines.map((line) => "  " + line).join("\n");
    applyEdit(el, lineStart, end, next, lineStart, lineStart + next.length);
  };

  const lines = value.split("\n").length;

  return (
    <div>
      <textarea
        id={`weblab-pane-${paneId}`}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={onRearm}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        autoComplete="off"
        wrap="off"
        aria-label={`${paneId.toUpperCase()} code editor`}
        className="thin-scroll block h-64 w-full resize-y rounded-md border border-ink-800 bg-ink-950 p-3 font-mono text-[12.5px] leading-relaxed text-ink-100 caret-signal-400 selection:bg-brand-700/60 sm:h-80"
      />
      <p className="tnum mt-1 text-right font-mono text-[10.5px] text-ink-400">
        {lines} {lines === 1 ? "line" : "lines"}
      </p>
    </div>
  );
}

// ── Preview device sizes ────────────────────────────────────────────────────

type DeviceId = "mobile" | "tablet" | "full";

const DEVICES: {
  id: DeviceId;
  label: string;
  width: number | null;
  Icon: typeof Monitor;
}[] = [
  { id: "mobile", label: "Mobile", width: 375, Icon: Smartphone },
  { id: "tablet", label: "Tablet", width: 768, Icon: Tablet },
  { id: "full", label: "Full", width: null, Icon: Monitor },
];

function ToolbarToggle({
  active,
  onClick,
  label,
  srLabel,
  icon,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  srLabel: string;
  icon: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      aria-label={srLabel}
      className={cn(
        "inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold transition-colors",
        active
          ? "bg-ink-900 text-white"
          : "text-ink-500 hover:bg-ink-100 hover:text-ink-800",
      )}
    >
      <span className="[&>svg]:size-3.5" aria-hidden>
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}

// ── The lab ─────────────────────────────────────────────────────────────────

/**
 * The Web Lab — write HTML, CSS and JavaScript, watch the page build itself.
 * The preview runs in a script-only sandbox and reports back a snapshot of the
 * rendered document, which drives the live build checklist.
 */
export function WebLab({
  config,
  title = "Web Lab",
  brief,
  onComplete,
  completed,
}: {
  /**
   * Starter code and challenge tasks. Typed loosely because the lab registry
   * hands every lab the shared `LabConfig` union — the shape is validated at
   * runtime by `readConfig`.
   */
  config?: WebLabConfig | unknown;
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const resolved = useMemo(() => readConfig(config), [config]);
  const { tasks } = resolved;

  const [source, setSource] = useState<WebLabSource>({
    html: resolved.html,
    css: resolved.css,
    js: resolved.js,
  });
  const [committed, setCommitted] = useState<WebLabSource>(source);
  const [runNonce, setRunNonce] = useState(0);
  const [pane, setPane] = useState<PaneId>("html");
  const [view, setView] = useState<"split" | "preview">("split");
  const [device, setDevice] = useState<DeviceId>("full");
  const [messages, setMessages] = useState<ConsoleMessage[]>([]);
  const [snapshot, setSnapshot] = useState<PreviewSnapshot | null>(null);
  const [tabTrap, setTabTrap] = useState(true);
  const [escaped, setEscaped] = useState(false);
  const [openHint, setOpenHint] = useState<string | null>(null);

  const frameRef = useRef<HTMLIFrameElement>(null);
  const messageId = useRef(0);
  const firedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const { doc: srcDoc, jsLineOffset } = useMemo(
    () => buildDoc(committed, runNonce),
    [committed, runNonce],
  );
  const jsLineCount = committed.js.split("\n").length;
  const lineMapRef = useRef({ offset: jsLineOffset, count: jsLineCount });
  useEffect(() => {
    lineMapRef.current = { offset: jsLineOffset, count: jsLineCount };
  }, [jsLineOffset, jsLineCount]);

  const pending =
    committed.html !== source.html ||
    committed.css !== source.css ||
    committed.js !== source.js;

  // Debounce so typing never fights the renderer. Each new run starts the
  // console fresh, so what you read always belongs to the page you can see.
  useEffect(() => {
    if (!pending) return;
    const timer = setTimeout(() => {
      setCommitted(source);
      setMessages([]);
    }, 400);
    return () => clearTimeout(timer);
  }, [source, pending]);

  // Listen for console output and snapshots from the sandboxed preview.
  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const frame = frameRef.current;
      if (!frame || event.source !== frame.contentWindow) return;
      const data = event.data as Record<string, unknown> | null;
      if (!data || typeof data !== "object" || data.__zero1 !== true) return;

      if (data.type === "console") {
        const level = CONSOLE_LEVELS.includes(data.level as ConsoleLevel)
          ? (data.level as ConsoleLevel)
          : "log";
        let text = readString(data.text, "").slice(0, 4200);
        // Runtime errors arrive with a line number for the generated document;
        // only show it when it lands inside the student's JS pane.
        if (typeof data.line === "number" && data.line > 0) {
          const { offset, count } = lineMapRef.current;
          const jsLine = data.line - offset;
          if (jsLine >= 1 && jsLine <= count) {
            text += `  (JS line ${jsLine})`;
          }
        }
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last && last.level === level && last.text === text) {
            const next = prev.slice(0, -1);
            next.push({ ...last, repeats: last.repeats + 1 });
            return next;
          }
          messageId.current += 1;
          const next = [...prev, { id: messageId.current, level, text, repeats: 1 }];
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next;
        });
        return;
      }

      if (data.type === "snapshot") {
        const parsed = normalizeSnapshot(data.data);
        if (parsed) setSnapshot(parsed);
      }
    };
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  const results = useMemo(
    () =>
      tasks.map((task) => {
        let ok = false;
        if (snapshot) {
          try {
            ok = task.test(snapshot) === true;
          } catch {
            ok = false;
          }
        }
        return { task, ok };
      }),
    [tasks, snapshot],
  );

  const doneCount = results.filter((r) => r.ok).length;
  const edited =
    committed.html !== resolved.html ||
    committed.css !== resolved.css ||
    committed.js !== resolved.js;
  /**
   * With a checklist, finishing means every check passes. In free-play mode
   * (a lesson that deliberately ships no tasks) it means the student changed
   * the starter and the page rendered.
   */
  const finished =
    tasks.length > 0
      ? doneCount === tasks.length
      : edited && snapshot !== null;

  useEffect(() => {
    if (finished && !firedRef.current) {
      firedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [finished]);

  const errorCount = messages.filter((m) => m.level === "error").length;
  const trapActive = tabTrap && !escaped;

  const setPaneCode = (next: string) =>
    setSource((prev) => ({ ...prev, [pane]: next }));

  // Left/right arrows move between HTML, CSS and JS, as tablists should.
  const handleTabListKeys = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;
    if (step === 0) return;
    event.preventDefault();
    const index = PANES.findIndex((p) => p.id === pane);
    const nextPane = PANES[(index + step + PANES.length) % PANES.length];
    setPane(nextPane.id);
    requestAnimationFrame(() => {
      document.getElementById(`weblab-tab-${nextPane.id}`)?.focus();
    });
  };

  const reset = () => {
    setSource({ html: resolved.html, css: resolved.css, js: resolved.js });
    setCommitted({ html: resolved.html, css: resolved.css, js: resolved.js });
    setMessages([]);
    setSnapshot(null);
    setPane("html");
    setOpenHint(null);
    setEscaped(false);
    firedRef.current = false;
    setRunNonce((n) => n + 1);
  };

  const activePane = PANES.find((p) => p.id === pane) ?? PANES[0];
  const activeDevice = DEVICES.find((d) => d.id === device) ?? DEVICES[2];
  const hasTasks = tasks.length > 0;
  const editorSpan = "lg:col-span-5";
  const previewSpan =
    view === "split"
      ? hasTasks
        ? "lg:col-span-4"
        : "lg:col-span-7"
      : hasTasks
        ? "lg:col-span-9"
        : "lg:col-span-12";

  return (
    <LabShell
      title={title}
      brief={brief}
      onReset={reset}
      completed={completed || finished}
    >
      <div className="grid gap-4 lg:grid-cols-12">
        {/* ── Editor ─────────────────────────────────────────────────── */}
        {view === "split" && (
          <div className={cn("min-w-0", editorSpan)}>
            <div
              role="tablist"
              aria-label="Code panes"
              onKeyDown={handleTabListKeys}
              className="flex items-center gap-1 rounded-md bg-ink-50 p-1"
            >
              {PANES.map((p) => {
                const active = p.id === pane;
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="tab"
                    id={`weblab-tab-${p.id}`}
                    aria-selected={active}
                    aria-controls={active ? `weblab-panel-${p.id}` : undefined}
                    tabIndex={active ? 0 : -1}
                    onClick={() => setPane(p.id)}
                    className={cn(
                      "flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-sm px-2 py-1.5 font-mono text-[12.5px] font-semibold transition-colors",
                      active
                        ? "bg-ink-900 text-white shadow-card"
                        : "text-ink-500 hover:bg-white hover:text-ink-800",
                    )}
                  >
                    <span className={cn("size-1.5 rounded-full", p.dot)} aria-hidden />
                    {p.label}
                  </button>
                );
              })}
            </div>

            <p className="mt-2 mb-2 text-[12px] text-ink-500">{activePane.help}</p>

            <div
              role="tabpanel"
              id={`weblab-panel-${pane}`}
              aria-labelledby={`weblab-tab-${pane}`}
            >
              <CodeEditor
                key={pane}
                paneId={pane}
                value={source[pane]}
                onChange={setPaneCode}
                trapActive={trapActive}
                onEscape={() => setEscaped(true)}
                onRearm={() => setEscaped(false)}
              />
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
              <button
                type="button"
                onClick={() => {
                  setTabTrap((v) => !v);
                  setEscaped(false);
                }}
                aria-pressed={tabTrap}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
              >
                <Keyboard className="size-3.5" aria-hidden />
                {tabTrap ? "Tab inserts 2 spaces" : "Tab moves to the next control"}
              </button>
              {tabTrap && (
                <span className="text-[11.5px] text-ink-400">
                  Press Esc, then Tab, to step out of the editor.
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── Preview + console ──────────────────────────────────────── */}
        <div className={cn("min-w-0", previewSpan)}>
          <div className="mb-2 flex flex-wrap items-center gap-1.5">
            <ToolbarToggle
              active={view === "split"}
              onClick={() => setView("split")}
              label="Split"
              srLabel="Show the code editor beside the preview"
              icon={<Columns2 />}
            />
            <ToolbarToggle
              active={view === "preview"}
              onClick={() => setView("preview")}
              label="Preview"
              srLabel="Show the preview on its own"
              icon={<Eye />}
            />
            <span className="mx-1 hidden h-5 w-px bg-ink-200 sm:block" aria-hidden />
            {DEVICES.map((d) => (
              <ToolbarToggle
                key={d.id}
                active={device === d.id}
                onClick={() => setDevice(d.id)}
                label={d.label}
                srLabel={
                  d.width
                    ? `Preview at ${d.width} pixels wide (${d.label.toLowerCase()})`
                    : "Preview at full width"
                }
                icon={<d.Icon />}
              />
            ))}
            <button
              type="button"
              onClick={() => {
                setMessages([]);
                setRunNonce((n) => n + 1);
              }}
              aria-label="Run the page again from the start"
              className="ml-auto inline-flex cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-semibold text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              Re-run
            </button>
          </div>

          <div className="overflow-hidden rounded-lg border border-ink-200 bg-ink-50">
            <div className="flex items-center gap-2 border-b border-ink-200 px-3 py-1.5">
              <span className="font-mono text-[10px] tracking-[0.18em] text-ink-400 uppercase">
                Preview
              </span>
              <span className="tnum font-mono text-[10.5px] text-ink-400">
                {activeDevice.width ? `${activeDevice.width}px` : "full width"}
              </span>
              <span
                aria-live="polite"
                className={cn(
                  "ml-auto flex items-center gap-1.5 font-mono text-[10.5px]",
                  pending ? "text-bit-700" : "text-mint-700",
                )}
              >
                <span
                  className={cn(
                    "size-1.5 rounded-full",
                    pending ? "animate-blink bg-bit-500" : "bg-mint-500",
                  )}
                  aria-hidden
                />
                {pending ? "Updating…" : "Up to date"}
              </span>
            </div>
            <div className="thin-scroll overflow-x-auto bg-white">
              <div
                className="mx-auto"
                style={
                  activeDevice.width ? { width: `${activeDevice.width}px` } : undefined
                }
              >
                <iframe
                  ref={frameRef}
                  title="Live preview of your web page"
                  sandbox="allow-scripts"
                  srcDoc={srcDoc}
                  className="block h-72 w-full border-0 bg-white sm:h-96"
                />
              </div>
            </div>
          </div>

          {/* Console strip */}
          <div className="mt-3 overflow-hidden rounded-md border border-ink-200 bg-white">
            <div className="flex items-center gap-2 border-b border-ink-100 bg-ink-50/70 px-3 py-1.5">
              <Terminal className="size-3.5 text-ink-400" aria-hidden />
              <span className="font-mono text-[10px] tracking-[0.18em] text-ink-400 uppercase">
                Console
              </span>
              <span className="tnum rounded-full bg-ink-100 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-600">
                {messages.length}
              </span>
              {errorCount > 0 && (
                <span className="tnum inline-flex items-center gap-1 rounded-full bg-coral-100 px-1.5 py-0.5 font-mono text-[10.5px] text-coral-700">
                  <TriangleAlert className="size-3" aria-hidden />
                  {errorCount}
                </span>
              )}
              <button
                type="button"
                onClick={() => setMessages([])}
                aria-label="Clear the console"
                disabled={messages.length === 0}
                className="ml-auto inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-1 text-[11.5px] font-medium text-ink-500 transition-colors hover:bg-ink-100 hover:text-ink-800 disabled:pointer-events-none disabled:opacity-40"
              >
                <Trash2 className="size-3.5" aria-hidden />
                Clear
              </button>
            </div>
            <ul
              className="thin-scroll max-h-32 divide-y divide-ink-50 overflow-y-auto"
              aria-live="polite"
            >
              {messages.length === 0 ? (
                <li className="px-3 py-2 font-mono text-[11.5px] text-ink-400">
                  Nothing yet. Try console.log(&quot;hello&quot;) in the JS pane.
                </li>
              ) : (
                messages.map((m) => (
                  <li
                    key={m.id}
                    className={cn(
                      "flex items-start gap-2 px-3 py-1.5 font-mono text-[11.5px] leading-relaxed break-words whitespace-pre-wrap",
                      m.level === "error" && "bg-coral-100/40 text-coral-700",
                      m.level === "warn" && "bg-amber-100/40 text-amber-700",
                      (m.level === "log" || m.level === "info") && "text-ink-700",
                    )}
                  >
                    {m.level === "error" ? (
                      <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                    ) : (
                      <span className="mt-1.5 block size-1.5 shrink-0 rounded-full bg-ink-300" aria-hidden />
                    )}
                    <span className="min-w-0 flex-1">{m.text}</span>
                    {m.repeats > 1 && (
                      <span className="tnum shrink-0 rounded-full bg-ink-100 px-1.5 text-[10.5px] text-ink-500">
                        ×{m.repeats}
                      </span>
                    )}
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>

        {/* ── Checklist ──────────────────────────────────────────────── */}
        {hasTasks && (
          <div className="min-w-0 lg:col-span-3">
            <div className="flex items-baseline justify-between">
              <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">
                Build checklist
              </p>
              <p
                aria-live="polite"
                className="tnum font-mono text-[11px] text-ink-400"
              >
                {doneCount}/{tasks.length}
              </p>
            </div>
            <ul className="mt-2 space-y-1.5">
              {results.map(({ task, ok }) => {
                const hintOpen = openHint === task.id;
                return (
                  <li key={task.id}>
                    <div
                      className={cn(
                        "flex items-start gap-2 rounded-md px-2.5 py-2 text-[13px] font-medium transition-colors",
                        ok ? "bg-mint-100/60 text-mint-700" : "bg-ink-50 text-ink-600",
                      )}
                    >
                      {ok ? (
                        <Check className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      ) : (
                        <span
                          className="mt-1 block size-2 shrink-0 rounded-full border-2 border-ink-300"
                          aria-hidden
                        />
                      )}
                      <span className="min-w-0 flex-1">{task.label}</span>
                      <span className="sr-only">{ok ? "done" : "not yet"}</span>
                      {!ok && (
                        <button
                          type="button"
                          onClick={() => setOpenHint(hintOpen ? null : task.id)}
                          aria-expanded={hintOpen}
                          aria-controls={`weblab-hint-${task.id}`}
                          aria-label={`Hint for: ${task.label}`}
                          className={cn(
                            "-my-0.5 shrink-0 cursor-pointer rounded-md p-1 transition-colors",
                            hintOpen
                              ? "bg-bit-100 text-bit-700"
                              : "text-ink-400 hover:bg-ink-100 hover:text-ink-700",
                          )}
                        >
                          <Lightbulb className="size-3.5" aria-hidden />
                        </button>
                      )}
                    </div>
                    {!ok && hintOpen && (
                      <p
                        id={`weblab-hint-${task.id}`}
                        className="animate-fade-up mt-1 rounded-md border border-bit-200 bg-bit-50 px-2.5 py-2 text-[12px] leading-relaxed text-ink-700"
                      >
                        {task.hint}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>

            {finished ? (
              <p className="animate-pop mt-3 flex items-start gap-2 rounded-lg bg-mint-100 px-3 py-2.5 text-[13px] font-semibold text-mint-700">
                <Sparkles className="mt-0.5 size-4 shrink-0" aria-hidden />
                Every check passed — you built, styled and wired up a real web page.
                Now make it yours: new colours, a picture, another button.
              </p>
            ) : (
              <p className="mt-3 rounded-lg border border-ink-100 bg-white px-3 py-2.5 text-[12px] leading-relaxed text-ink-500">
                Checks update as you type. A red message in the console is not a
                failure — it is the browser telling you exactly where to look.
              </p>
            )}
          </div>
        )}
      </div>
    </LabShell>
  );
}
