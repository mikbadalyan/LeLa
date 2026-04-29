"use client";

import { LoaderCircle, MapPin, Plus, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { CardSearchResult } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

import type { ActionChoice } from "../studio";
import { categories } from "../studio";

interface SearchState {
  query: string;
  city: string;
  tags: string;
  category: string;
}

interface CardSearchPanelProps {
  action: ActionChoice;
  search: SearchState;
  results: CardSearchResult[];
  selectedCard: CardSearchResult | null;
  loading: boolean;
  hasSearched: boolean;
  onSearchChange: (patch: Partial<SearchState>) => void;
  onUseCard: (card: CardSearchResult, nextAction?: ActionChoice) => void;
  onCreateNew: () => void;
}

function searchActionLabel(action: ActionChoice) {
  if (action === "create_card") return "Vérifiez d’abord les cartes existantes";
  if (action === "create_fiche") return "Choisissez la carte à enrichir";
  return "Choisissez la carte ou la fiche à corriger";
}

export function CardSearchPanel({
  action,
  search,
  results,
  selectedCard,
  loading,
  hasSearched,
  onSearchChange,
  onUseCard,
  onCreateNew,
}: CardSearchPanelProps) {
  return (
    <div className="grid h-full min-h-0 gap-4 xl:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="flex min-h-0 flex-col rounded-[28px] bg-white p-4 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#3365C8]">Recherche</p>
        <h3 className="mt-3 text-xl font-semibold tracking-[-0.04em] text-[#1F2430]">
          {searchActionLabel(action)}
        </h3>
        <div className="mt-4 space-y-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7B8190]" />
            <Input
              value={search.query}
              onChange={(event) => onSearchChange({ query: event.target.value })}
              placeholder="Titre, nom, mot-clé"
              className="pl-10"
            />
          </div>
          <Input
            value={search.city}
            onChange={(event) => onSearchChange({ city: event.target.value })}
            placeholder="Ville"
          />
          <Input
            value={search.tags}
            onChange={(event) => onSearchChange({ tags: event.target.value })}
            placeholder="Tags"
          />
          <select
            className="h-12 w-full rounded-[16px] border border-black/8 bg-[#F6F6F6] px-4 text-sm text-[#1F2430] outline-none transition focus:border-[#3365C8] focus:ring-4 focus:ring-[#3365C8]/12"
            value={search.category}
            onChange={(event) => onSearchChange({ category: event.target.value })}
          >
            <option value="">Toutes catégories</option>
            {categories.map((entry) => (
              <option key={entry.value} value={entry.value}>
                {entry.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 rounded-[22px] bg-[#F7F7F7] p-4 ring-1 ring-black/6">
          <p className="text-xs font-semibold text-[#1F2430]">Recherche instantanée</p>
          <p className="mt-2 text-sm leading-6 text-[#6B7280]">
            {loading
              ? "Résultats en cours…"
              : hasSearched
                ? `${results.length} résultat${results.length > 1 ? "s" : ""}`
                : "Les résultats apparaissent ici au fur et à mesure."}
          </p>
        </div>
        {action === "create_card" ? (
          <Button className="mt-5" onClick={onCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Créer une nouvelle carte
          </Button>
        ) : null}
      </aside>

      <section className="flex min-h-0 flex-col rounded-[28px] bg-white p-4 shadow-[0_20px_46px_rgba(30,34,40,0.08)] ring-1 ring-black/6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#6B7280]">Résultats</p>
            <h3 className="mt-1 text-lg font-semibold tracking-[-0.03em] text-[#1F2430]">
              Cartes existantes
            </h3>
          </div>
          {loading ? <LoaderCircle className="h-5 w-5 animate-spin text-[#3365C8]" /> : null}
        </div>

        <div className="mt-4 grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2 2xl:grid-cols-3">
          {results.map((card) => {
            const isSelected = selectedCard?.id === card.id;
            return (
              <article
                key={`${card.source}-${card.id}`}
                className={cn(
                  "overflow-hidden rounded-[24px] bg-[#FAFAFA] ring-1 transition",
                  isSelected ? "ring-[#3365C8] shadow-[0_18px_36px_rgba(51,101,200,0.18)]" : "ring-black/6"
                )}
              >
                <div className="relative h-40 bg-[linear-gradient(145deg,#1F2430,#7643A6)]">
                  {card.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={card.image} alt={card.title} className="h-full w-full object-cover" />
                  ) : null}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-4 py-3 text-white">
                    <span className="rounded-full bg-white/16 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em]">
                      {card.category_metadata ?? "carte"}
                    </span>
                  </div>
                </div>
                <div className="space-y-3 p-4">
                  <div>
                    <p className="line-clamp-1 text-lg font-semibold tracking-[-0.03em] text-[#1F2430]">
                      {card.title}
                    </p>
                    <p className="mt-1 line-clamp-2 text-sm leading-6 text-[#6B7280]">
                      {card.short_description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-medium text-[#7643A6]">
                    <MapPin className="h-3.5 w-3.5" />
                    <span>{card.city || "LE_LA"}</span>
                  </div>
                  <div className="grid gap-2">
                    {action === "create_card" ? (
                      <>
                        <Button className="rounded-[16px]" onClick={() => onUseCard(card, "create_fiche")}>
                          Utiliser cette carte
                        </Button>
                        <Button
                          variant="secondary"
                          className="rounded-[16px]"
                          onClick={() => onUseCard(card, "correction")}
                        >
                          Proposer une correction
                        </Button>
                      </>
                    ) : (
                      <Button className="rounded-[16px]" onClick={() => onUseCard(card)}>
                        Utiliser cette carte
                      </Button>
                    )}
                  </div>
                </div>
              </article>
            );
          })}

          {!loading && hasSearched && !results.length ? (
            <div className="col-span-full flex items-center justify-center rounded-[24px] bg-[#F7F7F7] p-10 text-center text-sm leading-6 text-[#6B7280] ring-1 ring-black/6">
              Aucun résultat. Vous pouvez créer une nouvelle carte si le sujet n’existe pas.
            </div>
          ) : null}

          {!hasSearched ? (
            <div className="col-span-full flex items-center justify-center rounded-[24px] bg-[#F7F7F7] p-10 text-center text-sm leading-6 text-[#6B7280] ring-1 ring-black/6">
              Commencez à taper pour lancer la recherche.
            </div>
          ) : null}
        </div>
      </section>
    </div>
  );
}
