import { GoogleAdsApi } from "google-ads-api";
import type { GoogleCredentials } from "@/types/google";

export function getGoogleClient(creds: GoogleCredentials) {
  return new GoogleAdsApi({
    client_id:       creds.client_id,
    client_secret:   creds.client_secret,
    developer_token: creds.developer_token,
  });
}

export function getCustomer(creds: GoogleCredentials) {
  const client = getGoogleClient(creds);
  return client.Customer({
    customer_id:   creds.customer_id.replace(/-/g, ""),
    refresh_token: creds.refresh_token,
  });
}

export function getLoginCustomer(creds: GoogleCredentials) {
  const client = getGoogleClient(creds);
  return client.Customer({
    customer_id:   creds.login_customer_id.replace(/-/g, ""),
    refresh_token: creds.refresh_token,
  });
}
