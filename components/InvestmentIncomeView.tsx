
import React, { useMemo, useState, useEffect } from 'react';
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
  // Use same filters as Dashboard
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMember, setFilterMember] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  
  const t = translations[language];

  // 0. Derive Filter Options from Data (Only show what exists)
  const { usedMembers, usedCategories, usedMonths } = useMemo(() => {
    const members = new Set<string>();
    const cats = new Set<string>();
    const months = new Set<string>();

    incomeRecords.forEach(rec => {
      if (rec.familyMember) members.add(rec.familyMember);
      if (rec.date) months.add(rec.date.substring(0, 7)); // YYYY-MM
      if (rec.category) cats.add(rec.category);
    });

    return {
      usedMembers: Array.from(members).sort(),
      usedCategories: Array.from(cats).sort(),
      usedMonths: Array.from(months).sort().reverse() // Newest first
    };
  }, [incomeRecords]);

  // Derive Data and Charts
  const { chartData, pieData, kpi } = useMemo(() => {
    
    // Aggregation maps
    const byMonth: Record<string, { date: string; [key: string]: number | string }> = {};
    const byCategory: Record<string, number> = {};
    
    let totalFiltered = 0;
    let countInFiltered = 0;

    incomeRecords.forEach(rec => {
      // --- Filter Logic ---
      if (filterMember !== 'All' && rec.familyMember !== filterMember) return;
      if (filterCategory !== 'All' && rec.category !== filterCategory) return;
      if (filterStartDate && rec.date < `${filterStartDate}-01`) return;
      if (filterEndDate && rec.date > `${filterEndDate}-31`) return;

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

    // Format Bar Data (Sorted by date)
    const sortedMonths = Object.keys(byMonth).sort();
    const barData = sortedMonths.map(m => byMonth[m]);
    
    // Format Pie Data
    const pieDataList = Object.keys(byCategory).map(cat => ({
      name: cat,
      value: byCategory[cat]
    })).sort((a, b) => b.value - a.value);

    // Calculate Monthly Avg
    // If range is selected, divide by active months in range, or 1
    const divisor = Object.keys(byMonth).length || 1; 
    const monthlyAvg = totalFiltered / divisor;

    return {
      chartData: barData,
      pieData: pieDataList,
      kpi: {
        total: totalFiltered,
        monthlyAvg,
        transactionCount: countInFiltered
      }
    };
  }, [incomeRecords, filterMember, filterCategory, filterStartDate, filterEndDate]);

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

  // Auto-reset filters if options disappear
  useEffect(() => {
     if (filterCategory !== 'All' && !usedCategories.includes(filterCategory)) setFilterCategory('All');
     if (filterMember !== 'All' && !usedMembers.includes(filterMember)) setFilterMember('All');
  }, [usedCategories, usedMembers, filterCategory, filterMember]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Filters (Unified with Dashboard) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-wrap items-center gap-4 transition-colors">
        
        {/* Family Member */}
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.familyMember}:</span>
            <select 
                value={filterMember} 
                onChange={(e) => setFilterMember(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
            >
                <option value="All">{t.allFamily}</option>
                {usedMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>

        {/* Category */}
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.category}:</span>
            <select 
                value={filterCategory} 
                onChange={(e) => setFilterCategory(e.target.value)}
                className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
            >
                <option value="All">All</option>
                {usedCategories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
        </div>

        {/* Date Range: From */}
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.from}:</span>
            <select 
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">--</option>
              {usedMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>

        {/* Date Range: To */}
        <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.to}:</span>
            <select 
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
            >
              <option value="">--</option>
              {usedMonths.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
        </div>

        {(filterStartDate || filterEndDate || filterCategory !== 'All' || filterMember !== 'All') && (
            <button 
                onClick={() => { setFilterStartDate(''); setFilterEndDate(''); setFilterCategory('All'); setFilterMember('All'); }}
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
            <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">{t.totalIncome}</h3>
            <p className="text-3xl font-bold font-mono">${kpi.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
          </div>
        </Card>
        
        <Card>
          <div className="text-slate-800 dark:text-slate-200">
            <h3 className="text-sm font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Transactions
            </h3>
            <p className="text-3xl font-bold font-mono">
                {kpi.transactionCount}
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
                <th className="px-4 py-3">{t.familyMember}</th>
                <th className="px-4 py-3">{t.category}</th>
                <th className="px-4 py-3">{t.source}</th>
                <th className="px-4 py-3 text-right">{t.value}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {[...incomeRecords]
                 // Apply filters here for table too
                .filter(rec => filterMember === 'All' || rec.familyMember === filterMember)
                .filter(rec => filterCategory === 'All' || rec.category === filterCategory)
                .filter(rec => !filterStartDate || rec.date >= `${filterStartDate}-01`)
                .filter(rec => !filterEndDate || rec.date <= `${filterEndDate}-31`)
                .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .slice(0, 10) // Show last 10
                .map(rec => (
                <tr key={rec.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                  <td className="px-4 py-3 whitespace-nowrap">{rec.date}</td>
                  <td className="px-4 py-3 whitespace-nowrap">{rec.familyMember || '-'}</td>
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
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
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
