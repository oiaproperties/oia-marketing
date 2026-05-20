import { NextRequest } from "next/server";
import { z } from "zod";
import { getCustomer } from "@/lib/google-ads";
import { apiSuccess, handleApiError } from "@/lib/api";
import { MATCH_TYPE_MAP } from "@/types/google";

const bodySchema = z.object({
  credentials: z.object({
    client_id: z.string(), client_secret: z.string(),
    developer_token: z.string(), login_customer_id: z.string(),
    refresh_token: z.string(), customer_id: z.string(),
  }),
  ad_group_id: z.string().min(1),
  keywords: z.array(z.object({
    text: z.string().min(1),
    match_type: z.enum(["EXACT", "PHRASE", "BROAD"]).default("PHRASE"),
  })),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const customer = getCustomer(body.credentials);
    const customerId = body.credentials.customer_id.replace(/-/g, "");

    const payloads = body.keywords.map(kw => ({
      ad_group: `customers/${customerId}/adGroups/${body.ad_group_id}`,
      status: 2,
      keyword: {
        text: kw.text,
        match_type: MATCH_TYPE_MAP[kw.match_type] ?? 3,
      },
    }));

    const result = await customer.adGroupCriteria.create(payloads);
    return apiSuccess({ result, message: `${body.keywords.length} keyword(s) added successfully` });
  } catch (err) {
    return handleApiError(err);
  }
}
