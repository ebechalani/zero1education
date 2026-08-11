"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { ProgressBar } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { clamp, cn } from "@/lib/utils";
import type {
  PDFDocumentLoadingTask,
  PDFDocumentProxy,
  RenderTask,
} from "pdfjs-dist";
import {
  ChevronLeft,
  ChevronRight,
  FileWarning,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  RefreshCw,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
} from "react";
import { bookAssetUrl } from "./use-book-file";

const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.25;
/** CSS width a thumbnail is rendered at; the rail is sized around it. */
const THUMB_WIDTH = 120;
/**
 * Ceiling on the canvas backing store. A zoomed A4 page at 2× DPR is happily
 * over 70 megapixels, which iOS Safari refuses to allocate — past this we trade
 * sharpness for a page that actually appears.
 */
const MAX_CANVAS_PIXELS = 12_000_000;

type ViewerStatus = "loading" | "ready" | "error";

/** pdf.js rejects in-flight work with these when *we* cancel it. Not errors. */
function isCancellation(err: unknown): boolean {
  const name = err instanceof Error ? err.name : "";
  return name === "RenderingCancelledException" || name === "AbortException";
}

/** A file never installed and a file that is corrupt need different words. */
function isMissingFile(err: unknown): boolean {
  const name = err instanceof Error ? err.name : "";
  return name === "MissingPDFException" || name === "UnexpectedResponseException";
}

/** Content-box width of the scroll stage — the width a page has to fit into. */
function measureStage(el: HTMLElement): number {
  const style = window.getComputedStyle(el);
  const padding = parseFloat(style.paddingLeft) + parseFloat(style.paddingRight);
  return Math.max(0, el.clientWidth - (Number.isFinite(padding) ? padding : 0));
}

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};
type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
};

function ToolButton({
  label,
  icon,
  onClick,
  disabled,
  pressed,
}: {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  disabled?: boolean;
  pressed?: boolean;
}) {
  return (
    <Button
      variant={pressed ? "primary" : "ghost"}
      size="sm"
      icon={icon}
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className="size-9 shrink-0 px-0"
    />
  );
}

interface PdfPageViewerProps {
  src: string;
  title: string;
  startPage?: number;
  onPageChange?: (p: number) => void;
  /**
   * Restrict navigation to [first, last] of the file. A lesson anchored to its
   * own pages should not let a student wander into the next lesson by holding
   * the arrow key — the chapter view is where you browse freely.
   */
  pageRange?: [number, number];
}

/**
 * The author's printed pages, read online.
 *
 * Everything runs in the browser: pdf.js is imported inside an effect so it
 * never touches the static build, its worker is served from `public/pdf/`, and
 * one page at a time is painted to a canvas at device pixel ratio. No server,
 * no download, no upload — the PDF is fetched like any other static asset and
 * decoded locally.
 *
 * A new file, or a retry after a failure, remounts the view below: that single
 * key *is* the reset, so no piece of document state has to be unwound by hand.
 */
export function PdfPageViewer(props: PdfPageViewerProps) {
  const [attempt, setAttempt] = useState(0);
  return (
    <PdfDocumentView
      key={`${props.src}#${attempt}`}
      {...props}
      onRetry={() => setAttempt((n) => n + 1)}
    />
  );
}

function PdfDocumentView({
  src,
  title,
  startPage,
  onPageChange,
  pageRange,
  onRetry,
}: PdfPageViewerProps & { onRetry: () => void }) {
  const [status, setStatus] = useState<ViewerStatus>("loading");
  const [missing, setMissing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [page, setPage] = useState(1);
  // The page field only holds a draft while it is being typed for *this* page;
  // turning the page any other way makes the draft stale and the number wins.
  const [draft, setDraft] = useState<{ page: number; text: string } | null>(null);
  const [zoom, setZoom] = useState(1);
  const [rendering, setRendering] = useState(false);
  const [thumbsOpen, setThumbsOpen] = useState(false);
  const [thumbs, setThumbs] = useState<Record<number, string>>({});
  const [isFullscreen, setFullscreen] = useState(false);
  const [stageEl, setStageEl] = useState<HTMLDivElement | null>(null);
  const [stageWidth, setStageWidth] = useState(0);

  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const renderTaskRef = useRef<RenderTask | null>(null);
  const docRef = useRef<PDFDocumentProxy | null>(null);
  const aliveRef = useRef(true);
  // Thumbnails render one at a time, only for pages the rail has actually shown.
  const thumbCacheRef = useRef<Record<number, string>>({});
  const thumbQueueRef = useRef<number[]>([]);
  const thumbBusyRef = useRef(false);
  // Held in refs so the loader never re-runs when a parent re-renders.
  const startPageRef = useRef(startPage);
  const onPageChangeRef = useRef(onPageChange);
  const rangeRef = useRef(pageRange);

  const hintId = useId();

  useEffect(() => {
    startPageRef.current = startPage;
    onPageChangeRef.current = onPageChange;
    rangeRef.current = pageRange;
  });

  // Navigation bounds: the whole file, or just this lesson's pages.
  const totalPages = numPages || 1;
  const firstPage = Math.max(1, pageRange?.[0] ?? 1);
  const lastPage = Math.min(pageRange?.[1] ?? totalPages, totalPages);

  useEffect(() => {
    aliveRef.current = true;
    return () => {
      aliveRef.current = false;
    };
  }, []);

  const attachStage = useCallback((el: HTMLDivElement | null) => {
    stageRef.current = el;
    setStageEl(el);
    // Measured on attach rather than waiting for the observer's first callback:
    // a viewer mounted in a hidden tab gets no frames, so no observation either,
    // and the first page would sit unrendered until the tab came forward.
    if (el) setStageWidth(measureStage(el));
  }, []);

  // ── Load the document ───────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    let loadingTask: PDFDocumentLoadingTask | null = null;

    (async () => {
      try {
        // Imported here and never at module scope: pdf.js reaches for browser
        // globals, and this app is exported statically at build time.
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = bookAssetUrl("/pdf/pdf.worker.min.mjs");

        const task = pdfjs.getDocument({ url: bookAssetUrl(src) });
        loadingTask = task;
        task.onProgress = ({ loaded, total }: { loaded: number; total: number }) => {
          if (cancelled) return;
          setProgress(total > 0 ? clamp(Math.round((loaded / total) * 100), 0, 100) : 0);
        };

        const pdf = await task.promise;
        if (cancelled) return;
        docRef.current = pdf;
        setDoc(pdf);
        setNumPages(pdf.numPages);
        setPage(
          clamp(
            Math.round(startPageRef.current ?? rangeRef.current?.[0] ?? 1),
            rangeRef.current?.[0] ?? 1,
            Math.min(rangeRef.current?.[1] ?? pdf.numPages, pdf.numPages),
          ),
        );
        setStatus("ready");
      } catch (err) {
        if (cancelled || isCancellation(err)) return;
        setMissing(isMissingFile(err));
        setStatus("error");
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
      renderTaskRef.current = null;
      void loadingTask?.destroy().catch(() => undefined);
    };
  }, [src]);

  // ── Keep the canvas as wide as the stage ────────────────────────────────────
  useEffect(() => {
    if (!stageEl) return;
    const observer = new ResizeObserver((entries) => {
      const width = entries[0]?.contentRect.width ?? 0;
      // contentRect already excludes padding; ignoring sub-pixel jitter stops a
      // appearing scrollbar from starting a resize/render loop.
      setStageWidth((prev) => (Math.abs(prev - width) > 2 ? width : prev));
    });
    observer.observe(stageEl);
    return () => observer.disconnect();
  }, [stageEl]);

  // ── Paint the current page ──────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!doc || !canvas || stageWidth <= 0) return;
    let cancelled = false;
    setRendering(true);

    (async () => {
      try {
        const pdfPage = await doc.getPage(page);
        if (cancelled) return;

        const base = pdfPage.getViewport({ scale: 1 });
        const cssScale = Math.max(0.1, (stageWidth / base.width) * zoom);
        const dpr = Math.min(window.devicePixelRatio || 1, 2);

        let scale = cssScale * dpr;
        const pixels = base.width * scale * (base.height * scale);
        if (pixels > MAX_CANVAS_PIXELS) scale *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
        const viewport = pdfPage.getViewport({ scale });

        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        canvas.style.width = `${Math.round(base.width * cssScale)}px`;
        canvas.style.height = `${Math.round(base.height * cssScale)}px`;

        renderTaskRef.current?.cancel();
        const task = pdfPage.render({ canvas, viewport, background: "#ffffff" });
        renderTaskRef.current = task;
        await task.promise;
        if (!cancelled) renderTaskRef.current = null;
      } catch (err) {
        if (cancelled || isCancellation(err)) return;
        setMissing(false);
        setStatus("error");
      } finally {
        if (!cancelled) setRendering(false);
      }
    })();

    return () => {
      cancelled = true;
      renderTaskRef.current?.cancel();
    };
  }, [doc, page, zoom, stageWidth]);

  // A new page starts at its top, the way turning a page does.
  useEffect(() => {
    if (stageRef.current) stageRef.current.scrollTop = 0;
    if (docRef.current) onPageChangeRef.current?.(page);
  }, [page]);

  // ── Thumbnails, rendered lazily as the rail scrolls ─────────────────────────
  const pumpThumbs = useCallback(async () => {
    if (thumbBusyRef.current) return;
    thumbBusyRef.current = true;
    try {
      let next = thumbQueueRef.current.shift();
      while (next !== undefined) {
        const n = next;
        const pdf = docRef.current;
        if (!pdf || !aliveRef.current) return;
        if (!thumbCacheRef.current[n]) {
          const pdfPage = await pdf.getPage(n);
          const base = pdfPage.getViewport({ scale: 1 });
          const dpr = Math.min(window.devicePixelRatio || 1, 2);
          const viewport = pdfPage.getViewport({
            scale: (THUMB_WIDTH * dpr) / base.width,
          });
          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.floor(viewport.width));
          canvas.height = Math.max(1, Math.floor(viewport.height));
          await pdfPage.render({ canvas, viewport, background: "#ffffff" }).promise;
          pdfPage.cleanup();
          if (!aliveRef.current) return;
          thumbCacheRef.current = {
            ...thumbCacheRef.current,
            [n]: canvas.toDataURL("image/jpeg", 0.72),
          };
          setThumbs(thumbCacheRef.current);
        }
        next = thumbQueueRef.current.shift();
      }
    } catch {
      // A thumbnail that will not render just stays a placeholder — the page
      // itself is still perfectly readable.
    } finally {
      thumbBusyRef.current = false;
    }
  }, []);

  // The pages around the reader are worth having whatever the rail has scrolled
  // to, so an opened rail is never a column of blanks. Everything else waits for
  // the observer below.
  useEffect(() => {
    if (!doc || !thumbsOpen) return;
    for (let n = Math.max(1, page - 2); n <= Math.min(numPages, page + 2); n++) {
      if (!thumbCacheRef.current[n] && !thumbQueueRef.current.includes(n)) {
        thumbQueueRef.current.push(n);
      }
    }
    void pumpThumbs();
  }, [doc, thumbsOpen, page, numPages, pumpThumbs]);

  useEffect(() => {
    const rail = railRef.current;
    if (!rail || !doc || !thumbsOpen) return;
    const observer = new IntersectionObserver(
      (entries) => {
        let queued = false;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const n = Number((entry.target as HTMLElement).dataset.page);
          if (!n || thumbCacheRef.current[n] || thumbQueueRef.current.includes(n)) {
            continue;
          }
          thumbQueueRef.current.push(n);
          queued = true;
        }
        if (queued) void pumpThumbs();
      },
      { root: rail, rootMargin: "240px" },
    );
    rail.querySelectorAll("[data-page]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [doc, thumbsOpen, numPages, pumpThumbs]);

  // Follow the reader: an open rail keeps the current page in view.
  useEffect(() => {
    if (!thumbsOpen) return;
    railRef.current
      ?.querySelector<HTMLElement>(`[data-page="${page}"]`)
      ?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [page, thumbsOpen]);

  // ── Fullscreen ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const onChange = () => {
      const fsDoc = document as FullscreenDocument;
      setFullscreen(Boolean(fsDoc.fullscreenElement ?? fsDoc.webkitFullscreenElement));
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);

  const toggleFullscreen = useCallback(() => {
    const fsDoc = document as FullscreenDocument;
    const node = rootRef.current as FullscreenElement | null;
    if (!node) return;
    const inFullscreen = Boolean(
      fsDoc.fullscreenElement ?? fsDoc.webkitFullscreenElement,
    );
    const result = inFullscreen
      ? typeof fsDoc.exitFullscreen === "function"
        ? fsDoc.exitFullscreen()
        : fsDoc.webkitExitFullscreen?.()
      : typeof node.requestFullscreen === "function"
        ? node.requestFullscreen()
        : node.webkitRequestFullscreen?.();
    // Browsers reject this when the gesture is not trusted; staying inline is
    // a perfectly good outcome.
    void Promise.resolve(result).catch(() => undefined);
  }, []);

  // ── Navigation & zoom ───────────────────────────────────────────────────────
  const goTo = useCallback(
    (n: number) => {
      if (numPages <= 0) return;
      setPage((prev) => {
        const next = clamp(Math.round(n), firstPage, lastPage);
        return next === prev ? prev : next;
      });
    },
    [numPages],
  );

  const zoomBy = useCallback((delta: number) => {
    setZoom((prev) => clamp(Number((prev + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  }, []);

  const pageInput = draft?.page === page ? draft.text : String(page);

  const commitPageInput = () => {
    const parsed = Number.parseInt(pageInput, 10);
    const next = Number.isFinite(parsed) ? clamp(parsed, 1, numPages || 1) : page;
    setDraft(null);
    goTo(next);
  };

  const onKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    // Typing a page number must not also turn the page.
    if ((event.target as HTMLElement).tagName === "INPUT") return;
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (status !== "ready") return;

    switch (event.key) {
      case "ArrowLeft":
      case "PageUp":
        goTo(page - 1);
        break;
      case "ArrowRight":
      case "PageDown":
        goTo(page + 1);
        break;
      case "Home":
        goTo(1);
        break;
      case "End":
        goTo(numPages);
        break;
      case "+":
      case "=":
        zoomBy(ZOOM_STEP);
        break;
      case "-":
      case "_":
        zoomBy(-ZOOM_STEP);
        break;
      case "0":
        setZoom(1);
        break;
      default:
        return;
    }
    event.preventDefault();
  };

  const frame = cn(
    "flex h-full min-h-[480px] w-full flex-col overflow-hidden border border-ink-200 bg-white shadow-card",
    isFullscreen ? "rounded-none" : "rounded-xl",
  );

  // ── The file is not there, or will not parse ────────────────────────────────
  if (status === "error") {
    return (
      <section className={frame} aria-label={`${title} — original pages`}>
        <div className="flex flex-1 items-center justify-center p-4">
          <EmptyState
            className="w-full max-w-xl border-0 bg-transparent"
            icon={<FileWarning />}
            title={
              missing
                ? "The original pages aren't installed yet"
                : "These pages could not be opened"
            }
            description={
              missing
                ? `The scan of this chapter has not been added to the site yet. As soon as ${src} is in place it opens right here — nothing to download, nothing to install.`
                : `The file at ${src} was found but could not be read as a PDF. It may have been replaced, or copied incompletely.`
            }
            action={
              <Button variant="secondary" icon={<RefreshCw />} onClick={onRetry}>
                Try again
              </Button>
            }
          />
        </div>
      </section>
    );
  }

  const busy = status !== "ready";
  const pageNumbers = Array.from({ length: numPages }, (_, i) => i + 1);

  return (
    <section
      ref={rootRef}
      tabIndex={0}
      onKeyDown={onKeyDown}
      aria-label={`${title} — original pages`}
      aria-describedby={hintId}
      className={frame}
    >
      <p id={hintId} className="sr-only">
        Arrow keys, or Page Up and Page Down, turn the page. Home and End jump to the
        first and last page. Plus and minus zoom, zero resets the zoom.
      </p>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1.5 border-b border-ink-100 px-2 py-2">
        <ToolButton
          label={thumbsOpen ? "Hide page thumbnails" : "Show page thumbnails"}
          icon={thumbsOpen ? <PanelLeftClose /> : <PanelLeftOpen />}
          onClick={() => setThumbsOpen((v) => !v)}
          disabled={busy}
          pressed={thumbsOpen}
        />

        <div className="flex items-center gap-1">
          <ToolButton
            label="Previous page"
            icon={<ChevronLeft />}
            onClick={() => goTo(page - 1)}
            disabled={busy || page <= 1}
          />
          <Input
            value={pageInput}
            onChange={(e) => setDraft({ page, text: e.target.value })}
            onBlur={commitPageInput}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                commitPageInput();
              }
            }}
            disabled={busy}
            inputMode="numeric"
            aria-label={`Page number, of ${numPages || "unknown"} pages`}
            className="tnum h-9 w-13 px-1 text-center font-mono text-[13px]"
          />
          <span className="tnum shrink-0 font-mono text-[13px] text-ink-400">
            / {numPages || "—"}
          </span>
          <ToolButton
            label="Next page"
            icon={<ChevronRight />}
            onClick={() => goTo(page + 1)}
            disabled={busy || page >= numPages}
          />
        </div>

        <div className="ml-auto flex items-center gap-1">
          <ToolButton
            label="Zoom out"
            icon={<ZoomOut />}
            onClick={() => zoomBy(-ZOOM_STEP)}
            disabled={busy || zoom <= MIN_ZOOM}
          />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setZoom(1)}
            disabled={busy || zoom === 1}
            aria-label="Reset zoom to fit the page width"
            title="Reset zoom to fit the page width"
            className="tnum h-9 w-14 px-0 font-mono text-[12px] text-ink-500"
          >
            {Math.round(zoom * 100)}%
          </Button>
          <ToolButton
            label="Zoom in"
            icon={<ZoomIn />}
            onClick={() => zoomBy(ZOOM_STEP)}
            disabled={busy || zoom >= MAX_ZOOM}
          />
          <ToolButton
            label={isFullscreen ? "Leave full screen" : "Read full screen"}
            icon={isFullscreen ? <Minimize2 /> : <Maximize2 />}
            onClick={toggleFullscreen}
            pressed={isFullscreen}
          />
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        {/* Thumbnail rail — a strip on phones, a column from md up */}
        {thumbsOpen && (
          <div
            ref={railRef}
            aria-label="Pages"
            className="thin-scroll flex max-h-40 shrink-0 gap-2 overflow-x-auto overflow-y-hidden border-b border-ink-100 bg-ink-50 p-2 md:max-h-none md:w-33 md:flex-col md:overflow-x-hidden md:overflow-y-auto md:border-r md:border-b-0"
          >
            {pageNumbers.map((n) => (
              <button
                key={n}
                data-page={n}
                onClick={() => goTo(n)}
                aria-label={`Page ${n}`}
                aria-current={n === page ? "page" : undefined}
                className="w-17 shrink-0 cursor-pointer md:w-full"
              >
                <span
                  className={cn(
                    "block overflow-hidden rounded-md border-2 bg-white transition-colors",
                    n === page
                      ? "border-brand-500 shadow-card"
                      : "border-ink-200 hover:border-ink-300",
                  )}
                >
                  {thumbs[n] ? (
                    // A data URL painted locally — nothing for an image optimizer
                    // to do, and a static host has none anyway.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumbs[n]} alt="" className="block w-full" />
                  ) : (
                    <span className="skeleton block aspect-[1/1.414] w-full" />
                  )}
                </span>
                <span
                  className={cn(
                    "tnum mt-1 block text-center font-mono text-[10px]",
                    n === page ? "font-bold text-brand-700" : "text-ink-400",
                  )}
                >
                  {n}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Stage */}
        <div
          ref={attachStage}
          className="thin-scroll relative min-h-0 flex-1 overflow-auto bg-ink-100 p-2 sm:p-4"
        >
          <div className="mx-auto w-fit">
            <canvas
              ref={canvasRef}
              role="img"
              aria-busy={rendering}
              aria-label={
                numPages > 0
                  ? `${title}, page ${page} of ${numPages}`
                  : `${title}, loading`
              }
              className="block bg-white shadow-pop"
            />
          </div>

          {busy && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink-100 p-4">
              <div className="animate-fade-up w-full max-w-md">
                <Skeleton className="aspect-[1/1.414] w-full" />
                <div className="mt-4">
                  <ProgressBar value={progress} size="sm" />
                  <p className="tnum mt-2 text-center font-mono text-[11px] tracking-wide text-ink-400 uppercase">
                    {progress > 0
                      ? `Loading original pages · ${progress}%`
                      : "Loading original pages"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {numPages > 0 ? `Page ${page} of ${numPages}` : ""}
      </p>
    </section>
  );
}
