"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { ContributionForm } from "@/features/contribution/contribution-form";
import { useAuthStore } from "@/features/auth/store";

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
    <div className="mx-auto w-full max-w-[1440px] px-4 py-5 lg:px-8 lg:py-8">
      <ContributionForm
        initialAction={initialAction}
        initialReference={initialReference}
        initialTargetFicheId={searchParams?.targetFicheId ?? null}
        initialCorrectionText={searchParams?.currentText ?? null}
      />
    </div>
  );
}
