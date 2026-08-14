import { cn } from "@/lib/utils";
import type { ApplicationStatus } from "@/types";

const statusConfig: Record<
  ApplicationStatus,
  { label: string; className: string }
> = {
  Applied: {
    label: "Applied",
    className:
      "bg-sky-500/10 text-sky-500 border-sky-500/20",
  },
  Screening: {
    label: "Screening",
    className:
      "bg-violet-500/10 text-violet-500 border-violet-500/20",
  },
  Technical: {
    label: "Technical",
    className:
      "bg-amber-500/10 text-amber-500 border-amber-500/20",
  },
  HR: {
    label: "HR Round",
    className:
      "bg-orange-500/10 text-orange-500 border-orange-500/20",
  },
  Offer: {
    label: "Offer",
    className:
      "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  },
  Hired: {
    label: "Hired 🎉",
    className:
      "bg-green-500/15 text-green-500 border-green-500/20 font-semibold",
  },
  Rejected: {
    label: "Rejected",
    className:
      "bg-red-500/10 text-red-500 border-red-500/20",
  },
};

interface StatusBadgeProps {
  status: ApplicationStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className,
      )}
    >
      {config.label}
    </span>
  );
}

export { statusConfig };
