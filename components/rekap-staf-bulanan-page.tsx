"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import "dayjs/locale/id";
import Swal from "sweetalert2";
import { Check, TriangleAlert, Printer, ClipboardList } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { apiFetch } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getUser, isAdmin } from "@/lib/auth";
import { KategoriRekapGuru, RekapGuruRow } from "@/types/absen";

dayjs.locale("id");

const BULAN_LIST = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

const TAHUN_INI = dayjs().year();
const TAHUN_LIST = [TAHUN_INI - 1, TAHUN_INI, TAHUN_INI + 1];

const CIRCLE_BASE =
  "mx-auto flex h-5 w-5 items-center justify-center rounded-full print:h-3.5 print:w-3.5";

function Cell({ kategori }: { kategori: KategoriRekapGuru }) {
  if (!kategori) {
    return <div className={cn(CIRCLE_BASE, "bg-slate-300")} />;
  }
  if (kategori === "lengkap_ontime") {
    return (
      <div className={cn(CIRCLE_BASE, "bg-emerald-500 text-white")}>
        <Check className="h-3 w-3 print:h-2 print:w-2" strokeWidth={3} />
      </div>
    );
  }
  if (kategori === "lengkap_terlambat") {
    return (
      <div className={cn(CIRCLE_BASE, "bg-amber-400 text-white")}>
        <Check className="h-3 w-3 print:h-2 print:w-2" strokeWidth={3} />
      </div>
    );
  }
  if (kategori === "belum_pulang_ontime") {
    return (
      <TriangleAlert className="mx-auto h-4 w-4 text-emerald-500 print:h-3 print:w-3" strokeWidth={2.5} />
    );
  }
  if (kategori === "belum_pulang_terlambat") {
    return (
      <TriangleAlert className="mx-auto h-4 w-4 text-amber-500 print:h-3 print:w-3" strokeWidth={2.5} />
    );
  }
  if (kategori === "sakit") {
    return (
      <div className={cn(CIRCLE_BASE, "bg-amber-500 text-white")}>
        <span className="text-[10px] font-bold print:text-[6px]">S</span>
      </div>
    );
  }
  if (kategori === "izin") {
    return (
      <div className={cn(CIRCLE_BASE, "bg-sky-500 text-white")}>
        <span className="text-[10px] font-bold print:text-[6px]">I</span>
      </div>
    );
  }
  if (kategori === "dispen") {
    return (
      <div className={cn(CIRCLE_BASE, "bg-emerald-500 text-white")}>
        <span className="text-[10px] font-bold print:text-[6px]">D</span>
      </div>
    );
  }
  return null;
}

function Legend() {
  const items: { kategori: KategoriRekapGuru; label: string }[] = [
    { kategori: "lengkap_ontime", label: "Datang on time & pulang" },
    { kategori: "lengkap_terlambat", label: "Datang terlambat & pulang" },
    { kategori: "belum_pulang_ontime", label: "On time, belum pulang" },
    { kategori: "belum_pulang_terlambat", label: "Terlambat, belum pulang" },
    { kategori: "sakit", label: "Sakit" },
    { kategori: "izin", label: "Izin" },
    { kategori: "dispen", label: "Dispen" },
    { kategori: null, label: "Tidak ada data" },
  ];

  return (
    <div className="flex flex-wrap gap-x-5 gap-y-2 rounded-2xl border border-slate-200 bg-white p-4 text-xs text-slate-600 shadow-sm print:rounded-none print:border-0 print:p-0 print:text-[7px]">
      {items.map((item) => (
        <div key={item.label} className="flex items-center gap-2">
          <Cell kategori={item.kategori} />
          <span>{item.label}</span>
        </div>
      ))}
    </div>
  );
}

export function RekapStafBulananPage({
  title,
  noun,
  endpoint,
}: {
  title: string;
  noun: string;
  endpoint: string;
}) {
  const [bulan, setBulan] = useState(dayjs().month() + 1);
  const [tahun, setTahun] = useState(TAHUN_INI);
  const [hari, setHari] = useState<string[]>([]);
  const [rows, setRows] = useState<RekapGuruRow[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!isAdmin(getUser())) return;
    setLoading(true);
    try {
      const res = await apiFetch(`${endpoint}?bulan=${bulan}&tahun=${tahun}`);
      setHari(res?.hari || []);
      setRows(res?.data || []);
    } catch (err) {
      Swal.fire("Gagal memuat rekap", (err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [bulan, tahun, endpoint]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/filter-change, this app uses plain fetch instead of SWR/React Query
    loadData();
  }, [loadData]);

  const namaKolom = `Nama ${noun[0].toUpperCase() + noun.slice(1)}`;

  return (
    <AppShell title={title} allowedRoles={["admin"]}>
      <div className="hidden print:mb-2 print:block">
        <h1 className="text-center text-sm font-bold uppercase">SMK Sangkuriang 1 Cimahi</h1>
        <p className="text-center text-xs">
          {title} — {BULAN_LIST[bulan - 1]} {tahun}
        </p>
      </div>

      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <select
            value={bulan}
            onChange={(e) => setBulan(Number(e.target.value))}
            className="rounded-xl border border-slate-200 py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {BULAN_LIST.map((b, i) => (
              <option key={b} value={i + 1}>
                {b}
              </option>
            ))}
          </select>
          <select
            value={tahun}
            onChange={(e) => setTahun(Number(e.target.value))}
            className="rounded-xl border border-slate-200 py-2 pl-3 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
          >
            {TAHUN_LIST.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <button
          onClick={() => window.print()}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Printer className="h-4 w-4" /> Cetak PDF
        </button>
      </div>

      <Legend />

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:overflow-visible print:rounded-none print:border-0 print:shadow-none">
        <div className="overflow-x-auto print:overflow-visible">
          <table className="w-full table-fixed border-collapse text-center text-xs print:text-[7px]">
            <colgroup>
              <col className="w-44 print:w-[13%]" />
              {hari.map((h) => (
                <col key={h} className="w-12 print:w-auto" />
              ))}
            </colgroup>
            <thead className="bg-slate-50">
              <tr>
                <th className="border border-slate-300 px-3 py-2.5 text-left font-semibold text-slate-500 print:border-slate-500 print:px-0.5 print:py-0.5 print:text-black">
                  {namaKolom}
                </th>
                {hari.map((h) => (
                  <th
                    key={h}
                    className="border border-slate-300 px-1 py-2.5 font-medium text-slate-500 print:border-slate-500 print:px-0 print:py-0.5 print:text-black"
                  >
                    <div className="leading-tight">
                      <div className="font-semibold">{dayjs(h).format("D")}</div>
                      <div className="text-[10px] font-normal text-slate-400 print:text-[6px] print:text-black">
                        {dayjs(h).format("dd")}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    <td className="border border-slate-200 px-3 py-3" colSpan={hari.length + 1}>
                      <div className="skeleton h-4 w-full rounded-lg" />
                    </td>
                  </tr>
                ))}

              {!loading && rows.length === 0 && (
                <tr>
                  <td
                    colSpan={hari.length + 1}
                    className="border border-slate-200 px-4 py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <ClipboardList className="h-10 w-10" />
                      <p className="text-sm font-medium">Belum ada data {noun}</p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.id_user}
                    className="break-inside-avoid transition-colors hover:bg-slate-50"
                  >
                    <td className="border border-slate-200 px-3 py-2 text-left font-medium text-slate-800 print:border-slate-400 print:px-0.5 print:py-0.5">
                      {row.nama_lengkap.trim()}
                    </td>
                    {hari.map((h) => (
                      <td
                        key={h}
                        className="border border-slate-200 px-1 py-2 print:border-slate-400 print:px-0 print:py-0.5"
                      >
                        <Cell kategori={row.rekap[h]} />
                      </td>
                    ))}
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </AppShell>
  );
}
