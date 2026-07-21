import { logout } from "@/lib/auth";

export const API_URL = process.env.NEXT_PUBLIC_API_URL;

export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token_piket") : null;

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  const res = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: {
      ...(!isFormData && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    // Token expired/invalid: backend membalas 401 - langsung logout & lempar
    // ke login daripada membiarkan user terjebak di halaman yang terus gagal fetch.
    if (res.status === 401 && typeof window !== "undefined") {
      logout();
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    throw new Error(data?.message || "Terjadi kesalahan");
  }

  return data;
};
