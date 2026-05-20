import { NextRequest } from "next/server";
import { z } from "zod";
import { getGoogleClient } from "@/lib/google-ads";
import { apiSuccess, handleApiError } from "@/lib/api";

const credSchema = z.object({
  client_id: z.string().min(1),
  client_secret: z.string().min(1),
  developer_token: z.string().min(1),
  login_customer_id: z.string().min(1),
  refresh_token: z.string().min(1),
  customer_id: z.string(),
});

const bodySchema = z.object({ credentials: credSchema });

export async function POST(req: NextRequest) {
  try {
    const body = bodySchema.parse(await req.json());
    const client = getGoogleClient(body.credentials);
    const customers = await client.listAccessibleCustomers(body.credentials.refresh_token);
    return apiSuccess({ customers });
  } catch (err) {
    return handleApiError(err);
  }
}
