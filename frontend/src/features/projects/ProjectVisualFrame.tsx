"use client";

import { useEffect, useState } from "react";
import { Battery, Code2, ExternalLink, Play, Smartphone, Sparkles, Video, Wifi, X } from "lucide-react";
import {
  getYouTubeThumbnailUrl,
  getYouTubeVideoId,
  isMobileProject,
  isVideoUrl,
  resolveProjectThumbnail,
} from "@/lib/image-url";

type ProjectLike = {
  name: string;
  role?: string | null;
  techStack?: string | null;
  demoUrl?: string | null;
  thumbnailUrl?: string | null;
  thumbnailAlt?: string | null;
  projectSlug?: string | null;
  repository?: string | null;
  hideDemoUrl?: boolean;
};

type ProjectVisualFrameProps = {
  project: ProjectLike;
  className?: string;
};

export function ProjectVisualFrame({ project, className = "" }: ProjectVisualFrameProps) {
  const isMobile = isMobileProject(project);
  const isVideo = isVideoUrl(project.demoUrl) && !project.hideDemoUrl;
  const ytId = getYouTubeVideoId(project.demoUrl);
  const resolvedThumbnailUrl = resolveProjectThumbnail(project);

  const [currentSrc, setCurrentSrc] = useState<string>(resolvedThumbnailUrl);
  const [imageError, setImageError] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Synchronize when project data changes
  useEffect(() => {
    setCurrentSrc(resolvedThumbnailUrl);
    setImageError(false);
    setIsPlaying(false);
  }, [resolvedThumbnailUrl]);

  const handleImageError = () => {
    // If maxres YouTube thumbnail fails, fallback to standard HQ
    if (currentSrc && currentSrc.includes("maxresdefault.jpg") && ytId) {
      setCurrentSrc(getYouTubeThumbnailUrl(ytId, "hq"));
      return;
    }

    // If auto-captured Microlink screenshot fails, fallback to Thum.io
    if (currentSrc && currentSrc.includes("api.microlink.io") && project.demoUrl) {
      const cleanUrl = project.demoUrl.startsWith("http") ? project.demoUrl : `https://${project.demoUrl}`;
      setCurrentSrc(`https://image.thum.io/get/width/1200/crop/750/noanimate/${cleanUrl}`);
      return;
    }
    // Otherwise fallback gracefully to high-tech architecture placeholder
    setImageError(true);
  };

  const hasValidImage = Boolean(currentSrc && !imageError);
  const isAutoCaptured = Boolean(!project.thumbnailUrl && currentSrc && !isMobile && !isVideo);

  // Extract a clean display domain for web projects
  let displayDomain = `${project.name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.app`;
  if (project.demoUrl) {
    try {
      const cleanUrl = project.demoUrl.startsWith("http") ? project.demoUrl : `https://${project.demoUrl}`;
      const parsed = new URL(cleanUrl);
      displayDomain = parsed.hostname;
    } catch {
      // keep fallback
    }
  }

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-white/15 bg-slate-950/80 shadow-2xl shadow-black/60 transition-all duration-500 group-hover:border-violet-500/30 ${className}`}
    >
      {/* Top Device / Window Header */}
      {isMobile ? (
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3.5 py-2">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-sky-400">
            Mobile App
          </span>
          <div className="flex items-center gap-1.5">
            <span className="h-2 w-10 rounded-full bg-white/20" />
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            {isVideo && (
              <span className="flex items-center gap-1 font-mono text-[9px] font-medium text-rose-400 bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20">
                <span className={`h-1.5 w-1.5 rounded-full bg-rose-500 ${isPlaying ? "animate-ping" : "animate-pulse"}`} />
                {isPlaying ? "Playing Video" : "Demo Video"}
              </span>
            )}
            <div className="flex items-center gap-1 text-slate-400">
              <Wifi className="h-3 w-3" />
              <Battery className="h-3 w-3" />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3.5 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-amber-500/80" />
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80" />
            <span className="ml-2 font-mono text-[10px] text-slate-400 truncate max-w-[180px]">
              {displayDomain}
            </span>
          </div>

          {isVideo ? (
            <span className="flex items-center gap-1 rounded-full bg-rose-500/10 px-2 py-0.5 font-mono text-[9px] font-medium text-rose-400 border border-rose-500/20">
              <Video className="h-2.5 w-2.5" />
              {isPlaying ? "Playing Video" : "Video Demo"}
            </span>
          ) : isAutoCaptured && hasValidImage ? (
            <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-medium text-emerald-400 border border-emerald-500/20">
              <Sparkles className="h-2.5 w-2.5" />
              Live Preview
            </span>
          ) : null}
        </div>
      )}

      {/* Visual Content Area */}
      <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-indigo-950/50 via-slate-950 to-slate-900 flex items-center justify-center group/screen">
        {isPlaying && ytId ? (
          /* Live Interactive YouTube Embed Player */
          <div className="relative h-full w-full bg-black">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
              title={`${project.name} video preview`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
            {/* Overlay button to exit inline player */}
            <button
              type="button"
              onClick={() => setIsPlaying(false)}
              className="absolute top-2.5 right-2.5 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-black/80 text-white shadow-xl backdrop-blur-md transition hover:bg-rose-600 hover:border-rose-400 active:scale-95"
              title="Close video preview"
              aria-label="Close video preview"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : hasValidImage ? (
          <div
            className={`relative h-full w-full ${isVideo && ytId ? "cursor-pointer" : ""}`}
            onClick={() => {
              if (isVideo && ytId) {
                setIsPlaying(true);
              }
            }}
            role={isVideo && ytId ? "button" : undefined}
            tabIndex={isVideo && ytId ? 0 : undefined}
            onKeyDown={(e) => {
              if ((e.key === "Enter" || e.key === " ") && isVideo && ytId) {
                e.preventDefault();
                setIsPlaying(true);
              }
            }}
          >
            {/* Rendered Thumbnail / Live Web Screenshot / Video Cover */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSrc}
              alt={project.thumbnailAlt || `${project.name} preview`}
              className="h-full w-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
              loading="lazy"
              onError={handleImageError}
            />

            {/* Interactive Centered Play Button Overlay for Videos */}
            {isVideo && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/25 transition-colors duration-300 group-hover/screen:bg-black/45">
                <div className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-black/70 text-white shadow-2xl backdrop-blur-md transition-all duration-300 group-hover/screen:scale-110 group-hover/screen:bg-rose-600 group-hover/screen:border-rose-400">
                  <Play className="h-6 w-6 fill-white translate-x-0.5" />
                </div>
                <span className="mt-2.5 rounded-full border border-white/20 bg-black/60 px-3 py-1 font-mono text-[10px] font-semibold text-white/90 shadow-lg backdrop-blur-md transition-all duration-300 group-hover/screen:bg-rose-600/90 group-hover/screen:border-rose-400">
                  Click to Play Inline
                </span>
              </div>
            )}

            {/* Subtle bottom vignette */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-slate-950/60 to-transparent" />
          </div>
        ) : (
          /* High-Tech Fallback Placeholder (Mobile Apps or System Architecture without Web Demo) */
          <div className="flex flex-col items-center justify-center p-6 text-center space-y-2">
            <div
              className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                isMobile
                  ? "bg-sky-500/10 border-sky-500/20 text-sky-300"
                  : "bg-indigo-500/10 border-indigo-500/20 text-indigo-300"
              } border shadow-inner transition-transform duration-500 group-hover:scale-110`}
            >
              {isMobile ? (
                <Smartphone className="h-7 w-7" />
              ) : (
                <Code2 className="h-7 w-7" />
              )}
            </div>
            <span
              className={`font-mono text-xs font-semibold uppercase tracking-widest ${
                isMobile ? "text-sky-300" : "text-indigo-300"
              }`}
            >
              {isMobile ? "Mobile Application" : "System Architecture"}
            </span>
            <span className="text-[11px] text-slate-400 max-w-[200px] line-clamp-1">
              Interactive Case Study
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

