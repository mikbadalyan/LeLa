import { MobileShell } from "@/components/layout/mobile-shell";
import { AuthForms } from "@/features/auth/auth-forms";

export default function LoginPage() {
  return (
    <MobileShell showBottomBar={false} showModeNav={false} className="px-5 py-8">
      <div className="space-y-6 rounded-card bg-elevated px-5 py-6 shadow-card ring-1 ring-borderSoft/10">
        <div>
          <p className="text-sm uppercase tracking-[0.2em] text-blue">LE_LA</p>
          <h1 className="mt-2 text-4xl font-semibold leading-tight text-ink">
            Votre entree dans le graphe editorial.
          </h1>
          <p className="mt-3 text-base leading-7 text-graphite">
            Connectez-vous pour aimer, contribuer et retrouver vos parcours editoriaux.
          </p>
        </div>
        <AuthForms />
      </div>
    </MobileShell>
  );
}
