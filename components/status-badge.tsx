import { cn } from "@/lib/utils";
import { STATUS_COLOR } from "@/types/absen";

export function StatusBadge({
  status,
  label,
  className,
}: {
  status: string;
  label: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap",
        STATUS_COLOR[status] || "bg-slate-100 text-slate-600",
        className
      )}
    >
      {label}
    </span>
  );
}
