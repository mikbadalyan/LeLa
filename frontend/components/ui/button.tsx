import type { ButtonHTMLAttributes, PropsWithChildren } from "react";

import { cn } from "@/lib/utils/cn";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  fullWidth?: boolean;
}

export function Button({
  children,
  className,
  variant = "primary",
  fullWidth,
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-transform duration-200 active:scale-[0.98]",
        fullWidth && "w-full",
        variant === "primary" &&
          "bg-plum text-white shadow-float hover:bg-plumSoft",
        variant === "secondary" && "bg-white text-ink shadow-sm ring-1 ring-borderSoft",
        variant === "ghost" && "bg-transparent text-ink",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

