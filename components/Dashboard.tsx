import React, { useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';
import { Snapshot, Language } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { analyzeFinancialData } from '../services/geminiService';
import { translations } from '../utils/translations';

interface DashboardProps {
  snapshots: Snapshot[];
  availableCategories: string[];
  familyMembers: string[];
  language: Language;
}

const RATES: Record<string, number> = {
  'USD': 1,
  'EUR': 1.05,
  'GBP': 1.25,
  'CAD': 0.74,
  'AUD': 0.65,
  'CNY': 0.14,
  'JPY': 0.0067,
  'SGD': 0.73,
  'INR': 0.012
};

export const Dashboard: React.FC<DashboardProps> = ({ snapshots, availableCategories, familyMembers, language }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterMember, setFilterMember] = useState<string>('All');
  const t = translations[language];

  // 1. Prepare Time Series Data with Currency Normalization
  const chartData = useMemo(() => {
    const groupedByDate: Record<string, any> = {};

    snapshots.forEach(s => {
      if (filterMember !== 'All' && s.familyMember !== filterMember) return;

      if (!groupedByDate[s.date]) {
        groupedByDate[s.date] = { date: s.date, total: 0 };
      }

      s.items.forEach(item => {
        const key = filterCategory === 'All' ? item.category : item.name;
        if (filterCategory === 'All' || item.category === filterCategory) {
           const rate = RATES[item.currency?.toUpperCase()] || 1;
           const normalizedValue = item.value * rate;

           groupedByDate[s.date][key] = (groupedByDate[s.date][key] || 0) + normalizedValue;
           groupedByDate[s.date].total += normalizedValue;
        }
      });
    });

    return Object.values(groupedByDate).sort((a: any, b: any) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [snapshots, filterCategory, filterMember]);

  // 2. Extract unique categories ONLY from historical data
  const displayCategories = useMemo(() => {
    const historicalCats = new Set<string>();
    snapshots.forEach(s => s.items.forEach(i => {
      if (i.category && i.category.trim() !== '') {
        historicalCats.add(i.category);
      }
    }));
    return ['All', ...Array.from(historicalCats).sort()];
  }, [snapshots]);

  const dataKeys = useMemo(() => {
    if (chartData.length === 0) return [];
    const allKeys = new Set<string>();
    chartData.forEach((d: any) => {
      Object.keys(d).forEach(k => {
        if (k !== 'date' && k !== 'total') allKeys.add(k);
      });
    });
    return Array.from(allKeys);
  }, [chartData]);

  useEffect(() => {
    if (filterCategory !== 'All' && !displayCategories.includes(filterCategory)) {
      setFilterCategory('All');
    }
  }, [displayCategories, filterCategory]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setActiveAnalysis('');
    const targetCategory = filterCategory === 'All' ? undefined : filterCategory;
    const relevantSnapshots = filterMember === 'All' 
        ? snapshots 
        : snapshots.filter(s => s.familyMember === filterMember);
    
    const result = await analyzeFinancialData(relevantSnapshots, targetCategory, language);
    setActiveAnalysis(result);
    setIsAnalyzing(false);
  };

  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#06b6d4", "#84cc16"];

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-20 bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-colors">
        <h2 className="text-xl text-slate-700 dark:text-slate-200 font-semibold mb-2">{t.noData}</h2>
        <p className="text-slate-500 dark:text-slate-400">
            {t.startByAdding} <span className="font-medium text-blue-600 dark:text-blue-400">{t.newSnapshot}</span> {t.orUse} <span className="font-medium text-blue-600 dark:text-blue-400">{t.bulkImport}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.familyMember}:</span>
                <select 
                    value={filterMember} 
                    onChange={(e) => setFilterMember(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
                >
                    <option value="All">{t.allFamily}</option>
                    {familyMembers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300">{t.category}:</span>
                <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 dark:border-slate-600 dark:bg-slate-700 dark:text-white rounded text-sm outline-none focus:ring-2 focus:ring-accent"
                >
                    <option value="All">All</option>
                    {displayCategories.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
        </div>
        <Button onClick={handleAnalyze} isLoading={isAnalyzing} variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
           ✨ {t.analyze} {filterMember === 'All' ? (language === 'zh' ? '全家' : 'Family') : filterMember} {filterCategory === 'All' ? (language === 'zh' ? '组合' : 'Portfolio') : filterCategory}
        </Button>
      </div>

      {/* AI Analysis Result */}
      {activeAnalysis && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-800">
            <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-200">
                <h3 className="text-indigo-800 dark:text-indigo-300 font-bold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                    {t.aiInsights}
                </h3>
                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: activeAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/- /g, '• ') }} />
            </div>
        </Card>
      )}

      {/* Main Net Worth Chart */}
      <Card title={filterCategory === 'All' ? t.totalNetWorth + " (USD Normalized)" : `${filterCategory} Growth (USD Normalized)`} className="min-h-[400px]">
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" strokeOpacity={0.5} />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: 'var(--tw-bg-opacity, #fff)', borderRadius: '8px', border: '1px solid #e2e8f0' }}
                        formatter={(value: number) => [`$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, 'Approx USD']}
                    />
                    {filterCategory === 'All' ? (
                         <Area type="monotone" dataKey="total" stroke="#3b82f6" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={2} />
                    ) : (
                        <Area type="monotone" dataKey={dataKeys[0] || 'total'} stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={2} />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </Card>

      {/* Breakdown Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title={t.assetAllocation + " (USD Normalized)"}>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                        <XAxis dataKey="date" fontSize={10} stroke="#64748b" />
                        <YAxis fontSize={10} tickFormatter={(val) => `${val/1000}k`} stroke="#64748b" />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        {dataKeys.map((key, index) => (
                            <Bar key={key} dataKey={key} stackId="a" fill={colors[index % colors.length]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card title={t.recentComposition}>
             <div className="h-[300px] flex items-center justify-center">
                 {snapshots.length > 0 && (
                     <div className="w-full space-y-2 overflow-y-auto max-h-full pr-2">
                         {(() => {
                           const lastDate = chartData[chartData.length - 1]?.date;
                           if (!lastDate) return null;

                           const latestItems = snapshots
                              .filter(s => s.date === lastDate && (filterMember === 'All' || s.familyMember === filterMember))
                              .flatMap(s => s.items)
                              .filter(i => filterCategory === 'All' || i.category === filterCategory)
                              .sort((a,b) => b.value - a.value);

                           return (
                             <>
                               <div className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2 sticky top-0 bg-white dark:bg-slate-800">
                                  Latest Snapshot: {lastDate}
                               </div>
                               {latestItems.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                                         <div className="flex flex-col">
                                            <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate max-w-[120px]" title={item.name}>{item.name}</span>
                                            <span className="text-xs text-slate-400">{item.category}</span>
                                         </div>
                                     </div>
                                     <span className="text-sm font-mono text-slate-700 dark:text-slate-200">
                                       {item.value.toLocaleString()} <span className="text-[10px] text-slate-500">{item.currency}</span>
                                     </span>
                                 </div>
                               ))}
                             </>
                           );
                         })()}
                     </div>
                 )}
             </div>
        </Card>
      </div>
    </div>
  );
};