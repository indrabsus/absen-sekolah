"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUser, getUserRole, isAllowedPiket } from "@/lib/auth";
import { Loader2, ShieldAlert } from "lucide-react";

export function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    const user = getUser();
    if (!isAllowedPiket(user)) {
      router.replace("/login");
      return;
    }
    if (allowedRoles && !allowedRoles.includes(getUserRole(user) || "")) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time client auth check against localStorage, mirrors admin-zakola's ProtectedRoute
      setDenied(true);
      return;
    }
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  if (denied) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100 p-6">
        <div className="flex max-w-sm flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <ShieldAlert className="h-10 w-10 text-red-400" />
          <p className="text-base font-semibold text-slate-800">Akses Ditolak</p>
          <p className="text-sm text-slate-500">
            Halaman ini hanya bisa diakses oleh admin.
          </p>
        </div>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-100">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-medium">Memuat...</span>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
