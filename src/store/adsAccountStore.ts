"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface PlatformAccount {
  accessToken: string;
  advertiserId: string;
  accountName?: string;
}

interface AdsAccountState {
  snapchat: PlatformAccount | null;
  tiktok: PlatformAccount | null;
  linkedin: PlatformAccount | null;
  setSnapchat: (acc: PlatformAccount) => void;
  setTiktok: (acc: PlatformAccount) => void;
  setLinkedin: (acc: PlatformAccount) => void;
  clearSnapchat: () => void;
  clearTiktok: () => void;
  clearLinkedin: () => void;
}

export const useAdsAccountStore = create<AdsAccountState>()(
  persist(
    (set) => ({
      snapchat: null,
      tiktok: null,
      linkedin: null,
      setSnapchat: (acc) => set({ snapchat: acc }),
      setTiktok: (acc) => set({ tiktok: acc }),
      setLinkedin: (acc) => set({ linkedin: acc }),
      clearSnapchat: () => set({ snapchat: null }),
      clearTiktok: () => set({ tiktok: null }),
      clearLinkedin: () => set({ linkedin: null }),
    }),
    { name: "oia_ads_accounts" }
  )
);
