"use client";

import { AbsenStafPage } from "@/components/absen-staf-page";

export default function AbsenGuruPage() {
  return (
    <AbsenStafPage
      title="Absen Guru"
      noun="guru"
      listEndpoint="/presensi/absenguru"
      optionsEndpoint="/data/guru"
    />
  );
}
