"use client";

import Link from "next/link";
import { ArrowRight, Smartphone, MonitorSmartphone } from "lucide-react";

import { LogoMark } from "@/components/ui/logo-mark";
import { useI18n } from "@/features/shell/i18n";

export default function HomePage() {
  const { t } = useI18n();

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[radial-gradient(circle_at_top,#f7efe8_0%,#efe3d8_42%,#e7dbd0_100%)] text-ink">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(106,43,232,0.12),transparent_22%),radial-gradient(circle_at_bottom_left,rgba(255,184,79,0.14),transparent_24%)]" />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-[1280px] flex-col px-5 py-8 lg:px-8 lg:py-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LogoMark />
            <div>
              <p className="text-sm font-semibold tracking-[0.18em] text-plum">LE_LA</p>
              <p className="text-xs text-graphite/70">{t("website.heroKicker")}</p>
            </div>
          </div>
          <Link
            href="/login"
            className="rounded-full border border-borderSoft bg-white/88 px-4 py-2 text-sm font-medium text-ink backdrop-blur-md"
          >
            {t("website.login")}
          </Link>
        </div>

        <div className="grid flex-1 items-center gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.26em] text-plum">
              {t("website.heroKicker")}
            </p>
            <h1 className="max-w-[11ch] text-[3rem] font-semibold leading-[0.9] tracking-[-0.06em] text-ink sm:text-[4.25rem]">
              {t("website.selectorTitle")}
            </h1>
            <p className="max-w-2xl text-base leading-8 text-graphite/82">
              {t("website.selectorDescription")}
            </p>
          </div>

          <div className="grid gap-5 xl:grid-cols-2">
            <Link
              href="/website"
              className="group overflow-hidden rounded-[36px] bg-white p-6 shadow-[0_28px_80px_rgba(30,22,18,0.1)] ring-1 ring-black/5 transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F4ECFF] text-plum">
                  <MonitorSmartphone className="h-7 w-7" />
                </span>
                <ArrowRight className="h-5 w-5 text-graphite/50 transition group-hover:translate-x-1" />
              </div>
              <h2 className="mt-8 text-[2rem] font-semibold tracking-[-0.05em] text-ink">
                {t("website.selectorWebsite")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-graphite/80">
                {t("website.selectorWebsiteDescription")}
              </p>
            </Link>

            <Link
              href="/feed"
              className="group overflow-hidden rounded-[36px] bg-[linear-gradient(155deg,#231E2C_0%,#6A2BE8_100%)] p-6 text-white shadow-[0_28px_80px_rgba(30,22,18,0.16)] transition hover:-translate-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-white/14 text-white">
                  <Smartphone className="h-7 w-7" />
                </span>
                <ArrowRight className="h-5 w-5 text-white/70 transition group-hover:translate-x-1" />
              </div>
              <h2 className="mt-8 text-[2rem] font-semibold tracking-[-0.05em]">
                {t("website.selectorApp")}
              </h2>
              <p className="mt-3 text-sm leading-7 text-white/80">
                {t("website.selectorAppDescription")}
              </p>
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
