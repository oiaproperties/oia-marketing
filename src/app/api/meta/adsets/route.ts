import { NextRequest } from "next/server";
import { z } from "zod";
import { metaFetch } from "@/lib/meta-ads";
import { apiSuccess, handleApiError } from "@/lib/api";
import type { MetaAdSet } from "@/types/meta";

const bodySchema = z.object({
  credentials: z.object({
    access_token: z.string(), app_id: z.string(),
    app_secret: z.string(), ad_account_id: z.string(),
  }),
  campaign_id: z.string().optional(),
  adset: z.object({
    name: z.string().min(1),
    campaign_id: z.string().min(1),
    daily_budget: z.string(),
    optimization_goal: z.string().default("LEAD_GENERATION"),
    billing_event: z.string().default("IMPRESSIONS"),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
    targeting: z.record(z.string(), z.unknown()).optional(),
  }).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const { credentials, adset } = body;

    if (adset) {
      const result = await metaFetch<{ id: string }>(
        `${credentials.ad_account_id}/adsets`,
        credentials,
        {
          method: "POST",
          body: {
            name: adset.name,
            campaign_id: adset.campaign_id,
            daily_budget: adset.daily_budget,
            optimization_goal: adset.optimization_goal,
            billing_event: adset.billing_event,
            status: adset.status,
            targeting: adset.targeting ?? { geo_locations: { countries: ["AE"] } },
          },
        }
      );
      return apiSuccess({ result, message: `Ad Set "${adset.name}" created` });
    }

    const params: Record<string, string> = {
      fields: "id,name,status,campaign_id,daily_budget,lifetime_budget,optimization_goal,billing_event",
      limit: "50",
    };
    if (body.campaign_id) params.campaign_id = body.campaign_id;

    const data = await metaFetch<{ data: MetaAdSet[] }>(
      `${credentials.ad_account_id}/adsets`,
      credentials,
      { params }
    );
    return apiSuccess({ adsets: data.data });
  } catch (err) {
    return handleApiError(err);
  }
}
