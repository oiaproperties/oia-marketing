"use client";
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { GoogleCredentials } from "@/types/google";
import type { MetaCredentials } from "@/types/meta";
import { normalizeMetaAccountId } from "@/lib/credentials";

interface CredentialsState {
  google: GoogleCredentials | null;
  meta: MetaCredentials | null;
  isGoogleConnected: boolean;
  isMetaConnected: boolean;
  setGoogle: (creds: GoogleCredentials) => void;
  setMeta: (creds: MetaCredentials) => void;
  clearGoogle: () => void;
  clearMeta: () => void;
  clearAll: () => void;
}

export const useCredentialsStore = create<CredentialsState>()(
  persist(
    (set) => ({
      google: null,
      meta: null,
      isGoogleConnected: false,
      isMetaConnected: false,
      setGoogle: (creds) =>
        set({ google: creds, isGoogleConnected: true }),
      setMeta: (creds) =>
        set({
          meta: {
            ...creds,
            ad_account_id: normalizeMetaAccountId(creds.ad_account_id),
          },
          isMetaConnected: true,
        }),
      clearGoogle: () => set({ google: null, isGoogleConnected: false }),
      clearMeta: () => set({ meta: null, isMetaConnected: false }),
      clearAll: () =>
        set({ google: null, meta: null, isGoogleConnected: false, isMetaConnected: false }),
    }),
    { name: "oia_ads_credentials" }
  )
);
