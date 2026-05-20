export interface MetaCredentials {
  access_token: string;
  app_id: string;
  app_secret: string;
  ad_account_id: string; // format: act_XXXXXXXXX
}

export interface MetaCampaign {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  objective: string;
  daily_budget?: string;
  lifetime_budget?: string;
  start_time?: string;
  stop_time?: string;
}

export interface MetaAdSet {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  campaign_id: string;
  daily_budget?: string;
  lifetime_budget?: string;
  targeting?: Record<string, unknown>;
  optimization_goal?: string;
  billing_event?: string;
}

export interface MetaAd {
  id: string;
  name: string;
  status: "ACTIVE" | "PAUSED" | "DELETED" | "ARCHIVED";
  campaign_id?: string;
  adset_id?: string;
  creative?: {
    id: string;
    name?: string;
    thumbnail_url?: string;
  };
}

export interface MetaInsights {
  spend: string;
  impressions: string;
  clicks: string;
  reach?: string;
  cpm?: string;
  ctr?: string;
  actions?: Array<{ action_type: string; value: string }>;
  date_start?: string;
  date_stop?: string;
}

export const META_OBJECTIVES = [
  "LEAD_GENERATION",
  "CONVERSIONS",
  "REACH",
  "BRAND_AWARENESS",
  "TRAFFIC",
  "ENGAGEMENT",
  "APP_INSTALLS",
  "VIDEO_VIEWS",
] as const;

export type MetaObjective = (typeof META_OBJECTIVES)[number];
