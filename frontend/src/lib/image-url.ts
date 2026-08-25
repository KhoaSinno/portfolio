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
} | null): boolean {
  if (!project) return false;
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
 * Resolves the appropriate thumbnail URL for a project.
 * 1. If explicit thumbnailUrl is provided, normalizes and returns it.
 * 2. If it's a mobile project, returns empty string (no web screenshot generation for apps).
 * 3. If it's a web project with a valid demoUrl, automatically generates a screenshot preview URL.
 * 4. Otherwise returns empty string for placeholder fallback.
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

  // 2. Mobile apps or hidden demoUrl do not use web screenshots
  if (project.hideDemoUrl || isMobileProject(project)) {
    return "";
  }

  // 3. Web projects with a Live Demo URL automatically generate screenshot
  if (project.demoUrl && typeof project.demoUrl === "string" && project.demoUrl.trim().length > 0) {
    return getAutoWebScreenshotUrl(project.demoUrl);
  }

  return "";
}

