import { PublicResume } from "@/features/resume/PublicResume";
import { getPublishedResume } from "@/features/resume/public-resume-api";

export default async function ResumePage() {
  const resume = await getPublishedResume().catch(() => null);
  return <PublicResume initialResume={resume} />;
}
