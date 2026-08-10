import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/**
 * Minimal markdown renderer for curriculum text.
 * Supports paragraphs, unordered/ordered lists, **bold**, *italic*, `code`.
 * Deliberately tiny — curriculum blocks handle structure; this handles prose.
 */

function renderInline(text: string): ReactNode[] {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-ink-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code
          key={i}
          className="rounded bg-ink-100 px-1.5 py-0.5 font-mono text-[0.85em] text-brand-700"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return <em key={i}>{part.slice(1, -1)}</em>;
    }
    return part;
  });
}

export function Inline({ text }: { text: string }) {
  return <>{renderInline(text)}</>;
}

export function Md({ text, className }: { text: string; className?: string }) {
  const lines = text.split("\n");
  const blocks: ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;
  let para: string[] = [];
  let key = 0;

  const flushPara = () => {
    if (para.length) {
      blocks.push(
        <p key={key++} className="leading-relaxed">
          {renderInline(para.join(" "))}
        </p>,
      );
      para = [];
    }
  };
  const flushList = () => {
    if (list) {
      const L = list.ordered ? "ol" : "ul";
      blocks.push(
        <L
          key={key++}
          className={cn(
            "space-y-1.5 pl-5 leading-relaxed",
            list.ordered ? "list-decimal" : "list-disc",
            "marker:text-brand-400",
          )}
        >
          {list.items.map((item, i) => (
            <li key={i}>{renderInline(item)}</li>
          ))}
        </L>,
      );
      list = null;
    }
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ul = line.match(/^\s*-\s+(.*)/);
    const ol = line.match(/^\s*\d+\.\s+(.*)/);
    if (ul) {
      flushPara();
      if (!list || list.ordered) {
        flushList();
        list = { ordered: false, items: [] };
      }
      list.items.push(ul[1]);
    } else if (ol) {
      flushPara();
      if (!list || !list.ordered) {
        flushList();
        list = { ordered: true, items: [] };
      }
      list.items.push(ol[1]);
    } else if (line.trim() === "") {
      flushPara();
      flushList();
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();

  return <div className={cn("space-y-3 text-ink-700", className)}>{blocks}</div>;
}
