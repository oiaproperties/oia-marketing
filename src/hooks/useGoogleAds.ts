"use client";
import { useState, useCallback } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import type { GoogleCredentials } from "@/types/google";

type FetchState<T> = { data: T | null; loading: boolean; error: string | null };

function useGoogleFetch<T>(
  path: string,
  extraBody?: Record<string, unknown>
): FetchState<T> & { refetch: () => Promise<void> } {
  const { google } = useCredentialsStore();
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null });

  const refetch = useCallback(async () => {
    if (!google) { setState(s => ({ ...s, error: "Google credentials not configured. Go to Setup." })); return; }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: google, ...extraBody }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Request failed");
      setState({ data: json.data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: e instanceof Error ? e.message : "Unknown error" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [google, path, JSON.stringify(extraBody)]);

  return { ...state, refetch };
}

export function useGoogleCustomers() {
  return useGoogleFetch("/api/google/customers");
}

export function useGoogleCampaigns() {
  return useGoogleFetch("/api/google/campaigns");
}

export function useGoogleAdGroups(campaign_id?: string) {
  return useGoogleFetch("/api/google/adgroups", campaign_id ? { campaign_id } : undefined);
}

export function useGoogleKeywords(campaign_id?: string) {
  return useGoogleFetch("/api/google/keywords", campaign_id ? { campaign_id } : undefined);
}

export function useGoogleAds(campaign_id?: string) {
  return useGoogleFetch("/api/google/ads", campaign_id ? { campaign_id } : undefined);
}

export function useGoogleReport(date_range = "LAST_30_DAYS") {
  return useGoogleFetch("/api/google/report", { date_range });
}

export async function googleAction(
  path: string,
  credentials: GoogleCredentials,
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials, ...body }),
  });
  return res.json();
}
