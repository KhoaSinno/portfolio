import type { MetadataRoute } from "next";
import { getPrimaryPublicResume } from "@/features/resume/public-resume-api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://www.nguyentrananhkhoa.id.vn";
  const publicResume = await getPrimaryPublicResume();
  const projects =
    publicResume.state === "unavailable" ? [] : publicResume.resume.projects;

  const projectRoutes: MetadataRoute.Sitemap = projects
    .filter(
      (project) => project.isVisible !== false && project.showOnWeb !== false,
    )
    .map((p) => {
      const slug = encodeURIComponent(
        p.projectSlug ||
          p.repository
            ?.replace(/\.git$/i, "")
            .split("/")
            .filter(Boolean)
            .pop() ||
          p.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-|-$/g, ""),
      );

      return {
        url: `${siteUrl}/projects/${slug}`,
        changeFrequency: "weekly",
        priority: 0.8,
      };
    });

  return [
    {
      url: siteUrl,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/resume`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...projectRoutes,
  ];
}
