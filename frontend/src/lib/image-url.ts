/**
 * Normalizes user-supplied image URLs.
 * Automatically converts GitHub web blob/raw preview URLs into direct raw content URLs.
 */
export function normalizeImageUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();

  // Pattern: https://github.com/:owner/:repo/blob/:branch/:path
  const blobMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)\/blob\/([^\/]+)\/(.+)$/i
  );
  if (blobMatch) {
    const [, owner, repo, branch, path] = blobMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  // Pattern: https://github.com/:owner/:repo/raw/:branch/:path
  const rawMatch = trimmed.match(
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)\/raw\/([^\/]+)\/(.+)$/i
  );
  if (rawMatch) {
    const [, owner, repo, branch, path] = rawMatch;
    return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
  }

  return trimmed;
}

/**
 * Checks if a project is a mobile application (Flutter, React Native, iOS, Android, etc.)
 */
export function isMobileProject(project?: {
  techStack?: string | null;
  role?: string | null;
  name?: string | null;
  projectType?: string | null;
} | null): boolean {
  if (!project) return false;
  if (project.projectType === "mobile") return true;
  if (project.projectType === "web" || project.projectType === "system") return false;

  const combined = `${project.techStack || ""} ${project.role || ""} ${project.name || ""}`.toLowerCase();
  return (
    combined.includes("flutter") ||
    combined.includes("react native") ||
    combined.includes("riverpod") ||
    combined.includes("mobile") ||
    combined.includes("android") ||
    combined.includes("ios") ||
    combined.includes("swift") ||
    combined.includes("kotlin")
  );
}

/**
 * Generates an automated web screenshot thumbnail URL from a live web demo URL.
 * Uses the high-reliability WordPress mshots service (1280px viewport capture).
 */
export function getAutoWebScreenshotUrl(url?: string | null): string {
  if (!url || typeof url !== "string") return "";
  let cleanUrl = url.trim();
  if (!cleanUrl) return "";

  // If user entered URL without protocol, prepend https://
  if (!/^https?:\/\//i.test(cleanUrl)) {
    cleanUrl = `https://${cleanUrl}`;
  }

  // Do not generate screenshot for localhost or invalid hostnames
  try {
    const parsed = new URL(cleanUrl);
    if (parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1") {
      return "";
    }
  } catch {
    return "";
  }

  // Use Microlink Chrome screenshot API (supports modern JS frameworks and all TLDs)
  return `https://api.microlink.io/?url=${encodeURIComponent(cleanUrl)}&screenshot=true&meta=false&embed=screenshot.url`;
}

/**
 * Extracts YouTube Video ID from various YouTube URL formats.
 * Supports watch?v=, youtu.be/, embed/, shorts/, live/
 */
export function getYouTubeVideoId(url?: string | null): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  const match = trimmed.match(
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/i
  );
  return match ? match[1] : null;
}

/**
 * Checks if a URL is a video demo link (YouTube, Loom, Vimeo, Streamable).
 */
export function isVideoUrl(url?: string | null): boolean {
  if (!url || typeof url !== "string") return false;
  const trimmed = url.trim().toLowerCase();
  return (
    Boolean(getYouTubeVideoId(url)) ||
    trimmed.includes("loom.com/share") ||
    trimmed.includes("vimeo.com") ||
    trimmed.includes("streamable.com")
  );
}

/**
 * Returns the HD / standard thumbnail URL for a YouTube video.
 */
export function getYouTubeThumbnailUrl(videoId: string, quality: "hq" | "maxres" = "hq"): string {
  return `https://img.youtube.com/vi/${videoId}/${quality === "maxres" ? "maxresdefault.jpg" : "hqdefault.jpg"}`;
}

/**
 * Resolves project demo metadata (determines if CTA should say 'Watch Demo' vs 'Live Demo').
 */
export function getProjectDemoMeta(project?: {
  demoUrl?: string | null;
  techStack?: string | null;
  role?: string | null;
  name?: string | null;
} | null) {
  const isVideo = isVideoUrl(project?.demoUrl) || (isMobileProject(project) && Boolean(project?.demoUrl));
  const isYouTube = Boolean(getYouTubeVideoId(project?.demoUrl));
  return {
    isVideo,
    isYouTube,
    label: isVideo ? "Watch Demo" : "Live Demo",
  };
}

/**
 * Resolves the appropriate thumbnail URL for a project.
 * 1. If explicit thumbnailUrl is provided, normalizes and returns it.
 * 2. If demoUrl is a YouTube video, automatically extracts the YouTube thumbnail.
 * 3. If it's a mobile project, returns empty string (no web screenshot generation for apps).
 * 4. If it's a web project with a valid demoUrl, automatically generates a screenshot preview URL.
 * 5. Otherwise returns empty string for placeholder fallback.
 */
export function resolveProjectThumbnail(project?: {
  thumbnailUrl?: string | null;
  demoUrl?: string | null;
  techStack?: string | null;
  role?: string | null;
  name?: string | null;
  hideDemoUrl?: boolean;
} | null): string {
  if (!project) return "";

  // 1. Explicit custom thumbnail provided by user
  if (project.thumbnailUrl && typeof project.thumbnailUrl === "string" && project.thumbnailUrl.trim().length > 0) {
    return normalizeImageUrl(project.thumbnailUrl);
  }

  // 2. Auto YouTube thumbnail extraction
  if (project.demoUrl && !project.hideDemoUrl) {
    const ytId = getYouTubeVideoId(project.demoUrl);
    if (ytId) {
      return getYouTubeThumbnailUrl(ytId, "hq");
    }
  }

  // 3. Mobile apps or hidden demoUrl do not use web screenshots
  if (project.hideDemoUrl || isMobileProject(project)) {
    return "";
  }

  // 4. Web projects with a Live Demo URL automatically generate screenshot
  if (project.demoUrl && typeof project.demoUrl === "string" && project.demoUrl.trim().length > 0) {
    return getAutoWebScreenshotUrl(project.demoUrl);
  }

  return "";
}

/**
 * Represents a parsed repository link with label and full URL.
 */
export type ParsedRepository = {
  label: string;
  url: string;
  cleanUrl: string;
};

/**
 * Parses single or multi-line repository inputs.
 * Supports:
 * - Simple URL: "github.com/owner/repo" -> label: "Source Code"
 * - Labeled with colon: "Mobile: github.com/owner/app" -> label: "Mobile"
 * - Labeled with hyphen: "Backend - github.com/owner/api" -> label: "Backend"
 * - Labeled with parenthesis: "github.com/owner/app (Mobile App)" -> label: "Mobile App"
 */
export function parseRepositories(raw?: string | null): ParsedRepository[] {
  if (!raw || typeof raw !== "string") return [];
  const lines = raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  return lines.map((line) => {
    let label = "";
    let url = line;

    // Pattern 1: "Label: URL" or "Label - URL"
    const prefixMatch = line.match(/^([^:]+?)\s*[:\-]\s*(https?:\/\/.+|github\.com\/.+|gitlab\.com\/.+|bitbucket\.org\/.+)$/i);
    if (prefixMatch) {
      label = prefixMatch[1].trim();
      url = prefixMatch[2].trim();
    } else {
      // Pattern 2: "URL (Label)" or "URL [Label]"
      const suffixMatch = line.match(/^(.+?)\s*[\(\[]([^\)\]]+)[\)\]]$/i);
      if (suffixMatch) {
        url = suffixMatch[1].trim();
        label = suffixMatch[2].trim();
      }
    }

    // Clean fallback: Extract repo name or default to Source Code (No keyword guessing)
    if (!label) {
      if (lines.length === 1) {
        label = "Source Code";
      } else {
        const cleanRepo = url.replace(/^(?:https?:\/\/)?(?:www\.)?github\.com\//i, "").replace(/\/$/, "");
        const parts = cleanRepo.split("/");
        const repoName = parts[parts.length - 1] || "";
        label = repoName || "Source Code";
      }
    }

    const cleanUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;

    return {
      label,
      url,
      cleanUrl,
    };
  });
}

/**
 * Returns a normalized list of repositories for a project,
 * supporting both first-class `repositories` array and legacy `repository` string.
 */
export function getProjectRepositories(project?: {
  repositories?: Array<{ label: string; url: string }> | null;
  repository?: string | null;
} | null): ParsedRepository[] {
  if (!project) return [];

  // 1. Structured repositories array if present and populated
  if (Array.isArray(project.repositories) && project.repositories.length > 0) {
    const valid = project.repositories
      .filter((r) => r && typeof r.url === "string" && r.url.trim().length > 0)
      .map((r) => {
        const label = r.label && r.label.trim().length > 0 ? r.label.trim() : "Source Code";
        const url = r.url.trim();
        const cleanUrl = url.startsWith("http://") || url.startsWith("https://") ? url : `https://${url}`;
        return { label, url, cleanUrl };
      });

    if (valid.length > 0) return valid;
  }

  // 2. Legacy repository string fallback
  if (project.repository && typeof project.repository === "string" && project.repository.trim().length > 0) {
    return parseRepositories(project.repository);
  }

  return [];
}

/**
 * Resolves the URL slug for a project case study.
 */
export function getProjectSlug(project?: {
  projectSlug?: string | null;
  repository?: string | null;
  repositories?: Array<{ label: string; url: string }> | null;
  name?: string | null;
} | null): string {
  if (!project) return "";
  if (project.projectSlug && typeof project.projectSlug === "string" && project.projectSlug.trim().length > 0) {
    return project.projectSlug.trim().toLowerCase();
  }
  const repos = getProjectRepositories(project);
  if (repos.length > 0 && repos[0]?.url) {
    const cleanRepo = repos[0].url.replace(/^git\+/, "").replace(/\.git$/i, "").trim();
    const parts = cleanRepo.split("/").filter(Boolean);
    const repoName = parts.pop();
    if (repoName && repoName !== "github.com") {
      return repoName.toLowerCase().trim();
    }
  }
  if (project.name && typeof project.name === "string") {
    return project.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  return "";
}



