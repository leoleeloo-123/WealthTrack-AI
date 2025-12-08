
import React, { useState, useMemo } from 'react';
import { Snapshot, Language, IncomeRecord } from '../types';
import { translations } from '../utils/translations';

interface MasterDatabaseViewProps {
  snapshots: Snapshot[];
  incomeRecords: IncomeRecord[];
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

export const MasterDatabaseView: React.FC<MasterDatabaseViewProps> = ({
  snapshots,
  incomeRecords,
  language
}) => {
  const [dataSource, setDataSource] = useState<'assets' | 'income'>('assets');
  const [filterCategory, setFilterCategory] = useState('All');
  const [filterMember, setFilterMember] = useState('All');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');

  const t = translations[language];

  // 0. Derive Filter Options from Data (Only show what exists based on DataSource)
  const { usedMembers, usedCategories, usedMonths } = useMemo(() => {
    const members = new Set<string>();
    const cats = new Set<string>();
    const months = new Set<string>();

    if (dataSource === 'assets') {
      snapshots.forEach(s => {
        if (s.familyMember) members.add(s.familyMember);
        if (s.date) months.add(s.date.substring(0, 7)); // YYYY-MM
        s.items.forEach(i => {
          if (i.category && i.category.trim() !== '') {
            cats.add(i.category);
          }
        });
      });
    } else {
      // Income Records
      incomeRecords.forEach(r => {
        if (r.familyMember) members.add(r.familyMember);
        if (r.date) months.add(r.date.substring(0, 7));
        if (r.category) cats.add(r.category);
      });
    }

    return {
      usedMembers: Array.from(members).sort(),
      usedCategories: Array.from(cats).sort(),
      usedMonths: Array.from(months).sort().reverse() // Newest first
    };
  }, [snapshots, incomeRecords, dataSource]);

  // 1. Filter Data based on Source
  const filteredData = useMemo(() => {
    if (dataSource === 'assets') {
      return snapshots.filter(s => {
        if (filterMember !== 'All' && s.familyMember !== filterMember) return false;
        if (filterStartDate && s.date < `${filterStartDate}-01`) return false;
        if (filterEndDate && s.date > `${filterEndDate}-31`) return false;
        if (filterCategory !== 'All' && !s.items.some(i => i.category === filterCategory)) return false;
        return true;
      });
    } else {
      return incomeRecords.filter(r => {
        if (filterMember !== 'All' && r.familyMember !== filterMember) return false;
        if (filterStartDate && r.date < `${filterStartDate}-01`) return false;
        if (filterEndDate && r.date > `${filterEndDate}-31`) return false;
        if (filterCategory !== 'All' && r.category !== filterCategory) return false;
        return true;
      });
    }
  }, [snapshots, incomeRecords, dataSource, filterMember, filterStartDate, filterEndDate, filterCategory]);

  // 2. Identify Unique Columns (Sub-categories / Names)
  const columnHeaders = useMemo(() => {
    const names = new Set<string>();
    
    if (dataSource === 'assets') {
      (filteredData as Snapshot[]).forEach(s => {
        s.items.forEach(i => {
          if (filterCategory === 'All' || i.category === filterCategory) {
             const key = i.name.trim() ? `${i.name.trim()} (${i.category})` : `${i.category} (Misc)`;
             names.add(key);
          }
        });
      });
    } else {
      (filteredData as IncomeRecord[]).forEach(r => {
        const key = r.name.trim() ? `${r.name.trim()} (${r.category})` : `${r.category} (Misc)`;
        names.add(key);
      });
    }
    
    return Array.from(names).sort();
  }, [filteredData, dataSource, filterCategory]);

  // 3. Construct Pivot Rows (Group by Date)
  const rows = useMemo(() => {
    const dates = Array.from(new Set(filteredData.map(d => d.date))).sort();

    return dates.map(date => {
      const rowData: Record<string, number> = {};
      let rowTotal = 0;

      if (dataSource === 'assets') {
        const daySnapshots = (filteredData as Snapshot[]).filter(s => s.date === date);
        daySnapshots.forEach(s => {
          s.items.forEach(i => {
             if (filterCategory === 'All' || i.category === filterCategory) {
               const key = i.name.trim() ? `${i.name.trim()} (${i.category})` : `${i.category} (Misc)`;
               const rate = RATES[i.currency?.toUpperCase()] || 1;
               const val = i.value * rate;
               
               rowData[key] = (rowData[key] || 0) + val;
               rowTotal += val;
             }
          });
        });
      } else {
        const dayRecords = (filteredData as IncomeRecord[]).filter(r => r.date === date);
        dayRecords.forEach(r => {
           const key = r.name.trim() ? `${r.name.trim()} (${r.category})` : `${r.category} (Misc)`;
           // Assume USD for Income for now as defined in BulkEntry
           const val = r.value; 
           rowData[key] = (rowData[key] || 0) + val;
           rowTotal += val;
        });
      }

      return {
        date,
        values: rowData,
        total: rowTotal
      };
    });
  }, [filteredData, dataSource, filterCategory]);

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors flex-shrink-0">
        <div className="flex flex-wrap items-center gap-4">
            
            {/* Data Source Toggle */}
            <div className="flex items-center gap-2 mr-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.dataSource}:</span>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                   <button 
                     onClick={() => { setDataSource('assets'); setFilterMember('All'); setFilterCategory('All'); }}
                     className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${dataSource === 'assets' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                   >
                     {t.viewAssets}
                   </button>
                   <button 
                     onClick={() => { setDataSource('income'); setFilterMember('All'); setFilterCategory('All'); }}
                     className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${dataSource === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                   >
                     {t.viewIncome}
                   </button>
                </div>
            </div>

            {/* Family Member (Now for BOTH) */}
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
                 onClick={() => { 
                   setFilterStartDate(''); 
                   setFilterEndDate(''); 
                   setFilterCategory('All');
                   setFilterMember('All');
                 }}
                 className="text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 ml-auto md:ml-0"
                 title="Clear All Filters"
               >
                 ✕
               </button>
             )}
         </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex flex-col relative">
        <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 flex justify-between items-center">
             <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">
               {dataSource === 'assets' ? t.assetDb : t.incomeDb}
             </h3>
             <span className="text-xs text-slate-500 italic">{t.normalizedNote}</span>
        </div>
        
        <div className="flex-1 overflow-auto relative">
           <table className="min-w-full text-sm text-left border-collapse">
              <thead className="bg-slate-100 dark:bg-slate-700 sticky top-0 z-20 shadow-sm">
                <tr>
                   {/* Sticky Date Column Header */}
                   <th className="sticky left-0 z-30 bg-slate-100 dark:bg-slate-700 px-4 py-3 font-semibold text-slate-600 dark:text-slate-200 border-b border-r border-slate-200 dark:border-slate-600 min-w-[120px]">
                      {t.date}
                   </th>
                   {/* Dynamic Asset Column Headers */}
                   {columnHeaders.map(col => (
                     <th key={col} className="px-4 py-3 font-semibold text-slate-600 dark:text-slate-200 border-b border-r border-slate-200 dark:border-slate-600 whitespace-nowrap min-w-[100px]">
                       {col}
                     </th>
                   ))}
                   {/* Total Column Header */}
                   <th className="px-4 py-3 font-bold text-slate-700 dark:text-slate-100 border-b border-slate-200 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 min-w-[100px] text-right">
                      {t.subTotal}
                   </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {rows.length > 0 ? (
                    rows.map((row, idx) => (
                    <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                        {/* Sticky Date Column Cell */}
                        <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-4 py-3 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                        {row.date}
                        </td>
                        {/* Dynamic Asset Cells */}
                        {columnHeaders.map(col => {
                            const val = row.values[col];
                            return (
                                <td key={col} className="px-4 py-3 text-slate-600 dark:text-slate-300 border-r border-slate-100 dark:border-slate-700 font-mono text-right">
                                    {val ? val.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '-'}
                                </td>
                            );
                        })}
                        {/* Total Cell */}
                        <td className="px-4 py-3 font-bold text-emerald-600 dark:text-emerald-400 font-mono text-right bg-slate-50/30 dark:bg-slate-700/30">
                           {row.total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </td>
                    </tr>
                    ))
                ) : (
                    <tr>
                        <td colSpan={columnHeaders.length + 2} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                           {t.noRecords}
                        </td>
                    </tr>
                )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};
