import type { Metadata } from "next";
import { ProjectCaseStudy } from "@/features/projects/ProjectCaseStudy";

export const metadata: Metadata = { title: "Project case study" };

export default async function ProjectCaseStudyPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <ProjectCaseStudy slug={slug} />;
}
