import { SettingsScreen } from "@/features/settings/settings-screen";

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;

  return <SettingsScreen initialTab={params.tab} />;
}
