"use client";

import { AlertTriangle, Bot, LoaderCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import type { FicheAiEvaluation } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

interface AIReviewPanelProps {
  evaluation?: FicheAiEvaluation | null;
  loading?: boolean;
  onRun?: () => void;
  disabled?: boolean;
  compact?: boolean;
}

function tone(score?: number) {
  if (score === undefined) return "bg-[#F3F3F3] text-[#6B7280]";
  if (score >= 75) return "bg-[#EAF6EF] text-[#1F9D66]";
  if (score >= 50) return "bg-[#FFF3DE] text-[#A36A15]";
  return "bg-[#FCE8E8] text-[#B64141]";
}

export function AIReviewPanel({
  evaluation,
  loading,
  onRun,
  disabled,
  compact = false,
}: AIReviewPanelProps) {
  if (loading) {
    return (
      <div className="flex h-full min-h-[250px] items-center justify-center rounded-[28px] bg-white p-6 text-center shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <div>
          <LoaderCircle className="mx-auto h-7 w-7 animate-spin text-[#3365C8]" />
          <p className="mt-3 text-sm font-semibold text-[#1F2430]">Analyse du contenu en cours…</p>
        </div>
      </div>
    );
  }

  if (!evaluation) {
    return (
      <div className="rounded-[28px] bg-white p-5 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#EEF4FF] text-[#3365C8]">
            <Bot className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[#1F2430]">Pré-check IA</p>
            <p className="text-sm text-[#6B7280]">Qualité, doublons, risques, sources.</p>
          </div>
        </div>
        {onRun ? (
          <Button className="mt-5 w-full" onClick={onRun} disabled={disabled}>
            <Sparkles className="mr-2 h-4 w-4" />
            Lancer l’analyse
          </Button>
        ) : null}
      </div>
    );
  }

  const metrics = [
    { label: "Global", value: evaluation.global_score },
    { label: "Clarté", value: evaluation.clarity_score },
    { label: "Complétude", value: evaluation.completeness_score },
    { label: "Sources", value: evaluation.source_quality_score },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col rounded-[28px] bg-white p-5 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Analyse IA</p>
          <h3 className="mt-2 text-[1.3rem] font-semibold tracking-[-0.04em] text-[#1F2430] sm:text-xl">
            Score éditorial
          </h3>
        </div>
        <span className={cn("rounded-full px-3 py-1 text-xs font-semibold", tone(evaluation.global_score))}>
          {evaluation.moderator_recommendation}
        </span>
      </div>

      <div className={cn("mt-4 grid gap-2", compact ? "grid-cols-2" : "grid-cols-2 xl:grid-cols-4")}>
        {metrics.map((metric) => (
          <div key={metric.label} className={cn("rounded-[20px] px-4 py-3", tone(metric.value))}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em]">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold">{metric.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-[22px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
        <p className="text-sm font-semibold text-[#1F2430]">Résumé</p>
        <p className="mt-2 text-sm leading-6 text-[#5F6674]">{evaluation.summary}</p>
      </div>

      <div className="mt-4 grid min-h-0 flex-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2">
        <div className="rounded-[22px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
          <p className="text-sm font-semibold text-[#1F2430]">Points forts</p>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5F6674]">
            {(evaluation.strengths.length ? evaluation.strengths : ["Aucun point fort remonté."]).map((value) => (
              <li key={value}>• {value}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-[22px] bg-[#FFF3DE] p-4 ring-1 ring-[#E5A93B]/18">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-[#A36A15]" />
            <p className="text-sm font-semibold text-[#1F2430]">À corriger</p>
          </div>
          <ul className="mt-3 space-y-2 text-sm leading-6 text-[#5F6674]">
            {(
              evaluation.weaknesses.length
                ? evaluation.weaknesses
                : evaluation.missing_information.length
                  ? evaluation.missing_information
                  : ["Aucun signal faible."]
            ).map((value) => (
              <li key={value}>• {value}</li>
            ))}
          </ul>
        </div>
      </div>

      {onRun ? (
        <Button className="mt-4 w-full" onClick={onRun} disabled={disabled}>
          <Sparkles className="mr-2 h-4 w-4" />
          Relancer l’analyse
        </Button>
      ) : null}
    </div>
  );
}
