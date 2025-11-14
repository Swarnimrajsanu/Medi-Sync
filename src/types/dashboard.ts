export interface DashboardModule {
  id: string;
  title: string;
  description: string;
  icon: string;
  href: string;
  color: string;
}

export interface RecentActivity {
  id: string;
  type: "sos" | "recovery" | "report" | "payment" | "surgery" | "ai";
  title: string;
  description: string;
  timestamp: string;
  href?: string;
}

