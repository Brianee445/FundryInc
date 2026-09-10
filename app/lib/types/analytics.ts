export interface DailyCount {
  date: string;
  count: number;
}

export interface FounderAnalytics {
  profile_views_total: number;
  profile_views_daily: DailyCount[];
  connection_requests_total: number;
  connection_requests_pending: number;
  connection_requests_accepted: number;
  connection_requests_declined: number;
  connection_requests_daily: DailyCount[];
  saved_by_investors_count: number;
  messages_total: number;
}

export interface InvestorAnalytics {
  connection_requests_sent_total: number;
  connection_requests_pending: number;
  connection_requests_accepted: number;
  connection_requests_declined: number;
  connection_requests_daily: DailyCount[];
  saved_founders_count: number;
  messages_total: number;
}
