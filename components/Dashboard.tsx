import React, { useMemo, useState, useEffect } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  BarChart, Bar, Legend, PieChart, Pie, Cell, Sector, ReferenceLine
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

// Consistent Color Palette
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

// Custom static label for Pie Chart
const renderCustomLabel = (props: any) => {
  const { cx, cy, midAngle, innerRadius, outerRadius, percent, value, name, payload } = props;
  const RADIAN = Math.PI / 180;
  const radius = outerRadius * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  
  // Calculate text anchor based on position
  const textAnchor = x > cx ? 'start' : 'end';

  // Use the original (potentially negative) value for display if available
  const displayValue = payload.originalValue !== undefined ? payload.originalValue : value;

  return (
    <text x={x} y={y} fill="#64748b" textAnchor={textAnchor} dominantBaseline="central" className="text-xs font-medium dark:fill-slate-300">
      {`${name}: ${displayValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} (${(percent * 100).toFixed(1)}%)`}
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
  
  // State for Pie Chart Hover
  const [activeIndexAsset, setActiveIndexAsset] = useState(0);
  const [activeIndexLiab, setActiveIndexLiab] = useState(0);

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

  // 1. Prepare Time Series Data (Area/Bar Chart)
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

  // 2. Prepare Detailed Pie Chart Data (Split Assets & Liabilities)
  const pieDataInfo = useMemo(() => {
    // A. Filter Snapshots by Date Range & Member first
    let relevantSnapshots = snapshots.filter(s => {
      if (filterMember !== 'All' && s.familyMember !== filterMember) return false;
      if (filterStartDate && s.date < `${filterStartDate}-01`) return false;
      if (filterEndDate && s.date > `${filterEndDate}-31`) return false;
      return true;
    });

    if (relevantSnapshots.length === 0) return { assets: [], liabilities: [], date: null };

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
      const name = item.name.trim() || item.category;
      aggByName[name] = (aggByName[name] || 0) + (item.value * rate);
    });

    // E. Separate into Assets (>0) and Liabilities (<0)
    const rawData = Object.keys(aggByName).map(key => ({
      name: key,
      value: aggByName[key]
    }));

    // Assets: Positive values, sorted high to low
    let assets = rawData
      .filter(d => d.value > 0)
      .map(d => ({ ...d, originalValue: d.value }))
      .sort((a, b) => b.value - a.value);

    // Liabilities: Negative values, sorted by magnitude (most debt first)
    // We convert value to absolute for the Pie Chart slice calculation, but keep originalValue for display
    let liabilities = rawData
      .filter(d => d.value < 0)
      .map(d => ({ 
        name: d.name, 
        value: Math.abs(d.value), 
        originalValue: d.value 
      }))
      .sort((a, b) => b.value - a.value);

    // F. Optimization: Group small items (Top 10 + Others) for Assets
    if (assets.length > 10) {
      const top10 = assets.slice(0, 10);
      const others = assets.slice(10);
      const otherTotal = others.reduce((sum, item) => sum + item.value, 0);
      assets = [...top10, { name: 'Others', value: otherTotal, originalValue: otherTotal }];
    }
    // Optimization for Liabilities
    if (liabilities.length > 10) {
        const top10 = liabilities.slice(0, 10);
        const others = liabilities.slice(10);
        const otherTotalAbs = others.reduce((sum, item) => sum + item.value, 0);
        const otherTotalOrig = others.reduce((sum, item) => sum + item.originalValue, 0);
        liabilities = [...top10, { name: 'Others', value: otherTotalAbs, originalValue: otherTotalOrig }];
    }

    return { assets, liabilities, date: latestDate };
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

  // Auto-reset filters
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

            {/* Date Range */}
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
                        <Area type="monotone" dataKey={dataKeys[0] || 'total'} stroke={getCategoryColor(filterCategory)} fill={getCategoryColor(filterCategory)} fillOpacity={0.3} strokeWidth={2} />
                    )}
                </AreaChart>
            </ResponsiveContainer>
        </div>
      </Card>

      {/* Breakdown Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Pie Chart: Detailed Item Breakdown */}
        <Card title={t.assetBreakdown} className="flex flex-col">
           {/* Date Indicator */}
           {pieDataInfo.date && (
               <div className="mb-2 self-start bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded text-sm font-semibold text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600">
                 {pieDataInfo.date}
               </div>
           )}

           <div className={`flex-1 w-full grid gap-4 ${pieDataInfo.assets.length > 0 && pieDataInfo.liabilities.length > 0 ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1'}`}>
             
             {/* Assets Pie */}
             {pieDataInfo.assets.length > 0 && (
               <div className="h-[350px] relative">
                  <h4 className="text-center font-semibold text-emerald-600 dark:text-emerald-400 mb-2">Assets</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        activeIndex={activeIndexAsset}
                        data={pieDataInfo.assets}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={90}
                        dataKey="value"
                        onMouseEnter={(_, idx) => setActiveIndexAsset(idx)}
                        paddingAngle={2}
                        label={renderCustomLabel}
                        labelLine={true}
                      >
                        {pieDataInfo.assets.map((entry, index) => (
                          <Cell key={`cell-a-${index}`} fill={getCategoryColor(entry.name)} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
               </div>
             )}

             {/* Liabilities Pie */}
             {pieDataInfo.liabilities.length > 0 && (
               <div className="h-[350px] relative">
                  <h4 className="text-center font-semibold text-red-600 dark:text-red-400 mb-2">Liabilities</h4>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                      <Pie
                        activeIndex={activeIndexLiab}
                        data={pieDataInfo.liabilities}
                        cx="50%"
                        cy="50%"
                        innerRadius={0}
                        outerRadius={90}
                        dataKey="value"
                        onMouseEnter={(_, idx) => setActiveIndexLiab(idx)}
                        paddingAngle={2}
                        label={renderCustomLabel}
                        labelLine={true}
                      >
                        {pieDataInfo.liabilities.map((entry, index) => (
                          <Cell key={`cell-l-${index}`} fill={getCategoryColor(entry.name)} stroke="rgba(255,255,255,0.2)" strokeWidth={1} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
               </div>
             )}
             
             {pieDataInfo.assets.length === 0 && pieDataInfo.liabilities.length === 0 && (
               <div className="h-[200px] flex items-center justify-center text-slate-400 text-sm">
                 No data to display for this period.
               </div>
             )}
           </div>
        </Card>

        {/* Stacked Bar Chart */}
        <Card title={t.assetAllocation}>
            <div className="h-[450px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} stackOffset="sign">
                        <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.5} />
                        <XAxis dataKey="date" fontSize={10} stroke="#64748b" />
                        <YAxis fontSize={10} tickFormatter={(val) => `${val/1000}k`} stroke="#64748b" />
                        <Tooltip formatter={(value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} />
                        <Legend wrapperStyle={{ fontSize: '10px' }} />
                        <ReferenceLine y={0} stroke="#000" strokeWidth={2} />
                        {dataKeys.slice(0, 10).map((key, index) => (
                            <Bar key={key} dataKey={key} stackId="a" fill={getCategoryColor(key)} />
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

                           // Get all items
                           const allItems = snapshots
                              .filter(s => s.date === lastDate && (filterMember === 'All' || s.familyMember === filterMember))
                              .flatMap(s => s.items)
                              .filter(i => filterCategory === 'All' || i.category === filterCategory);
                           
                           // Split into Assets and Liabilities
                           const positiveItems = allItems.filter(i => i.value > 0).sort((a,b) => b.value - a.value);
                           const negativeItems = allItems.filter(i => i.value < 0).sort((a,b) => a.value - b.value); // Sort most debt to least debt (ascending)

                           // Calculate Subtotal (Normalized to USD for consistent summation)
                           const subTotalNormalized = allItems.reduce((acc, item) => {
                             const rate = RATES[item.currency?.toUpperCase()] || 1;
                             return acc + (item.value * rate);
                           }, 0);
                           
                           const renderItemRow = (item: any, idx: string | number) => (
                               <div key={idx} className="flex justify-between items-center p-2 bg-slate-50 dark:bg-slate-700/50 rounded hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors border border-slate-100 dark:border-slate-700">
                                   <div className="flex items-center gap-2 overflow-hidden">
                                       <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: getCategoryColor(item.category) }}></div>
                                       <div className="flex flex-col min-w-0">
                                          <span className="text-sm text-slate-700 dark:text-slate-200 font-medium truncate" title={item.name}>{item.name}</span>
                                          <span className="text-[10px] text-slate-400 uppercase">{item.category}</span>
                                       </div>
                                   </div>
                                   <span className={`text-sm font-mono whitespace-nowrap ml-2 ${item.value < 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-700 dark:text-slate-200'}`}>
                                     {item.value.toLocaleString()} <span className="text-[10px] text-slate-500">{item.currency}</span>
                                   </span>
                               </div>
                           );

                           return (
                             <>
                               <div className="flex justify-between items-end mb-4 pb-2 border-b border-slate-100 dark:border-slate-700">
                                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                                     Snapshot Date: <span className="text-slate-800 dark:text-slate-200 font-bold">{lastDate}</span>
                                  </div>
                                  <div className="text-right">
                                     <span className="text-xs text-slate-400 uppercase tracking-wide">Net Worth (Approx USD)</span>
                                     <div className={`text-xl font-bold font-mono ${subTotalNormalized >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                                       ${subTotalNormalized.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                                     </div>
                                  </div>
                               </div>

                               {/* Assets Section */}
                               {positiveItems.length > 0 && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                       {positiveItems.map((item, idx) => renderItemRow(item, `pos-${idx}`))}
                                   </div>
                               )}

                               {/* Divider if both exist */}
                               {positiveItems.length > 0 && negativeItems.length > 0 && (
                                   <div className="py-4 flex items-center gap-4">
                                       <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                       <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Liabilities</span>
                                       <div className="h-px bg-slate-200 dark:bg-slate-700 flex-1"></div>
                                   </div>
                               )}

                               {/* Liabilities Section */}
                               {negativeItems.length > 0 && (
                                   <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                       {negativeItems.map((item, idx) => renderItemRow(item, `neg-${idx}`))}
                                   </div>
                               )}
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