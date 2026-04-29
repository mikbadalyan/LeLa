"use client";

import { Check, Lock } from "lucide-react";

import { cn } from "@/lib/utils/cn";

import type { ActionChoice, WizardStep } from "../studio";
import { actionChoices, stepIndex, steps } from "../studio";

interface ContributionStepperProps {
  step: WizardStep;
  action: ActionChoice;
  proposalStatus?: string | null;
  onStep: (step: WizardStep) => void;
  layout?: "vertical" | "horizontal";
}

export function ContributionStepper({
  step,
  action,
  proposalStatus,
  onStep,
  layout = "vertical",
}: ContributionStepperProps) {
  const currentIndex = stepIndex(step);
  const actionMeta = actionChoices.find((entry) => entry.id === action);

  if (layout === "horizontal") {
    return (
      <div className="rounded-[24px] bg-white p-2 shadow-[0_18px_40px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <div className="flex gap-2 overflow-x-auto">
          {steps.map((entry, index) => {
            const active = index === currentIndex;
            const complete = index < currentIndex;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => complete && onStep(entry.id)}
                className={cn(
                  "min-w-[104px] rounded-[18px] px-3 py-2 text-left transition",
                  active
                    ? "bg-[#7643A6] text-white shadow-[0_16px_32px_rgba(118,67,166,0.24)]"
                    : complete
                      ? "bg-[#F3EEFA] text-[#7643A6]"
                      : "bg-[#F7F7F7] text-[#606576]"
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
                    {entry.shortLabel}
                  </span>
                  {complete ? <Check className="h-4 w-4" /> : null}
                </div>
                <p className="mt-2 text-xs font-semibold">{entry.label}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[30px] bg-white px-5 py-5 shadow-[0_28px_60px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
      <div className="rounded-[24px] bg-[#7643A6] p-4 text-white shadow-[0_20px_40px_rgba(118,67,166,0.22)]">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/72">Contribution</p>
        <h2 className="mt-2 text-[1.55rem] font-semibold tracking-[-0.05em]">
          {actionMeta?.title ?? "Créer"}
        </h2>
        <p className="mt-1 text-sm text-white/74">{actionMeta?.subtitle}</p>
        {proposalStatus ? (
          <span className="mt-4 inline-flex rounded-full bg-white/14 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em]">
            {proposalStatus}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex-1 overflow-y-auto pr-1">
        <div className="space-y-3">
          {steps.map((entry, index) => {
            const active = index === currentIndex;
            const complete = index < currentIndex;
            const locked = index > currentIndex;
            return (
              <button
                key={entry.id}
                type="button"
                onClick={() => !locked && onStep(entry.id)}
                className={cn(
                  "group flex w-full items-start gap-3 rounded-[22px] px-3 py-3 text-left transition",
                  active ? "bg-[#EEF4FF]" : "hover:bg-[#F6F6F6]"
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition",
                    active
                      ? "bg-[#3365C8] text-white"
                      : complete
                        ? "bg-[#1FA463] text-white"
                        : "bg-[#F2F2F2] text-[#687082]"
                  )}
                >
                  {complete ? <Check className="h-4 w-4" /> : entry.shortLabel}
                </span>
                <span className="min-w-0">
                  <span className="flex items-center gap-2">
                    <span className={cn("text-sm font-semibold", active ? "text-[#1F2430]" : "text-[#353A46]")}>
                      {entry.label}
                    </span>
                    {locked ? <Lock className="h-3.5 w-3.5 text-[#9096A3]" /> : null}
                  </span>
                  <span className="mt-1 block text-xs leading-5 text-[#6B7280]">{entry.hint}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
