export interface GoogleCredentials {
  client_id: string;
  client_secret: string;
  developer_token: string;
  login_customer_id: string;
  refresh_token: string;
  customer_id: string;
}

export const CAMPAIGN_STATUS: Record<number, string> = {
  2: "ENABLED",
  3: "PAUSED",
  4: "REMOVED",
};

export const MATCH_TYPE: Record<number, string> = {
  2: "BROAD",
  3: "PHRASE",
  4: "EXACT",
};

export const MATCH_TYPE_MAP: Record<string, number> = {
  EXACT: 4,
  PHRASE: 3,
  BROAD: 2,
};

export interface GoogleCampaign {
  campaign: {
    id: string;
    name: string;
    status: number;
    advertising_channel_type: number;
    bidding_strategy_type: number;
  };
  campaign_budget: { amount_micros: number };
  metrics: {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
    ctr: number;
    average_cpc: number;
  };
}

export interface GoogleAdGroup {
  ad_group: {
    id: string;
    name: string;
    status: number;
    cpc_bid_micros: number;
  };
  metrics: {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
  };
}

export interface GoogleKeyword {
  ad_group_criterion: {
    keyword: { text: string; match_type: number };
    status: number;
    quality_info: { quality_score: number };
  };
  metrics: {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
    ctr: number;
  };
}

export interface GoogleAd {
  ad_group_ad: {
    ad: {
      id: string;
      name: string;
      type: number;
      responsive_search_ad: {
        headlines: Array<{ text: string }>;
        descriptions: Array<{ text: string }>;
      };
      final_urls: string[];
    };
    status: number;
    policy_summary: { approval_status: number };
  };
  campaign: { name: string };
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    conversions: number;
  };
}

export interface GoogleReportRow {
  segments: { date: string };
  metrics: {
    impressions: number;
    clicks: number;
    cost_micros: number;
    conversions: number;
    ctr: number;
    average_cpc: number;
    cost_per_conversion: number;
  };
}
