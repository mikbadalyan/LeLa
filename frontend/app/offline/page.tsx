import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-5">
      <div className="max-w-sm rounded-[36px] bg-white px-6 py-8 text-center shadow-card">
        <p className="text-sm uppercase tracking-[0.22em] text-plum">Mode hors ligne</p>
        <h1 className="mt-2 text-3xl font-semibold text-ink">LE_LA garde le fil.</h1>
        <p className="mt-4 text-base leading-7 text-graphite">
          La connexion est momentanement indisponible. Reprenez la navigation des que le reseau
          revient.
        </p>
        <Link href="/feed" className="mt-6 inline-block">
          <Button>Revenir au flux</Button>
        </Link>
      </div>
    </main>
  );
}
