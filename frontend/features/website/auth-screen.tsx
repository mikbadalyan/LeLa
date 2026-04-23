"use client";

import { AuthForms } from "@/features/auth/auth-forms";
import { useI18n } from "@/features/shell/i18n";

export function WebsiteAuthScreen() {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-[1380px] items-center px-5 py-10 lg:px-8">
      <div className="grid w-full gap-6 lg:grid-cols-[0.95fr_0.9fr]">
        <div className="overflow-hidden rounded-card bg-[linear-gradient(150deg,#201B27_0%,#7643A6_58%,#3365C8_100%)] px-8 py-10 text-white shadow-card">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-white/70">LE_LA</p>
          <h1 className="mt-4 max-w-[10ch] text-[3rem] font-semibold leading-[0.92] tracking-[-0.05em]">
            {t("website.heroTitle")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-8 text-white/80">
            Connectez-vous ou creez un compte sans quitter la version website.
          </p>
        </div>

        <div className="rounded-card bg-elevated px-6 py-6 shadow-card ring-1 ring-borderSoft/10 sm:px-8 sm:py-8">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue">
            {t("website.login")}
          </p>
          <h2 className="mt-2 text-[2rem] font-semibold tracking-[-0.04em] text-ink">
            Votre entree dans LE_LA
          </h2>
          <p className="mt-3 text-sm leading-7 text-graphite/80">
            Aimez, partagez, contribuez et retrouvez votre compte depuis l&apos;experience website.
          </p>

          <div className="mt-8">
            <AuthForms redirectTo="/website/profile" />
          </div>
        </div>
      </div>
    </div>
  );
}
