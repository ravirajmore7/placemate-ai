"use client";

import { create } from "zustand";
import type { User } from "@/lib/types";

type AuthState = {
  user: User | null;
  token: string | null;
  hydrated: boolean;
  hydrate: () => void;
  setSession: (user: User, token: string) => void;
  logout: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  hydrated: false,
  hydrate: () => {
    if (typeof window === "undefined") return;
    const token = window.localStorage.getItem("placemate_token");
    const rawUser = window.localStorage.getItem("placemate_user");
    set({
      token,
      user: rawUser ? (JSON.parse(rawUser) as User) : null,
      hydrated: true
    });
  },
  setSession: (user, token) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("placemate_token", token);
      window.localStorage.setItem("placemate_user", JSON.stringify(user));
    }
    set({ user, token, hydrated: true });
  },
  logout: () => {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem("placemate_token");
      window.localStorage.removeItem("placemate_user");
    }
    set({ user: null, token: null, hydrated: true });
  }
}));
