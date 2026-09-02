import { defaultSchema } from "rehype-sanitize";
import type { Schema } from "hast-util-sanitize";
import { normalizeImageUrl } from "../../lib/image-url";

const httpProtocols = ["http", "https"];

/** GitHub README content is external input, so only documentation-safe HTML survives. */
export const caseStudySanitizeSchema: Schema = {
  ...defaultSchema,
  tagNames: [
    ...new Set([
      ...(defaultSchema.tagNames ?? []),
      "details",
      "summary",
      "figure",
      "figcaption",
      "kbd",
      "mark",
      "input",
    ]),
  ],
  attributes: {
    ...defaultSchema.attributes,
    a: [...(defaultSchema.attributes?.a ?? []), "target", "rel"],
    img: [...(defaultSchema.attributes?.img ?? []), "width", "height"],
    code: [
      ...(defaultSchema.attributes?.code ?? []),
      ["className", /^language-[a-z0-9-]+$/i],
    ],
    input: [
      ...(defaultSchema.attributes?.input ?? []),
      "type",
      "checked",
      "disabled",
    ],
  },
  protocols: {
    ...defaultSchema.protocols,
    href: [...httpProtocols, "mailto"],
    src: httpProtocols,
  },
};

function resolveAllowedUrl(
  value: string,
  baseUrl: string,
  allowedProtocols: readonly string[],
  allowFragment = false,
): string {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (allowFragment && trimmed.startsWith("#")) return trimmed;

  try {
    const resolved = new URL(trimmed, baseUrl);
    const protocol = resolved.protocol.slice(0, -1).toLowerCase();
    if (!allowedProtocols.includes(protocol)) return "";
    return normalizeImageUrl(resolved.toString());
  } catch {
    return "";
  }
}

export function resolveCaseStudyLink(value: string, baseUrl: string): string {
  return resolveAllowedUrl(value, baseUrl, [...httpProtocols, "mailto"], true);
}

export function resolveCaseStudyImage(value: string, baseUrl: string): string {
  return resolveAllowedUrl(value, baseUrl, httpProtocols);
}

export function resolveExternalUrl(value: string): string {
  const candidate = /^https?:\/\//i.test(value.trim())
    ? value
    : `https://${value.trim()}`;
  return resolveAllowedUrl(candidate, "https://portfolio.invalid", httpProtocols);
}

/** Rewrites only safe relative README paths to the repository raw-content URL. */
export function preprocessCaseStudyMarkdown(markdown: string, baseUrl: string): string {
  if (!markdown) return "";

  let result = markdown.replace(
    /!\[([^\]]*)\]\((?!https?:\/\/|data:|\/)([^)]+)\)/g,
    (_match, alt, relativePath) => {
      const source = resolveCaseStudyImage(relativePath, baseUrl);
      return source ? `![${alt}](${source})` : `![${alt}]()`;
    },
  );

  result = result.replace(
    /<img\s+([^>]*?)src=["'](?!https?:\/\/|data:|\/)([^"']+)["']([^>]*?)>/gi,
    (_match, before, relativePath, after) => {
      const source = resolveCaseStudyImage(relativePath, baseUrl);
      return `<img ${before}src="${source}"${after}>`;
    },
  );

  return result.replace(
    /<a\s+([^>]*?)href=["'](?!https?:\/\/|mailto:|#|\/)([^"']+)["']([^>]*?)>/gi,
    (_match, before, relativePath, after) => {
      const href = resolveCaseStudyLink(relativePath, baseUrl);
      return `<a ${before}href="${href}"${after}>`;
    },
  );
}
