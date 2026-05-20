import type { GoogleCredentials } from "@/types/google";
import type { MetaCredentials } from "@/types/meta";

export type { GoogleCredentials, MetaCredentials };

export function getGoogleCredsFromEnv(): GoogleCredentials | null {
  const c = {
    client_id:         process.env.GOOGLE_CLIENT_ID ?? "",
    client_secret:     process.env.GOOGLE_CLIENT_SECRET ?? "",
    developer_token:   process.env.GOOGLE_DEVELOPER_TOKEN ?? "",
    login_customer_id: process.env.GOOGLE_LOGIN_CUSTOMER_ID ?? "",
    refresh_token:     process.env.GOOGLE_REFRESH_TOKEN ?? "",
    customer_id:       process.env.GOOGLE_CUSTOMER_ID ?? "",
  };
  return Object.values(c).every(Boolean) ? c : null;
}

export function getMetaCredsFromEnv(): MetaCredentials | null {
  const c = {
    access_token:   process.env.META_ACCESS_TOKEN ?? "",
    app_id:         process.env.META_APP_ID ?? "",
    app_secret:     process.env.META_APP_SECRET ?? "",
    ad_account_id:  process.env.META_AD_ACCOUNT_ID ?? "",
  };
  return Object.values(c).every(Boolean) ? c : null;
}

export function normalizeMetaAccountId(id: string): string {
  return id.startsWith("act_") ? id : `act_${id}`;
}
