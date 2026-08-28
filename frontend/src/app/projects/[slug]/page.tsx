import type { Metadata } from "next";
import { ProjectCaseStudy } from "@/features/projects/ProjectCaseStudy";
import { getInitialProjectCaseStudy } from "@/features/projects/project-case-study-server-api";

export const metadata: Metadata = { title: "Project case study" };

export default async function ProjectCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = await getInitialProjectCaseStudy(slug).catch(() => null);
  return <ProjectCaseStudy slug={slug} initialCaseStudy={caseStudy} />;
}
