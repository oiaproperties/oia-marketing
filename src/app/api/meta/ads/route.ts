import { NextRequest } from "next/server";
import { z } from "zod";
import { metaFetch } from "@/lib/meta-ads";
import { apiSuccess, handleApiError } from "@/lib/api";
import type { MetaAd } from "@/types/meta";

const bodySchema = z.object({
  credentials: z.object({
    access_token: z.string(), app_id: z.string(),
    app_secret: z.string(), ad_account_id: z.string(),
  }),
  campaign_id: z.string().optional(),
  adset_id: z.string().optional(),
  ad: z.object({
    name: z.string().min(1),
    adset_id: z.string().min(1),
    creative_id: z.string().optional(),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const { credentials, ad } = body;

    if (ad) {
      const result = await metaFetch<{ id: string }>(
        `${credentials.ad_account_id}/ads`,
        credentials,
        {
          method: "POST",
          body: {
            name: ad.name,
            adset_id: ad.adset_id,
            status: ad.status,
            ...(ad.creative_id ? { creative: { creative_id: ad.creative_id } } : {}),
          },
        }
      );
      return apiSuccess({ result, message: `Ad "${ad.name}" created` });
    }

    const params: Record<string, string> = {
      fields: "id,name,status,campaign_id,adset_id,creative{id,name,thumbnail_url}",
      limit: "50",
    };
    if (body.campaign_id) params.campaign_id = body.campaign_id;
    if (body.adset_id) params.adset_id = body.adset_id;

    const data = await metaFetch<{ data: MetaAd[] }>(
      `${credentials.ad_account_id}/ads`,
      credentials,
      { params }
    );
    return apiSuccess({ ads: data.data });
  } catch (err) {
    return handleApiError(err);
  }
}
