import type { Metadata } from "next";
import { PublicResume } from "@/features/resume/PublicResume";
import { getPrimaryPublicResume } from "@/features/resume/public-resume-api";

export const metadata: Metadata = {
  title: "Resume",
  description:
    "Resume and professional experience of Nguyen Tran Anh Khoa, a fullstack software engineer specializing in web, mobile, and AI systems.",
  alternates: { canonical: "/resume" },
  openGraph: {
    title: "Resume · Nguyen Tran Anh Khoa",
    description:
      "Explore the professional experience, technical skills, and selected software projects of Nguyen Tran Anh Khoa.",
    url: "/resume",
  },
};

export default async function ResumePage() {
  const result = await getPrimaryPublicResume();
  const resume = result.state === "unavailable" ? null : result.resume;
  return <PublicResume initialResume={resume} />;
}
