"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ContributionForm } from "@/features/contribution/contribution-form";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";

export function WebsiteContributionScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { t } = useI18n();

  useEffect(() => {
    if (!token) {
      router.replace("/website/login");
    }
  }, [router, token]);

  return (
    <div className="mx-auto w-full max-w-[1180px] space-y-8 px-5 py-8 lg:px-8 lg:py-12">
      <section className="rounded-[36px] bg-white px-6 py-6 shadow-card">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-plum">{t("contribute.studio")}</p>
        <h1 className="mt-2 text-[2.2rem] font-semibold tracking-[-0.05em] text-ink">
          {t("contribute.publishTitle")}
        </h1>
      </section>

      <section className="rounded-[40px] bg-transparent">
        <ContributionForm />
      </section>
    </div>
  );
}
