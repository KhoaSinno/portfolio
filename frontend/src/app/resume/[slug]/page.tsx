import { PublicResume } from "@/features/resume/PublicResume";
import { getPublishedResume } from "@/features/resume/public-resume-api";

export default async function PublicResumeBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resume = await getPublishedResume(slug).catch(() => null);
  return <PublicResume initialResume={resume} />;
}
