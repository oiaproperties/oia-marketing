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

    const keywords = await customer.query(`
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.quality_info.quality_score,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.ctr
      FROM keyword_view
      WHERE segments.date DURING LAST_30_DAYS
      ${body.campaign_id ? `AND campaign.id = ${body.campaign_id}` : ""}
      ORDER BY metrics.cost_micros DESC LIMIT 100
    `);

    return apiSuccess({ keywords });
  } catch (err) {
    return handleApiError(err);
  }
}
