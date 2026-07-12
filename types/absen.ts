export type DataUser = {
  id_data: string;
  id_user: string;
  nama_lengkap: string;
  jenkel: "l" | "p";
  no_rfid: string | null;
  uid_fp: number | null;
  nama_singkat: string;
  no_hp: string | null;
  gambar: string | null;
};

export type GuruUser = {
  id: string;
  username: string;
  id_role: string;
  acc: string;
  DataUser: DataUser | null;
};

export type AbsenGuru = {
  id_absen: string;
  id_user: string;
  status: string;
  waktu: string;
  keterangan: string | null;
  created_at?: string;
  updated_at?: string;
  users?: GuruUser;
};

export type RiwayatKelas = {
  id_riwayat: string;
  id_siswa: string;
  tahun_ajaran: string;
  tingkat: string;
  nama_kelas: string;
};

export type SiswaPpdb = {
  id_siswa: string;
  nama_lengkap: string;
  nisn?: string;
  no_rfid?: string | null;
  status?: string;
  riwayat_kelas?: RiwayatKelas[];
};

export type AbsenSiswa = {
  id_harian: string;
  id_siswa: string;
  status: string;
  waktu: string;
  created_at?: string;
  updated_at?: string;
  siswa_ppdb?: SiswaPpdb;
  kategori_datang?: KategoriKehadiran;
  keterlambatan_menit?: number | null;
};

export type KategoriKehadiran =
  | "on_time"
  | "toleransi"
  | "terlambat"
  | "dispen"
  | "sakit"
  | "izin"
  | "belum_absen";

export type RekapSiswaRow = {
  id_siswa: string;
  nama_lengkap: string;
  tingkat: string | null;
  nama_kelas: string | null;
  kategori: KategoriKehadiran;
  jam: string | null;
  keterlambatan_menit: number | null;
};

export const KATEGORI_LABEL: Record<KategoriKehadiran, string> = {
  on_time: "On Time",
  toleransi: "Toleransi",
  terlambat: "Terlambat",
  dispen: "Dispen",
  sakit: "Sakit",
  izin: "Izin",
  belum_absen: "Belum Absen",
};

export const KATEGORI_COLOR: Record<KategoriKehadiran, string> = {
  on_time: "bg-emerald-100 text-emerald-700",
  toleransi: "bg-amber-100 text-amber-700",
  terlambat: "bg-red-100 text-red-700",
  dispen: "bg-violet-100 text-violet-700",
  sakit: "bg-amber-100 text-amber-700",
  izin: "bg-sky-100 text-sky-700",
  belum_absen: "bg-slate-200 text-slate-600",
};

export const STATUS_COLOR: Record<string, string> = {
  "0": "bg-emerald-100 text-emerald-700",
  "4": "bg-slate-200 text-slate-700",
  "1": "bg-violet-100 text-violet-700",
  "2": "bg-amber-100 text-amber-700",
  "3": "bg-sky-100 text-sky-700",
};

export const STATUS_LABEL_GURU: Record<string, string> = {
  "0": "Masuk",
  "4": "Pulang",
  "1": "Dispen",
  "2": "Sakit",
  "3": "Izin",
};

export const STATUS_LABEL_SISWA: Record<string, string> = {
  "0": "Hadir",
  "4": "Pulang",
  "1": "Dispen",
  "2": "Sakit",
  "3": "Izin",
};

export const STATUS_OPTIONS_GURU = [
  { value: "0", label: "Masuk" },
  { value: "4", label: "Pulang" },
  { value: "1", label: "Dispen" },
  { value: "2", label: "Sakit" },
  { value: "3", label: "Izin" },
];

export const STATUS_OPTIONS_SISWA = [
  { value: "0", label: "Hadir" },
  { value: "4", label: "Pulang" },
  { value: "1", label: "Dispen" },
  { value: "2", label: "Sakit" },
  { value: "3", label: "Izin" },
];

export type KategoriRekapGuru =
  | "lengkap_ontime"
  | "lengkap_terlambat"
  | "belum_pulang_ontime"
  | "belum_pulang_terlambat"
  | "izin"
  | "sakit"
  | "dispen"
  | null;

export type RekapGuruRow = {
  id_user: string;
  nama_lengkap: string;
  rekap: Record<string, KategoriRekapGuru>;
};

export type RekapBulananGuruResponse = {
  status: string;
  bulan: number;
  tahun: number;
  hari: string[];
  data: RekapGuruRow[];
};
