import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatCard({
  label,
  value,
  icon: Icon,
  color,
  loading,
}: {
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        <div
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-xl",
            color
          )}
        >
          <Icon className="h-4.5 w-4.5" />
        </div>
      </div>
      {loading ? (
        <div className="skeleton mt-3 h-8 w-16 rounded-lg" />
      ) : (
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </p>
      )}
    </div>
  );
}
