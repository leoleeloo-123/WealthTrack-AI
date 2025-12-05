import React, { useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend
} from 'recharts';
import { Snapshot } from '../types';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { analyzeFinancialData } from '../services/geminiService';

interface DashboardProps {
  snapshots: Snapshot[];
  availableCategories: string[];
  familyMembers: string[];
}

// Simple normalization map for visualization purposes only
// In a real app, this would fetch live rates.
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

export const Dashboard: React.FC<DashboardProps> = ({ snapshots, availableCategories, familyMembers }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterMember, setFilterMember] = useState<string>('All');

  // 1. Prepare Time Series Data with Currency Normalization
  const chartData = useMemo(() => {
    // Group snapshots by date first (since different members have different snapshot entries on same day)
    const groupedByDate: Record<string, any> = {};

    snapshots.forEach(s => {
      // Apply Member Filter
      if (filterMember !== 'All' && s.familyMember !== filterMember) return;

      if (!groupedByDate[s.date]) {
        groupedByDate[s.date] = { date: s.date, total: 0 };
      }

      s.items.forEach(item => {
        // Apply Category Filter
        const key = filterCategory === 'All' ? item.category : item.name;
        if (filterCategory === 'All' || item.category === filterCategory) {
           // Normalize Value to USD for the Chart
           const rate = RATES[item.currency?.toUpperCase()] || 1;
           const normalizedValue = item.value * rate;

           groupedByDate[s.date][key] = (groupedByDate[s.date][key] || 0) + normalizedValue;
           groupedByDate[s.date].total += normalizedValue;
        }
      });
    });

    // Convert to array and sort
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

  // 3. Extract keys for lines/bars
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

  // Reset filter if selected category no longer exists
  useEffect(() => {
    if (filterCategory !== 'All' && !displayCategories.includes(filterCategory)) {
      setFilterCategory('All');
    }
  }, [displayCategories, filterCategory]);

  const handleAnalyze = async () => {
    setIsAnalyzing(true);
    setActiveAnalysis('');
    const targetCategory = filterCategory === 'All' ? undefined : filterCategory;
    // Filter snapshots passed to AI based on Member
    const relevantSnapshots = filterMember === 'All' 
        ? snapshots 
        : snapshots.filter(s => s.familyMember === filterMember);
    
    const result = await analyzeFinancialData(relevantSnapshots, targetCategory);
    setActiveAnalysis(result);
    setIsAnalyzing(false);
  };

  const colors = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#ec4899", "#6366f1", "#06b6d4", "#84cc16"];

  if (snapshots.length === 0) {
    return (
      <div className="text-center py-20 bg-white rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-xl text-slate-700 font-semibold mb-2">No data yet.</h2>
        <p className="text-slate-500">
            Start by adding a <span className="font-medium text-blue-600">New Snapshot</span> or use <span className="font-medium text-blue-600">Bulk Import</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Controls */}
      <div className="flex flex-wrap gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Family Member:</span>
                <select 
                    value={filterMember} 
                    onChange={(e) => setFilterMember(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
                >
                    <option value="All">All Family</option>
                    {familyMembers.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
            </div>
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Category:</span>
                <select 
                    value={filterCategory} 
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1.5 border border-slate-300 rounded text-sm outline-none focus:ring-2 focus:ring-accent"
                >
                    {displayCategories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </div>
        </div>
        <Button onClick={handleAnalyze} isLoading={isAnalyzing} variant="primary" className="bg-indigo-600 hover:bg-indigo-700">
           ✨ Analyze {filterMember === 'All' ? 'Family' : filterMember} {filterCategory === 'All' ? 'Portfolio' : filterCategory}
        </Button>
      </div>

      {/* AI Analysis Result */}
      {activeAnalysis && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-100">
            <div className="prose prose-sm max-w-none text-slate-700">
                <h3 className="text-indigo-800 font-bold mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z"></path></svg>
                    AI Financial Insights
                </h3>
                <div className="markdown-body" dangerouslySetInnerHTML={{ __html: activeAnalysis.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/- /g, '• ') }} />
            </div>
        </Card>
      )}

      {/* Main Net Worth Chart */}
      <Card title={filterCategory === 'All' ? "Total Net Worth Growth (USD Normalized)" : `${filterCategory} Growth (USD Normalized)`} className="min-h-[400px]">
        <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickMargin={10} />
                    <YAxis stroke="#64748b" fontSize={12} tickFormatter={(val) => `$${val/1000}k`} />
                    <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
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
        <Card title="Asset Allocation (USD Normalized)">
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="date" fontSize={10} />
                        <YAxis fontSize={10} tickFormatter={(val) => `${val/1000}k`} />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        {dataKeys.map((key, index) => (
                            <Bar key={key} dataKey={key} stackId="a" fill={colors[index % colors.length]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        <Card title="Recent Composition">
             <div className="h-[300px] flex items-center justify-center">
                 {snapshots.length > 0 && (
                     <div className="w-full space-y-2 overflow-y-auto max-h-full pr-2">
                        {/* 
                          Since we might have multiple snapshots for the same date (Dad, Mom),
                          we need to aggregate the LATEST date's data for this view.
                        */}
                         {(() => {
                           const lastDate = chartData[chartData.length - 1]?.date;
                           if (!lastDate) return null;

                           // Gather items from all snapshots on this last date
                           const latestItems = snapshots
                              .filter(s => s.date === lastDate && (filterMember === 'All' || s.familyMember === filterMember))
                              .flatMap(s => s.items)
                              .filter(i => filterCategory === 'All' || i.category === filterCategory)
                              .sort((a,b) => b.value - a.value);

                           return (
                             <>
                               <div className="text-sm font-medium text-slate-500 mb-2 sticky top-0 bg-white">
                                  Latest Snapshot: {lastDate}
                               </div>
                               {latestItems.map((item, idx) => (
                                 <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 rounded hover:bg-slate-100 transition-colors">
                                     <div className="flex items-center gap-2">
                                         <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                                         <div className="flex flex-col">
                                            <span className="text-sm text-slate-700 font-medium truncate max-w-[120px]" title={item.name}>{item.name}</span>
                                            <span className="text-xs text-slate-400">{item.category}</span>
                                         </div>
                                     </div>
                                     <span className="text-sm font-mono">
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