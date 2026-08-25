import { ImageResponse } from "next/og";
import fs from "node:fs/promises";
import path from "node:path";

export const alt = "Nguyen Tran Anh Khoa · Software Engineer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  let logoDataUrl = "";
  try {
    const logoBuffer = await fs.readFile(
      path.join(process.cwd(), "public", "icon.png")
    );
    logoDataUrl = `data:image/png;base64,${logoBuffer.toString("base64")}`;
  } catch {
    // Fallback if file not read
    logoDataUrl = "";
  }

  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #030712 0%, #0a0f1d 50%, #15102a 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "50px 65px",
          fontFamily: "sans-serif",
          color: "white",
        }}
      >
        {/* Left Column: Bio & Core Info */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            width: "58%",
            height: "100%",
          }}
        >
          {/* Top Brand Header with Official Logo */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "14px",
            }}
          >
            {logoDataUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={logoDataUrl}
                alt="Sinoo Logo"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  border: "1.5px solid rgba(255, 255, 255, 0.25)",
                  boxShadow: "0 8px 20px rgba(99, 102, 241, 0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, #8B5CF6, #6366F1)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  fontWeight: "bold",
                  color: "white",
                }}
              >
                K
              </div>
            )}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "6px 14px",
                borderRadius: "999px",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                fontSize: "12px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                color: "#34D399",
                textTransform: "uppercase",
              }}
            >
              <div
                style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: "#10B981",
                }}
              />
              <span>AVAILABLE FOR HIRE</span>
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "13px",
                fontWeight: 700,
                letterSpacing: "0.15em",
                color: "#A5B4FC",
                textTransform: "uppercase",
              }}
            >
              nguyentrananhkhoa.id.vn
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: "52px",
                fontWeight: 900,
                letterSpacing: "-0.03em",
                lineHeight: 1.1,
                color: "#FDE68A",
              }}
            >
              Nguyen Tran Anh Khoa
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "24px",
                fontWeight: 700,
                color: "#CBD5E1",
                letterSpacing: "-0.01em",
              }}
            >
              Software Engineer & Fullstack Developer
            </div>

            <div
              style={{
                display: "flex",
                fontSize: "15px",
                color: "#94A3B8",
                lineHeight: 1.5,
                maxWidth: "520px",
              }}
            >
              Architecting high-performance web applications, scalable APIs, Flutter mobile solutions, and generative AI systems.
            </div>
          </div>

          {/* Tech Badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              flexWrap: "wrap",
            }}
          >
            {[
              { name: "Next.js 16", border: "rgba(255, 255, 255, 0.3)", color: "#FFFFFF" },
              { name: "FastAPI", border: "rgba(5, 153, 139, 0.5)", color: "#2DD4BF" },
              { name: "NestJS", border: "rgba(224, 35, 78, 0.5)", color: "#FB7185" },
              { name: "Flutter", border: "rgba(2, 86, 155, 0.5)", color: "#38BDF8" },
              { name: "PostgreSQL", border: "rgba(65, 105, 225, 0.5)", color: "#818CF8" },
              { name: "Hybrid RAG", border: "rgba(147, 51, 234, 0.5)", color: "#C084FC" },
            ].map((tech) => (
              <div
                key={tech.name}
                style={{
                  display: "flex",
                  padding: "6px 14px",
                  borderRadius: "8px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${tech.border}`,
                  color: tech.color,
                  fontSize: "13px",
                  fontWeight: 700,
                }}
              >
                {tech.name}
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: High-Tech Glassmorphic Code Card */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "38%",
            height: "90%",
            borderRadius: "20px",
            background: "rgba(15, 23, 42, 0.95)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            overflow: "hidden",
          }}
        >
          {/* Mac Window Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 18px",
              background: "rgba(255, 255, 255, 0.03)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "7px" }}>
              <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#EF4444" }} />
              <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#F59E0B" }} />
              <div style={{ width: "11px", height: "11px", borderRadius: "50%", background: "#10B981" }} />
            </div>
            <div style={{ display: "flex", fontSize: "12px", fontFamily: "monospace", color: "#94A3B8" }}>
              engineer.profile.ts
            </div>
            <div style={{ display: "flex", width: "30px" }} />
          </div>

          {/* Code Window Body */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              padding: "20px 22px",
              fontFamily: "monospace",
              fontSize: "13px",
              lineHeight: 1.6,
              color: "#E2E8F0",
            }}
          >
            <div style={{ display: "flex" }}>
              <span style={{ color: "#C084FC" }}>const</span>
              <span style={{ color: "#60A5FA", marginLeft: "6px" }}>developer</span>
              <span style={{ marginLeft: "6px" }}>= &#123;</span>
            </div>
            <div style={{ display: "flex", paddingLeft: "16px" }}>
              <span style={{ color: "#94A3B8" }}>name:</span>
              <span style={{ color: "#FDE68A", marginLeft: "6px" }}>&quot;Nguyen Tran Anh Khoa&quot;,</span>
            </div>
            <div style={{ display: "flex", paddingLeft: "16px" }}>
              <span style={{ color: "#94A3B8" }}>alias:</span>
              <span style={{ color: "#FDE68A", marginLeft: "6px" }}>&quot;KhoaSinno&quot;,</span>
            </div>
            <div style={{ display: "flex", paddingLeft: "16px" }}>
              <span style={{ color: "#94A3B8" }}>brand:</span>
              <span style={{ color: "#34D399", marginLeft: "6px" }}>&quot;SinooHub&quot;,</span>
            </div>
            <div style={{ display: "flex", paddingLeft: "16px" }}>
              <span style={{ color: "#94A3B8" }}>role:</span>
              <span style={{ color: "#38BDF8", marginLeft: "6px" }}>&quot;Fullstack & AI Engineer&quot;,</span>
            </div>
            <div style={{ display: "flex", paddingLeft: "16px" }}>
              <span style={{ color: "#94A3B8" }}>focus:</span>
              <span style={{ color: "#F472B6", marginLeft: "6px" }}>[&quot;Next.js&quot;, &quot;FastAPI&quot;, &quot;RAG&quot;],</span>
            </div>
            <div style={{ display: "flex", paddingLeft: "16px" }}>
              <span style={{ color: "#94A3B8" }}>status:</span>
              <span style={{ color: "#34D399", marginLeft: "6px" }}>&quot;Ready for Impact ⚡&quot;</span>
            </div>
            <div style={{ display: "flex" }}>&#125;;</div>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
