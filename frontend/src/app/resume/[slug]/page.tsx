import { PublicResume } from "@/features/resume/PublicResume";

export default async function PublicResumeBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <PublicResume slug={slug} />;
}
