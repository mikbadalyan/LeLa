import type { ReactNode } from "react";

import { WebsiteShell } from "@/components/layout/website-shell";

export default function WebsiteLayout({ children }: { children: ReactNode }) {
  return <WebsiteShell>{children}</WebsiteShell>;
}

