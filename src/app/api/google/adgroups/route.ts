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
    const customerId = body.credentials.customer_id.replace(/-/g, "");

    const query = body.campaign_id
      ? `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros,
           metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
         FROM ad_group WHERE ad_group.campaign = 'customers/${customerId}/campaigns/${body.campaign_id}'
         AND segments.date DURING LAST_30_DAYS`
      : `SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.cpc_bid_micros,
           metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
         FROM ad_group WHERE segments.date DURING LAST_30_DAYS
         ORDER BY metrics.cost_micros DESC LIMIT 50`;

    const adGroups = await customer.query(query);
    return apiSuccess({ adGroups });
  } catch (err) {
    return handleApiError(err);
  }
}
