import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

import { Providers } from "@/components/layout/providers";

export const metadata: Metadata = {
  title: "LE_LA",
  description: "Plateforme editoriale mobile-first pour explorer lieux, personnes et evenements.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LE_LA"
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
