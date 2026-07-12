"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import Link from "next/link";
import Swal from "sweetalert2";
import {
  UserCheck,
  UserX,
  HeartPulse,
  FileClock,
  Users,
  ArrowRight,
  Download,
  Loader2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { StatCard } from "@/components/stat-card";
import { apiFetch } from "@/lib/api";
import { AbsenGuru, AbsenSiswa } from "@/types/absen";

const TARIK_DATA_URL = "https://sakuci.id/tarikdata";

dayjs.locale("id");

type Counts = {
  masuk: number;
  izin: number;
  sakit: number;
  dispen: number;
};

const emptyCounts: Counts = { masuk: 0, izin: 0, sakit: 0, dispen: 0 };

function countByStatus(rows: { status: string }[]): Counts {
  const counts = { ...emptyCounts };
  for (const row of rows) {
    if (row.status === "0") counts.masuk += 1;
    else if (row.status === "3") counts.izin += 1;
    else if (row.status === "2") counts.sakit += 1;
    else if (row.status === "1") counts.dispen += 1;
  }
  return counts;
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [tarikLoading, setTarikLoading] = useState(false);
  const [guruCounts, setGuruCounts] = useState<Counts>(emptyCounts);
  const [siswaCounts, setSiswaCounts] = useState<Counts>(emptyCounts);
  const today = dayjs().format("YYYY-MM-DD");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [guruRes, siswaRes] = await Promise.all([
        apiFetch(`/presensi/absenguru?tanggal=${today}&limit=500`),
        apiFetch(`/presensi/presensiharian?tanggal=${today}`),
      ]);

      const guruRows: AbsenGuru[] = guruRes?.data || [];
      const siswaRows: AbsenSiswa[] = Array.isArray(siswaRes) ? siswaRes : [];

      setGuruCounts(countByStatus(guruRows));
      setSiswaCounts(countByStatus(siswaRows));
    } catch {
      // biarkan tetap 0 kalau gagal, kartu skeleton berhenti dan tampil 0
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, this app uses plain fetch instead of SWR/React Query
    load();
  }, [load]);

  const handleTarikData = async () => {
    setTarikLoading(true);
    try {
      const res = await fetch(TARIK_DATA_URL);
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        throw new Error(data?.message || "Gagal menarik data dari mesin.");
      }
      await Swal.fire({
        title: "Berhasil",
        text: data.message || "Berhasil tarik data.",
        icon: "success",
        timer: 2000,
        showConfirmButton: false,
      });
      load();
    } catch (err) {
      Swal.fire("Gagal", (err as Error).message, "error");
    } finally {
      setTarikLoading(false);
    }
  };

  return (
    <AppShell title="Dashboard">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-lg font-semibold text-slate-900">
            Ringkasan Hari Ini
          </h2>
          <p className="text-sm text-slate-500">
            {dayjs().format("dddd, D MMMM YYYY")}
          </p>
        </div>
        <button
          onClick={handleTarikData}
          disabled={tarikLoading}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700 disabled:opacity-60"
        >
          {tarikLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          {tarikLoading ? "Menarik data..." : "Tarik Data"}
        </button>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-600">Absen Guru</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Masuk"
            value={guruCounts.masuk}
            icon={UserCheck}
            color="bg-emerald-100 text-emerald-600"
            loading={loading}
          />
          <StatCard
            label="Izin"
            value={guruCounts.izin}
            icon={FileClock}
            color="bg-sky-100 text-sky-600"
            loading={loading}
          />
          <StatCard
            label="Sakit"
            value={guruCounts.sakit}
            icon={HeartPulse}
            color="bg-amber-100 text-amber-600"
            loading={loading}
          />
          <StatCard
            label="Dispen"
            value={guruCounts.dispen}
            icon={UserX}
            color="bg-violet-100 text-violet-600"
            loading={loading}
          />
        </div>
      </div>

      <div>
        <p className="mb-3 text-sm font-semibold text-slate-600">Absen Siswa</p>
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard
            label="Hadir"
            value={siswaCounts.masuk}
            icon={Users}
            color="bg-emerald-100 text-emerald-600"
            loading={loading}
          />
          <StatCard
            label="Izin"
            value={siswaCounts.izin}
            icon={FileClock}
            color="bg-sky-100 text-sky-600"
            loading={loading}
          />
          <StatCard
            label="Sakit"
            value={siswaCounts.sakit}
            icon={HeartPulse}
            color="bg-amber-100 text-amber-600"
            loading={loading}
          />
          <StatCard
            label="Dispen"
            value={siswaCounts.dispen}
            icon={UserX}
            color="bg-violet-100 text-violet-600"
            loading={loading}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/absen-guru"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div>
            <p className="font-semibold text-slate-900">Kelola Absen Guru</p>
            <p className="mt-1 text-sm text-slate-500">
              Lihat, tambah, dan koreksi data absensi guru
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
        </Link>
        <Link
          href="/absen-siswa"
          className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-blue-200 hover:shadow-md"
        >
          <div>
            <p className="font-semibold text-slate-900">Kelola Absen Siswa</p>
            <p className="mt-1 text-sm text-slate-500">
              Lihat, tambah, dan koreksi data absensi harian siswa
            </p>
          </div>
          <ArrowRight className="h-5 w-5 text-slate-300 transition-transform group-hover:translate-x-1 group-hover:text-blue-500" />
        </Link>
      </div>
    </AppShell>
  );
}
