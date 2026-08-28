"use client";

import { useEffect, useId, useState } from "react";
import { Check, Copy, LoaderCircle, ZoomIn, ZoomOut } from "lucide-react";

let mermaidLoader: Promise<typeof import("mermaid").default> | undefined;

function loadMermaid() {
  mermaidLoader ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "dark",
      securityLevel: "loose",
      // Native SVG labels prevent host layout metrics from inflating the viewBox.
      htmlLabels: false,
      fontFamily:
        '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Helvetica, Arial, sans-serif',
      flowchart: { curve: "basis", useMaxWidth: true },
      themeVariables: {
        darkMode: true,
        background: "#0d1117",
        primaryColor: "#21262d",
        primaryTextColor: "#f0f6fc",
        primaryBorderColor: "#30363d",
        lineColor: "#8b949e",
        secondaryColor: "#161b22",
        tertiaryColor: "#161b22",
        clusterBkg: "#161b22",
        clusterBorder: "#30363d",
        defaultLinkColor: "#8b949e",
        titleColor: "#f0f6fc",
        edgeLabelBackground: "#161b22",
        nodeBorder: "#30363d",
        mainBkg: "#21262d",
        nodeTextColor: "#f0f6fc",
      },
    });
    return mermaid;
  });
  return mermaidLoader;
}

export function MermaidRenderer({ chart }: { chart: string }) {
  const rawId = useId();
  const uniqueId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const cleanChart = chart.trim();
  const [svg, setSvg] = useState<string>("");
  const [renderedChart, setRenderedChart] = useState<string>("");
  const [renderError, setRenderError] = useState<{
    chart: string;
    message: string;
  } | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);
  const error = renderError?.chart === cleanChart ? renderError.message : null;
  const loading = renderedChart !== cleanChart && !error;

  useEffect(() => {
    let isMounted = true;
    if (!cleanChart) return;

    void loadMermaid()
      .then((mermaid) => mermaid.render(uniqueId, cleanChart))
      .then(({ svg: renderedSvg }) => {
        if (isMounted) {
          setSvg(renderedSvg);
          setRenderedChart(cleanChart);
          setRenderError(null);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setRenderError({
            chart: cleanChart,
            message:
              err instanceof Error
                ? err.message
                : "Failed to parse Mermaid diagram",
          });
        }
      });

    return () => {
      isMounted = false;
    };
  }, [cleanChart, uniqueId]);

  const handleCopy = () => {
    void navigator.clipboard.writeText(chart);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.15, 2.0));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.15, 0.6));
  const resetZoom = () => setZoom(1);

  if (error) {
    return (
      <div className="my-4 rounded-xl border border-rose-500/20 bg-rose-500/5 p-4 font-mono text-xs text-rose-300">
        <p className="mb-2 text-xs font-semibold text-rose-400">
          ⚠️ Mermaid Diagram Parse Error (Fallback to Code):
        </p>
        <pre className="overflow-x-auto whitespace-pre">{chart}</pre>
      </div>
    );
  }

  if (loading && !svg) {
    return (
      <div className="my-6 flex min-h-[160px] items-center justify-center rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6 text-slate-400 gap-2.5 shadow-xl">
        <LoaderCircle className="h-5 w-5 animate-spin text-indigo-400" />
        <span className="text-xs font-mono">
          Rendering Architecture Diagram...
        </span>
      </div>
    );
  }

  return (
    <div className="group/mermaid relative my-8 overflow-hidden rounded-2xl border border-white/10 bg-[#0d1117] shadow-2xl">
      {/* Top Header Bar (GitHub Style) */}
      <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            System Architecture Flowchart
          </span>
        </div>

        {/* Interactive Controls: Zoom In / Out / Reset / Copy */}
        <div className="flex items-center gap-1 text-slate-400">
          <button
            type="button"
            onClick={zoomOut}
            className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={resetZoom}
            className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition cursor-pointer font-mono text-[10px]"
            title="Reset Zoom"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            onClick={zoomIn}
            className="rounded-lg p-1.5 hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="h-3.5 w-3.5" />
          </button>
          <div className="mx-1 h-3.5 w-px bg-white/10" />
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1 rounded-lg p-1.5 text-[11px] font-mono hover:bg-white/10 hover:text-white transition cursor-pointer"
            title="Copy Mermaid Source Code"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span className="text-emerald-400 text-[10px]">Copied</span>
              </>
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>

      {/*
       * Mermaid emits SVGs with width="100%".  Keeping that SVG in an
       * inline-block makes the browser use its ~300px intrinsic fallback
       * width, which shrinks every node and label until the diagram is
       * unreadable.  Give it a real canvas width instead.  On small screens
       * we preserve legible text and allow horizontal scrolling rather than
       * scaling the diagram down again.
       */}
      <div className="w-full overflow-x-auto p-4 sm:p-8 bg-[#0d1117] min-h-[160px]">
        <div
          className="mermaid-svg-wrapper w-full min-w-[720px] text-center transition-transform duration-200 ease-out"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: "top center",
          }}
          dangerouslySetInnerHTML={{ __html: svg }}
        />
      </div>
    </div>
  );
}
