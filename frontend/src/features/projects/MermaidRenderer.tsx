"use client";

import { useEffect, useId, useState } from "react";
import mermaid from "mermaid";
import { Check, Copy, LoaderCircle, ZoomIn, ZoomOut } from "lucide-react";

// Initialize Mermaid globally with GitHub-Dark theme
mermaid.initialize({
  startOnLoad: false,
  theme: "dark",
  securityLevel: "loose",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Noto Sans", Helvetica, Arial, sans-serif',
  flowchart: {
    htmlLabels: true,
    curve: "basis",
    useMaxWidth: true,
  },
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

export function MermaidRenderer({ chart }: { chart: string }) {
  const rawId = useId();
  const uniqueId = `mermaid-${rawId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [svg, setSvg] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [zoom, setZoom] = useState<number>(1);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;
    const cleanChart = chart.trim();
    if (!cleanChart) return;

    setLoading(true);
    setError(null);

    mermaid
      .render(uniqueId, cleanChart)
      .then(({ svg: renderedSvg }) => {
        if (isMounted) {
          setSvg(renderedSvg);
          setLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : "Failed to parse Mermaid diagram");
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [chart, uniqueId]);

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
        <p className="mb-2 text-xs font-semibold text-rose-400">⚠️ Mermaid Diagram Parse Error (Fallback to Code):</p>
        <pre className="overflow-x-auto whitespace-pre">{chart}</pre>
      </div>
    );
  }

  if (loading && !svg) {
    return (
      <div className="my-6 flex min-h-[160px] items-center justify-center rounded-2xl border border-white/10 bg-[#0d1117]/80 p-6 text-slate-400 gap-2.5 shadow-xl">
        <LoaderCircle className="h-5 w-5 animate-spin text-indigo-400" />
        <span className="text-xs font-mono">Rendering Architecture Diagram...</span>
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

      {/* SVG Canvas Area: Clean unconstrained container allowing Mermaid's internal styles to compute naturally */}
      <div className="w-full overflow-x-auto p-4 sm:p-8 text-center bg-[#0d1117] min-h-[160px]">
        <div
          className="mermaid-svg-wrapper inline-block max-w-full text-center transition-transform duration-200 ease-out"
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
