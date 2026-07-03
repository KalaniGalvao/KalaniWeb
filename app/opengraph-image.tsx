import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

// Render on the edge runtime: this is how the OG image is generated in
// production (Vercel), and it avoids the Node-side @vercel/og font-path bug
// that breaks static prerendering of this route on Windows builds.
export const runtime = "edge";

// Dynamically rendered social share image (also reused for the Twitter card).
export const alt = `${SITE.name} — ${SITE.tagline}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          background:
            "radial-gradient(120% 120% at 80% 20%, #1b3a8f 0%, #070b16 55%)",
          color: "#e8edff",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", fontSize: 34 }}>
          <span style={{ fontWeight: 700 }}>{SITE.name}</span>
          <span style={{ color: "#5cc8ff" }}>.</span>
          <span style={{ marginLeft: 18, color: "#7aa0ff", fontSize: 24 }}>
            estúdio digital
          </span>
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              maxWidth: 900,
            }}
          >
            Leve seu negócio físico para a era digital.
          </div>
          <div style={{ marginTop: 28, fontSize: 30, color: "#b9ccff" }}>
            {SITE.tagline}
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
