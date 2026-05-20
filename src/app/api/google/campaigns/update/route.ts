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
  campaign_id: z.string(),
  updates: z.object({
    name: z.string().optional(),
    status: z.enum(["ENABLED", "PAUSED"]).optional(),
    daily_budget: z.number().optional(),
    budget_resource_name: z.string().optional(),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const customer = getCustomer(body.credentials);
    const { campaign_id, updates, credentials } = body;

    const updatePayload: Record<string, unknown> = {
      resource_name: `customers/${credentials.customer_id.replace(/-/g, "")}/campaigns/${campaign_id}`,
    };
    if (updates.name) updatePayload.name = updates.name;
    if (updates.status) updatePayload.status = updates.status === "ENABLED" ? 2 : 3;

    if (updates.daily_budget && updates.budget_resource_name) {
      await customer.campaignBudgets.update([{
        resource_name: updates.budget_resource_name,
        amount_micros: updates.daily_budget * 1_000_000,
      }]);
    }

    const result = await customer.campaigns.update([updatePayload]);
    return apiSuccess({ result, message: "Campaign updated successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}
