import type { ContributionStatus } from "@/lib/api/types";
import { cn } from "@/lib/utils/cn";

const statusCopy: Record<ContributionStatus, string> = {
  draft: "Brouillon",
  pending: "En attente",
  approved: "Publie",
  changes_requested: "A revoir",
  rejected: "Refuse",
};

const statusStyles: Record<ContributionStatus, string> = {
  draft: "bg-slate-100 text-slate-700",
  pending: "bg-[#F8F0FF] text-plum",
  approved: "bg-emerald-100 text-emerald-700",
  changes_requested: "bg-amber-100 text-amber-800",
  rejected: "bg-rose-100 text-rose-700",
};

export function ContributionStatusBadge({
  status,
  className,
}: {
  status: ContributionStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]",
        statusStyles[status],
        className
      )}
    >
      {statusCopy[status]}
    </span>
  );
}

export function getContributionStatusLabel(status: ContributionStatus) {
  return statusCopy[status];
}
