"use client";

import { ArrowRight, FilePenLine, FileText, Plus } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import type { ActionChoice } from "../studio";
import { actionChoices } from "../studio";

interface ActionSelectorProps {
  value: ActionChoice;
  onChange: (value: ActionChoice) => void;
}

function iconFor(choice: ActionChoice) {
  if (choice === "create_card") return <Plus className="h-7 w-7" />;
  if (choice === "create_fiche") return <FileText className="h-7 w-7" />;
  return <FilePenLine className="h-7 w-7" />;
}

export function ActionSelector({ value, onChange }: ActionSelectorProps) {
  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-3">
      {actionChoices.map((choice) => {
        const active = choice.id === value;
        return (
          <button
            key={choice.id}
            type="button"
            onClick={() => onChange(choice.id)}
            className={cn(
              "group relative flex min-h-[180px] flex-col justify-between overflow-hidden rounded-[28px] p-5 text-left transition duration-300 sm:min-h-[220px] sm:rounded-[30px] sm:p-6",
              active
                ? "bg-[#1F2430] text-white shadow-[0_32px_70px_rgba(31,36,48,0.28)]"
                : "bg-white text-[#1F2430] shadow-[0_22px_50px_rgba(30,34,40,0.08)] ring-1 ring-black/6 hover:-translate-y-1 hover:shadow-[0_28px_60px_rgba(30,34,40,0.14)]"
            )}
          >
            <div
              className="absolute inset-x-8 top-6 h-28 rounded-full blur-3xl"
              style={{ backgroundColor: `${choice.accent}22` }}
            />
            <div className="relative">
              <div
                className={cn(
                  "inline-flex h-16 w-16 items-center justify-center rounded-[20px] transition",
                  active ? "bg-white/12 text-white" : "bg-[#F3EEFA] text-[#7643A6]"
                )}
              >
                {iconFor(choice.id)}
              </div>
              <span
                className={cn(
                  "mt-6 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]",
                  active ? "bg-white/10 text-white/78" : "bg-[#F5F5F5] text-[#687082]"
                )}
              >
                {choice.proposalType.replace("_", " ")}
              </span>
              <h3 className="mt-4 text-[1.45rem] font-semibold tracking-[-0.06em] sm:text-[1.85rem]">{choice.title}</h3>
              <p className={cn("mt-2 text-sm leading-6", active ? "text-white/78" : "text-[#6B7280]")}>
                {choice.subtitle}
              </p>
            </div>
            <div className="relative flex items-center justify-between">
              <span className={cn("text-xs font-medium", active ? "text-white/70" : "text-[#6B7280]")}>
                Continuer
              </span>
              <span
                className={cn(
                  "inline-flex h-12 w-12 items-center justify-center rounded-full transition",
                  active ? "bg-white text-[#1F2430]" : "bg-[#7643A6] text-white"
                )}
              >
                <ArrowRight className="h-5 w-5" />
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
