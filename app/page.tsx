"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getUser, isAllowedPiket } from "@/lib/auth";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    router.replace(isAllowedPiket(user) ? "/dashboard" : "/login");
  }, [router]);

  return null;
}
