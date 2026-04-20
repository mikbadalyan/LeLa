"use client";

import { MobileShell } from "@/components/layout/mobile-shell";
import { ContributionForm } from "@/features/contribution/contribution-form";
import { useI18n } from "@/features/shell/i18n";

export default function ContributePage() {
  const { t } = useI18n();

  return (
    <MobileShell activeMode="feed" activeTab="contribute" className="bg-[#F6F1EB] px-3 py-3">
      <div className="space-y-3">
        <div className="rounded-[26px] bg-white px-4 py-4 shadow-card">
          <p className="text-[11px] uppercase tracking-[0.22em] text-plum">{t("contribute.studio")}</p>
          <h1 className="mt-2 text-[1.5rem] font-semibold leading-tight tracking-[-0.03em] text-ink">
            {t("contribute.publishTitle")}
          </h1>
          <p className="mt-2 text-sm leading-6 text-graphite">
            {t("contribute.publishDescription")}
          </p>
        </div>

        <ContributionForm />
      </div>
    </MobileShell>
  );
}
