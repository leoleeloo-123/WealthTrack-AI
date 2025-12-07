import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { IncomeRecord, Language } from '../types';
import { Card } from './ui/Card';
import { translations } from '../utils/translations';

interface InvestmentIncomeViewProps {
  incomeRecords: IncomeRecord[];
  language: Language;
}

// Consistent Color Palette matching Dashboard
const COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#06b6d4", "#84cc16"];

// Deterministic color assignment based on string value
const getCategoryColor = (category: string) => {
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLORS.length;
  return COLORS[index];
};

export const InvestmentIncomeView: React.FC<InvestmentIncomeViewProps> = ({ incomeRecords, language }) => {
  const [filterYear, setFilterYear] = useState('All');
  const [filterCategory, setFilterCategory] = useState('All');
  const t = translations[language];

  // Derive Data
  const { chartData, pieData, kpi, years, availableCategories } = useMemo(() => {
    const currentYearStr = new Date().getFullYear().toString();
    const isSpecificYear = filterYear !== 'All';
    
    // 1. Collect all available options for dropdowns (from full dataset)
    const uniqueYears = new Set<string>();
    const uniqueCategories = new Set<string>();
    incomeRecords.forEach(rec => {
      uniqueYears.add(rec.date.substring(0, 4));
      uniqueCategories.add(rec.category);
    });
    
    // Aggregation maps
    const byMonth: Record<string, { date: string; [key: string]: number | string }> = {};
    const byCategory: Record<string, number> = {};
    
    let totalFiltered = 0;
    let totalYTD = 0;
    let countInFiltered = 0;

    incomeRecords.forEach(rec => {
      const year = rec.date.substring(0, 4);
      
      // Calculate YTD separately regardless of filter (for the "Current YTD" card context)
      // Note: If user filters by Category, YTD should probably reflect that category too.
      // So we apply category filter to YTD calculation as well.
      if (year === currentYearStr) {
         if (filterCategory === 'All' || rec.category === filterCategory) {
            totalYTD += rec.value;
         }
      }

      // --- Main Filter Logic ---
      if (isSpecificYear && year !== filterYear) return;
      if (filterCategory !== 'All' && rec.category !== filterCategory) return;

      // KPI for filtered set
      totalFiltered += rec.value;
      countInFiltered++;

      // Bar Chart Data (Group by Month)
      const monthKey = rec.date.substring(0, 7); // YYYY-MM
      if (!byMonth[monthKey]) {
        byMonth[monthKey] = { date: monthKey };
      }
      byMonth[monthKey][rec.category] = (Number(byMonth[monthKey][rec.category]) || 0) + rec.value;

      // Pie Chart Data (Group by Category)
      byCategory[rec.category] = (byCategory[rec.category] || 0) + rec.value;
    });

    // Format Bar Data
    let barData: any[] = [];
    if (isSpecificYear) {
        // If specific year, force all 12 months (01-12)
        for (let i = 1; i <= 12; i++) {
            const m = i < 10 ? `0${i}` : `${i}`;
            const key = `${filterYear}-${m}`;
            if (byMonth[key]) {
                barData.push(byMonth[key]);
            } else {
                barData.push({ date: key }); // Empty month
            }
        }
    } else {
        // Show all months present in data sorted
        const sortedMonths = Object.keys(byMonth).sort();
        barData = sortedMonths.map(m => byMonth[m]);
    }
    
    // Format Pie Data
    const pieDataList = Object.keys(byCategory).map(cat => ({
      name: cat,
      value: byCategory[cat]
    })).sort((a, b) => b.value - a.value);

    // Calculate Monthly Avg
    let divisor = 1;
    if (filterYear === 'All') {
        divisor = Object.keys(byMonth).length || 1; // Avg over active months
    } else {
        if (filterYear === currentYearStr) {
            // For current year, avg over elapsed months
            const currentMonth = new Date().getMonth() + 1; // 1-12
            divisor = currentMonth;
        } else {
            // Past year: always divide by 12
            divisor = 12;
        }
    }
    const monthlyAvg = totalFiltered / divisor;

    return {
      years: Array.from(uniqueYears).sort().reverse(),
      availableCategories: Array.from(uniqueCategories).sort(),
      chartData: barData,
      pieData: pieDataList,
      kpi: {
        total: totalFiltered,
        ytd: totalYTD,
        monthlyAvg,
        transactionCount: countInFiltered
      }
    };
  }, [incomeRecords, filterYear, filterCategory]);

  // Extract keys for stacking bars
  const barKeys = useMemo(() => {
    const keys = new Set<string>();
    chartData.forEach(d => {
      Object.keys(d).forEach(k => {
        if (k !== 'date') keys.add(k);
      });
    });
    return Array.from(keys);
  }, [chartData]);

  // Determine what to show in the second KPI card
  const currentYearStr = new Date().getFullYear().toString();
  const showYTD = filterYear === 'All' || filterYear === currentYearStr;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-4 transition-colors">
        
        {/* Year Filter */}
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Year:</span>
            <select 
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
            >
            <option value="All">All Time</option>
            {years.map(y => (
                <option key={y} value={y}>{y}</option>
            ))}
            </select>
        </div>

        {/* Category Filter */}
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.category}:</span>
            <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
            >
            <option value="All">All</option>
            {availableCategories.map(c => (
                <option key={c} value={c}>{c}</option>
            ))}
            </select>
        </div>

        {(filterYear !== 'All' || filterCategory !== 'All') && (
            <button 
                onClick={() => { setFilterYear('All'); setFilterCategory('All'); }}
                className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                title="Clear Filters"
            >
                ✕
            </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 border-emerald-100 dark:border-emerald-800">
          <div className="text-emerald-800 dark:text-emerald-300">
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">{filterYear === 'All' ? t.totalIncome : `Total Income (${filterYear})`}</h3>
            <p className="text-3xl font-bold font-mono">${kpi.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-slate-800 dark:text-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                {showYTD ? `${t.ytdIncome} (Current)` : 'Transactions'}
            </h3>
            <p className="text-3xl font-bold font-mono">
                {showYTD ? `$${kpi.ytd.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : kpi.transactionCount}
            </p>
          </div>
        </Card>
        
        <Card>
          <div className="text-slate-800 dark:text-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.monthlyAvg}</h3>
            <p className="text-3xl font-bold font-mono">${kpi.monthlyAvg.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <Card title={t.incomeHistory} className="lg:col-span-2">
           <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `${val/1000}k`} />
                <Tooltip 
                  cursor={{ fill: 'transparent' }}
                  contentStyle={{ backgroundColor: 'var(--tw-bg-opacity, #fff)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                  formatter={(value: number) => `$${value.toLocaleString()}`}
                />
                <Legend />
                {barKeys.map((key, index) => (
                  <Bar key={key} dataKey={key} stackId="a" fill={getCategoryColor(key)} />
                ))}
              </BarChart>
            </ResponsiveContainer>
           </div>
        </Card>

        {/* Pie Chart */}
        <Card title={t.incomeBreakdown}>
           <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getCategoryColor(entry.name)} stroke="rgba(255,255,255,0.2)" />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toLocaleString()}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
           </div>
        </Card>
      </div>

      {/* Recent Records Table */}
      <Card title={t.recentIncome}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">{t.date}</th>
                <th className="px-4 py-3">{t.category}</th>
                <th className="px-4 py-3">{t.source}</th>
                <th className="px-4 py-3 text-right">{t.value}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {[...incomeRecords]
                .filter(rec => filterYear === 'All' || rec.date.startsWith(filterYear))
                .filter(rec => filterCategory === 'All' || rec.category === filterCategory)
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10) // Show last 10
                .map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 whitespace-nowrap">{rec.date}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs" style={{ color: getCategoryColor(rec.category), backgroundColor: getCategoryColor(rec.category) + '20' }}>
                      {rec.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-slate-700 dark:text-slate-200">{rec.name}</td>
                  <td className="px-4 py-3 text-right font-mono text-emerald-600 dark:text-emerald-400">
                    +${rec.value.toLocaleString()}
                  </td>
                </tr>
              ))}
              {incomeRecords.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-slate-400">
                    {t.noRecords}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

    </div>
  );
};