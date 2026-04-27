import { WebsiteContributionScreen } from "@/features/website/contribution-screen";

export default async function WebsiteContributePage({
  searchParams,
}: {
  searchParams: Promise<{
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
  }>;
}) {
  return <WebsiteContributionScreen searchParams={await searchParams} />;
}
