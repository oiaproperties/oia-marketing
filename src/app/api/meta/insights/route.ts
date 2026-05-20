import { NextRequest } from "next/server";
import { z } from "zod";
import { metaFetch } from "@/lib/meta-ads";
import { apiSuccess, handleApiError } from "@/lib/api";
import type { MetaInsights } from "@/types/meta";

const DATE_PRESETS = [
  "today", "yesterday", "last_7_days", "last_14_days",
  "last_30_days", "this_month", "last_month",
] as const;

const bodySchema = z.object({
  credentials: z.object({
    access_token: z.string(), app_id: z.string(),
    app_secret: z.string(), ad_account_id: z.string(),
  }),
  date_preset: z.enum(DATE_PRESETS).default("last_30_days"),
  level: z.enum(["account", "campaign", "adset", "ad"]).default("account"),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const { credentials } = body;

    const data = await metaFetch<{ data: MetaInsights[] }>(
      `${credentials.ad_account_id}/insights`,
      credentials,
      {
        params: {
          fields: "spend,impressions,clicks,reach,cpm,ctr,actions,date_start,date_stop",
          date_preset: body.date_preset,
          level: body.level,
        },
      }
    );

    return apiSuccess({ insights: data.data });
  } catch (err) {
    return handleApiError(err);
  }
}
