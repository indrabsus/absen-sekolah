"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import Swal from "sweetalert2";
import { CalendarDays, GraduationCap, ClipboardList, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";
import { cn, formatDurasiMenit } from "@/lib/utils";
import {
  KATEGORI_COLOR,
  KATEGORI_LABEL,
  KategoriKehadiran,
  RekapSiswaRow,
} from "@/types/absen";

dayjs.locale("id");

type KelasOption = {
  tingkat: string;
  nama_kelas: string;
};

const SUMMARY_ORDER: KategoriKehadiran[] = [
  "on_time",
  "toleransi",
  "terlambat",
  "izin",
  "sakit",
  "dispen",
  "belum_absen",
];

export default function RekapSiswaPage() {
  const [tanggal, setTanggal] = useState(dayjs().format("YYYY-MM-DD"));
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [kelasFilter, setKelasFilter] = useState("");

  const [rows, setRows] = useState<RekapSiswaRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiFetch("/riwayat-kelas/tahun-list")
      .then((res) => setTahunList(res?.data || []))
      .catch(() => setTahunList([]));
    apiFetch("/riwayat-kelas/tahun-aktif")
      .then((res) => {
        const aktif = res?.data?.tahun_ajaran;
        if (aktif) setTahunAjaran(aktif);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!tahunAjaran) return;
    apiFetch(`/riwayat-kelas/kelas-list?tahun_ajaran=${encodeURIComponent(tahunAjaran)}`)
      .then((res) => setKelasList(res?.data || []))
      .catch(() => setKelasList([]));
  }, [tahunAjaran]);

  const kelasByTingkat = useMemo(() => {
    const groups = new Map<string, KelasOption[]>();
    for (const k of kelasList) {
      const list = groups.get(k.tingkat) || [];
      list.push(k);
      groups.set(k.tingkat, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [kelasList]);

  const loadRekap = useCallback(async () => {
    if (!kelasFilter || !tahunAjaran) {
      setRows([]);
      return;
    }
    setLoading(true);
    try {
      const params = new URLSearchParams({
        tanggal,
        kelas: kelasFilter,
        tahun_ajaran: tahunAjaran,
      });
      const res = await apiFetch(`/presensi/rekap-harian-siswa?${params.toString()}`);
      setRows(res?.data || []);
    } catch (err) {
      Swal.fire("Gagal memuat rekap", (err as Error).message, "error");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [tanggal, kelasFilter, tahunAjaran]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/filter-change, this app uses plain fetch instead of SWR/React Query
    loadRekap();
  }, [loadRekap]);

  const summary = useMemo(() => {
    const counts: Record<KategoriKehadiran, number> = {
      on_time: 0,
      toleransi: 0,
      terlambat: 0,
      dispen: 0,
      sakit: 0,
      izin: 0,
      belum_absen: 0,
    };
    for (const r of rows) counts[r.kategori] += 1;
    return counts;
  }, [rows]);

  return (
    <AppShell title="Rekap Siswa Harian">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center">
        <div className="relative">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="date"
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          />
        </div>
        <div className="relative">
          <select
            value={tahunAjaran}
            onChange={(e) => {
              setKelasFilter("");
              setTahunAjaran(e.target.value);
            }}
            className="rounded-xl border border-slate-200 py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {tahunAjaran && !tahunList.includes(tahunAjaran) && (
              <option value={tahunAjaran}>{tahunAjaran}</option>
            )}
            {tahunList.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div className="relative flex-1">
          <GraduationCap className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={kelasFilter}
            onChange={(e) => setKelasFilter(e.target.value)}
            className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Pilih kelas...</option>
            {kelasByTingkat.map(([tingkat, list]) => (
              <optgroup key={tingkat} label={`Tingkat ${tingkat}`}>
                {list.map((k) => (
                  <option
                    key={`${k.tingkat}-${k.nama_kelas}`}
                    value={`${k.tingkat}|${k.nama_kelas}`}
                  >
                    {k.tingkat} {k.nama_kelas}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {kelasFilter && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
          {SUMMARY_ORDER.map((kat) => (
            <div
              key={kat}
              className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-sm"
            >
              <p className="text-2xl font-bold text-slate-900">
                {loading ? "-" : summary[kat]}
              </p>
              <p className={cn("mt-1 text-xs font-medium", KATEGORI_COLOR[kat].split(" ")[1])}>
                {KATEGORI_LABEL[kat]}
              </p>
            </div>
          ))}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama Siswa</th>
                <th className="px-4 py-3">Jam Datang</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Keterlambatan</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3" colSpan={4}>
                      <div className="skeleton h-5 w-full rounded-lg" />
                    </td>
                  </tr>
                ))}

              {!loading && !kelasFilter && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ClipboardList className="h-10 w-10" />
                      <p className="text-sm font-medium">
                        Pilih kelas terlebih dahulu untuk melihat rekap
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading && kelasFilter && rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ClipboardList className="h-10 w-10" />
                      <p className="text-sm font-medium">
                        Tidak ada siswa pada kelas ini
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.id_siswa}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {row.nama_lengkap.trim()}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {row.jam ? (
                        <span className="inline-flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          {row.jam}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold",
                          KATEGORI_COLOR[row.kategori]
                        )}
                      >
                        {KATEGORI_LABEL[row.kategori]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.keterlambatan_menit != null
                        ? formatDurasiMenit(row.keterlambatan_menit)
                        : "-"}
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
