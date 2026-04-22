"use client";

import { type ReactNode, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Bell,
  CircleHelp,
  Globe2,
  Laptop2,
  LockKeyhole,
  LogIn,
  Mail,
  MonitorSmartphone,
  MoonStar,
  Palette,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  SunMedium,
  UserRound,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { MobileShell } from "@/components/layout/mobile-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/features/auth/store";
import { languageOptions } from "@/features/shell/i18n";
import { shellDefaults, useShellStore } from "@/features/shell/store";
import {
  changePassword,
  getCurrentSettings,
  updateCurrentSettings,
} from "@/lib/api/endpoints";
import type {
  PasswordChangePayload,
  UserSettings,
  UserSettingsUpdatePayload,
} from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

export type SettingsTab =
  | "appearance"
  | "privacy"
  | "security"
  | "notifications"
  | "language"
  | "help"
  | "about";

type SettingsVariant = "pwa" | "website";

const tabs: Array<{
  key: SettingsTab;
  label: string;
  icon: typeof Sparkles;
}> = [
  { key: "appearance", label: "Apparence", icon: Palette },
  { key: "privacy", label: "Confidentialite", icon: UserRound },
  { key: "security", label: "Securite", icon: ShieldCheck },
  { key: "notifications", label: "Notifications", icon: Bell },
  { key: "language", label: "Langue", icon: Globe2 },
  { key: "help", label: "Aide", icon: CircleHelp },
  { key: "about", label: "A propos", icon: MonitorSmartphone },
];

const localeByLanguage = {
  fr: "fr-FR",
  hy: "hy-AM",
  en: "en-US",
  de: "de-DE",
} as const;

const appearanceSettingKeys = new Set<keyof UserSettings>([
  "interface_language",
  "theme_preference",
  "compact_mode",
  "autoplay_previews",
  "reduce_motion",
  "large_text",
  "high_contrast",
  "sound_effects",
  "data_saver",
]);

function buildLocalSettings(input: {
  language: UserSettings["interface_language"];
  themeMode: UserSettings["theme_preference"];
  compactMode: boolean;
  autoplayPreviews: boolean;
  reduceMotion: boolean;
  largeText: boolean;
  highContrast: boolean;
  soundEffects: boolean;
  dataSaver: boolean;
}): UserSettings {
  return {
    interface_language: input.language,
    theme_preference: input.themeMode,
    compact_mode: input.compactMode,
    autoplay_previews: input.autoplayPreviews,
    reduce_motion: input.reduceMotion,
    large_text: input.largeText,
    high_contrast: input.highContrast,
    sound_effects: input.soundEffects,
    data_saver: input.dataSaver,
    profile_visibility: "public",
    show_email: false,
    show_city: true,
    show_activity_status: true,
    searchable_by_email: true,
    allow_friend_requests: true,
    allow_direct_messages: "friends",
    allow_tagging: true,
    profile_indexing_enabled: true,
    two_factor_enabled: false,
    login_alerts: true,
    security_reminders: true,
    marketing_emails: false,
    product_updates: true,
    weekly_digest: false,
    message_notifications: true,
    friend_request_notifications: true,
    moderation_notifications: true,
    last_password_changed_at: null,
  };
}

function toSettingsPayload(settings: UserSettings): UserSettingsUpdatePayload {
  const { last_password_changed_at: _ignored, ...payload } = settings;
  return payload;
}

function formatLastPasswordChange(value: string | null | undefined, language: UserSettings["interface_language"]) {
  if (!value) {
    return "Jamais modifie";
  }

  try {
    return new Intl.DateTimeFormat(localeByLanguage[language], {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function SettingsCard({
  title,
  hint,
  children,
  className,
}: {
  title: string;
  hint?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-[28px] bg-white px-4 py-4 shadow-card ring-1 ring-borderSoft/60", className)}>
      <div className="mb-3">
        <p className="text-sm font-semibold text-ink">{title}</p>
        {hint ? <p className="mt-1 text-xs leading-5 text-graphite/72">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function SettingsToggle({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (next: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex w-full items-center justify-between gap-4 rounded-[22px] bg-mist px-4 py-4 text-left ring-1 ring-borderSoft/70 transition hover:bg-paper"
    >
      <div>
        <p className="text-sm font-semibold text-ink">{label}</p>
        <p className="mt-1 text-xs leading-5 text-graphite/72">{hint}</p>
      </div>
      <span
        className={cn(
          "relative inline-flex h-7 w-12 shrink-0 rounded-full transition",
          checked ? "bg-plum" : "bg-[#D9D5CF]"
        )}
      >
        <span
          className={cn(
            "absolute top-1 h-5 w-5 rounded-full bg-white shadow-sm transition",
            checked ? "left-6" : "left-1"
          )}
        />
      </span>
    </button>
  );
}

function ChoicePill({
  active,
  onClick,
  children,
  icon: Icon,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon?: typeof SunMedium;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center justify-center gap-2 rounded-[20px] px-4 py-3 text-sm font-semibold transition",
        active ? "bg-plum text-white shadow-float" : "bg-mist text-ink ring-1 ring-borderSoft"
      )}
    >
      {Icon ? <Icon className="h-4 w-4" /> : null}
      <span>{children}</span>
    </button>
  );
}

function AccountRequired({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <SettingsCard title={title} hint={description}>
      <div className="rounded-[22px] bg-[#F8F0FF] px-4 py-4 text-sm text-plum">
        <p className="font-semibold">Cette section devient complete apres connexion.</p>
        <p className="mt-1 text-plum/80">Les reglages prives, de securite et les notifications sont lies au compte.</p>
        <Link
          href={href}
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-plum px-4 py-2 text-white shadow-float"
        >
          <LogIn className="h-4 w-4" />
          Se connecter
        </Link>
      </div>
    </SettingsCard>
  );
}

export function SettingsScreen({
  initialTab = "appearance",
  variant = "pwa",
}: {
  initialTab?: SettingsTab | string;
  variant?: SettingsVariant;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const city = useShellStore((state) => state.city);
  const selectedDate = useShellStore((state) => state.selectedDate);
  const language = useShellStore((state) => state.language);
  const themeMode = useShellStore((state) => state.themeMode);
  const compactMode = useShellStore((state) => state.compactMode);
  const autoplayPreviews = useShellStore((state) => state.autoplayPreviews);
  const reduceMotion = useShellStore((state) => state.reduceMotion);
  const largeText = useShellStore((state) => state.largeText);
  const highContrast = useShellStore((state) => state.highContrast);
  const soundEffects = useShellStore((state) => state.soundEffects);
  const dataSaver = useShellStore((state) => state.dataSaver);
  const setCity = useShellStore((state) => state.setCity);
  const setSelectedDate = useShellStore((state) => state.setSelectedDate);
  const setLanguage = useShellStore((state) => state.setLanguage);
  const setThemeMode = useShellStore((state) => state.setThemeMode);
  const setCompactMode = useShellStore((state) => state.setCompactMode);
  const setAutoplayPreviews = useShellStore((state) => state.setAutoplayPreviews);
  const setReduceMotion = useShellStore((state) => state.setReduceMotion);
  const setLargeText = useShellStore((state) => state.setLargeText);
  const setHighContrast = useShellStore((state) => state.setHighContrast);
  const setSoundEffects = useShellStore((state) => state.setSoundEffects);
  const setDataSaver = useShellStore((state) => state.setDataSaver);
  const resetFilters = useShellStore((state) => state.resetFilters);

  const basePath = variant === "website" ? "/website/settings" : "/settings";
  const loginHref = variant === "website" ? "/website/login" : "/login";
  const accountHref = variant === "website" ? "/website/profile" : "/profile";
  const chatHref = variant === "website" ? "/website/conversations" : "/feed?focus=chat";
  const contributeHref = variant === "website" ? "/website/contribute" : "/contribute";
  const mapHref = variant === "website" ? "/website/map" : "/map";
  const oppositeExperienceHref = variant === "website" ? "/feed" : "/website";

  const activeTab = useMemo<SettingsTab>(() => {
    return tabs.some((tab) => tab.key === initialTab)
      ? (initialTab as SettingsTab)
      : "appearance";
  }, [initialTab]);

  const [draftSettings, setDraftSettings] = useState<UserSettings>(() =>
    buildLocalSettings({
      language,
      themeMode,
      compactMode,
      autoplayPreviews,
      reduceMotion,
      largeText,
      highContrast,
      soundEffects,
      dataSaver,
    })
  );
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);

  const settingsQuery = useQuery({
    queryKey: ["auth-settings", token],
    queryFn: () => getCurrentSettings(token!),
    enabled: Boolean(token),
  });

  useEffect(() => {
    const incoming = user?.settings ?? settingsQuery.data;
    if (!incoming) {
      return;
    }

    setDraftSettings((current) => ({
      ...current,
      ...incoming,
    }));
  }, [settingsQuery.data, user?.settings]);

  const applyAppearanceLocally = (settings: UserSettings) => {
    setLanguage(settings.interface_language);
    setThemeMode(settings.theme_preference);
    setCompactMode(settings.compact_mode);
    setAutoplayPreviews(settings.autoplay_previews);
    setReduceMotion(settings.reduce_motion);
    setLargeText(settings.large_text);
    setHighContrast(settings.high_contrast);
    setSoundEffects(settings.sound_effects);
    setDataSaver(settings.data_saver);
  };

  const applyAppearancePatchLocally = (patch: Partial<UserSettingsUpdatePayload>) => {
    if (patch.interface_language) {
      setLanguage(patch.interface_language);
    }
    if (patch.theme_preference) {
      setThemeMode(patch.theme_preference);
    }
    if (typeof patch.compact_mode === "boolean") {
      setCompactMode(patch.compact_mode);
    }
    if (typeof patch.autoplay_previews === "boolean") {
      setAutoplayPreviews(patch.autoplay_previews);
    }
    if (typeof patch.reduce_motion === "boolean") {
      setReduceMotion(patch.reduce_motion);
    }
    if (typeof patch.large_text === "boolean") {
      setLargeText(patch.large_text);
    }
    if (typeof patch.high_contrast === "boolean") {
      setHighContrast(patch.high_contrast);
    }
    if (typeof patch.sound_effects === "boolean") {
      setSoundEffects(patch.sound_effects);
    }
    if (typeof patch.data_saver === "boolean") {
      setDataSaver(patch.data_saver);
    }
  };

  const applySettingsSuccess = (updatedSettings: UserSettings, message = "Parametres enregistres.") => {
    queryClient.setQueryData(["auth-settings", token], updatedSettings);
    applyAppearanceLocally(updatedSettings);
    if (user) {
      setUser({ ...user, settings: updatedSettings });
    }
    setDraftSettings((current) => ({ ...current, ...updatedSettings }));
    setStatusMessage(message);
  };

  const updateSettingsMutation = useMutation({
    mutationFn: (payload: UserSettingsUpdatePayload) => updateCurrentSettings(payload, token!),
  });

  const changePasswordMutation = useMutation({
    mutationFn: (payload: PasswordChangePayload) => changePassword(payload, token!),
    onSuccess: (response) => {
      setPasswordMessage(response.message);
      setPasswordForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setDraftSettings((current) => ({
        ...current,
        last_password_changed_at: response.last_password_changed_at,
      }));
      if (user?.settings) {
        setUser({
          ...user,
          settings: {
            ...user.settings,
            last_password_changed_at: response.last_password_changed_at,
          },
        });
      }
    },
    onError: (error: Error) => setPasswordMessage(error.message),
  });

  const persistSettingsPatch = (
    patch: UserSettingsUpdatePayload,
    {
      successMessage = "Parametres enregistres.",
      localOnlyMessage = "Preferences appliquees sur cet appareil.",
    }: {
      successMessage?: string;
      localOnlyMessage?: string;
    } = {}
  ) => {
    setStatusMessage(null);
    applyAppearancePatchLocally(patch);

    if (!token) {
      setStatusMessage(localOnlyMessage);
      return;
    }

    updateSettingsMutation.mutate(patch, {
      onSuccess: (updatedSettings) => applySettingsSuccess(updatedSettings, successMessage),
      onError: (error: Error) => setStatusMessage(error.message),
    });
  };

  const saveSettings = () => {
    persistSettingsPatch(toSettingsPayload(draftSettings), {
      successMessage: "Parametres enregistres.",
      localOnlyMessage: "Preferences appliquees sur cet appareil.",
    });
  };

  const resetAppearance = () => {
    const resetPatch: UserSettingsUpdatePayload = {
      interface_language: shellDefaults.language,
      theme_preference: shellDefaults.themeMode,
      compact_mode: shellDefaults.compactMode,
      autoplay_previews: shellDefaults.autoplayPreviews,
      reduce_motion: shellDefaults.reduceMotion,
      large_text: shellDefaults.largeText,
      high_contrast: shellDefaults.highContrast,
      sound_effects: shellDefaults.soundEffects,
      data_saver: shellDefaults.dataSaver,
    };

    setDraftSettings((current) => ({
      ...current,
      ...resetPatch,
    }));

    persistSettingsPatch(resetPatch, {
      successMessage: "Apparence reinitialisee.",
      localOnlyMessage: "Apparence reinitialisee sur cet appareil.",
    });
  };

  const updateDraft = <K extends keyof UserSettings>(
    key: K,
    value: UserSettings[K],
    options?: { persist?: boolean }
  ) => {
    setDraftSettings((current) => ({
      ...current,
      [key]: value,
    }));

    if (!options?.persist) {
      return;
    }

    const patch = { [key]: value } as UserSettingsUpdatePayload;
    if (appearanceSettingKeys.has(key)) {
      applyAppearancePatchLocally(patch);
    }
    persistSettingsPatch(patch, {
      successMessage: "Reglage mis a jour.",
      localOnlyMessage: "Reglage applique sur cet appareil.",
    });
  };

  const saveButtonLabel = token ? "Enregistrer" : "Appliquer";
  const loading = updateSettingsMutation.isPending || settingsQuery.isLoading;
  const passwordChangedLabel = formatLastPasswordChange(
    draftSettings.last_password_changed_at,
    draftSettings.interface_language
  );

  const content = (
    <div className={cn("space-y-4", variant === "website" ? "mx-auto w-full max-w-[1240px] px-5 py-8 lg:px-8 lg:py-10" : "px-3 py-3")}>
      <section
        className={cn(
          "overflow-hidden rounded-[32px] bg-white shadow-card ring-1 ring-borderSoft/60",
          variant === "website" ? "px-6 py-6 lg:px-8 lg:py-7" : "px-4 py-4"
        )}
      >
        <div className={cn("flex gap-4", variant === "website" ? "items-center justify-between" : "items-start")}>
          <div className="flex items-start gap-3">
            <div className="rounded-[20px] bg-[#F8F0FF] p-3 text-plum">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-plum">Parametres</p>
              <h1 className="mt-2 text-[1.45rem] font-semibold tracking-[-0.04em] text-ink">
                Reglages du compte et de l&apos;experience
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-graphite/74">
                Apparence, confidentialite, securite, notifications, langue et raccourcis utiles.
              </p>
            </div>
          </div>

          {variant === "website" ? (
            <div className="hidden items-center gap-2 lg:flex">
              <Link href={accountHref} className="rounded-full bg-mist px-4 py-2 text-sm font-semibold text-ink">
                Compte
              </Link>
              <Link
                href={oppositeExperienceHref}
                className="rounded-full bg-[#F8F0FF] px-4 py-2 text-sm font-semibold text-plum"
              >
                {variant === "website" ? "Ouvrir la PWA" : "Ouvrir le website"}
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <section className="flex gap-2 overflow-x-auto pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = tab.key === activeTab;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => router.replace(`${basePath}?tab=${tab.key}`)}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-full px-4 py-3 text-sm font-semibold transition",
                active ? "bg-plum text-white shadow-float" : "bg-white text-ink shadow-card ring-1 ring-borderSoft/60"
              )}
            >
              <Icon className="h-4 w-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </section>

      {statusMessage ? (
        <div className="rounded-[24px] bg-[#F8F0FF] px-4 py-3 text-sm text-plum">{statusMessage}</div>
      ) : null}

      {activeTab === "appearance" ? (
        <div className={cn("grid gap-4", variant === "website" ? "xl:grid-cols-[1.05fr_0.95fr]" : "")}>
          <div className="space-y-4">
            <SettingsCard title="Theme" hint="Choisissez l'ambiance generale de LE_LA.">
              <div className="grid grid-cols-3 gap-2">
                <ChoicePill
                  active={draftSettings.theme_preference === "system"}
                    onClick={() => updateDraft("theme_preference", "system", { persist: true })}
                  icon={Laptop2}
                >
                  Systeme
                </ChoicePill>
                <ChoicePill
                  active={draftSettings.theme_preference === "light"}
                    onClick={() => updateDraft("theme_preference", "light", { persist: true })}
                  icon={SunMedium}
                >
                  Clair
                </ChoicePill>
                <ChoicePill
                  active={draftSettings.theme_preference === "dark"}
                    onClick={() => updateDraft("theme_preference", "dark", { persist: true })}
                  icon={MoonStar}
                >
                  Sombre
                </ChoicePill>
              </div>
            </SettingsCard>

            <SettingsCard title="Interface" hint="Ajustez le confort visuel et le rythme de navigation.">
              <div className="space-y-3">
                <SettingsToggle
                  label="Mode compact"
                  hint="Resserre les espacements dans le feed et les ecrans."
                  checked={draftSettings.compact_mode}
                  onChange={(value) => updateDraft("compact_mode", value, { persist: true })}
                />
                <SettingsToggle
                  label="Grande taille de texte"
                  hint="Rend les titres, libelles et messages plus lisibles."
                  checked={draftSettings.large_text}
                  onChange={(value) => updateDraft("large_text", value, { persist: true })}
                />
                <SettingsToggle
                  label="Contraste renforce"
                  hint="Accentue les contrastes pour une meilleure lisibilite."
                  checked={draftSettings.high_contrast}
                  onChange={(value) => updateDraft("high_contrast", value, { persist: true })}
                />
                <SettingsToggle
                  label="Mouvements reduits"
                  hint="Calme les animations et les transitions."
                  checked={draftSettings.reduce_motion}
                  onChange={(value) => updateDraft("reduce_motion", value, { persist: true })}
                />
              </div>
            </SettingsCard>
          </div>

          <div className="space-y-4">
            <SettingsCard title="Media" hint="Controlez les apercus et la consommation de donnees.">
              <div className="space-y-3">
                <SettingsToggle
                  label="Lecture auto des apercus"
                  hint="Lance automatiquement les capsules video dans le feed."
                  checked={draftSettings.autoplay_previews}
                  onChange={(value) => updateDraft("autoplay_previews", value, { persist: true })}
                />
                <SettingsToggle
                  label="Effets sonores"
                  hint="Conserve les micro-retours audio de l'interface."
                  checked={draftSettings.sound_effects}
                  onChange={(value) => updateDraft("sound_effects", value, { persist: true })}
                />
                <SettingsToggle
                  label="Economiseur de donnees"
                  hint="Favorise des chargements plus legers."
                  checked={draftSettings.data_saver}
                  onChange={(value) => updateDraft("data_saver", value, { persist: true })}
                />
              </div>
            </SettingsCard>

            <SettingsCard title="Contexte" hint="Ces valeurs pilotent la ville et la date utilisees dans l'exploration.">
              <div className="space-y-3">
                <Input value={city} onChange={(event) => setCity(event.target.value)} placeholder="Ville" />
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                />
                <div className="flex gap-2">
                  <Button variant="secondary" fullWidth onClick={resetFilters}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Reinitialiser le contexte
                  </Button>
                  <Button fullWidth onClick={saveSettings} disabled={loading}>
                    <Save className="mr-2 h-4 w-4" />
                    {saveButtonLabel}
                  </Button>
                </div>
              </div>
            </SettingsCard>

            <Button variant="ghost" className="w-full justify-center text-plum" onClick={resetAppearance}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Revenir aux reglages visuels par defaut
            </Button>
          </div>
        </div>
      ) : null}

      {activeTab === "privacy" ? (
        token ? (
          <div className={cn("grid gap-4", variant === "website" ? "xl:grid-cols-[1.02fr_0.98fr]" : "")}>
            <div className="space-y-4">
              <SettingsCard title="Visibilite du profil" hint="Controlez ce que les autres voient quand ils visitent votre compte.">
                <div className="grid grid-cols-2 gap-2">
                  <ChoicePill
                    active={draftSettings.profile_visibility === "public"}
                    onClick={() => updateDraft("profile_visibility", "public", { persist: true })}
                  >
                    Public
                  </ChoicePill>
                  <ChoicePill
                    active={draftSettings.profile_visibility === "private"}
                    onClick={() => updateDraft("profile_visibility", "private", { persist: true })}
                  >
                    Prive
                  </ChoicePill>
                </div>
                <div className="mt-3 space-y-3">
                  <SettingsToggle
                    label="Afficher l'email"
                    hint="Rend l'email visible sur votre profil."
                    checked={draftSettings.show_email}
                    onChange={(value) => updateDraft("show_email", value, { persist: true })}
                  />
                  <SettingsToggle
                    label="Afficher la ville"
                    hint="Conserve ou masque votre ville de reference."
                    checked={draftSettings.show_city}
                    onChange={(value) => updateDraft("show_city", value, { persist: true })}
                  />
                  <SettingsToggle
                    label="Afficher votre activite"
                    hint="Montre si vous etes actif dans l'app."
                    checked={draftSettings.show_activity_status}
                    onChange={(value) => updateDraft("show_activity_status", value, { persist: true })}
                  />
                </div>
              </SettingsCard>

              <SettingsCard title="Decouverte" hint="Gerez la facon dont votre compte apparait dans la recherche.">
                <div className="space-y-3">
                  <SettingsToggle
                    label="Recherche par email"
                    hint="Permet de vous retrouver avec votre adresse email."
                    checked={draftSettings.searchable_by_email}
                    onChange={(value) => updateDraft("searchable_by_email", value, { persist: true })}
                  />
                  <SettingsToggle
                    label="Profil indexe"
                    hint="Autorise votre compte a apparaitre dans les suggestions."
                    checked={draftSettings.profile_indexing_enabled}
                    onChange={(value) => updateDraft("profile_indexing_enabled", value, { persist: true })}
                  />
                  <SettingsToggle
                    label="Autoriser le tag"
                    hint="Permet a d'autres comptes de vous associer a une capsule."
                    checked={draftSettings.allow_tagging}
                    onChange={(value) => updateDraft("allow_tagging", value, { persist: true })}
                  />
                </div>
              </SettingsCard>
            </div>

            <div className="space-y-4">
              <SettingsCard title="Interactions" hint="Choisissez qui peut entrer en relation avec vous.">
                <div className="space-y-3">
                  <SettingsToggle
                    label="Accepter les demandes d'amis"
                    hint="Si desactive, personne ne pourra vous ajouter."
                    checked={draftSettings.allow_friend_requests}
                    onChange={(value) => updateDraft("allow_friend_requests", value, { persist: true })}
                  />
                  <div className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                    <p className="text-sm font-semibold text-ink">Messages directs</p>
                    <p className="mt-1 text-xs leading-5 text-graphite/72">
                      Choisissez qui peut ouvrir une conversation avec vous.
                    </p>
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <ChoicePill
                        active={draftSettings.allow_direct_messages === "everyone"}
                        onClick={() => updateDraft("allow_direct_messages", "everyone", { persist: true })}
                      >
                        Tous
                      </ChoicePill>
                      <ChoicePill
                        active={draftSettings.allow_direct_messages === "friends"}
                        onClick={() => updateDraft("allow_direct_messages", "friends", { persist: true })}
                      >
                        Amis
                      </ChoicePill>
                      <ChoicePill
                        active={draftSettings.allow_direct_messages === "none"}
                        onClick={() => updateDraft("allow_direct_messages", "none", { persist: true })}
                      >
                        Personne
                      </ChoicePill>
                    </div>
                  </div>
                </div>
              </SettingsCard>

              <Button fullWidth onClick={saveSettings} disabled={loading}>
                <Save className="mr-2 h-4 w-4" />
                {saveButtonLabel}
              </Button>
            </div>
          </div>
        ) : (
          <AccountRequired
            href={loginHref}
            title="Confidentialite du compte"
            description="Connectez-vous pour gerer la visibilite, les demandes et les messages directs."
          />
        )
      ) : null}

      {activeTab === "security" ? (
        token ? (
          <div className={cn("grid gap-4", variant === "website" ? "xl:grid-cols-[0.98fr_1.02fr]" : "")}>
            <div className="space-y-4">
              <SettingsCard title="Mot de passe" hint="Mettez a jour votre mot de passe et gardez votre compte securise.">
                <form
                  className="space-y-3"
                  onSubmit={(event) => {
                    event.preventDefault();
                    setPasswordMessage(null);

                    if (passwordForm.new_password !== passwordForm.confirm_password) {
                      setPasswordMessage("La confirmation du mot de passe ne correspond pas.");
                      return;
                    }

                    changePasswordMutation.mutate({
                      current_password: passwordForm.current_password,
                      new_password: passwordForm.new_password,
                    });
                  }}
                >
                  <Input
                    type="password"
                    value={passwordForm.current_password}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        current_password: event.target.value,
                      }))
                    }
                    placeholder="Mot de passe actuel"
                  />
                  <Input
                    type="password"
                    value={passwordForm.new_password}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        new_password: event.target.value,
                      }))
                    }
                    placeholder="Nouveau mot de passe"
                  />
                  <Input
                    type="password"
                    value={passwordForm.confirm_password}
                    onChange={(event) =>
                      setPasswordForm((current) => ({
                        ...current,
                        confirm_password: event.target.value,
                      }))
                    }
                    placeholder="Confirmer le nouveau mot de passe"
                  />
                  <Button type="submit" fullWidth disabled={changePasswordMutation.isPending}>
                    <LockKeyhole className="mr-2 h-4 w-4" />
                    Mettre a jour
                  </Button>
                </form>
                {passwordMessage ? (
                  <div className="mt-3 rounded-[20px] bg-[#F8F0FF] px-4 py-3 text-sm text-plum">
                    {passwordMessage}
                  </div>
                ) : null}
              </SettingsCard>

              <SettingsCard title="Derniere modification" hint="Historique recent du mot de passe.">
                <div className="rounded-[22px] bg-mist px-4 py-4 text-sm text-ink ring-1 ring-borderSoft/70">
                  {passwordChangedLabel}
                </div>
              </SettingsCard>
            </div>

            <div className="space-y-4">
              <SettingsCard title="Protection du compte" hint="Renforcez le suivi de connexion et les rappels de securite.">
                <div className="space-y-3">
                  <SettingsToggle
                    label="Double verification"
                    hint="Mode beta pour renforcer la connexion au compte."
                    checked={draftSettings.two_factor_enabled}
                    onChange={(value) => updateDraft("two_factor_enabled", value, { persist: true })}
                  />
                  <SettingsToggle
                    label="Alertes de connexion"
                    hint="Recevez une alerte quand une nouvelle connexion est detectee."
                    checked={draftSettings.login_alerts}
                    onChange={(value) => updateDraft("login_alerts", value, { persist: true })}
                  />
                  <SettingsToggle
                    label="Rappels de securite"
                    hint="Affiche des recommandations de protection dans l'app."
                    checked={draftSettings.security_reminders}
                    onChange={(value) => updateDraft("security_reminders", value, { persist: true })}
                  />
                </div>
              </SettingsCard>

              <Button fullWidth onClick={saveSettings} disabled={loading}>
                <ShieldCheck className="mr-2 h-4 w-4" />
                {saveButtonLabel}
              </Button>
            </div>
          </div>
        ) : (
          <AccountRequired
            href={loginHref}
            title="Securite"
            description="Connectez-vous pour gerer le mot de passe, les alertes et la protection du compte."
          />
        )
      ) : null}

      {activeTab === "notifications" ? (
        token ? (
          <div className={cn("grid gap-4", variant === "website" ? "xl:grid-cols-[1fr_1fr]" : "")}>
            <SettingsCard title="Activite" hint="Choisissez les notifications utiles au quotidien.">
              <div className="space-y-3">
                <SettingsToggle
                  label="Messages"
                  hint="Etre notifie des nouveaux messages."
                  checked={draftSettings.message_notifications}
                    onChange={(value) => updateDraft("message_notifications", value, { persist: true })}
                />
                <SettingsToggle
                  label="Demandes d'amis"
                  hint="Recevoir une alerte quand quelqu'un vous ajoute."
                  checked={draftSettings.friend_request_notifications}
                    onChange={(value) => updateDraft("friend_request_notifications", value, { persist: true })}
                />
                <SettingsToggle
                  label="Moderation"
                  hint="Suivre l'etat des contributions en attente ou validees."
                  checked={draftSettings.moderation_notifications}
                    onChange={(value) => updateDraft("moderation_notifications", value, { persist: true })}
                />
              </div>
            </SettingsCard>

            <div className="space-y-4">
              <SettingsCard title="Emails et recaps" hint="Controlez les envois informationnels de LE_LA.">
                <div className="space-y-3">
                  <SettingsToggle
                    label="Mises a jour produit"
                    hint="Recevoir les nouveautes fonctionnelles."
                    checked={draftSettings.product_updates}
                    onChange={(value) => updateDraft("product_updates", value, { persist: true })}
                  />
                  <SettingsToggle
                    label="Digest hebdomadaire"
                    hint="Un resume editorial sur la semaine LE_LA."
                    checked={draftSettings.weekly_digest}
                    onChange={(value) => updateDraft("weekly_digest", value, { persist: true })}
                  />
                  <SettingsToggle
                    label="Emails marketing"
                    hint="Recevoir les annonces promotionnelles et partenariats."
                    checked={draftSettings.marketing_emails}
                    onChange={(value) => updateDraft("marketing_emails", value, { persist: true })}
                  />
                </div>
              </SettingsCard>

              <Button fullWidth onClick={saveSettings} disabled={loading}>
                <Bell className="mr-2 h-4 w-4" />
                {saveButtonLabel}
              </Button>
            </div>
          </div>
        ) : (
          <AccountRequired
            href={loginHref}
            title="Notifications"
            description="Connectez-vous pour enregistrer les preferences de messages, moderation et emails."
          />
        )
      ) : null}

      {activeTab === "language" ? (
        <div className={cn("grid gap-4", variant === "website" ? "xl:grid-cols-[1fr_1fr]" : "")}>
          <SettingsCard title="Langue de l'interface" hint="La meme langue sera utilisee partout dans LE_LA.">
            <div className="grid grid-cols-2 gap-2">
              {languageOptions.map((option) => (
                <button
                  key={option.code}
                  type="button"
                  onClick={() => updateDraft("interface_language", option.code, { persist: true })}
                  className={cn(
                    "flex items-center gap-2 rounded-[20px] px-4 py-4 text-sm font-semibold transition",
                    draftSettings.interface_language === option.code
                      ? "bg-plum text-white shadow-float"
                      : "bg-mist text-ink ring-1 ring-borderSoft"
                  )}
                >
                  <span className="text-base">{option.flag}</span>
                  <span>{option.label}</span>
                </button>
              ))}
            </div>
          </SettingsCard>

          <div className="space-y-4">
            <SettingsCard title="Rendu actuel" hint="Appliquez la langue choisie et retrouvez vos contextes.">
              <div className="space-y-3 text-sm text-graphite">
                <div className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                  <p className="font-semibold text-ink">Ville</p>
                  <p className="mt-1">{city}</p>
                </div>
                <div className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                  <p className="font-semibold text-ink">Date</p>
                  <p className="mt-1">{selectedDate}</p>
                </div>
              </div>
            </SettingsCard>

            <Button fullWidth onClick={saveSettings} disabled={loading}>
              <Globe2 className="mr-2 h-4 w-4" />
              {saveButtonLabel}
            </Button>
          </div>
        </div>
      ) : null}

      {activeTab === "help" ? (
        <div className={cn("grid gap-4", variant === "website" ? "xl:grid-cols-[1.05fr_0.95fr]" : "")}>
          <SettingsCard title="Aide rapide" hint="Les essentiels pour bien utiliser LE_LA.">
            <div className="space-y-3 text-sm leading-6 text-graphite">
              <div className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                1. Explorez via les icones du haut ou la barre website.
              </div>
              <div className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                2. Ouvrez une capsule pour voir la fiche, les medias et le graphe lie.
              </div>
              <div className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                3. Aimez, partagez, discutez ou proposez une nouvelle capsule.
              </div>
            </div>
          </SettingsCard>

          <div className="space-y-4">
            <SettingsCard title="Raccourcis utiles" hint="Accedez directement aux fonctions que l'on cherche le plus souvent.">
              <div className="grid gap-3">
                <Link href={chatHref} className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                  <p className="text-sm font-semibold text-ink">Chat / messages</p>
                  <p className="mt-1 text-xs text-graphite/72">Questions, navigation ou direct messages.</p>
                </Link>
                <Link href={contributeHref} className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                  <p className="text-sm font-semibold text-ink">Contribuer</p>
                  <p className="mt-1 text-xs text-graphite/72">Proposer une capsule, un lieu, une personne ou un evenement.</p>
                </Link>
                <Link href={mapHref} className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                  <p className="text-sm font-semibold text-ink">Carte</p>
                  <p className="mt-1 text-xs text-graphite/72">Explorer les lieux et evenements sur la carte europeenne.</p>
                </Link>
              </div>
            </SettingsCard>
          </div>
        </div>
      ) : null}

      {activeTab === "about" ? (
        <div className={cn("grid gap-4", variant === "website" ? "xl:grid-cols-[1fr_1fr]" : "")}>
          <SettingsCard title="LE_LA" hint="Deux experiences, une meme logique editoriale.">
            <div className="space-y-3 text-sm leading-6 text-graphite">
              <div className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                LE_LA relie lieux, personnes et evenements dans une lecture editoriale mobile-first.
              </div>
              <div className="rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70">
                Version actuelle : MVP 1.0, avec website et Progressive Web App.
              </div>
            </div>
          </SettingsCard>

          <div className="space-y-4">
            <SettingsCard title="Aller plus loin" hint="Basculer entre vos deux experiences LE_LA.">
              <div className="grid gap-3">
                <Link
                  href={oppositeExperienceHref}
                  className="flex items-center gap-3 rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70"
                >
                  <MonitorSmartphone className="h-5 w-5 text-plum" />
                  <div>
                    <p className="text-sm font-semibold text-ink">
                      {variant === "website" ? "Ouvrir la Progressive Web App" : "Ouvrir le website"}
                    </p>
                    <p className="mt-1 text-xs text-graphite/72">
                      Basculer vers l&apos;autre version de la plateforme.
                    </p>
                  </div>
                </Link>
                <Link
                  href={accountHref}
                  className="flex items-center gap-3 rounded-[22px] bg-mist px-4 py-4 ring-1 ring-borderSoft/70"
                >
                  <Mail className="h-5 w-5 text-plum" />
                  <div>
                    <p className="text-sm font-semibold text-ink">Compte</p>
                    <p className="mt-1 text-xs text-graphite/72">Retrouver votre profil, vos publications et vos relations.</p>
                  </div>
                </Link>
              </div>
            </SettingsCard>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (variant === "website") {
    return content;
  }

  return (
    <MobileShell activeMode="feed" activeTab="profile" className="p-0">
      {content}
    </MobileShell>
  );
}
