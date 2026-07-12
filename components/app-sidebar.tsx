"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  UserCheck,
  Users,
  ClipboardCheck,
  ClipboardList,
  CalendarCheck,
  UserCog,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { getUser, isAdmin } from "@/lib/auth";

const MENU = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, adminOnly: false },
  { href: "/absen-guru", label: "Absen Guru", icon: UserCheck, adminOnly: false },
  { href: "/absen-tendik", label: "Absen Tendik", icon: UserCog, adminOnly: false },
  { href: "/absen-siswa", label: "Absen Siswa", icon: Users, adminOnly: false },
  { href: "/rekap-siswa", label: "Rekap Siswa", icon: ClipboardList, adminOnly: false },
  { href: "/rekap-guru", label: "Rekap Guru", icon: CalendarCheck, adminOnly: true },
  { href: "/rekap-tendik", label: "Rekap Tendik", icon: CalendarCheck, adminOnly: true },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const admin = isAdmin(getUser());
  const menu = MENU.filter((item) => !item.adminOnly || admin);

  return (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {menu.map((item) => {
        const active = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-blue-600 text-white shadow-sm shadow-blue-900/30"
                : "text-slate-300 hover:bg-slate-800 hover:text-white"
            )}
          >
            <Icon className="h-4.5 w-4.5 shrink-0" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-3 px-5 py-6">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-900/40">
        <ClipboardCheck className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-white">Absensi Piket</p>
        <p className="text-xs text-slate-400">SMK Sangkuriang 1</p>
      </div>
    </div>
  );
}

export function AppSidebar({
  mobileOpen,
  onCloseMobile,
}: {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  return (
    <>
      <aside className="hidden md:flex md:w-64 md:flex-col md:bg-slate-950 md:py-4 print:hidden">
        <Brand />
        <NavLinks />
        <div className="px-5 pt-4 text-[11px] text-slate-600">
          &copy; {new Date().getFullYear()} Sakuci
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={onCloseMobile}
          />
          <aside className="relative flex h-full w-64 flex-col bg-slate-950 py-4 shadow-2xl">
            <Brand />
            <NavLinks onNavigate={onCloseMobile} />
          </aside>
        </div>
      )}
    </>
  );
}
