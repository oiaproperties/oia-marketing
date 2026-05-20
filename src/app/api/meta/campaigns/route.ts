import { NextRequest } from "next/server";
import { z } from "zod";
import { metaFetch } from "@/lib/meta-ads";
import { apiSuccess, handleApiError } from "@/lib/api";
import type { MetaCampaign } from "@/types/meta";

const credSchema = z.object({
  access_token: z.string().min(1),
  app_id: z.string(),
  app_secret: z.string(),
  ad_account_id: z.string().min(1),
});

const bodySchema = z.object({
  credentials: credSchema,
  campaign: z.object({
    name: z.string().min(1),
    objective: z.string().min(1),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
    daily_budget: z.string().optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const { credentials, campaign } = body;

    if (campaign) {
      const result = await metaFetch<{ id: string }>(
        `${credentials.ad_account_id}/campaigns`,
        credentials,
        {
          method: "POST",
          body: {
            name: campaign.name,
            objective: campaign.objective,
            status: campaign.status,
            ...(campaign.daily_budget ? { daily_budget: campaign.daily_budget } : {}),
            special_ad_categories: [],
          },
        }
      );
      return apiSuccess({ result, message: `Campaign "${campaign.name}" created` });
    }

    const data = await metaFetch<{ data: MetaCampaign[] }>(
      `${credentials.ad_account_id}/campaigns`,
      credentials,
      {
        params: {
          fields: "id,name,status,objective,daily_budget,lifetime_budget,start_time,stop_time",
          limit: "50",
        },
      }
    );
    return apiSuccess({ campaigns: data.data });
  } catch (err) {
    return handleApiError(err);
  }
}
