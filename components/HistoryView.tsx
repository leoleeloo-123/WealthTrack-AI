

import React, { useMemo, useState } from 'react';
import { Snapshot, Language, AssetItem, IncomeRecord } from '../types';
import { Card } from './ui/Card';
import { translations } from '../utils/translations';

interface HistoryViewProps {
  snapshots: Snapshot[];
  incomeRecords: IncomeRecord[];
  availableCategories: string[]; // Kept for prop compatibility
  familyMembers: string[];      // Kept for prop compatibility
  onEdit: (s: Snapshot) => void;
  onDelete: (id: string) => void;
  onDeleteIncome: (date: string, familyMember?: string) => void;
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

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  snapshots,
  incomeRecords, 
  onEdit, 
  onDelete,
  onDeleteIncome, 
  language 
}) => {
  // View State: 'cards' = Individual Record, 'table' = Master Table
  const [viewType, setViewType] = useState<'cards' | 'table'>('cards');
  
  const [dataSource, setDataSource] = useState<'assets' | 'income'>('assets');
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
  
  // 1. Common Filtered Data
  const filteredData = useMemo(() => {
     if (dataSource === 'assets') {
        const sorted = [...snapshots].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted.filter(s => {
            if (filterMember !== 'All' && s.familyMember !== filterMember) return false;
            if (filterCategory !== 'All' && !s.items.some(i => i.category === filterCategory)) return false;
            if (filterStartDate && s.date < `${filterStartDate}-01`) return false;
            if (filterEndDate && s.date > `${filterEndDate}-31`) return false;
            return true;
        });
    } else {
        const sorted = [...incomeRecords].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return sorted.filter(r => {
            if (filterMember !== 'All' && r.familyMember !== filterMember) return false;
            if (filterCategory !== 'All' && r.category !== filterCategory) return false;
            if (filterStartDate && r.date < `${filterStartDate}-01`) return false;
            if (filterEndDate && r.date > `${filterEndDate}-31`) return false;
            return true;
        });
    }
  }, [snapshots, incomeRecords, dataSource, filterMember, filterCategory, filterStartDate, filterEndDate]);

  // 2. Logic for Card View (Grouping for Income)
  const cardGroups = useMemo(() => {
    if (dataSource === 'assets') {
        return (filteredData as Snapshot[]);
    } else {
        // Group Income by Date AND Family Member to mimic Snapshots structure
        const grouped: Record<string, IncomeRecord[]> = {};
        
        (filteredData as IncomeRecord[]).forEach(r => {
            // Create a unique key for grouping
            const key = `${r.date}::${r.familyMember}`;
            if (!grouped[key]) grouped[key] = [];
            grouped[key].push(r);
        });

        return Object.keys(grouped).map(key => {
            const [date, member] = key.split('::');
            const items = grouped[key];
            const total = items.reduce((sum, i) => sum + i.value, 0);
            return {
                id: key, // Use composite key as ID
                date,
                familyMember: member,
                items: items, 
                totalValue: total,
                // Check if any note exists in the group and use first one found
                note: items.find(i => i.note)?.note
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }
  }, [filteredData, dataSource]);

  // 3. Logic for Table View (Pivoting)
  // Identify Unique Columns (Sub-categories / Names)
  const tableColumnHeaders = useMemo(() => {
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

  // Construct Pivot Rows (Group by Date)
  const tableRows = useMemo(() => {
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
  }, [filteredData, dataSource, filterCategory, tableColumnHeaders]);

  const isItemHighlighted = (item: any) => {
    if (filterCategory === 'All') return false;
    if (item.category === filterCategory) return true;
    return false;
  };

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors flex-shrink-0">
         <div className="flex flex-wrap items-center gap-4">
             
             {/* 1. View Type Toggle (Individual Record vs Master Table) */}
             <div className="flex items-center gap-2 mr-2 border-r border-slate-200 dark:border-slate-700 pr-4">
                <span className="text-sm font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">{t.viewType}:</span>
                <div className="flex bg-slate-100 dark:bg-slate-700 rounded-lg p-1">
                   <button 
                     onClick={() => setViewType('cards')}
                     className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewType === 'cards' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                   >
                     {t.individualRecord}
                   </button>
                   <button 
                     onClick={() => setViewType('table')}
                     className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewType === 'table' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
                   >
                     {t.masterTable}
                   </button>
                </div>
            </div>

             {/* 2. Data Source Toggle */}
             <div className="flex items-center gap-2 mr-2">
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

      {/* ================= CARD VIEW (INDIVIDUAL RECORDS) ================= */}
      {viewType === 'cards' && (
        <div className="space-y-4 flex-1 overflow-y-auto">
            {cardGroups.map(group => (
            <Card key={group.id} className="hover:shadow-md transition-all relative">
                <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{group.date}</h3>
                    {/* Family Member Badge for BOTH types now */}
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dataSource === 'assets' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                        {group.familyMember || 'Me'}
                    </span>
                    </div>
                    {/* Show Note if exists */}
                    {group.note && <p className="text-sm text-slate-500 dark:text-slate-400 italic">{group.note}</p>}
                </div>
                <div className="flex items-center gap-4 mt-2 md:mt-0">
                    <div className="text-right">
                        <span className={`block text-xl font-bold font-mono ${dataSource === 'assets' ? 'text-green-600 dark:text-green-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {group.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </span>
                        <span className="text-xs text-slate-400">{t.totalValue} (Sum)</span>
                    </div>
                    <div className="flex items-center gap-1 ml-4">
                        {dataSource === 'assets' && (
                            <button 
                                type="button"
                                onClick={(e) => { e.stopPropagation(); onEdit(group as Snapshot); }}
                                className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                                title={t.edit}
                            >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                            </button>
                        )}
                        <button 
                            type="button"
                            onClick={(e) => { 
                                e.stopPropagation(); 
                                if (dataSource === 'assets') onDelete(group.id);
                                else onDeleteIncome(group.date, group.familyMember);
                            }}
                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
                            title={t.delete}
                        >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    </div>
                </div>
                </div>

                {/* Accordion-like detail view */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {group.items.map((item: any) => (
                    <div key={item.id} className={`p-3 rounded border text-sm flex justify-between items-center transition-colors ${
                    isItemHighlighted(item)
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800 ring-2 ring-blue-100 dark:ring-blue-900/40' 
                        : 'bg-slate-50 dark:bg-slate-700/50 border-slate-100 dark:border-slate-700'
                    }`}>
                    <div>
                        <span className="block font-medium text-slate-700 dark:text-slate-200">{item.name}</span>
                        <span className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wide">{item.category}</span>
                    </div>
                    <div className="text-right">
                        <span className="block font-mono font-medium text-slate-800 dark:text-slate-200">{item.value.toLocaleString()} <span className="text-xs text-slate-500">{item.currency}</span></span>
                    </div>
                    </div>
                ))}
                </div>
            </Card>
            ))}
            {cardGroups.length === 0 && (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
                {t.noRecords}
            </div>
            )}
        </div>
      )}

      {/* ================= TABLE VIEW (MASTER TABLE) ================= */}
      {viewType === 'table' && (
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
                    {tableColumnHeaders.map(col => (
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
                    {tableRows.length > 0 ? (
                        tableRows.map((row) => (
                        <tr key={row.date} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                            {/* Sticky Date Column Cell */}
                            <td className="sticky left-0 z-10 bg-white dark:bg-slate-800 px-4 py-3 font-medium text-slate-900 dark:text-slate-100 border-r border-slate-200 dark:border-slate-700 whitespace-nowrap">
                            {row.date}
                            </td>
                            {/* Dynamic Asset Cells */}
                            {tableColumnHeaders.map(col => {
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
                            <td colSpan={tableColumnHeaders.length + 2} className="px-6 py-12 text-center text-slate-500 dark:text-slate-400">
                            {t.noRecords}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
            </div>
        </div>
      )}
    </div>
  );
};
