import { MobileShell } from "@/components/layout/mobile-shell";
import { ContributionForm } from "@/features/contribution/contribution-form";

export default function ContributePage() {
  return (
    <MobileShell activeMode="feed" activeTab="contribute" className="bg-background px-3 py-3">
      <ContributionForm />
    </MobileShell>
  );
}
