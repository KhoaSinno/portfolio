import type { Metadata } from "next";
import { ProjectCaseStudy } from "@/features/projects/ProjectCaseStudy";
import { getInitialProjectCaseStudy } from "@/features/projects/project-case-study-server-api";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL || "https://www.nguyentrananhkhoa.id.vn";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const caseStudy = await getInitialProjectCaseStudy(slug).catch(() => null);

  if (!caseStudy) {
    return {
      title: "Project case study unavailable",
      robots: { index: false, follow: false },
    };
  }

  const canonical = `/projects/${encodeURIComponent(slug)}`;
  const description = `Engineering case study for ${caseStudy.title}: architecture, implementation details, and source code.`;

  return {
    title: caseStudy.title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${caseStudy.title} · Project case study`,
      description,
      url: canonical,
      type: "article",
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: `${caseStudy.title} project case study`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${caseStudy.title} · Project case study`,
      description,
      images: ["/opengraph-image"],
    },
  };
}

export default async function ProjectCaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const caseStudy = await getInitialProjectCaseStudy(slug).catch(() => null);
  const canonical = `${siteUrl}/projects/${encodeURIComponent(slug)}`;
  const jsonLd = caseStudy
    ? {
        "@context": "https://schema.org",
        "@graph": [
          {
            "@type": "CreativeWork",
            name: caseStudy.title,
            description: `Engineering case study for ${caseStudy.title}.`,
            url: canonical,
            isBasedOn: caseStudy.repositoryUrl,
            author: {
              "@type": "Person",
              name: "Nguyen Tran Anh Khoa",
              url: siteUrl,
            },
          },
          {
            "@type": "BreadcrumbList",
            itemListElement: [
              {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: siteUrl,
              },
              {
                "@type": "ListItem",
                position: 2,
                name: caseStudy.title,
                item: canonical,
              },
            ],
          },
        ],
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProjectCaseStudy slug={slug} initialCaseStudy={caseStudy} />
    </>
  );
}
