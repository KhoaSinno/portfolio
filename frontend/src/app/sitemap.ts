import type { MetadataRoute } from "next";
import { getPublishedResume } from "@/features/resume/resume-api";
import { defaultResume } from "@/features/resume/resume-schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nguyentrananhkhoa.id.vn";
  const now = new Date();

  let resumeData = null;
  try {
    resumeData = await getPublishedResume();
  } catch {
    resumeData = defaultResume;
  }

  const projects = resumeData?.projects && resumeData.projects.length > 0 
    ? resumeData.projects 
    : defaultResume.projects;

  const projectRoutes: MetadataRoute.Sitemap = projects.map((p) => {
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
          .replace(/^-|-$/g, "")
    );

    return {
      url: `${siteUrl}/projects/${slug}`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    };
  });

  return [
    {
      url: siteUrl,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${siteUrl}/resume`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    ...projectRoutes,
  ];
}
