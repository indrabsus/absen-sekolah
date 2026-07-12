"use client";

import { useState } from "react";
import { ProtectedRoute } from "@/components/protected-route";
import { AppSidebar } from "@/components/app-sidebar";
import { AppHeader } from "@/components/app-header";

export function AppShell({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen bg-slate-100 print:block print:bg-white">
        <AppSidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
        <div className="flex min-w-0 flex-1 flex-col print:block">
          <AppHeader title={title} onOpenMobileMenu={() => setMobileOpen(true)} />
          <main className="flex-1 space-y-6 p-4 md:p-6 print:space-y-2 print:p-0">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
