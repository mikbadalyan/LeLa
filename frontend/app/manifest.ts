import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LE_LA",
    short_name: "LE_LA",
    description: "PWA editoriale pour explorer lieux, personnes et evenements a Strasbourg.",
    start_url: "/feed",
    display: "standalone",
    background_color: "#ECE8E4",
    theme_color: "#8A3FFC",
    orientation: "portrait",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png"
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}

