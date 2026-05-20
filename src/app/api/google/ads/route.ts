import { NextRequest } from "next/server";
import { z } from "zod";
import { getCustomer } from "@/lib/google-ads";
import { apiSuccess, handleApiError } from "@/lib/api";

const bodySchema = z.object({
  credentials: z.object({
    client_id: z.string(), client_secret: z.string(),
    developer_token: z.string(), login_customer_id: z.string(),
    refresh_token: z.string(), customer_id: z.string(),
  }),
  campaign_id: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const customer = getCustomer(body.credentials);

    const ads = await customer.query(`
      SELECT
        ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type,
        ad_group_ad.status, ad_group_ad.policy_summary.approval_status,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group_ad.ad.final_urls, campaign.name,
        metrics.impressions, metrics.clicks, metrics.ctr, metrics.conversions
      FROM ad_group_ad
      WHERE segments.date DURING LAST_30_DAYS
      ${body.campaign_id ? `AND campaign.id = ${body.campaign_id}` : ""}
      ORDER BY metrics.impressions DESC LIMIT 50
    `);

    return apiSuccess({ ads });
  } catch (err) {
    return handleApiError(err);
  }
}
