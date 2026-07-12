"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  GraduationCap,
  Search,
  X,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { cn, formatDurasiMenit } from "@/lib/utils";
import {
  AbsenSiswa,
  KATEGORI_LABEL,
  STATUS_LABEL_SISWA,
  STATUS_OPTIONS_SISWA,
} from "@/types/absen";

const PAGE_SIZE = 15;

type KelasOption = {
  tingkat: string;
  nama_kelas: string;
};

type SiswaOption = {
  id_siswa: string;
  nama_lengkap: string;
  siswa_baru?: { kelas_ppdb?: { nama_kelas: string } | null } | null;
};

type FormState = {
  id_harian?: string;
  id_siswa: string;
  nama_siswa: string;
  status: string;
  waktu: string;
};

const emptyForm: FormState = {
  id_siswa: "",
  nama_siswa: "",
  status: "0",
  waktu: dayjs().format("YYYY-MM-DDTHH:mm"),
};

export default function AbsenSiswaPage() {
  const [rows, setRows] = useState<AbsenSiswa[]>([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(dayjs().format("YYYY-MM-DD"));
  const [kelasFilter, setKelasFilter] = useState("");
  const [kelasList, setKelasList] = useState<KelasOption[]>([]);
  const [tahunAjaran, setTahunAjaran] = useState("");
  const [tahunList, setTahunList] = useState<string[]>([]);
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [siswaQuery, setSiswaQuery] = useState("");
  const [siswaResults, setSiswaResults] = useState<SiswaOption[]>([]);
  const [searchingSiswa, setSearchingSiswa] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadData = useCallback(async () => {
    if (!tahunAjaran) return;
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (tanggal) params.set("tanggal", tanggal);
      params.set("tahun_ajaran", tahunAjaran);
      const path = kelasFilter
        ? `/presensi/presensiharian/${encodeURIComponent(kelasFilter)}?${params.toString()}`
        : `/presensi/presensiharian?${params.toString()}`;
      const res = await apiFetch(path);
      setRows(Array.isArray(res) ? res : []);
    } catch (err) {
      Swal.fire("Gagal memuat data", (err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [tanggal, kelasFilter, tahunAjaran]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/filter-change, this app uses plain fetch instead of SWR/React Query
    loadData();
  }, [loadData]);

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

  const searchSiswa = (q: string) => {
    setSiswaQuery(q);
    setForm((f) => ({ ...f, id_siswa: "", nama_siswa: "" }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (q.trim().length < 2) {
      setSiswaResults([]);
      return;
    }
    setSearchingSiswa(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await apiFetch(
          `/siswa/master?search=${encodeURIComponent(q)}&status=aktif&limit=8`
        );
        setSiswaResults(res?.data || []);
      } catch {
        setSiswaResults([]);
      } finally {
        setSearchingSiswa(false);
      }
    }, 350);
  };

  const pickSiswa = (s: SiswaOption) => {
    setForm((f) => ({ ...f, id_siswa: s.id_siswa, nama_siswa: s.nama_lengkap }));
    setSiswaQuery(s.nama_lengkap);
    setSiswaResults([]);
  };

  const openAdd = () => {
    setEditing(false);
    setForm({ ...emptyForm, waktu: dayjs().format("YYYY-MM-DDTHH:mm") });
    setSiswaQuery("");
    setSiswaResults([]);
    setModalOpen(true);
  };

  const openEdit = (row: AbsenSiswa) => {
    setEditing(true);
    const nama = row.siswa_ppdb?.nama_lengkap || "";
    setForm({
      id_harian: row.id_harian,
      id_siswa: row.id_siswa,
      nama_siswa: nama,
      status: row.status,
      waktu: dayjs(row.waktu).format("YYYY-MM-DDTHH:mm"),
    });
    setSiswaQuery(nama);
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_siswa) {
      Swal.fire("Lengkapi data", "Pilih siswa terlebih dahulu.", "warning");
      return;
    }
    setSaving(true);
    try {
      if (editing && form.id_harian) {
        await apiFetch(`/presensi/updateharian/${form.id_harian}`, {
          method: "PUT",
          body: JSON.stringify({
            status: form.status,
            waktu: dayjs(form.waktu).format("YYYY-MM-DD HH:mm:ss"),
          }),
        });
      } else {
        await apiFetch(`/presensi/harian`, {
          method: "POST",
          body: JSON.stringify({
            id_siswa: form.id_siswa,
            status: form.status,
            waktu: dayjs(form.waktu).format("YYYY-MM-DD HH:mm:ss"),
          }),
        });
      }
      setModalOpen(false);
      await loadData();
      Swal.fire({
        title: "Berhasil",
        text: editing ? "Absensi siswa diperbarui." : "Absensi siswa ditambahkan.",
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Gagal", (err as Error).message, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (row: AbsenSiswa) => {
    const nama = row.siswa_ppdb?.nama_lengkap || "siswa ini";
    const result = await Swal.fire({
      title: "Hapus data absensi?",
      text: `Data absensi ${nama} pada ${dayjs(row.waktu).format("D MMM YYYY HH:mm")} akan dihapus.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Ya, hapus",
      cancelButtonText: "Batal",
      confirmButtonColor: "#dc2626",
    });
    if (!result.isConfirmed) return;

    try {
      await apiFetch(`/presensi/deleteharian/${row.id_harian}`, { method: "DELETE" });
      await loadData();
      Swal.fire({
        title: "Terhapus",
        icon: "success",
        timer: 1200,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Gagal menghapus", (err as Error).message, "error");
    }
  };

  const totalPage = Math.max(1, Math.ceil(rows.length / PAGE_SIZE));
  const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kelasByTingkat = useMemo(() => {
    const groups = new Map<string, KelasOption[]>();
    for (const k of kelasList) {
      const list = groups.get(k.tingkat) || [];
      list.push(k);
      groups.set(k.tingkat, list);
    }
    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [kelasList]);

  return (
    <AppShell title="Absen Siswa">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative">
            <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="date"
              value={tanggal}
              onChange={(e) => {
                setPage(1);
                setTanggal(e.target.value);
              }}
              className="rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </div>
          <div className="relative">
            <select
              value={tahunAjaran}
              onChange={(e) => {
                setPage(1);
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
              onChange={(e) => {
                setPage(1);
                setKelasFilter(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="">Semua Kelas</option>
              {kelasByTingkat.map(([tingkat, list]) => (
                <optgroup key={tingkat} label={`Tingkat ${tingkat}`}>
                  {list.map((k) => (
                    <option
                      key={`${k.tingkat}-${k.nama_kelas}`}
                      value={`${k.tingkat}|${k.nama_kelas}`}
                    >
                      {k.nama_kelas}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
        >
          <Plus className="h-4 w-4" /> Tambah Absensi
        </button>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-3">Nama Siswa</th>
                <th className="px-4 py-3">Kelas</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading &&
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0">
                    <td className="px-4 py-3" colSpan={5}>
                      <div className="skeleton h-5 w-full rounded-lg" />
                    </td>
                  </tr>
                ))}

              {!loading && pageRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <GraduationCap className="h-10 w-10" />
                      <p className="text-sm font-medium">
                        Belum ada data absensi siswa pada filter ini
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                pageRows.map((row) => (
                  <tr
                    key={row.id_harian}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {row.siswa_ppdb?.nama_lengkap?.trim() || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.siswa_ppdb?.riwayat_kelas?.[0]
                        ? `${row.siswa_ppdb.riwayat_kelas[0].tingkat} ${row.siswa_ppdb.riwayat_kelas[0].nama_kelas}`
                        : "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {dayjs(row.waktu).format("D MMM YYYY, HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col items-start gap-1">
                        <StatusBadge
                          status={row.status}
                          label={STATUS_LABEL_SISWA[row.status] || row.status}
                        />
                        {row.status === "0" && row.kategori_datang && (
                          <span
                            className={cn(
                              "text-xs font-medium",
                              row.kategori_datang === "terlambat"
                                ? "text-red-600"
                                : row.kategori_datang === "toleransi"
                                  ? "text-amber-600"
                                  : "text-emerald-600"
                            )}
                          >
                            {row.kategori_datang === "terlambat"
                              ? `Terlambat ${formatDurasiMenit(row.keterlambatan_menit || 0)}`
                              : KATEGORI_LABEL[row.kategori_datang]}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEdit(row)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        {!loading && rows.length > 0 && (
          <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
            <p className="text-xs text-slate-500">
              Halaman {page} dari {totalPage} &middot; {rows.length} data
            </p>
            <div className="flex items-center gap-1.5">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                disabled={page >= totalPage}
                onClick={() => setPage((p) => Math.min(totalPage, p + 1))}
                className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <Modal
        title={editing ? "Edit Absensi Siswa" : "Tambah Absensi Siswa"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Siswa</label>
            {editing ? (
              <input
                disabled
                value={form.nama_siswa}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500"
              />
            ) : (
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Ketik minimal 2 huruf nama siswa..."
                  value={siswaQuery}
                  onChange={(e) => searchSiswa(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-9 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
                />
                {siswaQuery && (
                  <button
                    type="button"
                    onClick={() => {
                      setSiswaQuery("");
                      setSiswaResults([]);
                      setForm((f) => ({ ...f, id_siswa: "", nama_siswa: "" }));
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}

                {(siswaResults.length > 0 || searchingSiswa) && !form.id_siswa && (
                  <div className="absolute z-10 mt-1.5 max-h-56 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg">
                    {searchingSiswa && (
                      <p className="px-3 py-2 text-sm text-slate-400">Mencari...</p>
                    )}
                    {!searchingSiswa &&
                      siswaResults.map((s) => (
                        <button
                          type="button"
                          key={s.id_siswa}
                          onClick={() => pickSiswa(s)}
                          className="flex w-full flex-col items-start px-3 py-2 text-left text-sm hover:bg-slate-50"
                        >
                          <span className="font-medium text-slate-800">
                            {s.nama_lengkap.trim()}
                          </span>
                          <span className="text-xs text-slate-400">
                            {s.siswa_baru?.kelas_ppdb?.nama_kelas || "Kelas belum diset"}
                          </span>
                        </button>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Status
              </label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              >
                {STATUS_OPTIONS_SISWA.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">
                Waktu
              </label>
              <input
                type="datetime-local"
                required
                value={form.waktu}
                onChange={(e) => setForm({ ...form, waktu: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
              />
            </div>
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
    </AppShell>
  );
}
