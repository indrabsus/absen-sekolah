"use client";

import { RekapStafBulananPage } from "@/components/rekap-staf-bulanan-page";

export default function RekapTendikPage() {
  return (
    <RekapStafBulananPage
      title="Rekap Bulanan Tendik"
      noun="tendik"
      endpoint="/presensi/rekap-bulanan-tendik"
    />
  );
}
