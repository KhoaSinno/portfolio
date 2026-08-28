import type { Metadata } from "next";
import { PublicResume } from "@/features/resume/PublicResume";
import { getPublishedResume } from "@/features/resume/public-resume-api";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resume = await getPublishedResume(slug).catch(() => null);

  if (!resume) {
    return {
      title: "Resume unavailable",
      robots: { index: false, follow: false },
    };
  }

  const name = resume.basics.name || "Nguyen Tran Anh Khoa";
  const headline = resume.basics.headline || "Software Engineer";
  const canonical = `/resume/${encodeURIComponent(slug)}`;

  return {
    title: `${name} · Resume`,
    description: resume.summary,
    alternates: { canonical },
    openGraph: {
      title: `${name} · ${headline}`,
      description: resume.summary,
      url: canonical,
    },
  };
}

export default async function PublicResumeBySlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resume = await getPublishedResume(slug).catch(() => null);
  return <PublicResume initialResume={resume} />;
}
