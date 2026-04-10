import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-3xl border border-borderSoft bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-plum",
        props.className
      )}
    />
  );
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "min-h-32 w-full rounded-3xl border border-borderSoft bg-white px-4 py-3 text-sm text-ink outline-none transition focus:border-plum",
        props.className
      )}
    />
  );
}

