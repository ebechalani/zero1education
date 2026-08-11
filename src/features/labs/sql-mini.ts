/**
 * sql-mini — a hand-written SQL subset interpreter for the ZERO1 Database Lab.
 *
 * The app is statically exported, so there is no database server and no query
 * engine dependency: every query a student types is tokenized, parsed into a
 * small AST and executed against in-memory tables right here. Nothing is
 * ever `eval`-ed — the parser only ever produces data structures.
 *
 * The supported subset is deliberately the Grade 9–12 Access / MySQL syllabus:
 *
 *   SELECT  col [AS alias] | * | t.*  |  COUNT/AVG/SUM/MIN/MAX(...)
 *   FROM    table [alias]  [INNER] JOIN table2 [alias] ON a.col = b.col
 *   WHERE   = != <> > < >= <=   AND OR NOT   LIKE   IN (...)   IS [NOT] NULL   ( )
 *   GROUP BY cols   HAVING cond   ORDER BY col [ASC|DESC], ...   LIMIT n
 *
 * Anything outside the subset raises a {@link SqlError} carrying a message
 * written for a student: what was hit, and what to do instead. A raw parser
 * exception must never reach the screen.
 */

// ── Value & schema types ────────────────────────────────────────────────────

export type SqlValue = string | number | null;

export type ColumnType = "INTEGER" | "TEXT";

export interface ColumnDef {
  name: string;
  type: ColumnType;
  /** Primary key — the column that gives every row its unique identity. */
  pk?: boolean;
  /** Foreign key — this column points at a row in another table. */
  fk?: { table: string; column: string };
  /** Short plain-language description shown in the schema browser. */
  note?: string;
}

export interface TableDef {
  name: string;
  label: string;
  description: string;
  columns: ColumnDef[];
  /** Row values, aligned to `columns` by index. */
  rows: SqlValue[][];
}

export interface SqlDatabase {
  name: string;
  tables: TableDef[];
}

export interface ResultSet {
  columns: string[];
  /** Per-column flag used to right-align numeric data in the results grid. */
  numeric: boolean[];
  rows: SqlValue[][];
}

export type QueryOutcome =
  | { ok: true; result: ResultSet; ms: number }
  | { ok: false; error: string; hint?: string };

// ── The sample database ─────────────────────────────────────────────────────

/**
 * A tiny but honest school database. Every foreign key lines up, so joins
 * return sensible rows. Two deliberate teaching details:
 *   • Fadi Chamoun has no class yet  → `students.class_id IS NULL`, and an
 *     INNER JOIN quietly leaves him out (the classic first surprise).
 *   • His ICT paper is unmarked      → `grades.score IS NULL`, so COUNT(*) and
 *     COUNT(score) disagree, and AVG() skips it.
 */
export const SCHOOL_DB: SqlDatabase = {
  name: "school_db",
  tables: [
    {
      name: "students",
      label: "Students",
      description: "One row per student enrolled this year.",
      columns: [
        { name: "id", type: "INTEGER", pk: true, note: "Unique student number" },
        { name: "first_name", type: "TEXT" },
        { name: "last_name", type: "TEXT" },
        { name: "grade", type: "INTEGER", note: "Grade level, 9 to 11" },
        {
          name: "class_id",
          type: "INTEGER",
          fk: { table: "classes", column: "id" },
          note: "Which class — empty if not placed yet",
        },
      ],
      rows: [
        [1, "Maya", "Haddad", 9, 1],
        [2, "Karim", "Nassar", 9, 1],
        [3, "Lea", "Chidiac", 9, 1],
        [4, "Rami", "Saad", 9, 1],
        [5, "Nour", "Khalil", 10, 2],
        [6, "Jad", "Mansour", 10, 2],
        [7, "Yasmina", "Aoun", 10, 2],
        [8, "Tarek", "Hobeika", 10, 2],
        [9, "Sara", "Rizk", 11, 3],
        [10, "Elias", "Daher", 11, 3],
        [11, "Dana", "Sleiman", 11, 3],
        [12, "Fadi", "Chamoun", 11, null],
      ],
    },
    {
      name: "classes",
      label: "Classes",
      description: "The three homeroom classes, each with a form teacher.",
      columns: [
        { name: "id", type: "INTEGER", pk: true, note: "Unique class number" },
        { name: "name", type: "TEXT", note: "Class code, e.g. 9A" },
        { name: "grade", type: "INTEGER" },
        {
          name: "teacher_id",
          type: "INTEGER",
          fk: { table: "teachers", column: "id" },
          note: "The form teacher of this class",
        },
      ],
      rows: [
        [1, "9A", 9, 1],
        [2, "10B", 10, 2],
        [3, "11C", 11, 3],
      ],
    },
    {
      name: "teachers",
      label: "Teachers",
      description: "Staff who hold a homeroom class.",
      columns: [
        { name: "id", type: "INTEGER", pk: true, note: "Unique teacher number" },
        { name: "first_name", type: "TEXT" },
        { name: "last_name", type: "TEXT" },
        { name: "subject", type: "TEXT", note: "Main teaching subject" },
      ],
      rows: [
        [1, "Rania", "Khoury", "Computer Science"],
        [2, "Samir", "Fares", "Mathematics"],
        [3, "Nour", "Chahine", "Science"],
      ],
    },
    {
      name: "grades",
      label: "Grades",
      description: "One row per mark: which student, which subject, what score.",
      columns: [
        { name: "id", type: "INTEGER", pk: true, note: "Unique mark number" },
        {
          name: "student_id",
          type: "INTEGER",
          fk: { table: "students", column: "id" },
          note: "Whose mark this is",
        },
        { name: "subject", type: "TEXT" },
        { name: "score", type: "INTEGER", note: "Out of 100 — empty if unmarked" },
        { name: "term", type: "INTEGER" },
      ],
      rows: [
        [1, 1, "ICT", 92, 1],
        [2, 1, "Math", 88, 1],
        [3, 2, "ICT", 78, 1],
        [4, 2, "Math", 71, 1],
        [5, 3, "ICT", 85, 1],
        [6, 3, "Math", 90, 1],
        [7, 4, "ICT", 64, 1],
        [8, 4, "Math", 58, 1],
        [9, 5, "ICT", 95, 1],
        [10, 5, "Math", 82, 1],
        [11, 6, "ICT", 73, 1],
        [12, 6, "Math", 67, 1],
        [13, 7, "ICT", 88, 1],
        [14, 7, "Math", 94, 1],
        [15, 8, "ICT", 55, 1],
        [16, 8, "Math", 61, 1],
        [17, 9, "ICT", 91, 1],
        [18, 9, "Math", 79, 1],
        [19, 10, "ICT", 68, 1],
        [20, 10, "Math", 74, 1],
        [21, 11, "ICT", 83, 1],
        [22, 11, "Math", 86, 1],
        [23, 12, "ICT", null, 1],
        [24, 12, "Math", 70, 1],
      ],
    },
  ],
};

// ── Errors ──────────────────────────────────────────────────────────────────

/** An error a student can learn from: what went wrong + what to try instead. */
export class SqlError extends Error {
  readonly hint?: string;
  constructor(message: string, hint?: string) {
    super(message);
    this.name = "SqlError";
    this.hint = hint;
  }
}

const subqueryError = () =>
  new SqlError(
    "This lab doesn't support subqueries (a SELECT inside another query) yet.",
    "Try an INNER JOIN instead — it links two tables in a single, flatter query.",
  );

// ── Tokenizer ───────────────────────────────────────────────────────────────

type TokKind = "ident" | "num" | "str" | "op" | "eof";

interface Tok {
  kind: TokKind;
  /** Raw text for idents/ops, decoded contents for strings. */
  text: string;
  /** Uppercased text — keyword matching is always case-insensitive. */
  up: string;
  num?: number;
  pos: number;
}

const KEYWORDS = new Set([
  "SELECT", "FROM", "WHERE", "GROUP", "BY", "HAVING", "ORDER", "LIMIT", "OFFSET",
  "JOIN", "INNER", "LEFT", "RIGHT", "FULL", "OUTER", "CROSS", "NATURAL", "ON",
  "USING", "AS", "AND", "OR", "NOT", "IN", "IS", "NULL", "LIKE", "ASC", "DESC",
  "DISTINCT", "UNION", "INTERSECT", "EXCEPT", "BETWEEN", "CASE", "WHEN", "THEN",
  "ELSE", "END", "EXISTS", "INSERT", "UPDATE", "DELETE", "CREATE", "DROP",
  "ALTER", "TRUNCATE", "VALUES", "INTO", "SET", "TABLE", "INDEX", "VIEW",
  "REPLACE", "MERGE", "GRANT", "WITH",
]);

const WRITE_KEYWORDS = new Set([
  "INSERT", "UPDATE", "DELETE", "CREATE", "DROP", "ALTER", "TRUNCATE",
  "REPLACE", "MERGE", "GRANT",
]);

const AGG_FUNCS = new Set(["COUNT", "AVG", "SUM", "MIN", "MAX"]);

const COMPARE_OPS = new Set(["=", "<>", "!=", ">", "<", ">=", "<="]);

const TWO_CHAR_OPS = ["<=", ">=", "<>", "!="];
const ONE_CHAR_OPS = "=<>(),.*;+-/%";

function tok(kind: TokKind, text: string, pos: number, num?: number): Tok {
  return { kind, text, up: text.toUpperCase(), num, pos };
}

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const ch = src[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }
    // -- line comment
    if (ch === "-" && src[i + 1] === "-") {
      while (i < src.length && src[i] !== "\n") i++;
      continue;
    }
    // /* block comment */
    if (ch === "/" && src[i + 1] === "*") {
      const end = src.indexOf("*/", i + 2);
      if (end === -1)
        throw new SqlError(
          "This comment starts with /* but never closes.",
          "Finish it with */ — or use -- for a comment that ends at the line break.",
        );
      i = end + 2;
      continue;
    }
    // 'text literal' (doubled quote escapes a quote) and "text literal"
    if (ch === "'" || ch === '"') {
      const quote = ch;
      const start = i;
      let value = "";
      i++;
      for (;;) {
        if (i >= src.length)
          throw new SqlError(
            `This text value opens with ${quote} but never closes.`,
            "Wrap text in single quotes, like WHERE last_name = 'Haddad'.",
          );
        if (src[i] === quote) {
          if (src[i + 1] === quote) {
            value += quote;
            i += 2;
            continue;
          }
          i++;
          break;
        }
        value += src[i++];
      }
      out.push(tok("str", value, start));
      continue;
    }
    // `quoted identifier` and [quoted identifier] (MySQL / Access styles)
    if (ch === "`" || ch === "[") {
      const close = ch === "`" ? "`" : "]";
      const end = src.indexOf(close, i + 1);
      if (end === -1)
        throw new SqlError(
          `This name opens with ${ch} but never closes.`,
          `Close it with ${close}, or drop the brackets entirely — plain names work fine here.`,
        );
      out.push(tok("ident", src.slice(i + 1, end), i));
      i = end + 1;
      continue;
    }
    if (/[0-9]/.test(ch)) {
      const start = i;
      while (i < src.length && /[0-9]/.test(src[i])) i++;
      if (src[i] === "." && /[0-9]/.test(src[i + 1] ?? "")) {
        i++;
        while (i < src.length && /[0-9]/.test(src[i])) i++;
      }
      const text = src.slice(start, i);
      out.push(tok("num", text, start, Number(text)));
      continue;
    }
    if (/[A-Za-z_]/.test(ch)) {
      const start = i;
      while (i < src.length && /[A-Za-z0-9_]/.test(src[i])) i++;
      out.push(tok("ident", src.slice(start, i), start));
      continue;
    }
    const two = src.slice(i, i + 2);
    if (TWO_CHAR_OPS.includes(two)) {
      out.push(tok("op", two, i));
      i += 2;
      continue;
    }
    if (ONE_CHAR_OPS.includes(ch)) {
      out.push(tok("op", ch, i));
      i++;
      continue;
    }
    throw new SqlError(
      `I don't know what to do with the character "${ch}".`,
      "SQL here uses letters, numbers, quotes for text, and the symbols = < > ( ) , . *",
    );
  }
  out.push(tok("eof", "", src.length));
  return out;
}

function describe(t: Tok): string {
  if (t.kind === "eof") return "the end of the query";
  if (t.kind === "str") return `the text '${t.text}'`;
  if (t.kind === "num") return `the number ${t.text}`;
  return `"${t.text}"`;
}

// ── AST ─────────────────────────────────────────────────────────────────────

interface ColRef {
  /** Table alias (or real table name) written before the dot, lower-cased. */
  table?: string;
  column: string;
  /** Exactly as the student typed it — used for result headers. */
  text: string;
}

type AggFunc = "COUNT" | "AVG" | "SUM" | "MIN" | "MAX";

interface AggExpr {
  kind: "agg";
  func: AggFunc;
  arg: ColRef | "*";
  text: string;
}

interface ColExpr {
  kind: "col";
  ref: ColRef;
}

type ValueExpr = AggExpr | ColExpr;

type SelectItem =
  | { kind: "star"; table?: string }
  | { kind: "expr"; expr: ValueExpr; alias?: string };

type Operand =
  | { kind: "lit"; value: SqlValue }
  | { kind: "col"; ref: ColRef }
  | { kind: "agg"; agg: AggExpr };

type Cond =
  | { kind: "and"; left: Cond; right: Cond }
  | { kind: "or"; left: Cond; right: Cond }
  | { kind: "not"; inner: Cond }
  | { kind: "cmp"; op: string; left: Operand; right: Operand }
  | { kind: "like"; not: boolean; left: Operand; pattern: string }
  | { kind: "in"; not: boolean; left: Operand; list: SqlValue[] }
  | { kind: "isnull"; not: boolean; left: Operand };

interface TableRef {
  table: string;
  text: string;
  alias: string;
}

interface JoinClause extends TableRef {
  on: { left: ColRef; right: ColRef };
}

interface OrderKey {
  expr: ValueExpr;
  dir: "ASC" | "DESC";
}

interface Query {
  select: SelectItem[];
  from: TableRef;
  join?: JoinClause;
  where?: Cond;
  groupBy?: ColRef[];
  having?: Cond;
  orderBy?: OrderKey[];
  limit?: number;
}

// ── Parser ──────────────────────────────────────────────────────────────────

class Parser {
  private toks: Tok[];
  private i = 0;

  constructor(src: string) {
    this.toks = tokenize(src);
  }

  private peek(offset = 0): Tok {
    return this.toks[Math.min(this.i + offset, this.toks.length - 1)];
  }
  private advance(): Tok {
    const t = this.peek();
    if (t.kind !== "eof") this.i++;
    return t;
  }
  private atKw(kw: string): boolean {
    const t = this.peek();
    return t.kind === "ident" && t.up === kw;
  }
  private eatKw(kw: string): boolean {
    if (!this.atKw(kw)) return false;
    this.i++;
    return true;
  }
  private atOp(op: string): boolean {
    const t = this.peek();
    return t.kind === "op" && t.text === op;
  }
  private eatOp(op: string): boolean {
    if (!this.atOp(op)) return false;
    this.i++;
    return true;
  }
  private expectOp(op: string, ctx: string): void {
    if (this.eatOp(op)) return;
    throw new SqlError(
      `I expected "${op}" ${ctx}, but found ${describe(this.peek())}.`,
      "Check for a missing bracket or comma.",
    );
  }

  parse(): Query {
    const first = this.peek();
    if (first.kind === "eof")
      throw new SqlError(
        "There's no query here yet.",
        "Start with SELECT * FROM students; — or tap one of the example queries.",
      );
    if (first.kind === "ident" && WRITE_KEYWORDS.has(first.up))
      throw new SqlError(
        `This lab is read-only, so ${first.up} isn't available.`,
        "You can still ask the database anything you like with SELECT — the data stays safe.",
      );
    if (first.kind === "ident" && first.up === "WITH")
      throw new SqlError(
        "Common table expressions (WITH ...) aren't supported yet.",
        "Every query in this lab starts with SELECT.",
      );
    if (!(first.kind === "ident" && first.up === "SELECT"))
      throw new SqlError(
        `Every query starts with SELECT, but this one starts with ${describe(first)}.`,
        "Try: SELECT * FROM students;",
      );
    this.advance();

    if (this.atKw("DISTINCT"))
      throw new SqlError(
        "DISTINCT isn't supported yet.",
        "GROUP BY does the same job here: SELECT grade FROM students GROUP BY grade;",
      );
    if (this.atKw("TOP") && this.peek(1).kind === "num")
      throw new SqlError(
        "Access-style SELECT TOP n isn't supported here.",
        `Put it at the end instead: ... ORDER BY score DESC LIMIT ${this.peek(1).text};`,
      );

    const select = this.parseSelectList();

    if (!this.eatKw("FROM"))
      throw new SqlError(
        `Every query needs a FROM clause naming the table to read, but I found ${describe(
          this.peek(),
        )}.`,
        "For example: SELECT first_name FROM students;",
      );

    const from = this.parseTableRef("after FROM");
    if (this.atOp(","))
      throw new SqlError(
        "Listing two tables with a comma isn't supported here.",
        "Link them properly instead: FROM students s INNER JOIN classes c ON s.class_id = c.id",
      );

    const join = this.parseOptionalJoin();
    if (join && (this.atKw("JOIN") || this.atKw("INNER") || this.atKw("LEFT")))
      throw new SqlError(
        "This lab joins two tables at a time.",
        "Split the question into two queries: join the first pair, read the answer, then join the next pair.",
      );

    const where = this.eatKw("WHERE") ? this.parseCond("WHERE") : undefined;

    let groupBy: ColRef[] | undefined;
    if (this.eatKw("GROUP")) {
      if (!this.eatKw("BY"))
        throw new SqlError(
          "GROUP needs BY straight after it.",
          "Write: GROUP BY grade",
        );
      groupBy = [];
      do {
        groupBy.push(this.parseColRef("in GROUP BY"));
      } while (this.eatOp(","));
    }

    const having = this.eatKw("HAVING") ? this.parseCond("HAVING") : undefined;

    let orderBy: OrderKey[] | undefined;
    if (this.eatKw("ORDER")) {
      if (!this.eatKw("BY"))
        throw new SqlError(
          "ORDER needs BY straight after it.",
          "Write: ORDER BY score DESC",
        );
      orderBy = [];
      do {
        if (this.peek().kind === "num")
          throw new SqlError(
            "ORDER BY needs a column name, not a position number.",
            "Name the column you want to sort by, e.g. ORDER BY score DESC.",
          );
        const expr = this.parseValueExpr("in ORDER BY");
        let dir: "ASC" | "DESC" = "ASC";
        if (this.eatKw("DESC")) dir = "DESC";
        else this.eatKw("ASC");
        orderBy.push({ expr, dir });
      } while (this.eatOp(","));
    }

    let limit: number | undefined;
    if (this.eatKw("LIMIT")) {
      const t = this.peek();
      if (t.kind !== "num")
        throw new SqlError(
          `LIMIT needs a whole number, but I found ${describe(t)}.`,
          "For example: LIMIT 5 keeps only the first five rows.",
        );
      this.advance();
      limit = Math.floor(t.num ?? 0);
      if (limit < 0)
        throw new SqlError(
          "LIMIT can't be negative.",
          "Use a number of rows to keep, like LIMIT 10.",
        );
      if (this.atOp(",") || this.atKw("OFFSET"))
        throw new SqlError(
          "LIMIT with an offset isn't supported yet.",
          "Use a plain LIMIT n, then sort with ORDER BY to control which rows come first.",
        );
    }

    this.eatOp(";");

    const rest = this.peek();
    if (rest.kind !== "eof") {
      if (rest.kind === "ident" && ["UNION", "INTERSECT", "EXCEPT"].includes(rest.up))
        throw new SqlError(
          `${rest.up} isn't supported yet.`,
          "Run the two queries one after the other and compare what comes back.",
        );
      if (rest.kind === "ident" && rest.up === "SELECT")
        throw new SqlError(
          "This lab runs one query at a time.",
          "Keep the query you want and delete the rest — or comment it out with --.",
        );
      if (
        rest.kind === "ident" &&
        ["WHERE", "GROUP", "HAVING", "ORDER", "LIMIT"].includes(rest.up)
      )
        throw new SqlError(
          `${rest.up} appears after the clause it should come before.`,
          "The order is fixed: SELECT ... FROM ... WHERE ... GROUP BY ... HAVING ... ORDER BY ... LIMIT.",
        );
      throw new SqlError(
        `I read the whole query but ${describe(rest)} was still left over.`,
        "Look for a missing keyword, a repeated word, or a stray bracket.",
      );
    }

    return { select, from, join, where, groupBy, having, orderBy, limit };
  }

  // ── select list ───────────────────────────────────────────────────────────

  private parseSelectList(): SelectItem[] {
    const items: SelectItem[] = [];
    do {
      items.push(this.parseSelectItem());
    } while (this.eatOp(","));
    return items;
  }

  private parseSelectItem(): SelectItem {
    if (this.atOp("*")) {
      this.advance();
      return { kind: "star" };
    }
    const t = this.peek();
    if (
      t.kind === "ident" &&
      this.peek(1).kind === "op" &&
      this.peek(1).text === "." &&
      this.peek(2).kind === "op" &&
      this.peek(2).text === "*"
    ) {
      this.i += 3;
      return { kind: "star", table: t.text.toLowerCase() };
    }
    const expr = this.parseValueExpr("in the SELECT list");
    const alias = this.parseAlias();
    return { kind: "expr", expr, alias };
  }

  private parseAlias(): string | undefined {
    if (this.eatKw("AS")) {
      const t = this.peek();
      if (t.kind !== "ident" && t.kind !== "str")
        throw new SqlError(
          `AS needs a name after it, but I found ${describe(t)}.`,
          "For example: SELECT first_name AS name FROM students;",
        );
      this.advance();
      return t.text;
    }
    const t = this.peek();
    if (t.kind === "ident" && !KEYWORDS.has(t.up) && !AGG_FUNCS.has(t.up)) {
      this.advance();
      return t.text;
    }
    return undefined;
  }

  private parseValueExpr(ctx: string): ValueExpr {
    const t = this.peek();
    if (
      t.kind === "ident" &&
      AGG_FUNCS.has(t.up) &&
      this.peek(1).kind === "op" &&
      this.peek(1).text === "("
    )
      return this.parseAgg();
    if (t.kind === "ident" && this.peek(1).kind === "op" && this.peek(1).text === "(")
      throw new SqlError(
        `The function ${t.text}() isn't available in this lab.`,
        "The functions you can use are COUNT, AVG, SUM, MIN and MAX.",
      );
    if (t.kind === "op" && t.text === "(") {
      if (this.peek(1).kind === "ident" && this.peek(1).up === "SELECT")
        throw subqueryError();
      throw new SqlError(
        `Brackets aren't allowed ${ctx}.`,
        "Use plain column names here, e.g. SELECT first_name, grade FROM students;",
      );
    }
    return { kind: "col", ref: this.parseColRef(ctx) };
  }

  private parseAgg(): AggExpr {
    const fn = this.advance();
    this.advance(); // consume "("
    const func = fn.up as AggFunc;
    let arg: ColRef | "*";
    if (this.atOp("*")) {
      this.advance();
      if (func !== "COUNT")
        throw new SqlError(
          `${func}(*) doesn't have a meaning — only COUNT(*) counts whole rows.`,
          `Give it a column to work on instead, like ${func}(score).`,
        );
      arg = "*";
    } else {
      if (this.atKw("DISTINCT"))
        throw new SqlError(
          "COUNT(DISTINCT ...) isn't supported yet.",
          "GROUP BY that column instead — you get one row per distinct value.",
        );
      if (this.atOp(")"))
        throw new SqlError(
          `${func}() needs a column inside the brackets.`,
          func === "COUNT"
            ? "Try COUNT(*) to count rows, or COUNT(score) to count filled-in scores."
            : `Try ${func}(score).`,
        );
      arg = this.parseColRef(`inside ${func}()`);
    }
    this.expectOp(")", `to close ${func}(`);
    return {
      kind: "agg",
      func,
      arg,
      text: `${func}(${arg === "*" ? "*" : arg.text})`,
    };
  }

  private parseColRef(ctx: string): ColRef {
    const t = this.peek();
    if (t.kind !== "ident")
      throw new SqlError(
        `I expected a column name ${ctx}, but found ${describe(t)}.`,
        t.kind === "str"
          ? "Column names are written plainly — quotes are only for text values."
          : "Column names look like score, first_name, or s.class_id.",
      );
    if (KEYWORDS.has(t.up))
      throw new SqlError(
        `"${t.text}" is a SQL keyword, so I can't read it as a column name ${ctx}.`,
        "Check the clause order, or rename what you meant to write.",
      );
    this.advance();
    if (this.atOp(".")) {
      this.advance();
      const c = this.peek();
      if (c.kind !== "ident")
        throw new SqlError(
          `After "${t.text}." I expected a column name, but found ${describe(c)}.`,
          "For example: s.first_name",
        );
      this.advance();
      return {
        table: t.text.toLowerCase(),
        column: c.text.toLowerCase(),
        text: `${t.text}.${c.text}`,
      };
    }
    return { column: t.text.toLowerCase(), text: t.text };
  }

  // ── from / join ───────────────────────────────────────────────────────────

  private parseTableRef(ctx: string): TableRef {
    const t = this.peek();
    if (t.kind === "op" && t.text === "(") throw subqueryError();
    if (t.kind !== "ident")
      throw new SqlError(
        `I expected a table name ${ctx}, but found ${describe(t)}.`,
        "The tables here are students, classes, teachers and grades.",
      );
    if (KEYWORDS.has(t.up))
      throw new SqlError(
        `I expected a table name ${ctx}, but "${t.text}" is a SQL keyword.`,
        "For example: FROM students",
      );
    this.advance();
    const alias = this.parseAlias();
    return {
      table: t.text.toLowerCase(),
      text: t.text,
      alias: (alias ?? t.text).toLowerCase(),
    };
  }

  private parseOptionalJoin(): JoinClause | undefined {
    for (const word of ["LEFT", "RIGHT", "FULL", "CROSS", "NATURAL", "OUTER"]) {
      if (this.atKw(word))
        throw new SqlError(
          `${word} JOIN isn't supported yet — this lab does INNER JOIN only.`,
          "Write INNER JOIN (or just JOIN). It keeps the rows that match on both sides.",
        );
    }
    let sawInner = false;
    if (this.eatKw("INNER")) sawInner = true;
    if (!this.eatKw("JOIN")) {
      if (sawInner)
        throw new SqlError(
          "INNER needs JOIN straight after it.",
          "Write: INNER JOIN classes c ON s.class_id = c.id",
        );
      return undefined;
    }
    const ref = this.parseTableRef("after JOIN");
    if (this.atKw("USING"))
      throw new SqlError(
        "JOIN ... USING isn't supported yet.",
        "Spell the match out in full: ON students.class_id = classes.id",
      );
    if (!this.eatKw("ON"))
      throw new SqlError(
        "A JOIN needs an ON that says which columns must match.",
        "For example: INNER JOIN classes c ON s.class_id = c.id",
      );
    const left = this.parseColRef("in the ON condition");
    if (!this.eatOp("="))
      throw new SqlError(
        `The ON condition links two columns with =, but I found ${describe(
          this.peek(),
        )}.`,
        "For example: ON s.class_id = c.id",
      );
    const right = this.parseColRef("in the ON condition");
    if (this.atKw("AND") || this.atKw("OR"))
      throw new SqlError(
        "This lab matches tables on a single pair of columns.",
        "Keep ON to one comparison — extra conditions belong in WHERE.",
      );
    return { ...ref, on: { left, right } };
  }

  // ── conditions ────────────────────────────────────────────────────────────

  private parseCond(clause: string): Cond {
    return this.parseOr(clause);
  }

  private parseOr(clause: string): Cond {
    let left = this.parseAnd(clause);
    while (this.eatKw("OR"))
      left = { kind: "or", left, right: this.parseAnd(clause) };
    return left;
  }

  private parseAnd(clause: string): Cond {
    let left = this.parseNot(clause);
    while (this.eatKw("AND"))
      left = { kind: "and", left, right: this.parseNot(clause) };
    return left;
  }

  private parseNot(clause: string): Cond {
    if (this.eatKw("NOT")) return { kind: "not", inner: this.parseNot(clause) };
    return this.parsePredicate(clause);
  }

  private parsePredicate(clause: string): Cond {
    if (this.atOp("(")) {
      if (this.peek(1).kind === "ident" && this.peek(1).up === "SELECT")
        throw subqueryError();
      this.advance();
      const inner = this.parseOr(clause);
      this.expectOp(")", "to close the bracket");
      return inner;
    }
    const left = this.parseOperand(clause);
    return this.parseComparisonTail(left, clause);
  }

  private parseComparisonTail(left: Operand, clause: string): Cond {
    const negate = this.eatKw("NOT");

    if (this.atKw("BETWEEN"))
      throw new SqlError(
        "BETWEEN isn't supported yet.",
        "Write it as two conditions joined by AND: score >= 60 AND score <= 80",
      );

    if (this.eatKw("LIKE")) {
      const p = this.peek();
      if (p.kind !== "str")
        throw new SqlError(
          `LIKE needs a text pattern in quotes, but I found ${describe(p)}.`,
          "For example: last_name LIKE 'H%' finds every last name starting with H.",
        );
      this.advance();
      return { kind: "like", not: negate, left, pattern: p.text };
    }

    if (this.eatKw("IN")) {
      this.expectOp("(", "after IN");
      if (this.peek().kind === "ident" && this.peek().up === "SELECT")
        throw subqueryError();
      const list: SqlValue[] = [];
      do {
        list.push(this.parseLiteral("inside IN ( ... )"));
      } while (this.eatOp(","));
      this.expectOp(")", "to close the IN list");
      return { kind: "in", not: negate, left, list };
    }

    if (this.eatKw("IS")) {
      const isNot = this.eatKw("NOT");
      if (!this.eatKw("NULL"))
        throw new SqlError(
          "IS is only used to test for empty values here.",
          "Write: class_id IS NULL — or class_id IS NOT NULL.",
        );
      return { kind: "isnull", not: negate !== isNot, left };
    }

    if (negate)
      throw new SqlError(
        "NOT needs LIKE, IN or NULL after it here.",
        "For example: last_name NOT LIKE 'H%', or grade NOT IN (9, 10).",
      );

    const op = this.peek();
    if (op.kind === "op" && COMPARE_OPS.has(op.text)) {
      this.advance();
      if (op.text === "=" && this.atOp("="))
        throw new SqlError(
          "In SQL, equals is a single = (not ==).",
          "Write: WHERE grade = 10",
        );
      const right = this.parseOperand(clause);
      return { kind: "cmp", op: op.text === "!=" ? "<>" : op.text, left, right };
    }
    if (op.kind === "op" && ["+", "-", "/", "%"].includes(op.text))
      throw new SqlError(
        `Doing maths inside a query (${op.text}) isn't supported yet.`,
        "Compare a column with a fixed number instead, e.g. score >= 60.",
      );
    if (op.kind === "ident" && op.up === "AS")
      throw new SqlError(
        "AS renames columns in the SELECT list — it can't be used in a condition.",
        "For example: SELECT score AS mark FROM grades WHERE score > 80;",
      );
    throw new SqlError(
      `I expected a comparison after ${operandLabel(left)}, but found ${describe(op)}.`,
      "Conditions look like: grade = 10 · score >= 60 · last_name LIKE 'H%' · class_id IS NULL",
    );
  }

  private parseOperand(clause: string): Operand {
    const t = this.peek();
    if (t.kind === "str") {
      this.advance();
      return { kind: "lit", value: t.text };
    }
    if (t.kind === "num") {
      this.advance();
      return { kind: "lit", value: t.num ?? 0 };
    }
    if (t.kind === "op" && t.text === "-" && this.peek(1).kind === "num") {
      this.advance();
      const n = this.advance();
      return { kind: "lit", value: -(n.num ?? 0) };
    }
    if (t.kind === "ident" && t.up === "NULL") {
      this.advance();
      return { kind: "lit", value: null };
    }
    if (
      t.kind === "ident" &&
      AGG_FUNCS.has(t.up) &&
      this.peek(1).kind === "op" &&
      this.peek(1).text === "("
    )
      return { kind: "agg", agg: this.parseAgg() };
    return { kind: "col", ref: this.parseColRef(`in ${clause}`) };
  }

  private parseLiteral(ctx: string): SqlValue {
    const t = this.peek();
    if (t.kind === "str") {
      this.advance();
      return t.text;
    }
    if (t.kind === "num") {
      this.advance();
      return t.num ?? 0;
    }
    if (t.kind === "op" && t.text === "-" && this.peek(1).kind === "num") {
      this.advance();
      const n = this.advance();
      return -(n.num ?? 0);
    }
    if (t.kind === "ident" && t.up === "NULL") {
      this.advance();
      return null;
    }
    throw new SqlError(
      `I expected a value ${ctx}, but found ${describe(t)}.`,
      "Lists hold fixed values: numbers like 9, 10 or text like 'ICT', 'Math'.",
    );
  }
}

function operandLabel(op: Operand): string {
  if (op.kind === "col") return `"${op.ref.text}"`;
  if (op.kind === "agg") return op.agg.text;
  return op.value === null ? "NULL" : `'${op.value}'`;
}

// ── Value helpers ───────────────────────────────────────────────────────────

function toNumber(v: SqlValue): number | null {
  if (v === null) return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = v.trim();
  if (s === "") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

/**
 * Three-way compare. Returns null when either side is NULL — SQL calls that
 * "unknown", and this lab treats unknown as "does not match".
 */
function cmpValues(a: SqlValue, b: SqlValue): number | null {
  if (a === null || b === null) return null;
  const an = toNumber(a);
  const bn = toNumber(b);
  if (an !== null && bn !== null) return an < bn ? -1 : an > bn ? 1 : 0;
  const as = String(a).toLowerCase();
  const bs = String(b).toLowerCase();
  return as < bs ? -1 : as > bs ? 1 : 0;
}

function applyCmp(op: string, a: SqlValue, b: SqlValue): boolean {
  const c = cmpValues(a, b);
  if (c === null) return false;
  switch (op) {
    case "=":
      return c === 0;
    case "<>":
      return c !== 0;
    case ">":
      return c > 0;
    case "<":
      return c < 0;
    case ">=":
      return c >= 0;
    case "<=":
      return c <= 0;
    default:
      return false;
  }
}

function likeToRegExp(pattern: string): RegExp {
  let body = "";
  for (const ch of pattern) {
    if (ch === "%") body += "[\\s\\S]*";
    else if (ch === "_") body += "[\\s\\S]";
    else body += ch.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  return new RegExp(`^${body}$`, "i");
}

function editDistance(a: string, b: string): number {
  const prev: number[] = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(
        prev[j] + 1,
        prev[j - 1] + 1,
        diag + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
      diag = tmp;
    }
  }
  return prev[b.length];
}

function didYouMean(name: string, options: string[]): string | undefined {
  let best: string | undefined;
  let bestDistance = Number.POSITIVE_INFINITY;
  for (const option of options) {
    const d = editDistance(name.toLowerCase(), option.toLowerCase());
    if (d < bestDistance) {
      bestDistance = d;
      best = option;
    }
  }
  if (best && bestDistance <= Math.max(2, Math.floor(best.length / 3))) return best;
  return undefined;
}

function unique(values: string[]): string[] {
  return [...new Set(values)];
}

// ── Execution ───────────────────────────────────────────────────────────────

interface SourceCol {
  idx: number;
  alias: string;
  tableName: string;
  column: string;
  type: ColumnType;
  /** Header used by SELECT * — qualified only when the name is ambiguous. */
  display: string;
}

function findTable(db: SqlDatabase, name: string): TableDef {
  const found = db.tables.find((t) => t.name.toLowerCase() === name.toLowerCase());
  if (found) return found;
  const guess = didYouMean(
    name,
    db.tables.map((t) => t.name),
  );
  throw new SqlError(
    `There's no table called "${name}" in ${db.name}.`,
    `${guess ? `Did you mean "${guess}"? ` : ""}The tables are: ${db.tables
      .map((t) => t.name)
      .join(", ")}.`,
  );
}

function execute(q: Query, db: SqlDatabase): ResultSet {
  // 1 ── resolve the tables this query reads
  const fromDef = findTable(db, q.from.table);
  const sources: { def: TableDef; alias: string }[] = [
    { def: fromDef, alias: q.from.alias },
  ];
  if (q.join) {
    const joinDef = findTable(db, q.join.table);
    if (q.join.alias === q.from.alias)
      throw new SqlError(
        `Both tables are called "${q.join.alias}" in this query, so I can't tell them apart.`,
        "Give each one a short alias: FROM students s INNER JOIN classes c ON s.class_id = c.id",
      );
    sources.push({ def: joinDef, alias: q.join.alias });
  }

  const nameCount = new Map<string, number>();
  for (const s of sources)
    for (const c of s.def.columns)
      nameCount.set(c.name, (nameCount.get(c.name) ?? 0) + 1);

  const scols: SourceCol[] = [];
  for (const s of sources)
    for (const c of s.def.columns)
      scols.push({
        idx: scols.length,
        alias: s.alias,
        tableName: s.def.name,
        column: c.name,
        type: c.type,
        display: (nameCount.get(c.name) ?? 0) > 1 ? `${s.alias}.${c.name}` : c.name,
      });

  const resolve = (ref: ColRef): SourceCol => {
    let pool = scols;
    if (ref.table) {
      pool = scols.filter(
        (c) => c.alias === ref.table || c.tableName === ref.table,
      );
      if (pool.length === 0)
        throw new SqlError(
          `"${ref.table}" isn't one of the tables in this query.`,
          `This query reads ${sources
            .map((s) =>
              s.alias === s.def.name ? s.def.name : `${s.def.name} (as ${s.alias})`,
            )
            .join(" and ")}.`,
        );
    }
    const hits = pool.filter((c) => c.column === ref.column);
    if (hits.length === 1) return hits[0];
    if (hits.length === 0) {
      const options = unique(pool.map((c) => c.column));
      const guess = didYouMean(ref.column, options);
      throw new SqlError(
        `There's no column called "${ref.column}"${
          ref.table ? ` in ${ref.table}` : ""
        }.`,
        `${guess ? `Did you mean "${guess}"? ` : ""}Columns available: ${options.join(
          ", ",
        )}.`,
      );
    }
    throw new SqlError(
      `"${ref.column}" exists in both tables, so I don't know which one you mean.`,
      `Say which: ${hits.map((h) => `${h.alias}.${h.column}`).join(" or ")}.`,
    );
  };

  const starColumns = (table?: string): SourceCol[] => {
    if (!table) return scols;
    const hits = scols.filter((c) => c.alias === table || c.tableName === table);
    if (hits.length === 0)
      throw new SqlError(
        `"${table}.*" doesn't match a table in this query.`,
        `This query reads ${sources.map((s) => s.alias).join(" and ")}.`,
      );
    return hits;
  };

  // 2 ── build the working rows (a join is a filtered pairing of both tables)
  let rows: SqlValue[][];
  if (!q.join) {
    rows = fromDef.rows.map((r) => [...r]);
  } else {
    const onLeft = resolve(q.join.on.left);
    const onRight = resolve(q.join.on.right);
    if (onLeft.alias === onRight.alias)
      throw new SqlError(
        "The ON condition compares two columns from the same table.",
        "An ON links the two tables together, e.g. ON s.class_id = c.id",
      );
    rows = [];
    for (const left of sources[0].def.rows)
      for (const right of sources[1].def.rows) {
        const combined = [...left, ...right];
        if (cmpValues(combined[onLeft.idx], combined[onRight.idx]) === 0)
          rows.push(combined);
      }
  }

  // 3 ── WHERE
  if (q.where) {
    const predicate = compileCond(q.where, resolve, "WHERE");
    rows = rows.filter((row) => predicate(row, null));
  }

  // 4 ── decide whether this is a grouped (aggregate) query
  const hasSelectAgg = q.select.some(
    (item) => item.kind === "expr" && item.expr.kind === "agg",
  );
  const hasHavingAgg = q.having ? condHasAgg(q.having) : false;
  const hasOrderAgg = (q.orderBy ?? []).some((k) => k.expr.kind === "agg");
  const grouped = Boolean(q.groupBy) || hasSelectAgg || hasHavingAgg;

  if (q.having && !grouped)
    throw new SqlError(
      "HAVING filters groups, but this query doesn't make any groups.",
      "Use WHERE to filter rows — or add a GROUP BY and keep HAVING for the totals.",
    );
  if (hasOrderAgg && !grouped)
    throw new SqlError(
      "ORDER BY uses a total like AVG(), but nothing is being grouped.",
      "Add the aggregate to the SELECT list and a GROUP BY, then sort by it.",
    );

  return grouped
    ? runGrouped(q, rows, resolve)
    : runFlat(q, rows, resolve, starColumns);
}

type Resolver = (ref: ColRef) => SourceCol;
type StarResolver = (table?: string) => SourceCol[];
type AggMap = Map<string, SqlValue>;
type Predicate = (row: SqlValue[], aggs: AggMap | null) => boolean;

function condHasAgg(cond: Cond): boolean {
  switch (cond.kind) {
    case "and":
    case "or":
      return condHasAgg(cond.left) || condHasAgg(cond.right);
    case "not":
      return condHasAgg(cond.inner);
    case "cmp":
      return cond.left.kind === "agg" || cond.right.kind === "agg";
    default:
      return cond.left.kind === "agg";
  }
}

function collectAggs(cond: Cond, into: AggExpr[]): void {
  const add = (op: Operand) => {
    if (op.kind === "agg" && !into.some((a) => aggKey(a) === aggKey(op.agg)))
      into.push(op.agg);
  };
  switch (cond.kind) {
    case "and":
    case "or":
      collectAggs(cond.left, into);
      collectAggs(cond.right, into);
      return;
    case "not":
      collectAggs(cond.inner, into);
      return;
    case "cmp":
      add(cond.left);
      add(cond.right);
      return;
    default:
      add(cond.left);
  }
}

const aggKey = (a: AggExpr) => a.text.toUpperCase();

function compileCond(cond: Cond, resolve: Resolver, clause: string): Predicate {
  switch (cond.kind) {
    case "and": {
      const l = compileCond(cond.left, resolve, clause);
      const r = compileCond(cond.right, resolve, clause);
      return (row, aggs) => l(row, aggs) && r(row, aggs);
    }
    case "or": {
      const l = compileCond(cond.left, resolve, clause);
      const r = compileCond(cond.right, resolve, clause);
      return (row, aggs) => l(row, aggs) || r(row, aggs);
    }
    case "not": {
      const inner = compileCond(cond.inner, resolve, clause);
      return (row, aggs) => !inner(row, aggs);
    }
    case "cmp": {
      const l = compileOperand(cond.left, resolve, clause);
      const r = compileOperand(cond.right, resolve, clause);
      return (row, aggs) => applyCmp(cond.op, l(row, aggs), r(row, aggs));
    }
    case "like": {
      const l = compileOperand(cond.left, resolve, clause);
      const re = likeToRegExp(cond.pattern);
      return (row, aggs) => {
        const v = l(row, aggs);
        if (v === null) return false;
        const hit = re.test(String(v));
        return cond.not ? !hit : hit;
      };
    }
    case "in": {
      const l = compileOperand(cond.left, resolve, clause);
      return (row, aggs) => {
        const v = l(row, aggs);
        const hit = cond.list.some((item) => cmpValues(v, item) === 0);
        return cond.not ? !hit : hit;
      };
    }
    case "isnull": {
      const l = compileOperand(cond.left, resolve, clause);
      return (row, aggs) => {
        const isNull = l(row, aggs) === null;
        return cond.not ? !isNull : isNull;
      };
    }
  }
}

function compileOperand(
  op: Operand,
  resolve: Resolver,
  clause: string,
): (row: SqlValue[], aggs: AggMap | null) => SqlValue {
  if (op.kind === "lit") return () => op.value;
  if (op.kind === "col") {
    const col = resolve(op.ref);
    return (row) => row[col.idx] ?? null;
  }
  if (clause === "WHERE")
    throw new SqlError(
      `${op.agg.text} can't be used in WHERE.`,
      "WHERE looks at one row at a time, before any totals exist. Filter totals with HAVING after a GROUP BY.",
    );
  const key = aggKey(op.agg);
  return (_row, aggs) => aggs?.get(key) ?? null;
}

function computeAgg(
  agg: AggExpr,
  groupRows: SqlValue[][],
  resolve: Resolver,
): SqlValue {
  if (agg.arg === "*") return groupRows.length;
  const col = resolve(agg.arg);
  const values = groupRows
    .map((r) => r[col.idx] ?? null)
    .filter((v): v is string | number => v !== null);

  switch (agg.func) {
    case "COUNT":
      return values.length;
    case "SUM":
    case "AVG": {
      if (col.type === "TEXT")
        throw new SqlError(
          `${agg.func}(${col.column}) needs numbers, but ${col.column} holds text.`,
          "Try a number column such as score, grade or term.",
        );
      if (values.length === 0) return null;
      const total = values.reduce<number>((sum, v) => sum + (toNumber(v) ?? 0), 0);
      if (agg.func === "SUM") return total;
      return Math.round((total / values.length) * 100) / 100;
    }
    case "MIN":
    case "MAX": {
      if (values.length === 0) return null;
      let best = values[0];
      for (const v of values.slice(1)) {
        const c = cmpValues(v, best) ?? 0;
        if (agg.func === "MIN" ? c < 0 : c > 0) best = v;
      }
      return best;
    }
  }
}

/** Header text a result column answers to when ORDER BY names it. */
function headerAliases(item: SelectItem): string[] {
  if (item.kind === "star") return [];
  const names: string[] = [];
  if (item.alias) names.push(item.alias);
  if (item.expr.kind === "col") {
    names.push(item.expr.ref.text, item.expr.ref.column);
  } else {
    names.push(item.expr.text);
  }
  return names.map((n) => n.toLowerCase());
}

function orderKeyText(expr: ValueExpr): string {
  return expr.kind === "agg" ? expr.text : expr.ref.text;
}

function sortRows<T>(
  items: T[],
  keys: { get: (item: T) => SqlValue; dir: "ASC" | "DESC" }[],
): T[] {
  return [...items].sort((a, b) => {
    for (const key of keys) {
      const av = key.get(a);
      const bv = key.get(b);
      // NULL sorts last in both directions — "no value" is never the answer.
      if (av === null && bv === null) continue;
      if (av === null) return 1;
      if (bv === null) return -1;
      const c = cmpValues(av, bv) ?? 0;
      if (c !== 0) return key.dir === "DESC" ? -c : c;
    }
    return 0;
  });
}

function runFlat(
  q: Query,
  rows: SqlValue[][],
  resolve: Resolver,
  starColumns: StarResolver,
): ResultSet {
  const columns: string[] = [];
  const numeric: boolean[] = [];
  const getters: ((row: SqlValue[]) => SqlValue)[] = [];

  for (const item of q.select) {
    if (item.kind === "star") {
      for (const col of starColumns(item.table)) {
        columns.push(col.display);
        numeric.push(col.type === "INTEGER");
        getters.push((row) => row[col.idx] ?? null);
      }
      continue;
    }
    if (item.expr.kind === "agg")
      throw new SqlError(
        `${item.expr.text} mixes a total with plain columns.`,
        "Either select only totals, or add a GROUP BY naming the columns you want beside them.",
      );
    const col = resolve(item.expr.ref);
    columns.push(item.alias ?? item.expr.ref.text);
    numeric.push(col.type === "INTEGER");
    getters.push((row) => row[col.idx] ?? null);
  }

  let working = rows;
  if (q.orderBy?.length) {
    const keys = q.orderBy.map((key) => {
      const text = orderKeyText(key.expr).toLowerCase();
      const outIndex = q.select.findIndex((item) =>
        headerAliases(item).includes(text),
      );
      if (outIndex >= 0) {
        // Sorting by something already selected: use exactly that value.
        let offset = 0;
        for (let i = 0; i < outIndex; i++) {
          const item = q.select[i];
          offset += item.kind === "star" ? starColumns(item.table).length : 1;
        }
        const getter = getters[offset];
        return { get: (row: SqlValue[]) => getter(row), dir: key.dir };
      }
      if (key.expr.kind === "agg")
        throw new SqlError(
          `ORDER BY ${key.expr.text} needs that total in the SELECT list.`,
          "Add it: SELECT subject, AVG(score) AS avg_score ... ORDER BY avg_score DESC",
        );
      const col = resolve(key.expr.ref);
      return { get: (row: SqlValue[]) => row[col.idx] ?? null, dir: key.dir };
    });
    working = sortRows(working, keys);
  }

  if (q.limit !== undefined) working = working.slice(0, q.limit);

  return {
    columns,
    numeric,
    rows: working.map((row) => getters.map((get) => get(row))),
  };
}

function runGrouped(q: Query, rows: SqlValue[][], resolve: Resolver): ResultSet {
  if (q.select.some((item) => item.kind === "star"))
    throw new SqlError(
      "SELECT * can't be mixed with grouping.",
      "List the grouped columns and the totals instead, e.g. SELECT grade, COUNT(*) FROM students GROUP BY grade;",
    );

  const groupCols = (q.groupBy ?? []).map(resolve);

  // Every plain column in the SELECT list has to be one of the grouped ones,
  // otherwise the database would have to pick a row at random.
  for (const item of q.select) {
    if (item.kind !== "expr" || item.expr.kind !== "col") continue;
    const col = resolve(item.expr.ref);
    if (!groupCols.some((g) => g.idx === col.idx))
      throw new SqlError(
        `"${item.expr.ref.text}" isn't in the GROUP BY, so there's one value per row but only one row per group.`,
        q.groupBy
          ? `Add it to the GROUP BY, or wrap it in a total like MIN(${item.expr.ref.text}).`
          : `Add GROUP BY ${item.expr.ref.text} at the end of the query.`,
      );
  }

  // Collect every aggregate that has to be computed for each group.
  const aggs: AggExpr[] = [];
  const addAgg = (agg: AggExpr) => {
    if (!aggs.some((a) => aggKey(a) === aggKey(agg))) aggs.push(agg);
  };
  for (const item of q.select)
    if (item.kind === "expr" && item.expr.kind === "agg") addAgg(item.expr);
  if (q.having) collectAggs(q.having, aggs);
  for (const key of q.orderBy ?? [])
    if (key.expr.kind === "agg") addAgg(key.expr);

  // Build the groups, preserving first-seen order.
  const groups: { rep: SqlValue[]; rows: SqlValue[][] }[] = [];
  if (groupCols.length === 0) {
    // No GROUP BY: the whole table is a single group (COUNT(*) of nothing is 0).
    groups.push({ rep: rows[0] ?? [], rows });
  } else {
    const index = new Map<string, number>();
    for (const row of rows) {
      const key = JSON.stringify(
        groupCols.map((g) => {
          const v = row[g.idx] ?? null;
          return v === null ? ["n"] : [typeof v, v];
        }),
      );
      const at = index.get(key);
      if (at === undefined) {
        index.set(key, groups.length);
        groups.push({ rep: row, rows: [row] });
      } else {
        groups[at].rows.push(row);
      }
    }
  }

  const aggValues = groups.map((group) => {
    const map: AggMap = new Map();
    for (const agg of aggs) map.set(aggKey(agg), computeAgg(agg, group.rows, resolve));
    return map;
  });

  if (q.having) {
    const predicate = compileCond(q.having, resolve, "HAVING");
    for (let i = groups.length - 1; i >= 0; i--)
      if (!predicate(groups[i].rep, aggValues[i])) {
        groups.splice(i, 1);
        aggValues.splice(i, 1);
      }
  }

  // Project each group into one output row.
  const columns: string[] = [];
  const numeric: boolean[] = [];
  const getters: ((rep: SqlValue[], map: AggMap) => SqlValue)[] = [];

  for (const item of q.select) {
    if (item.kind !== "expr") continue;
    if (item.expr.kind === "col") {
      const col = resolve(item.expr.ref);
      columns.push(item.alias ?? item.expr.ref.text);
      numeric.push(col.type === "INTEGER");
      getters.push((rep) => rep[col.idx] ?? null);
    } else {
      const agg = item.expr;
      const key = aggKey(agg);
      columns.push(item.alias ?? agg.text);
      const argType =
        agg.arg === "*" ? "INTEGER" : resolve(agg.arg).type;
      numeric.push(
        agg.func === "COUNT" ||
          agg.func === "SUM" ||
          agg.func === "AVG" ||
          argType === "INTEGER",
      );
      getters.push((_rep, map) => map.get(key) ?? null);
    }
  }

  let output = groups.map((group, i) => ({
    values: getters.map((get) => get(group.rep, aggValues[i])),
  }));

  if (q.orderBy?.length) {
    const keys = q.orderBy.map((key) => {
      const text = orderKeyText(key.expr).toLowerCase();
      const outIndex = q.select.findIndex((item) =>
        headerAliases(item).includes(text),
      );
      if (outIndex < 0)
        throw new SqlError(
          `ORDER BY "${orderKeyText(key.expr)}" — that isn't one of the columns this query returns.`,
          "In a grouped query you can only sort by the grouped columns and the totals you selected.",
        );
      return {
        get: (item: { values: SqlValue[] }) => item.values[outIndex] ?? null,
        dir: key.dir,
      };
    });
    output = sortRows(output, keys);
  }

  if (q.limit !== undefined) output = output.slice(0, q.limit);

  return { columns, numeric, rows: output.map((o) => o.values) };
}

// ── Public entry point ──────────────────────────────────────────────────────

/**
 * Parse and run one SQL statement against an in-memory database.
 * Never throws: every failure comes back as `{ ok: false }` with a message
 * a student can act on.
 */
export function runQuery(sql: string, db: SqlDatabase): QueryOutcome {
  const clock =
    typeof performance !== "undefined" && typeof performance.now === "function"
      ? () => performance.now()
      : () => Date.now();
  const started = clock();
  try {
    if (!sql.trim())
      return {
        ok: false,
        error: "There's nothing to run yet.",
        hint: "Type a query, or tap one of the example chips to load one.",
      };
    const query = new Parser(sql).parse();
    const result = execute(query, db);
    return { ok: true, result, ms: Math.max(0, clock() - started) };
  } catch (error) {
    if (error instanceof SqlError)
      return { ok: false, error: error.message, hint: error.hint };
    return {
      ok: false,
      error: "Something in that query stopped the engine before it could answer.",
      hint: "Try running one of the example queries, then change it a piece at a time.",
    };
  }
}

/** Display form of a single result cell. NULL renders separately in the UI. */
export function formatValue(value: SqlValue): string {
  if (value === null) return "NULL";
  return String(value);
}
