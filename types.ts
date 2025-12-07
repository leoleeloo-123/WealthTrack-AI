
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

export interface IncomeRecord {
  id: string;
  date: string;
  category: string; // e.g., "Dividend", "Interest", "Rent"
  name: string;     // e.g., "Apple Stock", "US T-Bill"
  value: number;
  familyMember: string; // Added for consistency
  currency: string;
}

export interface StockPosition {
  id: string;
  ticker: string;     // e.g. AAPL
  quantity: number;   // e.g. 10
  avgCost: number;    // e.g. 150.00
  currentPrice: number; // e.g. 175.00 (User updated)
  currency: string;   // e.g. USD
}

export interface ChartDataPoint {
  date: string;
  total: number;
  [key: string]: number | string; // Dynamic keys for breakdown
}

export type ViewMode = 'dashboard' | 'history' | 'masterDatabase' | 'investmentIncome' | 'stockMarket' | 'analysis' | 'settings' | 'bulk' | 'dataManagement';

export type Language = 'en' | 'zh';
export type Theme = 'light' | 'dark';
