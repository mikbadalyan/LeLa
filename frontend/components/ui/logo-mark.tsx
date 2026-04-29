import Image from "next/image";

import { cn } from "@/lib/utils/cn";

export function LogoMark({ className, large = false }: { className?: string; large?: boolean }) {
  return (
    <div className={cn("flex h-[46px] w-[46px] items-center justify-center rounded-full border border-borderSoft/10 bg-elevated shadow-soft", className)}>
      <Image src="/assets/logo.svg" alt="LE_LA" width={large ? 28 : 18} height={large ? 38 : 26} />
    </div>
  );
}
