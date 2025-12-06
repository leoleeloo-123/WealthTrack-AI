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

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899"];

export const InvestmentIncomeView: React.FC<InvestmentIncomeViewProps> = ({ incomeRecords, language }) => {
  const [filterYear, setFilterYear] = useState('All');
  const t = translations[language];

  // Derive Data
  const { chartData, pieData, kpi } = useMemo(() => {
    const currentYear = new Date().getFullYear().toString();
    const years = new Set<string>();
    
    // Aggregation maps
    const byMonth: Record<string, { date: string; [key: string]: number | string }> = {};
    const byCategory: Record<string, number> = {};
    
    let totalAllTime = 0;
    let totalYTD = 0;

    incomeRecords.forEach(rec => {
      const year = rec.date.substring(0, 4);
      years.add(year);
      
      // Filter logic
      if (filterYear !== 'All' && year !== filterYear) return;

      // KPI
      totalAllTime += rec.value;
      if (year === currentYear) totalYTD += rec.value;

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
    const sortedMonths = Object.keys(byMonth).sort();
    const barData = sortedMonths.map(m => byMonth[m]);
    
    // Format Pie Data
    const pieDataList = Object.keys(byCategory).map(cat => ({
      name: cat,
      value: byCategory[cat]
    })).sort((a, b) => b.value - a.value);

    // Calculate Monthly Avg (based on filtered range)
    const monthCount = sortedMonths.length || 1;
    const monthlyAvg = totalAllTime / monthCount;

    return {
      years: Array.from(years).sort().reverse(),
      chartData: barData,
      pieData: pieDataList,
      kpi: {
        total: totalAllTime,
        ytd: totalYTD,
        monthlyAvg
      }
    };
  }, [incomeRecords, filterYear]);

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

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
        <span className="text-sm font-medium text-slate-600 dark:text-slate-300">Filter Year:</span>
        <select 
          value={filterYear}
          onChange={(e) => setFilterYear(e.target.value)}
          className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
        >
          <option value="All">All Time</option>
          {/* We calculate years inside useMemo, but accessing it via a simple separate pass or just filtering unique years from records for the dropdown is fine. 
              For simplicity, let's assume records exist. */}
          {Array.from(new Set(incomeRecords.map(r => r.date.substring(0,4)))).sort().reverse().map(y => (
             <option key={y} value={y}>{y}</option>
          ))}
        </select>
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
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">{t.ytdIncome} (Current Year)</h3>
            <p className="text-3xl font-bold font-mono">${kpi.ytd.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
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
                  <Bar key={key} dataKey={key} stackId="a" fill={COLORS[index % COLORS.length]} />
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
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(255,255,255,0.2)" />
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
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10) // Show last 10
                .map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 whitespace-nowrap">{rec.date}</td>
                  <td className="px-4 py-3">
                    <span className="bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded text-xs">{rec.category}</span>
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