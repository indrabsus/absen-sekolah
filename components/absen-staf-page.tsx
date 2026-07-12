"use client";

import { useEffect, useState, useCallback } from "react";
import dayjs from "dayjs";
import Swal from "sweetalert2";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  UserCircle2,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Modal } from "@/components/modal";
import { StatusBadge } from "@/components/status-badge";
import { apiFetch } from "@/lib/api";
import { getUser } from "@/lib/auth";
import { AbsenGuru, STATUS_LABEL_GURU, STATUS_OPTIONS_GURU } from "@/types/absen";

type StafOption = {
  id_data: string;
  nama_lengkap: string;
  user: { id: string; id_role: string };
};

type FormState = {
  id_absen?: string;
  id_user: string;
  status: string;
  waktu: string;
  keterangan: string;
};

// piket (role manajemen) tidak boleh menandai "Masuk" secara manual — itu seharusnya dari RFID
const STATUS_OPTIONS_MANAJEMEN = STATUS_OPTIONS_GURU.filter((o) => o.value !== "0");

export function AbsenStafPage({
  title,
  noun,
  listEndpoint,
  optionsEndpoint,
}: {
  title: string;
  noun: string;
  listEndpoint: string;
  optionsEndpoint: string;
}) {
  const isManajemen = getUser()?.role === "manajemen";
  const emptyForm: FormState = {
    id_user: "",
    status: isManajemen ? STATUS_OPTIONS_MANAJEMEN[0].value : "0",
    waktu: dayjs().format("YYYY-MM-DDTHH:mm"),
    keterangan: "",
  };

  const [rows, setRows] = useState<AbsenGuru[]>([]);
  const [loading, setLoading] = useState(true);
  const [tanggal, setTanggal] = useState(dayjs().format("YYYY-MM-DD"));
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPage, setTotalPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [stafOptions, setStafOptions] = useState<StafOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const statusOptions =
    !editing && isManajemen ? STATUS_OPTIONS_MANAJEMEN : STATUS_OPTIONS_GURU;

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page) });
      if (tanggal) params.set("tanggal", tanggal);
      if (search) params.set("search", search);
      const res = await apiFetch(`${listEndpoint}?${params.toString()}`);
      setRows(res?.data || []);
      setTotalPage(res?.totalPage || 1);
      setTotal(res?.total || 0);
    } catch (err) {
      Swal.fire("Gagal memuat data", (err as Error).message, "error");
    } finally {
      setLoading(false);
    }
  }, [page, tanggal, search, listEndpoint]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount/filter-change, this app uses plain fetch instead of SWR/React Query
    loadData();
  }, [loadData]);

  useEffect(() => {
    apiFetch(optionsEndpoint)
      .then((res) => setStafOptions(res?.data || []))
      .catch(() => setStafOptions([]));
  }, [optionsEndpoint]);

  const openAdd = () => {
    setEditing(false);
    setForm({ ...emptyForm, waktu: dayjs().format("YYYY-MM-DDTHH:mm") });
    setModalOpen(true);
  };

  const openEdit = (row: AbsenGuru) => {
    setEditing(true);
    setForm({
      id_absen: row.id_absen,
      id_user: row.id_user,
      status: row.status,
      waktu: dayjs(row.waktu).format("YYYY-MM-DDTHH:mm"),
      keterangan: row.keterangan || "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.id_user) {
      Swal.fire("Lengkapi data", `Pilih ${noun} terlebih dahulu.`, "warning");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id_user: form.id_user,
        status: form.status,
        waktu: dayjs(form.waktu).format("YYYY-MM-DD HH:mm:ss"),
        keterangan: form.keterangan || null,
      };
      if (editing && form.id_absen) {
        await apiFetch(`/presensi/absenguru/${form.id_absen}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
      } else {
        await apiFetch(`/presensi/absenguru`, {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setModalOpen(false);
      await loadData();
      Swal.fire({
        title: "Berhasil",
        text: editing ? "Absensi diperbarui." : "Absensi ditambahkan.",
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

  const handleDelete = async (row: AbsenGuru) => {
    const nama = row.users?.DataUser?.nama_lengkap || noun;
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
      await apiFetch(`/presensi/absenguru/${row.id_absen}`, { method: "DELETE" });
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

  return (
    <AppShell title={title}>
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
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder={`Cari nama ${noun}...`}
              value={search}
              onChange={(e) => {
                setPage(1);
                setSearch(e.target.value);
              }}
              className="w-full rounded-xl border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
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
                <th className="px-4 py-3">Nama {noun[0].toUpperCase() + noun.slice(1)}</th>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Keterangan</th>
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

              {!loading && rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <div className="flex flex-col items-center gap-2 text-slate-400">
                      <UserCircle2 className="h-10 w-10" />
                      <p className="text-sm font-medium">
                        Belum ada data absensi {noun} pada tanggal ini
                      </p>
                    </div>
                  </td>
                </tr>
              )}

              {!loading &&
                rows.map((row) => (
                  <tr
                    key={row.id_absen}
                    className="border-b border-slate-100 transition-colors last:border-0 hover:bg-slate-50"
                  >
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {row.users?.DataUser?.nama_lengkap || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {dayjs(row.waktu).format("D MMM YYYY, HH:mm")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        status={row.status}
                        label={STATUS_LABEL_GURU[row.status] || row.status}
                      />
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {row.keterangan || "-"}
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
              Halaman {page} dari {totalPage} &middot; {total} data
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
        title={editing ? "Edit Absensi" : "Tambah Absensi"}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 capitalize">
              {noun}
            </label>
            <select
              required
              disabled={editing}
              value={form.id_user}
              onChange={(e) => setForm({ ...form, id_user: e.target.value })}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-50 disabled:text-slate-500"
            >
              <option value="">Pilih {noun}...</option>
              {stafOptions.map((g) => (
                <option key={g.user.id} value={g.user.id}>
                  {g.nama_lengkap}
                </option>
              ))}
            </select>
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
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              {!editing && isManajemen && (
                <p className="mt-1 text-xs text-slate-400">
                  Piket hanya bisa mencatat Sakit, Izin, Dispen, atau Pulang.
                </p>
              )}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Keterangan (opsional)
            </label>
            <textarea
              value={form.keterangan}
              onChange={(e) => setForm({ ...form, keterangan: e.target.value })}
              rows={2}
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
    </AppShell>
  );
}
