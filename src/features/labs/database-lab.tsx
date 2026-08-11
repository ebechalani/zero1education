"use client";

import { cn } from "@/lib/utils";
import {
  Check,
  ChevronDown,
  ChevronRight,
  Database,
  KeyRound,
  Lightbulb,
  Link2,
  ListChecks,
  Play,
  Rows3,
  SearchX,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { LabShell } from "./lab-shell";
import {
  runQuery,
  SCHOOL_DB,
  type QueryOutcome,
  type SqlValue,
  type TableDef,
} from "./sql-mini";

export {
  SCHOOL_DB,
  runQuery,
  type SqlDatabase,
  type SqlValue,
  type TableDef,
  type ColumnDef,
  type ResultSet,
  type QueryOutcome,
} from "./sql-mini";

// ── Config ──────────────────────────────────────────────────────────────────

export interface DatabaseChallenge {
  id: string;
  /** What the student is being asked to find out, in plain language. */
  ask: string;
  /** Number of rows a correct answer returns. */
  expectedRows: number;
  /** Keywords the query must contain (matched case-insensitively). */
  mustInclude?: string[];
  /** Optional nudge — only ever shown when the student asks for it. */
  hint?: string;
}

export interface DatabaseLabConfig {
  challenges?: DatabaseChallenge[];
  /** Query the editor opens with. */
  starter?: string;
}

const DEFAULT_STARTER = "SELECT *\nFROM students;";

const DEFAULT_CHALLENGES: DatabaseChallenge[] = [
  {
    id: "browse",
    ask: "Open the students table and look at every row.",
    expectedRows: 12,
    mustInclude: ["select", "from students"],
    hint: "SELECT * FROM students;  —  the star means “every column”.",
  },
  {
    id: "filter",
    ask: "Narrow it down to the students in grade 10.",
    expectedRows: 4,
    mustInclude: ["from students", "where", "grade"],
    hint: "Add a condition on the end: WHERE grade = 10",
  },
  {
    id: "join",
    ask: "Show each student beside the name of their class.",
    expectedRows: 11,
    mustInclude: ["join", "on"],
    hint: "FROM students s INNER JOIN classes c ON s.class_id = c.id — you get 11 rows, not 12, because one student has no class yet.",
  },
  {
    id: "group",
    ask: "Work out the average score in each grade level.",
    expectedRows: 3,
    mustInclude: ["avg", "group by"],
    hint: "Join students to grades on s.id = g.student_id, then AVG(g.score) with GROUP BY s.grade.",
  },
  {
    id: "top",
    ask: "Find the three highest marks in the school, best first.",
    expectedRows: 3,
    mustInclude: ["order by", "desc", "limit"],
    hint: "Sort the grades table: ORDER BY score DESC LIMIT 3",
  },
];

interface ExampleQuery {
  label: string;
  sql: string;
}

/** The syntax tour — each chip is labelled by the idea it teaches. */
const EXAMPLES: ExampleQuery[] = [
  { label: "See a whole table", sql: "SELECT *\nFROM classes;" },
  {
    label: "Pick columns & rename",
    sql: "SELECT first_name AS name, grade\nFROM students;",
  },
  {
    label: "Filter with WHERE",
    sql: "SELECT *\nFROM students\nWHERE grade = 10;",
  },
  {
    label: "Two conditions with AND",
    sql: "SELECT *\nFROM grades\nWHERE subject = 'ICT' AND score >= 85;",
  },
  {
    label: "Search with LIKE",
    sql: "SELECT *\nFROM students\nWHERE last_name LIKE 'H%';",
  },
  {
    label: "Match a list with IN",
    sql: "SELECT *\nFROM students\nWHERE grade IN (9, 11);",
  },
  {
    label: "Find the empty cells",
    sql: "SELECT *\nFROM students\nWHERE class_id IS NULL;",
  },
  {
    label: "Sort and take the top",
    sql: "SELECT *\nFROM grades\nORDER BY score DESC\nLIMIT 5;",
  },
  {
    label: "Join two tables",
    sql: "SELECT s.first_name, s.last_name, c.name AS class\nFROM students s\nINNER JOIN classes c ON s.class_id = c.id;",
  },
  {
    label: "Count the rows",
    sql: "SELECT COUNT(*) AS students, COUNT(class_id) AS placed\nFROM students;",
  },
  {
    label: "Average per grade",
    sql: "SELECT s.grade, AVG(g.score) AS avg_score\nFROM students s\nINNER JOIN grades g ON s.id = g.student_id\nGROUP BY s.grade;",
  },
  {
    label: "Filter groups with HAVING",
    sql: "SELECT subject, AVG(score) AS avg_score\nFROM grades\nGROUP BY subject\nHAVING AVG(score) > 78;",
  },
];

const SUPPORTED_SYNTAX = [
  "SELECT … AS",
  "FROM … alias",
  "INNER JOIN … ON",
  "WHERE",
  "AND / OR / NOT",
  "= != > < >= <=",
  "LIKE '%…'",
  "IN (…)",
  "IS NULL",
  "GROUP BY",
  "HAVING",
  "ORDER BY … DESC",
  "LIMIT",
  "COUNT AVG SUM MIN MAX",
];

// ── Query-text matching for challenges ──────────────────────────────────────

/** Lower-case, drop comments, and space out operators so keywords match. */
function normalizeQuery(sql: string): string {
  return sql
    .replace(/--[^\n]*/g, " ")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/(<=|>=|<>|!=|[=<>(),*])/g, " $1 ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function containsToken(normalized: string, token: string): boolean {
  const needle = token.trim().toLowerCase();
  if (!needle) return true;
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const before = /^\w/.test(needle) ? "\\b" : "";
  const after = /\w$/.test(needle) ? "\\b" : "";
  return new RegExp(`${before}${escaped}${after}`).test(normalized);
}

// ── Syntax highlighting (a decorative layer behind the textarea) ─────────────

const HIGHLIGHT_SPLIT =
  /('(?:[^']|'')*'|"(?:[^"]|"")*"|--[^\n]*|\/\*[\s\S]*?\*\/|\b\d+(?:\.\d+)?\b|[A-Za-z_][A-Za-z0-9_]*)/;

const HL_KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "HAVING", "ORDER", "LIMIT", "AS",
  "INNER", "JOIN", "ON", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE",
  "ASC", "DESC", "DISTINCT",
]);
const HL_FUNCS = new Set(["COUNT", "AVG", "SUM", "MIN", "MAX"]);

function highlightSql(sql: string): ReactNode[] {
  return sql.split(HIGHLIGHT_SPLIT).map((part, index) => {
    if (!part) return null;
    // Odd indexes are the captured tokens; even indexes are the gaps between.
    if (index % 2 === 0)
      return (
        <span key={index} className="text-ink-300">
          {part}
        </span>
      );
    let tone = "text-ink-100";
    if (part.startsWith("--") || part.startsWith("/*")) tone = "text-ink-400 italic";
    else if (part.startsWith("'") || part.startsWith('"')) tone = "text-mint-500";
    else if (/^\d/.test(part)) tone = "text-bit-300";
    else if (HL_KEYWORDS.has(part.toUpperCase())) tone = "text-brand-300 font-semibold";
    else if (HL_FUNCS.has(part.toUpperCase())) tone = "text-signal-300";
    return (
      <span key={index} className={tone}>
        {part}
      </span>
    );
  });
}

// ── Schema browser ──────────────────────────────────────────────────────────

function TypeBadge({ type }: { type: "INTEGER" | "TEXT" }) {
  return (
    <span
      className={cn(
        "rounded-xs px-1 py-px font-mono text-[9px] font-bold tracking-wide",
        type === "INTEGER"
          ? "bg-brand-50 text-brand-700"
          : "bg-ink-100 text-ink-500",
      )}
    >
      {type === "INTEGER" ? "INT" : "TEXT"}
    </span>
  );
}

function TableCard({
  table,
  open,
  onToggle,
  onInsert,
}: {
  table: TableDef;
  open: boolean;
  onToggle: () => void;
  onInsert: () => void;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-card">
      <div className="flex items-stretch border-b border-ink-100 bg-ink-50/70">
        <button
          onClick={onInsert}
          title={`Insert SELECT * FROM ${table.name};`}
          aria-label={`Insert the query SELECT * FROM ${table.name} into the editor`}
          className="group flex min-w-0 flex-1 cursor-pointer items-center gap-2 px-2.5 py-2 text-left transition-colors hover:bg-brand-50"
        >
          <Rows3 className="size-3.5 shrink-0 text-brand-600" />
          <span className="truncate font-mono text-[12.5px] font-semibold text-ink-800 group-hover:text-brand-700">
            {table.name}
          </span>
          <span className="tnum ml-auto shrink-0 font-mono text-[10px] text-ink-400">
            {table.rows.length} rows
          </span>
        </button>
        <button
          onClick={onToggle}
          aria-expanded={open}
          aria-label={`${open ? "Hide" : "Show"} the columns of ${table.name}`}
          className="flex cursor-pointer items-center border-l border-ink-100 px-1.5 text-ink-400 transition-colors hover:bg-ink-100 hover:text-ink-700"
        >
          {open ? (
            <ChevronDown className="size-3.5" />
          ) : (
            <ChevronRight className="size-3.5" />
          )}
        </button>
      </div>
      {open && (
        <ul className="divide-y divide-ink-50">
          {table.columns.map((col) => (
            <li key={col.name} className="px-2.5 py-1.5">
              <div className="flex items-center gap-1.5">
                {col.pk ? (
                  <KeyRound
                    className="size-3 shrink-0 text-bit-600"
                    aria-label="Primary key"
                  />
                ) : col.fk ? (
                  <Link2
                    className="size-3 shrink-0 text-violet-500"
                    aria-label="Foreign key"
                  />
                ) : (
                  <span className="size-3 shrink-0" aria-hidden />
                )}
                <span className="truncate font-mono text-[11.5px] text-ink-700">
                  {col.name}
                </span>
                <span className="ml-auto shrink-0">
                  <TypeBadge type={col.type} />
                </span>
              </div>
              {col.note && (
                <p className="mt-0.5 pl-4.5 text-[10.5px] leading-snug text-ink-400">
                  {col.note}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Results ─────────────────────────────────────────────────────────────────

function Cell({ value, numeric }: { value: SqlValue; numeric: boolean }) {
  if (value === null)
    return (
      <span className="rounded-xs bg-ink-50 px-1 py-px font-mono text-[10px] font-semibold tracking-wide text-ink-300">
        NULL
      </span>
    );
  return (
    <span className={cn(numeric && "tnum font-mono text-ink-800")}>
      {String(value)}
    </span>
  );
}

function ResultPanel({ outcome }: { outcome: QueryOutcome | null }) {
  if (!outcome)
    return (
      <div className="rounded-lg border border-dashed border-ink-200 bg-ink-50/40 px-5 py-10 text-center">
        <Database className="mx-auto mb-2 size-6 text-ink-300" />
        <p className="font-display text-[14px] font-semibold text-ink-700">
          Nothing has been asked yet
        </p>
        <p className="mx-auto mt-1 max-w-xs text-[13px] text-ink-500">
          Press Run (or Ctrl/Cmd + Enter) and the database will answer.
        </p>
      </div>
    );

  if (!outcome.ok)
    return (
      <div className="rounded-lg border border-coral-500/40 bg-coral-100/50 p-4">
        <div className="flex gap-2.5">
          <TriangleAlert className="mt-0.5 size-4 shrink-0 text-coral-600" />
          <div className="min-w-0">
            <p className="text-[13.5px] font-semibold text-coral-700">
              {outcome.error}
            </p>
            {outcome.hint && (
              <p className="mt-1 text-[13px] leading-relaxed text-ink-600">
                {outcome.hint}
              </p>
            )}
            <p className="mt-2 text-[12px] text-ink-400">
              Nothing broke — the database just could not read that. Adjust one
              piece and run it again.
            </p>
          </div>
        </div>
      </div>
    );

  const { result } = outcome;

  return (
    <div className="overflow-hidden rounded-lg border border-ink-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b border-ink-100 bg-ink-50/60 px-3 py-2">
        <span className="font-mono text-[10px] tracking-[0.18em] text-ink-500 uppercase">
          Result
        </span>
        <span className="tnum font-mono text-[11px] font-semibold text-ink-700">
          {result.rows.length} {result.rows.length === 1 ? "row" : "rows"}
        </span>
        <span className="tnum font-mono text-[11px] text-ink-400">
          {result.columns.length}{" "}
          {result.columns.length === 1 ? "column" : "columns"}
        </span>
        <span className="tnum ml-auto font-mono text-[11px] text-ink-400">
          {outcome.ms < 0.1 ? "<0.1" : outcome.ms.toFixed(1)} ms
        </span>
      </div>

      {result.rows.length === 0 ? (
        <div className="px-5 py-10 text-center">
          <SearchX className="mx-auto mb-2 size-6 text-ink-300" />
          <p className="font-display text-[14px] font-semibold text-ink-700">
            The query worked — nothing matched
          </p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] leading-relaxed text-ink-500">
            An empty result is still an answer: not one row fits your condition.
            Try widening it — a smaller number, a shorter LIKE pattern, or check
            the spelling inside the quotes.
          </p>
        </div>
      ) : (
        <div className="thin-scroll max-h-80 overflow-auto">
          <table className="w-full text-[13px]">
            <caption className="sr-only">Query results</caption>
            <thead className="sticky top-0 z-10">
              <tr>
                {result.columns.map((column, i) => (
                  <th
                    key={`${column}-${i}`}
                    scope="col"
                    className={cn(
                      "border-b border-ink-200 bg-white px-3 py-2 font-mono text-[10.5px] font-semibold tracking-wide whitespace-nowrap text-ink-500 uppercase",
                      result.numeric[i] ? "text-right" : "text-left",
                    )}
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row, r) => (
                <tr key={r} className="border-b border-ink-50 last:border-0">
                  {row.map((value, c) => (
                    <td
                      key={c}
                      className={cn(
                        "px-3 py-1.5 whitespace-nowrap text-ink-700",
                        result.numeric[c] && "text-right",
                      )}
                    >
                      <Cell value={value} numeric={result.numeric[c]} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── The lab ─────────────────────────────────────────────────────────────────

/**
 * The Query Desk — a real (tiny) school database, a schema browser that makes
 * foreign keys visible, and a hand-written SQL interpreter that answers
 * genuine queries in the browser.
 */
export function DatabaseLab({
  config,
  title = "Database Lab",
  brief = "school_db holds four linked tables. Read the schema on the left, write a query, and the database answers instantly — every row you see is really being filtered, joined and counted.",
  onComplete,
  completed,
}: {
  config?: DatabaseLabConfig;
  title?: string;
  brief?: string;
  onComplete?: () => void;
  completed?: boolean;
}) {
  const challenges = useMemo(
    () => config?.challenges ?? DEFAULT_CHALLENGES,
    [config],
  );
  const starter = config?.starter ?? DEFAULT_STARTER;

  const [sql, setSql] = useState(starter);
  const [outcome, setOutcome] = useState<QueryOutcome | null>(null);
  const [passed, setPassed] = useState<string[]>([]);
  const [justSolved, setJustSolved] = useState<string[]>([]);
  const [openHint, setOpenHint] = useState<string | null>(null);
  const [openTables, setOpenTables] = useState<string[]>(() =>
    SCHOOL_DB.tables.map((t) => t.name),
  );

  const editorRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const firedRef = useRef(false);
  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const allPassed = challenges.length > 0 && passed.length === challenges.length;
  useEffect(() => {
    if (allPassed && !firedRef.current) {
      firedRef.current = true;
      onCompleteRef.current?.();
    }
  }, [allPassed]);

  // Keep the highlight layer lined up with the textarea while it scrolls.
  const syncScroll = useCallback(() => {
    const textarea = editorRef.current;
    const pre = highlightRef.current;
    if (!textarea || !pre) return;
    pre.scrollTop = textarea.scrollTop;
    pre.scrollLeft = textarea.scrollLeft;
  }, []);
  useEffect(syncScroll, [sql, syncScroll]);

  const relationships = useMemo(
    () =>
      SCHOOL_DB.tables.flatMap((table) =>
        table.columns
          .filter((column) => column.fk)
          .map((column) => {
            const target = column.fk!;
            const a = table.name[0];
            const b = target.table[0] === a ? `${target.table[0]}2` : target.table[0];
            return {
              id: `${table.name}.${column.name}`,
              from: `${table.name}.${column.name}`,
              to: `${target.table}.${target.column}`,
              sql: `SELECT *\nFROM ${table.name} ${a}\nINNER JOIN ${target.table} ${b} ON ${a}.${column.name} = ${b}.${target.column};`,
            };
          }),
      ),
    [],
  );

  const loadQuery = (text: string) => {
    setSql(text);
    setJustSolved([]);
    const textarea = editorRef.current;
    if (textarea) {
      textarea.focus();
      requestAnimationFrame(() => {
        textarea.setSelectionRange(text.length, text.length);
        textarea.scrollTop = 0;
      });
    }
  };

  const run = () => {
    const next = runQuery(sql, SCHOOL_DB);
    setOutcome(next);
    if (!next.ok) {
      setJustSolved([]);
      return;
    }
    const normalized = normalizeQuery(sql);
    const rowCount = next.result.rows.length;
    const newly = challenges
      .filter(
        (challenge) =>
          !passed.includes(challenge.id) &&
          rowCount === challenge.expectedRows &&
          (challenge.mustInclude ?? []).every((token) =>
            containsToken(normalized, token),
          ),
      )
      .map((challenge) => challenge.id);
    setJustSolved(newly);
    if (newly.length > 0) setPassed((prev) => [...prev, ...newly]);
  };

  const reset = () => {
    setSql(starter);
    setOutcome(null);
    setPassed([]);
    setJustSolved([]);
    setOpenHint(null);
    firedRef.current = false;
  };

  const toggleTable = (name: string) =>
    setOpenTables((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name],
    );

  return (
    <LabShell
      title={title}
      brief={brief}
      onReset={reset}
      completed={completed || allPassed}
      footer={
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="font-mono text-[10px] tracking-[0.18em] text-ink-400 uppercase">
            SQL you can use here
          </span>
          {SUPPORTED_SYNTAX.map((item) => (
            <span
              key={item}
              className="rounded-sm bg-ink-50 px-1.5 py-0.5 font-mono text-[10.5px] text-ink-500"
            >
              {item}
            </span>
          ))}
        </div>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[236px_minmax(0,1fr)]">
        {/* ── Schema browser ─────────────────────────────────────────── */}
        <aside className="thin-scroll lg:max-h-[640px] lg:overflow-y-auto lg:pr-1">
          <div className="mb-2 flex items-center gap-1.5">
            <Database className="size-3.5 text-ink-400" />
            <h4 className="font-mono text-[11px] font-semibold tracking-[0.14em] text-ink-500 uppercase">
              {SCHOOL_DB.name}
            </h4>
          </div>
          <div className="space-y-2">
            {SCHOOL_DB.tables.map((table) => (
              <TableCard
                key={table.name}
                table={table}
                open={openTables.includes(table.name)}
                onToggle={() => toggleTable(table.name)}
                onInsert={() => loadQuery(`SELECT *\nFROM ${table.name};`)}
              />
            ))}
          </div>

          <div className="mt-4 rounded-lg border border-violet-500/25 bg-violet-100/40 p-2.5">
            <div className="mb-1.5 flex items-center gap-1.5">
              <Link2 className="size-3.5 text-violet-700" />
              <h4 className="font-mono text-[10px] font-semibold tracking-[0.14em] text-violet-700 uppercase">
                Relationships
              </h4>
            </div>
            <ul className="space-y-1">
              {relationships.map((relation) => (
                <li key={relation.id}>
                  <button
                    onClick={() => loadQuery(relation.sql)}
                    title="Insert the matching INNER JOIN"
                    className="w-full cursor-pointer rounded-sm px-1 py-0.5 text-left font-mono text-[10.5px] leading-snug text-ink-600 transition-colors hover:bg-white hover:text-violet-700"
                  >
                    {relation.from}
                    <span className="mx-1 text-violet-500">&rarr;</span>
                    {relation.to}
                  </button>
                </li>
              ))}
            </ul>
            <p className="mt-1.5 text-[10.5px] leading-snug text-ink-500">
              A foreign key stores the id of a row in another table. That is the
              thread a JOIN follows.
            </p>
          </div>
        </aside>

        {/* ── Work area ──────────────────────────────────────────────── */}
        <div className="min-w-0">
          {/* Example queries */}
          <div className="mb-3">
            <p className="mb-1.5 font-mono text-[10px] tracking-[0.18em] text-ink-400 uppercase">
              Try one — each shows a different idea
            </p>
            <div className="flex flex-wrap gap-1.5">
              {EXAMPLES.map((example) => (
                <button
                  key={example.label}
                  onClick={() => loadQuery(example.sql)}
                  className="cursor-pointer rounded-full border border-ink-200 bg-white px-2.5 py-1 text-[12px] font-medium text-ink-600 shadow-card transition-all hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                >
                  {example.label}
                </button>
              ))}
            </div>
          </div>

          {/* Editor */}
          <div className="overflow-hidden rounded-lg border border-ink-800 bg-ink-950 shadow-card">
            <div className="flex items-center gap-2 border-b border-white/10 px-3 py-2">
              <span className="font-mono text-[10px] tracking-[0.18em] text-ink-400 uppercase">
                query
              </span>
              {challenges.length > 0 && (
                <span
                  className={cn(
                    "tnum rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold",
                    allPassed
                      ? "bg-mint-500/20 text-mint-500"
                      : "bg-white/10 text-ink-300",
                  )}
                >
                  {passed.length} / {challenges.length} solved
                </span>
              )}
              <span className="ml-auto hidden font-mono text-[10px] text-ink-500 sm:inline">
                Ctrl/Cmd + Enter
              </span>
              <button
                onClick={run}
                className="inline-flex cursor-pointer items-center gap-1.5 rounded-md bg-brand-600 px-3 py-1.5 text-[13px] font-semibold text-white transition-colors hover:bg-brand-500"
              >
                <Play className="size-3.5" />
                Run
              </button>
            </div>

            <div className="relative">
              <pre
                ref={highlightRef}
                aria-hidden
                className="thin-scroll pointer-events-none absolute inset-0 m-0 h-40 overflow-auto px-3 py-2.5 font-mono text-[13px] leading-[1.6] break-words whitespace-pre-wrap"
              >
                {highlightSql(sql)}
                {"\n"}
              </pre>
              <textarea
                ref={editorRef}
                value={sql}
                onChange={(event) => {
                  setSql(event.target.value);
                  setJustSolved([]);
                }}
                onScroll={syncScroll}
                onKeyDown={(event) => {
                  if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
                    event.preventDefault();
                    run();
                  }
                }}
                spellCheck={false}
                autoCapitalize="off"
                autoCorrect="off"
                aria-label="SQL query editor. Press Control or Command plus Enter to run."
                className="thin-scroll relative h-40 w-full resize-none bg-transparent px-3 py-2.5 font-mono text-[13px] leading-[1.6] break-words whitespace-pre-wrap text-transparent caret-signal-400 outline-none"
              />
            </div>
          </div>

          {/* Newly solved banner */}
          {justSolved.length > 0 && (
            <div className="animate-pop mt-3 flex items-start gap-2 rounded-lg bg-mint-100 px-3 py-2">
              <Sparkles className="mt-0.5 size-4 shrink-0 text-mint-600" />
              <p className="text-[13px] font-semibold text-mint-700">
                {justSolved.length === 1 ? "Mission solved: " : "Missions solved: "}
                <span className="font-normal">
                  {justSolved
                    .map((id) => challenges.find((c) => c.id === id)?.ask ?? id)
                    .join("  ·  ")}
                </span>
              </p>
            </div>
          )}

          {/* Results */}
          <div className="mt-3">
            <ResultPanel outcome={outcome} />
          </div>

          {/* Challenges */}
          {challenges.length > 0 && (
            <div className="mt-4 rounded-lg border border-ink-200 bg-white p-3 shadow-card">
              <div className="mb-2 flex items-center gap-2">
                <ListChecks className="size-4 text-ink-400" />
                <h4 className="font-display text-[13px] font-semibold text-ink-800">
                  Query missions
                </h4>
                <span className="tnum ml-auto font-mono text-[11px] font-semibold text-ink-500">
                  {passed.length} / {challenges.length}
                </span>
              </div>
              <ol className="space-y-1.5">
                {challenges.map((challenge, index) => {
                  const done = passed.includes(challenge.id);
                  const hintOpen = openHint === challenge.id;
                  return (
                    <li
                      key={challenge.id}
                      className={cn(
                        "rounded-md px-2.5 py-2 transition-colors",
                        done ? "bg-mint-100/60" : "bg-ink-50",
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {done ? (
                          <Check className="mt-0.5 size-3.5 shrink-0 text-mint-600" />
                        ) : (
                          <span
                            className="tnum mt-px block size-3.5 shrink-0 text-center font-mono text-[10px] font-bold text-ink-400"
                            aria-hidden
                          >
                            {index + 1}
                          </span>
                        )}
                        <p
                          className={cn(
                            "flex-1 text-[13px] leading-snug",
                            done
                              ? "font-medium text-mint-700"
                              : "font-medium text-ink-600",
                          )}
                        >
                          {challenge.ask}
                          <span className="tnum ml-1.5 font-mono text-[10.5px] font-normal text-ink-400">
                            {challenge.expectedRows}{" "}
                            {challenge.expectedRows === 1 ? "row" : "rows"}
                          </span>
                        </p>
                        {challenge.hint && !done && (
                          <button
                            onClick={() =>
                              setOpenHint(hintOpen ? null : challenge.id)
                            }
                            aria-expanded={hintOpen}
                            aria-label={`${hintOpen ? "Hide" : "Show"} the hint for mission ${index + 1}`}
                            className="shrink-0 cursor-pointer rounded-sm p-0.5 text-ink-300 transition-colors hover:text-bit-600"
                          >
                            <Lightbulb className="size-3.5" />
                          </button>
                        )}
                      </div>
                      {hintOpen && challenge.hint && !done && (
                        <p className="mt-1.5 ml-5.5 rounded-sm bg-bit-50 px-2 py-1.5 font-mono text-[11.5px] leading-relaxed text-ink-600">
                          {challenge.hint}
                        </p>
                      )}
                    </li>
                  );
                })}
              </ol>
              {allPassed && (
                <p className="animate-pop mt-2.5 flex items-center justify-center gap-1.5 rounded-md bg-mint-100 px-3 py-2 text-center text-[13px] font-bold text-mint-700">
                  <Sparkles className="size-4" />
                  Every mission solved — you can read this database like a pro.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </LabShell>
  );
}
