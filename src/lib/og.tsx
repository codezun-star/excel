import { ImageResponse } from "next/og";

export const OG_SIZE = { width: 1200, height: 630 };

/** Imagen Open Graph con estilo de hoja de cálculo (sin fuentes externas). */
export function renderOgImage({
  title,
  subtitle,
  badge,
}: {
  title: string;
  subtitle: string;
  badge?: string;
}) {
  const grid =
    "linear-gradient(to right, rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,.08) 1px, transparent 1px)";
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: 64,
        backgroundColor: "#217346",
        backgroundImage: grid,
        backgroundSize: "88px 34px",
        color: "white",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 14,
            background: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#217346",
            fontSize: 44,
            fontWeight: 800,
          }}
        >
          X
        </div>
        <div style={{ fontSize: 34, fontWeight: 800 }}>Excel Codezun</div>
        {badge ? (
          <div
            style={{
              marginLeft: "auto",
              background: "#F2B01E",
              color: "#2b2105",
              borderRadius: 999,
              padding: "8px 22px",
              fontSize: 26,
              fontWeight: 800,
            }}
          >
            {badge}
          </div>
        ) : null}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        <div style={{ fontSize: 72, fontWeight: 800, lineHeight: 1.05, maxWidth: 1000 }}>
          {title}
        </div>
        <div style={{ fontSize: 30, opacity: 0.9, maxWidth: 1000 }}>{subtitle}</div>
      </div>
      <div style={{ display: "flex", gap: 12, fontSize: 24, opacity: 0.9 }}>
        <span>Plantilla .xlsx con fórmulas reales</span>
        <span>·</span>
        <span>excel.codezun.com</span>
      </div>
    </div>,
    OG_SIZE,
  );
}
