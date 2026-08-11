"use client";

import { useCallback, useEffect, useState } from "react";

export type BookFileStatus = "checking" | "present" | "missing";

/**
 * GitHub Pages serves the export from /<repo>, so every runtime-built URL —
 * the PDFs and the pdf.js worker — needs the same prefix `next.config.ts`
 * gives to bundled assets. Absolute and inline sources are left alone.
 */
export function bookAssetUrl(path: string): string {
  if (/^(https?:|blob:|data:)/i.test(path)) return path;
  const base = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return `${base}${path.startsWith("/") ? "" : "/"}${path}`;
}

/**
 * Is the original PDF actually installed?
 *
 * The printed pages are large binaries kept out of the repository, so a chapter
 * can be catalogued long before its file is dropped into `public/books/`. This
 * probes for it — HEAD first, then a one-byte ranged GET for hosts that reject
 * HEAD — so the UI can say "not installed yet" honestly instead of mounting a
 * viewer that will fail to parse a 404 page.
 */
export function useBookFile(src: string): {
  status: BookFileStatus;
  /** Bytes reported by the server, when it sent a length */
  bytes: number | null;
  recheck: () => void;
} {
  const [attempt, setAttempt] = useState(0);
  // The probe is tagged with what it probed, so a new file (or a recheck) reads
  // as "checking" immediately — without an effect having to reset anything.
  const [probe, setProbe] = useState<{
    key: string;
    status: BookFileStatus;
    bytes: number | null;
  } | null>(null);

  const key = `${src}#${attempt}`;
  const settled = probe?.key === key ? probe : null;

  const recheck = useCallback(() => {
    setAttempt((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!src) return;
    const controller = new AbortController();
    let alive = true;
    const url = bookAssetUrl(src);

    // A static host that misses the file answers with its 404 page, which can
    // still be a 200 — so the content type has to agree that this is a PDF.
    const looksLikePdf = (res: Response) => {
      if (!res.ok && res.status !== 206) return false;
      const type = res.headers.get("content-type") ?? "";
      return !type.toLowerCase().includes("text/html");
    };

    const sizeOf = (res: Response) => {
      const len =
        res.headers.get("content-length") ??
        res.headers.get("content-range")?.split("/")[1] ??
        null;
      const n = len ? Number(len) : Number.NaN;
      return Number.isFinite(n) && n > 0 ? n : null;
    };

    (async () => {
      try {
        let res = await fetch(url, { method: "HEAD", signal: controller.signal });
        if (!res.ok && res.status !== 206) {
          res = await fetch(url, {
            method: "GET",
            headers: { Range: "bytes=0-0" },
            signal: controller.signal,
          });
        }
        if (!alive) return;
        const present = looksLikePdf(res);
        setProbe({
          key,
          status: present ? "present" : "missing",
          bytes: present ? sizeOf(res) : null,
        });
      } catch {
        if (alive) setProbe({ key, status: "missing", bytes: null });
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [src, key]);

  return {
    status: src ? (settled?.status ?? "checking") : "missing",
    bytes: settled?.bytes ?? null,
    recheck,
  };
}
