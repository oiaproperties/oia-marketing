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
  adGroup: z.object({
    name: z.string().min(1),
    campaign_id: z.string().min(1),
    cpc_bid: z.number().positive().default(1),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const customer = getCustomer(body.credentials);
    const customerId = body.credentials.customer_id.replace(/-/g, "");
    const { adGroup } = body;

    const result = await customer.adGroups.create([{
      name: adGroup.name,
      campaign: `customers/${customerId}/campaigns/${adGroup.campaign_id}`,
      status: 2,
      cpc_bid_micros: adGroup.cpc_bid * 1_000_000,
    }]);

    return apiSuccess({ result, message: `Ad Group "${adGroup.name}" created successfully` });
  } catch (err) {
    return handleApiError(err);
  }
}
