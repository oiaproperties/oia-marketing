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
  campaign: z.object({
    name: z.string().min(1),
    daily_budget: z.number().positive(),
    type: z.enum(["SEARCH", "DISPLAY"]).default("SEARCH"),
    bidding_strategy: z.string().default("MAXIMIZE_CONVERSIONS"),
    start_date: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const customer = getCustomer(body.credentials);
    const { campaign } = body;

    const budgetResult = await customer.campaignBudgets.create([{
      name: `${campaign.name} Budget`,
      amount_micros: campaign.daily_budget * 1_000_000,
      delivery_method: 2,
    }]);
    const budgetId = budgetResult.results[0].resource_name;

    const campaignResult = await customer.campaigns.create([{
      name: campaign.name,
      status: 3, // PAUSED — safe default
      advertising_channel_type: campaign.type === "SEARCH" ? 2 : 3,
      campaign_budget: budgetId,
      bidding_strategy_type: campaign.bidding_strategy === "MAXIMIZE_CONVERSIONS" ? 10 : 3,
      network_settings: {
        target_google_search: true,
        target_search_network: true,
        target_content_network: false,
      },
      start_date: campaign.start_date
        ?? new Date().toISOString().slice(0, 10).replace(/-/g, ""),
    }]);

    return apiSuccess({ result: campaignResult, message: `Campaign "${campaign.name}" created (PAUSED)` });
  } catch (err) {
    return handleApiError(err);
  }
}
