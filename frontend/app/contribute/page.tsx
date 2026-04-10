import { MobileShell } from "@/components/layout/mobile-shell";
import { ContributionForm } from "@/features/contribution/contribution-form";

export default function ContributePage() {
  return (
    <MobileShell activeMode="feed" activeTab="contribute" className="px-4 py-5">
      <div className="space-y-5">
        <div className="rounded-[32px] bg-white px-5 py-6 shadow-card">
          <p className="text-sm uppercase tracking-[0.22em] text-plum">Contribution</p>
          <h1 className="mt-2 text-3xl font-semibold text-ink">Ajouter une nouvelle histoire.</h1>
          <p className="mt-3 text-base leading-7 text-graphite">
            Magazine, lieu, personne ou evenement: chaque proposition entre dans le graphe avec
            un statut en attente.
          </p>
        </div>
        <div className="rounded-[32px] bg-[#F8F5F1] px-4 py-4 shadow-card">
          <ContributionForm />
        </div>
      </div>
    </MobileShell>
  );
}

