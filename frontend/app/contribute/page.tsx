import { MobileShell } from "@/components/layout/mobile-shell";
import { ContributionForm } from "@/features/contribution/contribution-form";

export default function ContributePage() {
  return (
    <MobileShell activeMode="feed" activeTab="contribute" className="px-4 py-5">
      <div className="space-y-5">
        <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.22em] text-plum">Studio de contribution</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Publier une nouvelle carte, etape par etape.</h1>
          <p className="mt-3 text-base leading-7 text-graphite">
            Comme dans un flow de post social: choisissez le type de carte, ajoutez un media,
            renseignez la legende et les infos utiles, puis envoyez la proposition en moderation.
          </p>
        </div>
        <div className="rounded-[32px] bg-[#F8F5F1] px-4 py-4 shadow-card">
          <ContributionForm />
        </div>
      </div>
    </MobileShell>
  );
}
