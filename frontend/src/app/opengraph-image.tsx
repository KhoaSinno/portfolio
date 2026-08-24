import { ImageResponse } from "next/og";

export const alt = "Nguyen Tran Anh Khoa · Software Engineer";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "linear-gradient(135deg, #030712 0%, #0b1120 50%, #1e1b4b 100%)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "70px 80px",
          fontFamily: "sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        {/* Glow orb */}
        <div
          style={{
            position: "absolute",
            top: "-100px",
            right: "-100px",
            width: "500px",
            height: "500px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(139, 92, 246, 0.3) 0%, rgba(99, 102, 241, 0.1) 60%, transparent 80%)",
          }}
        />

        {/* Top brand header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
          }}
        >
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
              boxShadow: "0 10px 25px rgba(99, 102, 241, 0.4)",
            }}
          >
            K
          </div>
          <div
            style={{
              fontSize: "20px",
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#A5B4FC",
              fontWeight: 700,
            }}
          >
            NGUYENTRANANHKHOA.ID.VN
          </div>
        </div>

        {/* Center Main Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "16px",
          }}
        >
          <div
            style={{
              fontSize: "58px",
              fontWeight: 900,
              letterSpacing: "-0.03em",
              lineHeight: 1.1,
              background: "linear-gradient(to right, #FFFFFF, #E2E8F0, #CBD5E1)",
              backgroundClip: "text",
              color: "white",
            }}
          >
            Nguyen Tran Anh Khoa
          </div>
          <div
            style={{
              fontSize: "28px",
              fontWeight: 600,
              color: "#94A3B8",
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            <span style={{ color: "#A855F7" }}>•</span> Software Engineer & Fullstack Developer
          </div>
        </div>

        {/* Bottom Tech Badges */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          {["Next.js", "FastAPI", "NestJS", "Flutter", "PostgreSQL", "Hybrid RAG"].map(
            (tech) => (
              <div
                key={tech}
                style={{
                  padding: "8px 18px",
                  borderRadius: "10px",
                  background: "rgba(255, 255, 255, 0.07)",
                  border: "1px solid rgba(255, 255, 255, 0.15)",
                  color: "#E2E8F0",
                  fontSize: "16px",
                  fontWeight: 600,
                }}
              >
                {tech}
              </div>
            )
          )}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
