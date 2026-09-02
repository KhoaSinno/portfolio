import { rehype } from "rehype";
import rehypeRaw from "rehype-raw";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import { describe, expect, it } from "vitest";
import {
  caseStudySanitizeSchema,
  preprocessCaseStudyMarkdown,
  resolveCaseStudyImage,
  resolveCaseStudyLink,
} from "./case-study-sanitize";

function sanitizeHtml(html: string) {
  return String(
    rehype()
      .use(rehypeRaw)
      .use(rehypeSanitize, caseStudySanitizeSchema)
      .use(rehypeStringify)
      .processSync(html),
  );
}

describe("case study README sanitization", () => {
  it("removes executable markup and unsafe embeds", () => {
    const rendered = sanitizeHtml(
      '<script>alert(1)</script><img src="https://example.com/a.png" onerror="alert(1)"><iframe src="https://evil.example"></iframe><a href="javascript:alert(1)">bad</a>',
    );

    expect(rendered).not.toContain("script");
    expect(rendered).not.toContain("onerror");
    expect(rendered).not.toContain("iframe");
    expect(rendered).not.toContain("javascript:");
  });

  it("preserves README documentation primitives and Mermaid code classes", () => {
    const rendered = sanitizeHtml(
      '<details open><summary>Architecture</summary><table><tr><td>API</td></tr></table><pre><code class="language-mermaid">graph TD</code></pre></details>',
    );

    expect(rendered).toContain("<details open>");
    expect(rendered).toContain("<summary>Architecture</summary>");
    expect(rendered).toContain("<table>");
    expect(rendered).toContain('class="language-mermaid"');
  });

  it("resolves safe relative GitHub assets while rejecting dangerous protocols", () => {
    const baseUrl = "https://raw.githubusercontent.com/acme/project/main/";
    expect(resolveCaseStudyImage("docs/diagram.png", baseUrl)).toBe(
      "https://raw.githubusercontent.com/acme/project/main/docs/diagram.png",
    );
    expect(resolveCaseStudyImage("data:text/html,unsafe", baseUrl)).toBe("");
    expect(resolveCaseStudyLink("javascript:alert(1)", baseUrl)).toBe("");
    expect(resolveCaseStudyLink("#architecture", baseUrl)).toBe("#architecture");
    expect(preprocessCaseStudyMarkdown("![Diagram](docs/diagram.png)", baseUrl)).toContain(
      "https://raw.githubusercontent.com/acme/project/main/docs/diagram.png",
    );
  });
});
