"use client";

import { RekapStafBulananPage } from "@/components/rekap-staf-bulanan-page";

export default function RekapGuruPage() {
  return (
    <RekapStafBulananPage
      title="Rekap Bulanan Guru"
      noun="guru"
      endpoint="/presensi/rekap-bulanan-guru"
    />
  );
}
