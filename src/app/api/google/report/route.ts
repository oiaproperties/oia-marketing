import { NextRequest } from "next/server";
import { z } from "zod";
import { getCustomer } from "@/lib/google-ads";
import { apiSuccess, handleApiError } from "@/lib/api";

const DATE_RANGES = ["LAST_7_DAYS", "LAST_30_DAYS", "LAST_90_DAYS", "THIS_MONTH", "LAST_MONTH"] as const;

const bodySchema = z.object({
  credentials: z.object({
    client_id: z.string(), client_secret: z.string(),
    developer_token: z.string(), login_customer_id: z.string(),
    refresh_token: z.string(), customer_id: z.string(),
  }),
  date_range: z.enum(DATE_RANGES).default("LAST_30_DAYS"),
});

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const customer = getCustomer(body.credentials);

    const report = await customer.query(`
      SELECT
        segments.date, metrics.impressions, metrics.clicks,
        metrics.cost_micros, metrics.conversions, metrics.ctr,
        metrics.average_cpc, metrics.cost_per_conversion
      FROM customer
      WHERE segments.date DURING ${body.date_range}
      ORDER BY segments.date ASC
    `);

    return apiSuccess({ report });
  } catch (err) {
    return handleApiError(err);
  }
}
