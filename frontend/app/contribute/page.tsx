import { MobileShell } from "@/components/layout/mobile-shell";
import { ContributionForm } from "@/features/contribution/contribution-form";

export default function ContributePage() {
  return (
    <MobileShell activeMode="feed" activeTab="contribute" className="bg-[#F6F1EB] px-3 py-3">
      <ContributionForm />
    </MobileShell>
  );
}
