import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { cn } from "@/lib/utils/cn";

export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-control border border-borderSoft/14 bg-elevated px-4 py-3 text-sm text-ink outline-none transition placeholder:text-graphite/45 focus:border-blue focus:ring-4 focus:ring-blue/12",
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
        "min-h-32 w-full rounded-control border border-borderSoft/14 bg-elevated px-4 py-3 text-sm text-ink outline-none transition placeholder:text-graphite/45 focus:border-blue focus:ring-4 focus:ring-blue/12",
        props.className
      )}
    />
  );
}
