
import React, { useMemo, useState } from 'react';
import { Snapshot, Language, AssetItem, IncomeRecord } from '../types';
import { Card } from './ui/Card';
import { translations } from '../utils/translations';

interface HistoryViewProps {
  snapshots: Snapshot[];
  incomeRecords: IncomeRecord[];
  availableCategories: string[]; // Kept for prop compatibility, but unused for filtering options
  familyMembers: string[];      // Kept for prop compatibility, but unused for filtering options
  onEdit: (s: Snapshot) => void;
  onDelete: (id: string) => void;
  onDeleteIncome: (date: string) => void;
  language: Language;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ 
  snapshots,
  incomeRecords, 
  onEdit, 
  onDelete,
  onDeleteIncome, 
  language 
}) => {
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
  
  // Sort and Filter Data
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
        // Group Income by Date to mimic Snapshots structure
        const grouped: Record<string, IncomeRecord[]> = {};
        incomeRecords.forEach(r => {
            if (!grouped[r.date]) grouped[r.date] = [];
            grouped[r.date].push(r);
        });

        const groups = Object.keys(grouped).map(date => {
            const items = grouped[date];
            const total = items.reduce((sum, i) => sum + i.value, 0);
            return {
                id: date, // Use date as ID for the group
                date,
                familyMember: 'Income', // Placeholder
                items: items, // IncomeRecord structure matches generic usage enough or we map it
                totalValue: total
            };
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return groups.filter(g => {
            // No family member filter for Income
            // Category filter: Show group if any item matches
            if (filterCategory !== 'All' && !g.items.some(i => i.category === filterCategory)) return false;
            if (filterStartDate && g.date < `${filterStartDate}-01`) return false;
            if (filterEndDate && g.date > `${filterEndDate}-31`) return false;
            return true;
        });
    }
  }, [snapshots, incomeRecords, dataSource, filterMember, filterCategory, filterStartDate, filterEndDate]);

  const isItemHighlighted = (item: any) => {
    if (filterCategory === 'All') return false;
    if (item.category === filterCategory) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
         <div className="flex flex-wrap items-center gap-4">
             
             {/* Data Source Toggle */}
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

             {/* Family Member (Assets Only) */}
             {dataSource === 'assets' && (
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
             )}

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

             {(filterStartDate || filterEndDate || filterCategory !== 'All' || (dataSource === 'assets' && filterMember !== 'All')) && (
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

      <div className="space-y-4">
        {filteredData.map(group => (
          <Card key={group.id} className="hover:shadow-md transition-all relative">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{group.date}</h3>
                   <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${dataSource === 'assets' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'}`}>
                     {dataSource === 'assets' ? (group.familyMember || 'Me') : t.investmentIncome}
                   </span>
                 </div>
                 {dataSource === 'assets' && (group as Snapshot).note && <p className="text-sm text-slate-500 dark:text-slate-400 italic">{(group as Snapshot).note}</p>}
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
                            else onDeleteIncome(group.date);
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
        {filteredData.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {t.noRecords}
          </div>
        )}
      </div>
    </div>
  );
};
