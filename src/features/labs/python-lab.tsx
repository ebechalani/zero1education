"use client";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";
import {
  AlertTriangle,
  Check,
  CircleDashed,
  Download,
  Eraser,
  FileCode2,
  Lightbulb,
  ListChecks,
  Loader2,
  Play,
  RefreshCw,
  Terminal,
  WifiOff,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { LabShell } from "./lab-shell";

// ── Config ──────────────────────────────────────────────────────────────────

export interface PythonLabTest {
  id: string;
  /** What the student is being asked to make the program do */
  label: string;
  /** Text the program must print. Compared trimmed & case-sensitive. */
  expectedOutput: string;
}

export interface PythonLabConfig {
  /** Code the editor opens with (and returns to on Reset) */
  starter?: string;
  /** When present the lab runs in exercise mode with a live checklist */
  tests?: PythonLabTest[];
}

/** The first program a Grade 7 class actually gets given. */
export const PYTHON_LAB_STARTER = `# My first Python program.
# Anything after a # is a note for humans — Python ignores it.

name = "ZERO1 Explorer"        # a variable remembers a value
print("Hello, " + name + "!")

# A loop repeats work so you don't have to write it five times.
for step in range(1, 6):
    print("Step", step, "of 5")

print("Done. Change something above and press Run again!")
`;

// ── Pyodide runtime (loaded once per page, cached at module scope) ───────────

const PYODIDE_VERSION = "0.28.3";
const PYODIDE_BASE = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;
const PYODIDE_SCRIPT = `${PYODIDE_BASE}pyodide.js`;
const SCRIPT_TIMEOUT_MS = 45_000;

interface PyodideRuntime {
  runPythonAsync(code: string): Promise<unknown>;
  setStdout(options: { batched: (text: string) => void }): void;
  setStderr(options: { batched: (text: string) => void }): void;
  setStdin(options: { stdin: () => string | null; isatty?: boolean }): void;
}

type PyodideGlobal = typeof globalThis & {
  loadPyodide?: (options: { indexURL: string }) => Promise<PyodideRuntime>;
};

type LoadStage = "script" | "runtime" | "booting";

let runtime: PyodideRuntime | null = null;
let runtimeLoad: Promise<PyodideRuntime> | null = null;
let pythonVersion = "";

const stageListeners = new Set<(stage: LoadStage) => void>();
function emitStage(stage: LoadStage) {
  stageListeners.forEach((listener) => listener(stage));
}

/** Thrown when the interpreter itself could not be fetched — not a code error. */
class RuntimeLoadError extends Error {}

function injectPyodideScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof document === "undefined") {
      reject(new Error("Python needs a browser window to run in."));
      return;
    }
    if (typeof (globalThis as PyodideGlobal).loadPyodide === "function") {
      resolve();
      return;
    }
    // A previous attempt may have left a dead tag behind — start clean.
    document
      .querySelectorAll('script[data-zero1="pyodide"]')
      .forEach((node) => node.remove());

    const el = document.createElement("script");
    el.src = PYODIDE_SCRIPT;
    el.async = true;
    el.dataset.zero1 = "pyodide";

    const timer = setTimeout(() => {
      cleanup();
      el.remove();
      reject(new Error("The download did not finish in time."));
    }, SCRIPT_TIMEOUT_MS);

    const onLoad = () => {
      cleanup();
      resolve();
    };
    const onError = () => {
      cleanup();
      el.remove();
      reject(new Error("The request was blocked or the network is offline."));
    };
    function cleanup() {
      clearTimeout(timer);
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    }

    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);
    document.head.appendChild(el);
  });
}

async function bootRuntime(): Promise<PyodideRuntime> {
  emitStage("script");
  await injectPyodideScript();
  const factory = (globalThis as PyodideGlobal).loadPyodide;
  if (typeof factory !== "function") {
    throw new Error("The Python loader arrived but did not start.");
  }
  emitStage("runtime");
  const py = await factory({ indexURL: PYODIDE_BASE });
  emitStage("booting");
  try {
    const version = await py.runPythonAsync("import sys; sys.version.split(' ')[0]");
    pythonVersion = typeof version === "string" ? version : "";
  } catch {
    pythonVersion = "";
  }
  runtime = py;
  return py;
}

function loadRuntime(): Promise<PyodideRuntime> {
  if (runtime) return Promise.resolve(runtime);
  if (!runtimeLoad) {
    runtimeLoad = bootRuntime().catch((err: unknown) => {
      runtimeLoad = null;
      throw err;
    });
  }
  return runtimeLoad;
}

// ── Error interpretation ────────────────────────────────────────────────────

interface PyError {
  type: string;
  message: string;
  line: number | null;
  hint: string | null;
  traceback: string;
}

/**
 * Friendly one-liners for the mistakes every beginner makes. Matched on the
 * error type plus a peek at the message — a lookup, not a decision tree.
 */
const ERROR_HINTS: { when: (type: string, message: string) => boolean; hint: string }[] = [
  {
    when: (t) => t === "IndentationError" || t === "TabError",
    hint: "Python reads your spacing. Every line inside a for, while, if or def needs the same indent — four spaces is the habit to build.",
  },
  {
    when: (t) => t === "SyntaxError",
    hint: "Python got lost reading this line. Check for a missing colon at the end of an if / for / while / def line, and make sure every ( [ \" has a partner.",
  },
  {
    when: (t) => t === "NameError",
    hint: "You used a name Python has not met yet. Create it before you use it — and check the spelling, because score and Score are two different names.",
  },
  {
    when: (t, m) =>
      t === "TypeError" &&
      /can only concatenate str|unsupported operand type|must be str|not all arguments converted/i.test(m),
    hint: 'You joined text and a number with +. Turn the number into text with str(age), or use an f-string: print(f"I am {age}").',
  },
  {
    when: (t) => t === "TypeError",
    hint: "This value is not the kind Python expected here. Print it first to see what it really is — often it is text where a number was needed.",
  },
  {
    when: (t) => t === "ZeroDivisionError",
    hint: "Nothing can be split into zero parts. Check the number you are dividing by before you divide.",
  },
  {
    when: (t) => t === "IndexError",
    hint: "You asked for a position that is not in the list. Remember counting starts at 0, so a list of 3 items has positions 0, 1 and 2.",
  },
  {
    when: (t) => t === "KeyError",
    hint: "That key is not in the dictionary. Check the spelling, or use .get(key) to ask safely.",
  },
  {
    when: (t, m) => t === "ValueError" && /invalid literal for int/i.test(m),
    hint: "int() can only convert text that is entirely digits. Something like \"12 apples\" or an empty answer will not convert.",
  },
  {
    when: (t) => t === "ModuleNotFoundError" || t === "ImportError",
    hint: "That module is not available in the browser version of Python. Try solving it with the built-in tools instead.",
  },
  {
    when: (t) => t === "EOFError",
    hint: "Your program asked for input() but no answer was given. Run it again and type something into the box.",
  },
  {
    when: (t) => t === "RecursionError",
    hint: "A function kept calling itself with no way to stop. Give it a base case that returns without calling itself again.",
  },
  {
    when: (t) => t === "AttributeError",
    hint: "That value does not have the thing you asked for after the dot. Check the spelling, and check what kind of value it actually is.",
  },
];

function interpret(raw: string): PyError {
  const traceback = raw.trim();
  const lines = traceback.split("\n").filter((l) => l.trim().length > 0);
  const pattern = /^([A-Za-z_][\w.]*(?:Error|Exception|Exit|Interrupt|Warning))(?::\s*(.*))?$/;

  let type = "Error";
  let message = lines[lines.length - 1] ?? traceback;
  for (let i = lines.length - 1; i >= 0; i--) {
    const match = pattern.exec(lines[i].trim());
    if (match) {
      type = match[1].includes(".") ? match[1].split(".").pop()! : match[1];
      message = (match[2] ?? "").trim();
      break;
    }
  }

  // Only the frames from the student's own code carry a useful line number.
  let line: number | null = null;
  const frames = traceback.matchAll(/File "(?:<exec>|<string>|<stdin>)", line (\d+)/g);
  for (const frame of frames) line = Number(frame[1]);

  const hint = ERROR_HINTS.find((h) => h.when(type, message))?.hint ?? null;
  return { type, message, line, hint, traceback };
}

// ── Output comparison ───────────────────────────────────────────────────────

/** Trim trailing spaces per line, drop blank lines top and bottom. Case-sensitive. */
function normalizeOutput(text: string): string {
  return text
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.replace(/[ \t]+$/, ""))
    .join("\n")
    .replace(/^\n+/, "")
    .replace(/\n+$/, "");
}

function outputMatches(actual: string, expected: string): boolean {
  const a = normalizeOutput(actual);
  const e = normalizeOutput(expected);
  if (e.length === 0) return false;
  if (a === e) return true;
  // Also accept the expected block appearing inside a longer transcript, so a
  // single program can satisfy several checks at once.
  const actualLines = a.split("\n");
  const expectedLines = e.split("\n");
  if (expectedLines.length > actualLines.length) return false;
  for (let i = 0; i <= actualLines.length - expectedLines.length; i++) {
    if (expectedLines.every((l, j) => actualLines[i + j] === l)) return true;
  }
  return false;
}

// ── Console model ───────────────────────────────────────────────────────────

type Stream = "out" | "err" | "in" | "note";
interface OutputLine {
  stream: Stream;
  text: string;
}

const MAX_OUTPUT_LINES = 4000;
const MAX_LINE_CHARS = 2000;

const STAGE_COPY: Record<LoadStage, { title: string; detail: string }> = {
  script: {
    title: "Fetching the Python loader",
    detail: "A small file that knows how to start a real Python interpreter.",
  },
  runtime: {
    title: "Downloading Python… this happens once",
    detail:
      "About 10 MB. On a slow school connection this can take a minute — after that your browser keeps it, and every Run is instant.",
  },
  booting: {
    title: "Starting the interpreter",
    detail: "Unpacking the standard library and warming Python up.",
  },
};

/**
 * The ZERO1 Python Lab — a genuine CPython interpreter compiled to
 * WebAssembly, running entirely in the student's browser. No server, no
 * account, no install. Errors are treated as information: every traceback
 * gets a plain-English interpretation next to it.
 */
export function PythonLab({
  config,
  title = "Python Lab",
  brief,
  onComplete,
  completed,
}: {
  config?: PythonLabConfig;
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const starter = config?.starter ?? PYTHON_LAB_STARTER;
  const tests = useMemo(() => config?.tests ?? [], [config]);

  const [source, setSource] = useState(starter);
  const [output, setOutput] = useState<OutputLine[]>([]);
  const [pyError, setPyError] = useState<PyError | null>(null);
  const [phase, setPhase] = useState<"idle" | "loading" | "ready" | "blocked">(
    runtime ? "ready" : "idle",
  );
  const [stage, setStage] = useState<LoadStage>("script");
  const [elapsed, setElapsed] = useState(0);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [lastRunMs, setLastRunMs] = useState<number | null>(null);
  const [passed, setPassed] = useState<Record<string, boolean> | null>(null);
  const [lastStdout, setLastStdout] = useState("");
  const [ranOnce, setRanOnce] = useState(false);
  const [runErrored, setRunErrored] = useState(false);

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);
  const consoleRef = useRef<HTMLDivElement>(null);
  const escapedRef = useRef(false);
  const pendingSelectionRef = useRef<[number, number] | null>(null);
  const runningRef = useRef(false);
  const firedRef = useRef(false);
  const loadStartRef = useRef(0);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  // Honest progress: no fake percentage, just which step and how long so far.
  useEffect(() => {
    if (phase !== "loading") return;
    const startedAt = loadStartRef.current;
    const id = setInterval(
      () => setElapsed(Math.floor((Date.now() - startedAt) / 1000)),
      1000,
    );
    return () => clearInterval(id);
  }, [phase]);

  // Restore the caret after an edit that could not use the native undo path.
  useEffect(() => {
    const selection = pendingSelectionRef.current;
    if (!selection || !editorRef.current) return;
    pendingSelectionRef.current = null;
    editorRef.current.setSelectionRange(selection[0], selection[1]);
  }, [source]);

  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [output, pyError]);

  const lineCount = useMemo(() => source.split("\n").length, [source]);

  // A while True with no way out will freeze the tab — say so before they run.
  const loopWarning = useMemo(() => {
    const code = source.replace(/#.*$/gm, "");
    return /\bwhile\s+(True|1)\s*:/.test(code) && !/\bbreak\b/.test(code);
  }, [source]);

  const outputsMatch =
    tests.length > 0 && passed !== null && tests.every((t) => passed[t.id]);
  // Printing the right lines and then crashing is not a finished program.
  const allPass = outputsMatch && !runErrored;
  const passCount =
    passed === null ? 0 : tests.filter((t) => passed[t.id]).length;

  // ── Editing ───────────────────────────────────────────────────────────────

  /** Replace [start, end) with text, keeping native undo whenever possible. */
  const applyEdit = (
    area: HTMLTextAreaElement,
    start: number,
    end: number,
    text: string,
    selectionStart: number,
    selectionEnd: number,
  ) => {
    if (text.length > 0) {
      area.setSelectionRange(start, end);
      let inserted = false;
      try {
        inserted = document.execCommand("insertText", false, text);
      } catch {
        inserted = false;
      }
      if (inserted) {
        area.setSelectionRange(selectionStart, selectionEnd);
        setSource(area.value);
        return;
      }
    }
    const next = area.value.slice(0, start) + text + area.value.slice(end);
    pendingSelectionRef.current = [selectionStart, selectionEnd];
    setSource(next);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const area = event.currentTarget;
    const { selectionStart: from, selectionEnd: to, value } = area;

    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void run();
      return;
    }

    if (event.key === "Escape") {
      // Escape then Tab leaves the editor — the tab trap always has a door.
      escapedRef.current = true;
      return;
    }

    if (event.key === "Tab") {
      if (escapedRef.current) {
        escapedRef.current = false;
        return;
      }
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", from - 1) + 1;

      if (event.shiftKey || from !== to) {
        const blockEnd = to > from ? to : from;
        const block = value.slice(lineStart, blockEnd);
        // A selection ending on a line break must not indent the next line.
        const tail = block.endsWith("\n") ? "\n" : "";
        const body = tail ? block.slice(0, -1) : block;
        const next =
          (event.shiftKey
            ? body.replace(/^ {1,4}/gm, "")
            : body.replace(/^/gm, "    ")) + tail;
        const delta = next.length - block.length;
        const firstLineDelta = event.shiftKey
          ? -Math.min(4, /^ */.exec(block)![0].length)
          : 4;
        applyEdit(
          area,
          lineStart,
          blockEnd,
          next,
          Math.max(lineStart, from + firstLineDelta),
          Math.max(lineStart, to + delta),
        );
        return;
      }

      applyEdit(area, from, to, "    ", from + 4, from + 4);
      return;
    }

    escapedRef.current = false;

    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      const lineStart = value.lastIndexOf("\n", from - 1) + 1;
      const current = value.slice(lineStart, from);
      const indent = /^[ \t]*/.exec(current)![0];
      // A line ending in ":" opens a block, so start the next one indented.
      const opensBlock = /:\s*$/.test(current.replace(/#.*$/, ""));
      const insert = `\n${indent}${opensBlock ? "    " : ""}`;
      applyEdit(area, from, to, insert, from + insert.length, from + insert.length);
    }
  };

  // ── Running ───────────────────────────────────────────────────────────────

  const run = async () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setRunning(true);
    setPyError(null);
    setLastRunMs(null);

    const collected: OutputLine[] = [];
    let truncated = false;
    const push = (stream: Stream, text: string) => {
      if (collected.length >= MAX_OUTPUT_LINES) {
        truncated = true;
        return;
      }
      collected.push({
        stream,
        text:
          text.length > MAX_LINE_CHARS
            ? `${text.slice(0, MAX_LINE_CHARS)} …(line shortened)`
            : text,
      });
    };
    const pushChunk = (stream: Stream, chunk: string) => {
      const parts = chunk.replace(/\r\n?/g, "\n").split("\n");
      if (parts.length > 1 && parts[parts.length - 1] === "") parts.pop();
      parts.forEach((part) => push(stream, part));
    };

    try {
      let py: PyodideRuntime;
      try {
        if (!runtime) {
          loadStartRef.current = Date.now();
          setElapsed(0);
          setPhase("loading");
          setLoadError(null);
          setStage("script");
          stageListeners.add(setStage);
        }
        py = await loadRuntime();
        setPhase("ready");
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setLoadError(detail);
        setPhase("blocked");
        throw new RuntimeLoadError(detail);
      } finally {
        stageListeners.delete(setStage);
      }

      py.setStdout({ batched: (text) => pushChunk("out", text) });
      py.setStderr({ batched: (text) => pushChunk("err", text) });
      try {
        py.setStdin({
          isatty: false,
          stdin: () => {
            const answer = window.prompt("Your program is asking for input:");
            if (answer === null) return null;
            push("in", answer);
            return answer;
          },
        });
      } catch {
        // Older builds without setStdin: input() simply raises EOFError,
        // which the hint table already explains.
      }

      const startedAt = performance.now();
      let result: unknown;
      let errored = false;
      try {
        result = await py.runPythonAsync(source);
        setLastRunMs(Math.round(performance.now() - startedAt));
      } catch (err) {
        errored = true;
        setLastRunMs(Math.round(performance.now() - startedAt));
        setPyError(interpret(err instanceof Error ? err.message : String(err)));
      }
      setRunErrored(errored);
      const proxy = result as { destroy?: () => void } | null;
      if (proxy && typeof proxy.destroy === "function") proxy.destroy();

      if (truncated) {
        push(
          "note",
          `Output stopped after ${MAX_OUTPUT_LINES} lines — that is usually a loop printing more than you meant it to.`,
        );
      }

      const stdout = collected
        .filter((l) => l.stream === "out")
        .map((l) => l.text)
        .join("\n");

      setOutput(collected);
      setLastStdout(stdout);
      setRanOnce(true);

      if (tests.length > 0) {
        const next: Record<string, boolean> = {};
        tests.forEach((t) => {
          next[t.id] = outputMatches(stdout, t.expectedOutput);
        });
        setPassed(next);
        if (!errored && tests.every((t) => next[t.id]) && !firedRef.current) {
          firedRef.current = true;
          onCompleteRef.current?.();
        }
      } else if (!errored && stdout.trim().length > 0 && !firedRef.current) {
        // Sandbox mode: writing a program that runs and prints is the finish line.
        firedRef.current = true;
        onCompleteRef.current?.();
      }
    } catch (err) {
      if (!(err instanceof RuntimeLoadError)) {
        push("note", err instanceof Error ? err.message : String(err));
        setOutput(collected);
      }
    } finally {
      runningRef.current = false;
      setRunning(false);
    }
  };

  const reset = () => {
    setSource(starter);
    setOutput([]);
    setPyError(null);
    setPassed(null);
    setLastStdout("");
    setLastRunMs(null);
    setRanOnce(false);
    setRunErrored(false);
    editorRef.current?.focus();
  };

  const busy = running || phase === "loading";
  const statusMessage = running
    ? "Running your program"
    : pyError
      ? `${pyError.type}: ${pyError.message}`
      : ranOnce
        ? `Program finished with ${output.length} line${output.length === 1 ? "" : "s"} of output`
        : "";

  return (
    <LabShell
      title={title}
      brief={brief}
      onReset={reset}
      completed={completed || allPass}
      footer={
        <p className="text-[12.5px] leading-relaxed text-ink-500">
          Python runs <strong className="font-semibold text-ink-700">inside your browser</strong> —
          your code never leaves this device, and the interpreter downloads once
          then stays cached. There is no Stop button, and that is honest rather
          than lazy: Python runs on the same thread as the page, so a loop that
          never ends will freeze this tab and the only cure is reloading the
          page. Give every <code className="font-mono text-ink-700">while True</code> a
          way out.
        </p>
      }
    >
      <p role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </p>

      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <Button
          onClick={() => void run()}
          disabled={busy}
          icon={
            busy ? <Loader2 className="animate-spin" /> : <Play />
          }
        >
          {phase === "loading" ? "Downloading Python…" : running ? "Running…" : "Run"}
        </Button>

        {phase === "ready" && !running && (
          <Chip tone="mint" icon={<Check />}>
            Python {pythonVersion || "3"} ready
          </Chip>
        )}
        {phase === "idle" && (
          <span className="text-[12.5px] text-ink-400">
            First Run downloads Python (about 10 MB) — after that it is instant.
          </span>
        )}
        {phase === "blocked" && !running && (
          <Chip tone="coral" icon={<WifiOff />}>
            Python unavailable
          </Chip>
        )}

        <div className="ml-auto flex items-center gap-2">
          {lastRunMs !== null && !running && (
            <span className="tnum font-mono text-[11px] text-ink-400">
              ran in {lastRunMs} ms
            </span>
          )}
          <button
            type="button"
            onClick={() => {
              setOutput([]);
              setPyError(null);
            }}
            disabled={output.length === 0 && !pyError}
            aria-label="Clear the output pane"
            className="flex size-8 cursor-pointer items-center justify-center rounded-md border border-ink-200 bg-white text-ink-500 transition-colors hover:border-ink-300 hover:text-ink-700 disabled:pointer-events-none disabled:opacity-40"
          >
            <Eraser className="size-4" />
          </button>
        </div>
      </div>

      {loopWarning && (
        <div className="mb-3 flex items-start gap-2 rounded-md border border-amber-500/40 bg-amber-100 px-3 py-2 text-[13px] leading-relaxed text-amber-700">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <span>
            Heads up: this loop may never end — add a{" "}
            <code className="font-mono font-semibold">break</code> so it can
            finish. You can still run it, but a runaway loop freezes the page
            until you reload.
          </span>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Editor */}
        <div className="overflow-hidden rounded-lg border border-ink-800 bg-ink-950">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <FileCode2 className="size-3.5 text-signal-400" />
            <span className="font-mono text-[11px] tracking-wider text-ink-300">
              main.py
            </span>
            <span className="tnum ml-auto font-mono text-[10px] text-ink-300">
              {lineCount} {lineCount === 1 ? "line" : "lines"}
            </span>
          </div>
          <div className="flex h-[300px] sm:h-[360px]">
            <div
              ref={gutterRef}
              aria-hidden
              className="w-11 shrink-0 overflow-hidden border-r border-white/10 bg-white/[0.03] py-3 pr-2 text-right select-none"
            >
              {Array.from({ length: lineCount }, (_, i) => i + 1).map((n) => (
                <div
                  key={n}
                  className={cn(
                    "tnum font-mono text-[13px] leading-[22px]",
                    pyError?.line === n
                      ? "font-bold text-coral-500"
                      : "text-ink-400",
                  )}
                >
                  {n}
                </div>
              ))}
            </div>
            <textarea
              ref={editorRef}
              value={source}
              onChange={(e) => setSource(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                escapedRef.current = false;
              }}
              onScroll={(e) => {
                if (gutterRef.current) {
                  gutterRef.current.scrollTop = e.currentTarget.scrollTop;
                }
              }}
              spellCheck={false}
              autoCorrect="off"
              autoCapitalize="off"
              autoComplete="off"
              wrap="off"
              aria-label="Python code editor"
              className="thin-scroll h-full flex-1 resize-none bg-transparent px-3 py-3 font-mono text-[13px] leading-[22px] text-ink-50 caret-signal-400 outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-white/10 px-3 py-2 font-mono text-[10.5px] text-ink-300">
            <span>Tab = 4 spaces</span>
            <span>Shift+Tab = un-indent</span>
            <span>Ctrl/⌘ + Enter = Run</span>
            <span>Esc then Tab leaves the editor</span>
          </div>
        </div>

        {/* Console */}
        <div className="overflow-hidden rounded-lg border border-ink-800 bg-ink-900">
          <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
            <Terminal className="size-3.5 text-signal-400" />
            <span className="font-mono text-[11px] tracking-wider text-ink-300">
              Output
            </span>
          </div>
          <div
            ref={consoleRef}
            className="thin-scroll h-[300px] overflow-auto sm:h-[360px]"
          >
            {phase === "loading" ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <Download className="size-6 text-signal-400" />
                <p className="font-display text-sm font-semibold text-white">
                  {STAGE_COPY[stage].title}
                </p>
                <p className="max-w-xs text-[12.5px] leading-relaxed text-ink-300">
                  {STAGE_COPY[stage].detail}
                </p>
                <div className="skeleton h-1.5 w-full max-w-xs rounded-full" />
                <p className="tnum font-mono text-[11px] text-ink-300">
                  {elapsed}s so far
                </p>
              </div>
            ) : phase === "blocked" ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                <WifiOff className="size-6 text-coral-500" />
                <p className="font-display text-sm font-semibold text-white">
                  Python could not be downloaded
                </p>
                <p className="max-w-sm text-[12.5px] leading-relaxed text-ink-300">
                  This lab runs a real Python interpreter inside your browser,
                  so it needs one download the first time — about 10 MB. That
                  download did not arrive, usually because the device is offline
                  or a school network filter blocked it. Your code is safe: it is
                  still in the editor.
                </p>
                {loadError && (
                  <p className="font-mono text-[11px] text-ink-300">{loadError}</p>
                )}
                <Button
                  size="sm"
                  variant="secondary"
                  icon={<RefreshCw />}
                  onClick={() => void run()}
                >
                  Try again
                </Button>
              </div>
            ) : output.length === 0 && !pyError ? (
              <div className="flex h-full flex-col items-center justify-center gap-2 px-6 text-center">
                <Terminal className="size-6 text-ink-400" />
                <p className="text-[13px] text-ink-200">
                  Press <span className="font-semibold text-white">Run</span> to
                  execute your program.
                </p>
                <p className="max-w-xs text-[12px] leading-relaxed text-ink-300">
                  Whatever your code prints shows up here.
                </p>
              </div>
            ) : (
              <div className="px-3 py-3">
                {output.map((line, i) => (
                  <p
                    key={i}
                    className={cn(
                      "font-mono text-[13px] leading-[22px] break-words whitespace-pre-wrap",
                      line.stream === "out" && "text-ink-100",
                      line.stream === "err" && "text-amber-500",
                      line.stream === "in" && "text-signal-300",
                      line.stream === "note" && "text-ink-300 italic",
                    )}
                  >
                    {line.stream === "in" ? `› ${line.text}` : line.text || " "}
                  </p>
                ))}

                {pyError && (
                  <div className="animate-fade-up mt-3 rounded-md border border-coral-500/40 bg-coral-500/10 p-3">
                    <p className="flex items-center gap-1.5 font-mono text-[12.5px] font-bold text-coral-500">
                      <X className="size-3.5" />
                      {pyError.type}
                      {pyError.line !== null && (
                        <span className="tnum font-normal text-coral-500/80">
                          · line {pyError.line}
                        </span>
                      )}
                    </p>
                    <p className="mt-1 font-mono text-[12.5px] leading-relaxed break-words text-coral-100">
                      {pyError.message || "Python stopped here."}
                    </p>
                    {pyError.hint && (
                      <p className="mt-2.5 flex items-start gap-1.5 text-[12.5px] leading-relaxed text-ink-200">
                        <Lightbulb className="mt-0.5 size-3.5 shrink-0 text-bit-400" />
                        <span>{pyError.hint}</span>
                      </p>
                    )}
                    <details className="mt-2.5">
                      <summary className="cursor-pointer font-mono text-[11px] text-ink-300 hover:text-white">
                        Show the full traceback
                      </summary>
                      <pre className="thin-scroll mt-1.5 overflow-x-auto font-mono text-[11px] leading-[18px] text-ink-300">
                        {pyError.traceback}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exercise checklist */}
      {tests.length > 0 && (
        <div className="mt-4 rounded-lg border border-ink-100 bg-ink-50/60 p-3.5">
          <div className="mb-2.5 flex items-center gap-2">
            <ListChecks className="size-4 text-ink-400" />
            <p className="text-xs font-bold tracking-wide text-ink-500 uppercase">
              What your program must do
            </p>
            <span className="tnum ml-auto font-mono text-xs text-ink-400">
              {passCount}/{tests.length} passing
            </span>
          </div>
          <ul className="space-y-1.5">
            {tests.map((test) => {
              const state =
                passed === null ? "pending" : passed[test.id] ? "pass" : "fail";
              return (
                <li
                  key={test.id}
                  className={cn(
                    "rounded-md px-2.5 py-2 text-[13px]",
                    state === "pass" && "bg-mint-100/70 text-mint-700",
                    state === "fail" && "bg-coral-100/60 text-coral-700",
                    state === "pending" &&
                      "border border-ink-100 bg-white text-ink-500",
                  )}
                >
                  <div className="flex items-start gap-2 font-medium">
                    {state === "pass" ? (
                      <Check className="mt-0.5 size-3.5 shrink-0" />
                    ) : state === "fail" ? (
                      <X className="mt-0.5 size-3.5 shrink-0" />
                    ) : (
                      <CircleDashed className="mt-0.5 size-3.5 shrink-0 text-ink-300" />
                    )}
                    <span>{test.label}</span>
                  </div>
                  {state === "fail" && (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <div>
                        <p className="mb-1 font-mono text-[10px] tracking-wider text-ink-400 uppercase">
                          Expected
                        </p>
                        <pre className="thin-scroll overflow-x-auto rounded-md border border-ink-100 bg-white px-2.5 py-2 font-mono text-[12px] leading-5 text-ink-700">
                          {normalizeOutput(test.expectedOutput)}
                        </pre>
                      </div>
                      <div>
                        <p className="mb-1 font-mono text-[10px] tracking-wider text-ink-400 uppercase">
                          Your output
                        </p>
                        <pre className="thin-scroll overflow-x-auto rounded-md border border-ink-100 bg-white px-2.5 py-2 font-mono text-[12px] leading-5 text-ink-700">
                          {normalizeOutput(lastStdout) ||
                            "(your program printed nothing)"}
                        </pre>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {allPass ? (
            <p className="animate-pop mt-3 rounded-lg bg-mint-100 px-3 py-2.5 text-center text-sm font-bold text-mint-700">
              Every check passes — your program does exactly what it was asked
              to do. 🎉
            </p>
          ) : outputsMatch && runErrored ? (
            <p className="mt-3 rounded-lg bg-amber-100 px-3 py-2.5 text-center text-[13px] font-medium text-amber-700">
              Your output is exactly right, but the program stopped with an
              error before it finished. Fix the error shown in the output pane
              and run it once more.
            </p>
          ) : (
            passed !== null && (
              <p className="mt-3 text-center text-[12.5px] text-ink-500">
                Not there yet — and that is fine. Compare the two boxes above
                line by line; the difference is the clue.
              </p>
            )
          )}
        </div>
      )}

      {tests.length === 0 && ranOnce && !pyError && (
        <p className="mt-3 text-[12.5px] text-ink-500">
          That is real Python — the same language used to build search engines,
          telescopes and games. Change a value, run it again, and watch what
          moves.
        </p>
      )}
    </LabShell>
  );
}
