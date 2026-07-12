"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Menu, LogOut, KeyRound, ChevronDown } from "lucide-react";
import Swal from "sweetalert2";
import { getUser, logout } from "@/lib/auth";
import { apiFetch } from "@/lib/api";
import { Modal } from "@/components/modal";

export function AppHeader({
  title,
  onOpenMobileMenu,
}: {
  title: string;
  onOpenMobileMenu: () => void;
}) {
  const router = useRouter();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [pwOpen, setPwOpen] = useState(false);
  const [form, setForm] = useState({
    password_lama: "",
    password_baru: "",
    konfirmasi_password: "",
  });
  const [saving, setSaving] = useState(false);

  const handleLogout = async () => {
    const result = await Swal.fire({
      title: "Keluar dari aplikasi?",
      text: "Anda perlu login kembali untuk mengakses aplikasi.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Ya, keluar",
      cancelButtonText: "Batal",
      confirmButtonColor: "#2563eb",
    });
    if (result.isConfirmed) {
      logout();
      router.replace("/login");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password_baru.length < 6) {
      Swal.fire("Gagal", "Password baru minimal 6 karakter.", "error");
      return;
    }
    if (form.password_baru !== form.konfirmasi_password) {
      Swal.fire("Gagal", "Konfirmasi password tidak sama.", "error");
      return;
    }
    setSaving(true);
    try {
      await apiFetch("/api/auth/change-password", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setPwOpen(false);
      setForm({ password_lama: "", password_baru: "", konfirmasi_password: "" });
      Swal.fire("Berhasil", "Password berhasil diubah.", "success");
    } catch (err) {
      Swal.fire("Gagal", (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 print:hidden md:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 md:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-base font-semibold text-slate-900 md:text-lg">{title}</h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 py-1.5 pl-1.5 pr-3 transition-colors hover:bg-slate-50"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-sm font-semibold text-white">
              {(user?.username || "P").charAt(0).toUpperCase()}
            </div>
            <div className="hidden text-left sm:block">
              <p className="text-sm font-medium text-slate-800 leading-tight">
                {user?.username || "Piket"}
              </p>
              <p className="text-xs capitalize text-slate-400 leading-tight">
                {user?.role || "manajemen"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400" />
          </button>

          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 z-20 mt-2 w-52 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setPwOpen(true);
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-slate-700 hover:bg-slate-50"
                >
                  <KeyRound className="h-4 w-4" /> Ubah Password
                </button>
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    handleLogout();
                  }}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  <LogOut className="h-4 w-4" /> Keluar
                </button>
              </div>
            </>
          )}
        </div>
      </header>

      <Modal title="Ubah Password" open={pwOpen} onClose={() => setPwOpen(false)}>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password Lama
            </label>
            <input
              type="password"
              required
              value={form.password_lama}
              onChange={(e) => setForm({ ...form, password_lama: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Password Baru
            </label>
            <input
              type="password"
              required
              value={form.password_baru}
              onChange={(e) => setForm({ ...form, password_baru: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Konfirmasi Password Baru
            </label>
            <input
              type="password"
              required
              value={form.konfirmasi_password}
              onChange={(e) =>
                setForm({ ...form, konfirmasi_password: e.target.value })
              }
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-blue-600 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-700 disabled:opacity-60"
          >
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </form>
      </Modal>
    </>
  );
}
