import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background:
            "radial-gradient(circle at top, rgba(255,255,255,0.85), rgba(255,255,255,0) 36%), linear-gradient(180deg, #f4ede6 0%, #e6ddd4 100%)"
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            borderRadius: 999,
            background: "#fff",
            border: "10px solid #8A3FFC",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "Trebuchet MS"
          }}
        >
          <div style={{ fontSize: 120, fontWeight: 800, color: "#4F6CF2", lineHeight: 1 }}>
            LE
          </div>
          <div style={{ fontSize: 120, fontWeight: 800, color: "#FF7B5B", lineHeight: 1 }}>
            LA
          </div>
        </div>
      </div>
    ),
    size
  );
}

