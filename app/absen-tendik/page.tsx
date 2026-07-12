"use client";

import { AbsenStafPage } from "@/components/absen-staf-page";

export default function AbsenTendikPage() {
  return (
    <AbsenStafPage
      title="Absen Tendik"
      noun="tendik"
      listEndpoint="/presensi/absentendik"
      optionsEndpoint="/data/tendik"
    />
  );
}
