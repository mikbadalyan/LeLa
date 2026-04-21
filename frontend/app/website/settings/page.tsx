import { SettingsScreen } from "@/features/settings/settings-screen";

export default async function WebsiteSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;

  return <SettingsScreen initialTab={params.tab} variant="website" />;
}
