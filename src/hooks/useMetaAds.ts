"use client";
import { useState, useCallback } from "react";
import { useCredentialsStore } from "@/store/credentialsStore";
import type { MetaCredentials } from "@/types/meta";

type FetchState<T> = { data: T | null; loading: boolean; error: string | null };

function useMetaFetch<T>(
  path: string,
  params?: Record<string, string>
): FetchState<T> & { refetch: () => Promise<void> } {
  const { meta } = useCredentialsStore();
  const [state, setState] = useState<FetchState<T>>({ data: null, loading: false, error: null });

  const refetch = useCallback(async () => {
    if (!meta) { setState(s => ({ ...s, error: "Meta credentials not configured. Go to Setup." })); return; }
    setState(s => ({ ...s, loading: true, error: null }));
    try {
      const url = new URL(path, window.location.origin);
      if (params) {
        for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
      }
      const res = await fetch(url.toString(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credentials: meta }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Request failed");
      setState({ data: json.data, loading: false, error: null });
    } catch (e) {
      setState({ data: null, loading: false, error: e instanceof Error ? e.message : "Unknown error" });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meta, path, JSON.stringify(params)]);

  return { ...state, refetch };
}

export function useMetaCampaigns() {
  return useMetaFetch("/api/meta/campaigns");
}

export function useMetaAdSets(campaign_id?: string) {
  return useMetaFetch("/api/meta/adsets", campaign_id ? { campaign_id } : undefined);
}

export function useMetaAds(campaign_id?: string) {
  return useMetaFetch("/api/meta/ads", campaign_id ? { campaign_id } : undefined);
}

export function useMetaInsights(date_preset = "last_30_days") {
  return useMetaFetch("/api/meta/insights", { date_preset });
}

export async function metaAction(
  path: string,
  credentials: MetaCredentials,
  body: Record<string, unknown>
): Promise<{ success: boolean; error?: string; data?: unknown }> {
  const res = await fetch(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credentials, ...body }),
  });
  return res.json();
}
