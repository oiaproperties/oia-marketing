"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UiState {
  theme: "dark" | "light";
  toggleTheme: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      theme: "dark",
      toggleTheme: () => set({ theme: get().theme === "dark" ? "light" : "dark" }),
    }),
    { name: "oia_ads_ui" }
  )
);
