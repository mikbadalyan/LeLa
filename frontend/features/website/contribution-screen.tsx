"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ContributionForm } from "@/features/contribution/contribution-form";
import { useAuthStore } from "@/features/auth/store";
import { useI18n } from "@/features/shell/i18n";

interface WebsiteContributionScreenProps {
  searchParams?: {
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
  };
}

export function WebsiteContributionScreen({ searchParams }: WebsiteContributionScreenProps) {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const { t } = useI18n();
  const initialAction =
    searchParams?.action === "fiche"
      ? "create_fiche"
      : searchParams?.action === "correction"
        ? "correction"
        : undefined;
  const initialReference = searchParams?.sourceId && searchParams.title
    ? {
        id: searchParams.sourceId,
        source: searchParams.source === "card" ? "card" as const : "editorial" as const,
        title: searchParams.title,
        short_description: searchParams.description ?? "",
        city: searchParams.city ?? null,
        image: searchParams.image ?? null,
        category_metadata: searchParams.category ?? null,
      }
    : null;

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
        <ContributionForm
          initialAction={initialAction}
          initialReference={initialReference}
          initialTargetFicheId={searchParams?.targetFicheId ?? null}
          initialCorrectionText={searchParams?.currentText ?? null}
        />
      </section>
    </div>
  );
}
