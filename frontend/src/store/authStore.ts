import { create } from "zustand";
import { setAccessToken } from "@/lib/api";

interface AuthState {
  userId: string | null;
  role: string | null;
  isLoggedIn: boolean;
  login: (accessToken: string, userId: string, role: string) => void;
  logout: () => void;
  setAuth: (userId: string | null, role: string | null, isLoggedIn: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  userId: typeof window !== "undefined" ? localStorage.getItem("user_id") : null,
  role: typeof window !== "undefined" ? localStorage.getItem("role") : null,
  isLoggedIn: typeof window !== "undefined" ? !!localStorage.getItem("user_id") : false,
  login: (token, userId, role) => {
    setAccessToken(token);
    localStorage.setItem("user_id", userId);
    localStorage.setItem("role", role);
    set({ userId, role, isLoggedIn: true });
  },
  logout: () => {
    setAccessToken(null);
    localStorage.removeItem("user_id");
    localStorage.removeItem("role");
    set({ userId: null, role: null, isLoggedIn: false });
  },
  setAuth: (userId, role, isLoggedIn) => {
    set({ userId, role, isLoggedIn });
  }
}));
