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
  type = "button",
  ...props
}: PropsWithChildren<ButtonProps>) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-[44px] items-center justify-center rounded-control px-4 py-2.5 text-[13px] font-semibold transition duration-200 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-55",
        fullWidth && "w-full",
        variant === "primary" &&
          "bg-plum text-white shadow-float hover:bg-plumSoft focus-visible:outline-blue/40",
        variant === "secondary" && "bg-elevated text-ink shadow-soft ring-1 ring-borderSoft/12 hover:bg-white",
        variant === "ghost" && "bg-transparent text-ink hover:bg-mist",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
