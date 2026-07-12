import { UserLogin } from "@/types/auth";

export const ALLOWED_ROLES = ["manajemen", "admin"];

export const getUserRole = (user: UserLogin | null) => {
  return user?.role || user?.nama_role || null;
};

export const saveAuth = (token: string, user: UserLogin) => {
  localStorage.setItem("token_piket", token);
  localStorage.setItem("user_piket", JSON.stringify(user));
};

export const getToken = () => {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token_piket");
};

export const getUser = (): UserLogin | null => {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem("user_piket");
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const logout = () => {
  localStorage.removeItem("token_piket");
  localStorage.removeItem("user_piket");
};

export const isAllowedPiket = (user: UserLogin | null) => {
  const role = getUserRole(user);
  return !!role && ALLOWED_ROLES.includes(role);
};

export const isAdmin = (user: UserLogin | null) => getUserRole(user) === "admin";
