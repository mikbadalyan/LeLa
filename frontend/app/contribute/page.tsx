import { MobileShell } from "@/components/layout/mobile-shell";
import { ContributionForm } from "@/features/contribution/contribution-form";

export default async function ContributePage({
  searchParams,
}: {
  searchParams: Promise<{
    action?: string;
    source?: string;
    sourceId?: string;
    title?: string;
    description?: string;
    city?: string;
    image?: string;
    category?: string;
    targetFicheId?: string;
    currentText?: string;
  }>;
}) {
  const params = await searchParams;
  const initialAction =
    params.action === "fiche" ? "create_fiche" : params.action === "correction" ? "correction" : undefined;
  const initialReference = params.sourceId && params.title
    ? {
        id: params.sourceId,
        source: params.source === "card" ? "card" as const : "editorial" as const,
        title: params.title,
        short_description: params.description ?? "",
        city: params.city ?? null,
        image: params.image ?? null,
        category_metadata: params.category ?? null,
      }
    : null;

  return (
    <MobileShell activeMode="feed" activeTab="contribute" className="bg-background px-3 py-3">
      <ContributionForm
        initialAction={initialAction}
        initialReference={initialReference}
        initialTargetFicheId={params.targetFicheId ?? null}
        initialCorrectionText={params.currentText ?? null}
      />
    </MobileShell>
  );
}
