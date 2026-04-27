"use client";

import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AlertTriangle, Check, GitCompareArrows, LoaderCircle, Search, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input, Textarea } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { getModerationProposals, moderateContributionProposal } from "@/lib/api/endpoints";
import type {
  ContributionProposal,
  ContributionProposalStatus,
  ContributionProposalType,
  FicheAiEvaluation,
} from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

const statusOptions: Array<{ value: ContributionProposalStatus | ""; label: string }> = [
  { value: "pending_moderation", label: "A modérer" },
  { value: "ai_reviewed", label: "Pré-check IA" },
  { value: "needs_changes", label: "Changements demandés" },
  { value: "approved", label: "Approuvées" },
  { value: "rejected", label: "Rejetées" },
  { value: "", label: "Toutes" },
];

const typeOptions: Array<{ value: ContributionProposalType | ""; label: string }> = [
  { value: "", label: "Tous types" },
  { value: "create_card", label: "Nouvelle carte" },
  { value: "create_fiche", label: "Nouvelle fiche" },
  { value: "update_card", label: "Mise à jour carte" },
  { value: "update_fiche", label: "Mise à jour fiche" },
  { value: "correction", label: "Correction" },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown>
    : {};
}

function textValue(value: unknown, fallback = "") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function proposalTitle(proposal: ContributionProposal) {
  const card = asRecord(proposal.proposed_data.card);
  const fiche = asRecord(proposal.proposed_data.fiche);
  const correction = asRecord(proposal.proposed_data.correction);
  const reference = asRecord(proposal.proposed_data.card_reference);
  return textValue(card.title, textValue(fiche.title, textValue(reference.title, textValue(correction.section, "Proposition LE_LA"))));
}

function proposalDescription(proposal: ContributionProposal) {
  const card = asRecord(proposal.proposed_data.card);
  const fiche = asRecord(proposal.proposed_data.fiche);
  const sections = asRecord(fiche.sections);
  const correction = asRecord(proposal.proposed_data.correction);
  return textValue(
    card.short_description,
    textValue(sections.resume, textValue(correction.proposed_text, proposal.explanation ?? ""))
  );
}

function proposalCity(proposal: ContributionProposal) {
  const card = asRecord(proposal.proposed_data.card);
  const reference = asRecord(proposal.proposed_data.card_reference);
  return textValue(card.city, textValue(reference.city, "Ville non précisée"));
}

function scoreTone(score?: number) {
  if (score === undefined) return "bg-mist text-graphite ring-borderSoft/10";
  if (score >= 75) return "bg-success/10 text-success ring-success/20";
  if (score >= 50) return "bg-warning/10 text-warning ring-warning/20";
  return "bg-danger/10 text-danger ring-danger/20";
}

function ScoreBadge({ score, label = "IA" }: { score?: number; label?: string }) {
  return (
    <span className={cn("rounded-full px-2.5 py-1 text-xs font-semibold ring-1", scoreTone(score))}>
      {label} {score ?? "-"}
    </span>
  );
}

function AIBlock({ review }: { review?: FicheAiEvaluation | null }) {
  if (!review) {
    return <p className="text-sm text-graphite">Aucune analyse IA disponible.</p>;
  }
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
        <ScoreBadge label="Global" score={review.global_score} />
        <ScoreBadge label="Doublon" score={review.duplicate_risk_score} />
        <ScoreBadge label="Sources" score={review.source_quality_score} />
        <ScoreBadge label="Risque" score={review.risk_score} />
      </div>
      <div className="rounded-[22px] bg-surface p-4 ring-1 ring-borderSoft/10">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-plum">
          Recommandation: {review.moderator_recommendation} · type: {review.content_type_recommendation}
        </p>
        <p className="mt-2 text-sm leading-6 text-graphite">{review.summary}</p>
      </div>
      {[
        ["Doublons", review.duplicate_warnings],
        ["Grammaire", review.grammar_suggestions],
        ["Manques", review.missing_information],
        ["Suggestions", review.content_suggestions],
      ].map(([title, values]) => (
        <div key={title as string} className="rounded-[18px] bg-surface p-3 text-sm ring-1 ring-borderSoft/10">
          <p className="font-semibold text-ink">{title as string}</p>
          {(values as string[]).length ? (
            <ul className="mt-2 space-y-1 text-graphite">
              {(values as string[]).map((value) => <li key={value}>- {value}</li>)}
            </ul>
          ) : <p className="mt-2 text-graphite/65">Aucun signalement.</p>}
        </div>
      ))}
    </div>
  );
}

function BeforeAfterDiff({ proposal }: { proposal: ContributionProposal }) {
  const correction = asRecord(proposal.proposed_data.correction);
  const previous = proposal.previous_data_snapshot ?? asRecord(proposal.proposed_data.card_reference);
  const before = textValue(correction.current_text, textValue(previous.short_description, "Contenu actuel non renseigné."));
  const after = textValue(correction.proposed_text, proposalDescription(proposal));
  return (
    <div className="grid gap-3 md:grid-cols-2">
      <div className="rounded-[22px] bg-danger/8 p-4 ring-1 ring-danger/15">
        <p className="flex items-center gap-2 text-sm font-semibold text-danger"><GitCompareArrows className="h-4 w-4" />Avant</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-graphite">{before}</p>
      </div>
      <div className="rounded-[22px] bg-success/8 p-4 ring-1 ring-success/15">
        <p className="flex items-center gap-2 text-sm font-semibold text-success"><GitCompareArrows className="h-4 w-4" />Après</p>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-graphite">{after}</p>
      </div>
    </div>
  );
}

function PublicPreview({ proposal }: { proposal: ContributionProposal }) {
  const card = asRecord(proposal.proposed_data.card);
  const reference = asRecord(proposal.proposed_data.card_reference);
  const image = textValue(card.main_image, textValue(reference.image));
  return (
    <article className="overflow-hidden rounded-[26px] bg-elevated shadow-card ring-1 ring-borderSoft/10">
      <div className="relative h-64 bg-[linear-gradient(145deg,#202431,#7643A6)]">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt={proposalTitle(proposal)} className="h-full w-full object-cover" />
        ) : null}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/82 to-transparent p-4 text-white">
          <span className="rounded-full bg-blue px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]">
            {proposal.contribution_type}
          </span>
          <h3 className="mt-3 text-2xl font-semibold leading-tight">{proposalTitle(proposal)}</h3>
          <p className="mt-2 line-clamp-3 text-sm text-white/82">{proposalDescription(proposal)}</p>
        </div>
      </div>
    </article>
  );
}

export function FicheModerationScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [status, setStatus] = useState<ContributionProposalStatus | "">("pending_moderation");
  const [type, setType] = useState<ContributionProposalType | "">("");
  const [city, setCity] = useState("");
  const [minScore, setMinScore] = useState("");
  const [duplicateRisk, setDuplicateRisk] = useState("");
  const [category, setCategory] = useState("");
  const [contributor, setContributor] = useState("");
  const [date, setDate] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!token) router.replace("/login");
  }, [router, token]);

  const proposalsQuery = useQuery({
    queryKey: ["moderation-proposals", status, type, city, minScore, duplicateRisk, category, contributor, date, Boolean(token)],
    queryFn: () => getModerationProposals(token!, {
      status: status || undefined,
      type: type || undefined,
      city: city || undefined,
      min_score: minScore ? Number(minScore) : undefined,
      duplicate_risk: duplicateRisk ? Number(duplicateRisk) : undefined,
      category: category || undefined,
      contributor: contributor || undefined,
      date: date || undefined,
    }),
    enabled: Boolean(token && user?.role === "moderator"),
  });

  const proposals = proposalsQuery.data ?? [];
  const selected = useMemo(
    () => proposals.find((proposal) => proposal.id === selectedId) ?? proposals[0] ?? null,
    [proposals, selectedId]
  );

  useEffect(() => {
    if (selected) {
      setSelectedId(selected.id);
      setNotes(selected.moderator_notes ?? "");
    }
  }, [selected?.id]);

  const moderationMutation = useMutation({
    mutationFn: ({ proposalId, action }: { proposalId: string; action: "approve" | "reject" | "needs-changes" }) =>
      moderateContributionProposal(proposalId, action, { moderator_notes: notes }, token!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["moderation-proposals"] });
      queryClient.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  if (token && user?.role !== "moderator") {
    return (
      <div className="min-h-dvh bg-background px-5 py-8">
        <div className="mx-auto max-w-xl rounded-[28px] bg-elevated p-5 text-sm text-graphite shadow-soft ring-1 ring-borderSoft/10">
          Cette page est réservée aux modérateurs.
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background px-4 py-5 text-ink md:px-8">
      <div className="mx-auto flex w-full max-w-[1380px] flex-col gap-4">
        <header className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue">Modération collaborative</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em]">Cartes, fiches et corrections</h1>
          </div>
          <Button variant="secondary" onClick={() => router.push("/feed")}>Retour LE_LA</Button>
        </header>

        <section className="grid gap-3 rounded-[28px] bg-elevated p-3 shadow-soft ring-1 ring-borderSoft/10 md:grid-cols-[1fr_1fr_1fr_0.75fr] xl:grid-cols-[1fr_1fr_1fr_0.8fr_0.8fr_1fr_1fr_0.9fr]">
          <select className="rounded-control border border-borderSoft/14 bg-surface px-3 py-3 text-sm" value={status} onChange={(event) => setStatus(event.target.value as ContributionProposalStatus | "")}>
            {statusOptions.map((entry) => <option key={entry.label} value={entry.value}>{entry.label}</option>)}
          </select>
          <select className="rounded-control border border-borderSoft/14 bg-surface px-3 py-3 text-sm" value={type} onChange={(event) => setType(event.target.value as ContributionProposalType | "")}>
            {typeOptions.map((entry) => <option key={entry.label} value={entry.value}>{entry.label}</option>)}
          </select>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite/55" />
            <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville" className="pl-9" />
          </div>
          <Input value={minScore} onChange={(event) => setMinScore(event.target.value)} placeholder="Score min" />
          <Input value={duplicateRisk} onChange={(event) => setDuplicateRisk(event.target.value)} placeholder="Doublon min" />
          <select className="rounded-control border border-borderSoft/14 bg-surface px-3 py-3 text-sm" value={category} onChange={(event) => setCategory(event.target.value)}>
            <option value="">Catégorie</option>
            <option value="lieu">Lieu</option>
            <option value="personne">Personne</option>
            <option value="evenement">Evénement</option>
            <option value="objet">Objet</option>
            <option value="theme">Thème</option>
            <option value="autre">Autre</option>
          </select>
          <Input value={contributor} onChange={(event) => setContributor(event.target.value)} placeholder="Contributeur" />
          <Input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Date de contribution" />
        </section>

        <main className="grid min-h-[72vh] gap-4 lg:grid-cols-[380px_1fr]">
          <aside className="overflow-hidden rounded-[28px] bg-elevated shadow-soft ring-1 ring-borderSoft/10">
            <div className="border-b border-borderSoft/10 px-4 py-3 text-sm font-semibold">
              {proposals.length} proposition{proposals.length > 1 ? "s" : ""}
            </div>
            <div className="max-h-[74vh] overflow-y-auto">
              {proposalsQuery.isLoading ? (
                <div className="flex items-center justify-center py-12 text-blue">
                  <LoaderCircle className="h-5 w-5 animate-spin" />
                </div>
              ) : proposals.length ? (
                proposals.map((proposal) => (
                  <button
                    key={proposal.id}
                    type="button"
                    onClick={() => setSelectedId(proposal.id)}
                    className={cn(
                      "block w-full border-b border-borderSoft/8 px-4 py-4 text-left transition hover:bg-mist",
                      selected?.id === proposal.id && "bg-blueSoft/70"
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-full bg-mist px-2 py-1 text-[11px] font-semibold uppercase text-graphite">{proposal.contribution_type}</span>
                      <ScoreBadge score={proposal.ai_review?.global_score} />
                    </div>
                    <p className="mt-2 line-clamp-1 text-sm font-semibold text-ink">{proposalTitle(proposal)}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-5 text-graphite">{proposalDescription(proposal)}</p>
                    <p className="mt-2 text-xs font-semibold text-plum">{proposalCity(proposal)}</p>
                  </button>
                ))
              ) : (
                <div className="px-4 py-10 text-sm text-graphite">Aucune proposition ne correspond aux filtres.</div>
              )}
            </div>
          </aside>

          <section className="rounded-[28px] bg-elevated p-4 shadow-soft ring-1 ring-borderSoft/10">
            {selected ? (
              <div className="grid gap-4 xl:grid-cols-[1fr_330px]">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-blue">{selected.contribution_type}</p>
                    <h2 className="mt-1 text-2xl font-semibold text-ink">{proposalTitle(selected)}</h2>
                    <p className="mt-1 text-sm text-graphite">Par {selected.contributor.display_name} · {proposalCity(selected)}</p>
                  </div>

                  {selected.contribution_type === "correction" ? <BeforeAfterDiff proposal={selected} /> : (
                    <div className="rounded-[22px] bg-surface p-4 ring-1 ring-borderSoft/10">
                      <p className="text-sm font-semibold text-ink">Contenu proposé</p>
                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-graphite">{proposalDescription(selected)}</p>
                      <pre className="mt-3 max-h-48 overflow-auto rounded-[18px] bg-ink/90 p-3 text-xs text-white/85">
                        {JSON.stringify(selected.proposed_data, null, 2)}
                      </pre>
                    </div>
                  )}

                  <div className="rounded-[22px] bg-white/70 p-4 ring-1 ring-borderSoft/10">
                    <AIBlock review={selected.ai_review} />
                  </div>

                  <div className="rounded-[22px] bg-surface p-4 ring-1 ring-borderSoft/10">
                    <Textarea value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Notes modérateur, demande de changements, raison du rejet..." className="min-h-24" />
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ proposalId: selected.id, action: "approve" })}>
                        <Check className="mr-2 h-4 w-4" />
                        Approuver
                      </Button>
                      <Button variant="secondary" disabled={moderationMutation.isPending} onClick={() => moderationMutation.mutate({ proposalId: selected.id, action: "needs-changes" })}>
                        <AlertTriangle className="mr-2 h-4 w-4" />
                        Demander changements
                      </Button>
                      <Button variant="ghost" disabled={moderationMutation.isPending} className="text-danger" onClick={() => moderationMutation.mutate({ proposalId: selected.id, action: "reject" })}>
                        <X className="mr-2 h-4 w-4" />
                        Rejeter
                      </Button>
                    </div>
                    {moderationMutation.error ? <p className="mt-2 text-sm text-danger">{moderationMutation.error.message}</p> : null}
                  </div>
                </div>
                <aside className="space-y-3">
                  <PublicPreview proposal={selected} />
                  <div className="rounded-[22px] bg-surface p-4 text-sm leading-6 text-graphite ring-1 ring-borderSoft/10">
                    <p className="font-semibold text-ink">Suivi</p>
                    <p>Statut: {selected.status}</p>
                    <p>Soumis: {selected.submitted_at ? new Date(selected.submitted_at).toLocaleString("fr-FR") : "Non soumis"}</p>
                    <p>Cible carte: {selected.target_card?.title ?? selected.target_card_id ?? "Aucune"}</p>
                    <p>Cible fiche: {selected.target_fiche?.title ?? selected.target_fiche_id ?? "Aucune"}</p>
                  </div>
                </aside>
              </div>
            ) : (
              <div className="flex min-h-[360px] items-center justify-center text-sm text-graphite">
                Sélectionnez une proposition à examiner.
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
