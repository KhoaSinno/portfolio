import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.nguyentrananhkhoa.id.vn";

export const viewport: Viewport = {
  themeColor: "#030712",
  colorScheme: "dark",
  width: "device-width",
  initialScale: 1,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Nguyen Tran Anh Khoa · Software Engineer",
    template: "%s | Nguyen Tran Anh Khoa",
  },
  description:
    "Official portfolio of Nguyen Tran Anh Khoa (KhoaSinno). Specialized in Fullstack Web & Mobile Development, Next.js, FastAPI, NestJS, Flutter, and AI Systems.",
  keywords: [
    "Nguyen Tran Anh Khoa",
    "KhoaSinno",
    "nguyentrananhkhoa.id.vn",
    "SinooHub",
    "Fullstack Developer",
    "Software Engineer",
    "Backend Developer",
    "Next.js Developer",
    "FastAPI Developer",
    "NestJS",
    "Flutter Developer",
    "PostgreSQL",
    "Supabase",
    "Hybrid RAG",
    "AI Voice Assistant",
    "Vietnam Software Engineer",
    "Can Tho University of Technology",
  ],
  authors: [{ name: "Nguyen Tran Anh Khoa", url: siteUrl }],
  creator: "Nguyen Tran Anh Khoa",
  publisher: "Nguyen Tran Anh Khoa",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: "vi_VN",
    url: siteUrl,
    siteName: "Nguyen Tran Anh Khoa Portfolio",
    title: "Nguyen Tran Anh Khoa · Software Engineer",
    description:
      "Explore high-performance fullstack systems, AI-powered applications, and engineering projects built by Nguyen Tran Anh Khoa.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Nguyen Tran Anh Khoa - Software Engineer",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Nguyen Tran Anh Khoa · Software Engineer",
    description:
      "Explore high-performance fullstack systems, AI-powered applications, and engineering projects built by Nguyen Tran Anh Khoa.",
    creator: "@KhoaSinno",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: [
      { url: "/icon.png", type: "image/png" },
      { url: "/favicon.png", sizes: "any" },
    ],
    shortcut: "/icon.png",
    apple: "/apple-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#030712] text-slate-100 font-sans selection:bg-purple-500/30 selection:text-purple-200">
        {children}
      </body>
    </html>
  );
}
