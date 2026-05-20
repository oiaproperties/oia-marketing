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
  ad_group_id: z.string().min(1),
  ad: z.object({
    final_url: z.string().url(),
    headlines: z.array(z.string().min(1)).min(3).max(15),
    descriptions: z.array(z.string().min(1)).min(2).max(4),
  }),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const customer = getCustomer(body.credentials);
    const customerId = body.credentials.customer_id.replace(/-/g, "");
    const { ad } = body;

    const result = await customer.adGroupAds.create([{
      ad_group: `customers/${customerId}/adGroups/${body.ad_group_id}`,
      status: 2,
      ad: {
        final_urls: [ad.final_url],
        responsive_search_ad: {
          headlines:    ad.headlines.map(h => ({ text: h })),
          descriptions: ad.descriptions.map(d => ({ text: d })),
        },
      },
    }]);

    return apiSuccess({ result, message: "Responsive Search Ad created successfully" });
  } catch (err) {
    return handleApiError(err);
  }
}
