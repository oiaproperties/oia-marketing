import { NextRequest } from "next/server";
import { z } from "zod";
import { getCustomer } from "@/lib/google-ads";
import { apiSuccess, handleApiError } from "@/lib/api";

const credSchema = z.object({
  client_id: z.string(), client_secret: z.string(),
  developer_token: z.string(), login_customer_id: z.string(),
  refresh_token: z.string(), customer_id: z.string(),
});
const bodySchema = z.object({ credentials: credSchema });

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const customer = getCustomer(body.credentials);
    const campaigns = await customer.query(`
      SELECT
        campaign.id, campaign.name, campaign.status,
        campaign.advertising_channel_type, campaign.bidding_strategy_type,
        campaign_budget.amount_micros,
        metrics.impressions, metrics.clicks, metrics.cost_micros,
        metrics.conversions, metrics.ctr, metrics.average_cpc
      FROM campaign
      WHERE segments.date DURING LAST_30_DAYS
      ORDER BY metrics.cost_micros DESC
    `);
    return apiSuccess({ campaigns });
  } catch (err) {
    return handleApiError(err);
  }
}
