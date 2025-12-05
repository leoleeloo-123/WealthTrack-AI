export interface AssetItem {
  id: string;
  category: string; // e.g., "Bank", "Stock", "Real Estate", "Loan"
  name: string;     // e.g., "BOA", "Tesla", "Apt 4B"
  value: number;    // The numeric value
  currency: string; // e.g., "USD", "EUR", "CNY"
  tags: string[];   // For extra filtering, e.g., "Liquid", "Long-term"
}

export interface Snapshot {
  id: string;
  date: string; // ISO Date string
  familyMember: string; // e.g. "Dad", "Mom", "Kid"
  items: AssetItem[];
  note?: string;
  totalValue: number; // This is a raw sum, simplified for now
}

export interface ChartDataPoint {
  date: string;
  total: number;
  [key: string]: number | string; // Dynamic keys for breakdown
}

export type ViewMode = 'dashboard' | 'history' | 'analysis' | 'settings' | 'bulk' | 'dataManagement';