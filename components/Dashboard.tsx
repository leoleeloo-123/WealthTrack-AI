import React, { useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, Sector
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

// Custom static label for Pie Chart
const renderCustomLabel = (props: any) => {
  const RADIAN = Math.PI / 180;
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, name } = props;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Calculate text anchor based on position
  const textAnchor = x > cx ? 'start' : 'end';

  return (
    <text x={x} y={y} fill="#64748b" textAnchor={textAnchor} dominantBaseline="central" className="text-xs font-medium dark:fill-slate-300">
      {`${name}: ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${(percent * 100).toFixed(1)}%)`}
    </text>
  );
};

export const Dashboard: React.FC<DashboardProps> = ({ snapshots, language }) => {
  const [activeAnalysis, setActiveAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterMember, setFilterMember] = useState<string>('All');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  
  // State for Pie Chart Hover (kept for interaction, though labels are static now)
  const [activeIndex, setActiveIndex] = useState(0);

  const t = translations[language];

  // 0. Derive Filter Options from Data (Only show what exists)
  const { usedMembers, usedCategories, usedMonths } = useMemo(() => {
    const members = new Set<string>();
    const cats = new Set<string>();
    const months = new Set<string>();

    snapshots.forEach(s => {
      if (s.familyMember) members.add(s.familyMember);
      if (s.date) months.add(s.date.substring(0, 7)); // YYYY-MM
      s.items.forEach(i => {
        if (i.category && i.category.trim() !== '') {
          cats.add(i.category);
        }
      });
    });

    return {
      usedMembers: Array.from(members).sort(),
      usedCategories: Array.from(cats).sort(),
      usedMonths: Array.from(months).sort().reverse() // Newest first
    };
  }, [snapshots]);

  // 1. Prepare Time Series Data with Currency Normalization AND Date Filtering (Area Chart)
  const chartData = useMemo(() => {
    const groupedByDate: Record<string, any> = {};

    snapshots.forEach(s => {
      // Family Member Filter
      if (filterMember !== 'All' && s.familyMember !== filterMember) return;

      // Date Range Filter (Format YYYY-MM)
      if (filterStartDate && s.date < `${filterStartDate}-01`) return;
      if (filterEndDate && s.date > `${filterEndDate}-31`) return;

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
  }, [snapshots, filterCategory, filterMember, filterStartDate, filterEndDate]);

  // 2. Prepare Detailed Pie Chart Data (Based on the LAST snapshot set in the filtered range)
  const pieDataInfo = useMemo(() => {
    // A. Filter Snapshots by Date Range & Member first
    let relevantSnapshots = snapshots.filter(s => {
      if (filterMember !== 'All' && s.familyMember !== filterMember) return false;
      if (filterStartDate && s.date < `${filterStartDate}-01`) return false;
      if (filterEndDate && s.date > `${filterEndDate}-31`) return false;
      return true;
    });

    if (relevantSnapshots.length === 0) return { data: [], date: null };

    // B. Find the latest date
    const sortedDates = relevantSnapshots.map(s => s.date).sort();
    const latestDate = sortedDates[sortedDates.length - 1];

    // C. Get only items for that latest date
    const latestItems = relevantSnapshots
      .filter(s => s.date === latestDate)
      .flatMap(s => s.items)
      .filter(i => filterCategory === 'All' || i.category === filterCategory);

    // D. Aggregate by Name (Sub-category level)
    const aggByName: Record<string, number> = {};
    latestItems.forEach(item => {
      const rate = RATES[item.currency?.toUpperCase()] || 1;
      // Use Item Name for granularity, fallback to category if name is empty
      const name = item.name.trim() || item.category;
      aggByName[name] = (aggByName[name] || 0) + (item.value * rate);
    });

    // E. Convert to array and Sort
    let data = Object.keys(aggByName).map(key => ({
      name: key,
      value: aggByName[key]
    })).sort((a, b) => b.value - a.value);

    // F. Optimization: Group small items if list is too long (Top 10 + Others)
    if (data.length > 10) {
      const top10 = data.slice(0, 10);
      const others = data.slice(10);
      const otherTotal = others.reduce((sum, item) => sum + item.value, 0);
      data = [...top10, { name: 'Others', value: otherTotal }];
    }

    return { data, date: latestDate };
  }, [snapshots, filterCategory, filterMember, filterStartDate, filterEndDate]);

  // Keys for Bar Chart
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

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  // Auto-reset filters if they no longer exist
  useEffect(() => {
    if (filterCategory !== 'All' && !usedCategories.includes(filterCategory)) setFilterCategory('All');
    if (filterMember !== 'All' && !usedMembers.includes(filterMember)) setFilterMember('All');
  }, [usedCategories, usedMembers, filterCategory, filterMember]);

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

  return (
    <div className="space-y-6">
      
      {/* Controls */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center gap-4">
            
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
                 title="Clear Dates"
               >
                 ✕
               </button>
             )}

            <div className="flex-1 hidden xl:block"></div>

            {/* Analyze Button */}
            <Button onClick={handleAnalyze} isLoading={isAnalyzing} variant="primary" className="bg-indigo-600 hover:bg-indigo-700 w-full md:w-auto ml-auto md:ml-0">
               ✨ {t.analyze}
            </Button>
        </div>
      </div>

      {/* AI Analysis Result */}
      {activeAnalysis && (
        <Card className="bg-gradient-to-r from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-800 animate-fade-in">
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

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart: Detailed Item Breakdown */}
        <Card title={t.assetBreakdown}>
           {/* Chart Container */}
           <div className="h-[450px] w-full flex items-center justify-center relative">
             
             {/* Date Indicator in top-left of chart area */}
             {pieDataInfo.date && (
                <div className="absolute top-2 left-2 bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded text-sm font-semibold text-slate-700 dark:text-slate-200 z-10 shadow-sm border border-slate-200 dark:border-slate-600">
                  {pieDataInfo.date}
                </div>
             )}

             {pieDataInfo.data.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <Pie
                      activeIndex={activeIndex}
                      data={pieDataInfo.data}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      dataKey="value"
                      onMouseEnter={onPieEnter}
                      paddingAngle={2}
                      label={renderCustomLabel}
                      labelLine={true}
                    >
                      {pieDataInfo.data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={colors[index % colors.length]} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                      ))}
                    </Pie>
                 </PieChart>
               </ResponsiveContainer>
             ) : (
               <p className="text-slate-400 text-sm">No data available for chart</p>
             )}
           </div>
        </Card>

        {/* Stacked Bar Chart */}
        <Card title={t.assetAllocation}>
            <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                        <XAxis dataKey="date" fontSize={10} stroke="#64748b" />
                        <YAxis fontSize={10} tickFormatter={(val) => `${val/1000}k`} stroke="#64748b" />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        {dataKeys.slice(0, 10).map((key, index) => (
                            <Bar key={key} dataKey={key} stackId="a" fill={colors[index % colors.length]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </Card>

        {/* Recent List */}
        <Card title={t.recentComposition} className="lg:col-span-2">
             <div className="flex flex-col">
                 {snapshots.length > 0 && (
                     <div className="w-full space-y-2">
                         {(() => {
                           const lastDate = chartData[chartData.length - 1]?.date;
                           if (!lastDate) return <p className="text-slate-400 p-4">No data in selected range</p>;

                           const latestItems = snapshots
                              .filter(s => s.date === lastDate && (filterMember === 'All' || s.familyMember === filterMember))
                              .flatMap(s => s.items)
                              .filter(i => filterCategory === 'All' || i.category === filterCategory)
                              .sort((a,b) => b.value - a.value);

                           // Calculate Subtotal (Normalized to USD for consistent summation)
                           const subTotalNormalized = latestItems.reduce((acc, item) => {
                             const rate = RATES[item.currency?.toUpperCase()] || 1;
                             return acc + (item.value * rate);
                           }, 0);

                           return (
                             <>
                               <div className="flex justify-between items-end mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                     Snapshot Date: <span className="text-slate-800 dark:text-slate-200 font-bold">{lastDate}</span>
                                  </div>
                                  <div className="text-right">
                                     <span className="text-xs text-slate-400 uppercase tracking-wide">Sub Total (Approx USD)</span>
                                     <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                                       ${subTotalNormalized.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                     </div>
                                  </div>
                               </div>

                               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                 {latestItems.map((item, idx) => (
                                   <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700">
                                       <div className="flex items-center gap-2 overflow-hidden">
                                           <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: colors[idx % colors.length] }}></div>
                                           <div className="flex flex-col min-w-0">
                                              <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate" title={item.name}>{item.name}</span>
                                              <span className="text-[10px] text-slate-400 uppercase">{item.category}</span>
                                           </div>
                                       </div>
                                       <span className="text-sm font-mono text-slate-700 dark:text-slate-200 whitespace-nowrap ml-2">
                                         {item.value.toLocaleString()} <span className="text-[10px] text-slate-500">{item.currency}</span>
                                       </span>
                                   </div>
                                 ))}
                               </div>
                             </>
                           );
                         })()}
                     </div>
                 )}
                 {snapshots.length === 0 && (
                     <div className="text-center py-10">
                        <p className="text-slate-500 dark:text-slate-400 text-sm">
                            {t.startByAdding} <span className="font-medium text-blue-600 dark:text-blue-400">{t.newSnapshot}</span>.
                        </p>
                     </div>
                 )}
             </div>
        </Card>
      </div>
    </div>
  );
};