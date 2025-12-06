import React, { useMemo, useState } from 'react';
import { Snapshot, Language } from '../types';
import { Card } from './ui/Card';
import { translations } from '../utils/translations';

interface HistoryViewProps {
  snapshots: Snapshot[];
  onEdit: (s: Snapshot) => void;
  onDelete: (id: string) => void;
  language: Language;
}

export const HistoryView: React.FC<HistoryViewProps> = ({ snapshots, onEdit, onDelete, language }) => {
  const [filter, setFilter] = useState('');
  const t = translations[language];
  
  // Sort chronological
  const sortedSnapshots = useMemo(() => {
    return [...snapshots].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [snapshots]);

  const filteredSnapshots = sortedSnapshots.filter(s => 
    s.items.some(i => 
      i.name.toLowerCase().includes(filter.toLowerCase()) || 
      i.category.toLowerCase().includes(filter.toLowerCase())
    ) || s.date.includes(filter) || s.familyMember?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
        <input 
          type="text" 
          placeholder={t.filterPlaceholder}
          className="w-full sm:w-96 px-4 py-2 border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-lg focus:ring-2 focus:ring-accent outline-none transition-colors"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="space-y-4">
        {filteredSnapshots.map(snapshot => (
          <Card key={snapshot.id} className="hover:shadow-md transition-all relative">
            <div className="flex flex-col md:flex-row justify-between md:items-center mb-4 pb-3 border-b border-slate-100 dark:border-slate-700">
               <div>
                 <div className="flex items-center gap-2 mb-1">
                   <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{snapshot.date}</h3>
                   <span className="bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 text-xs px-2 py-0.5 rounded-full font-medium">
                     {snapshot.familyMember || 'Me'}
                   </span>
                 </div>
                 {snapshot.note && <p className="text-sm text-slate-500 dark:text-slate-400 italic">{snapshot.note}</p>}
               </div>
               <div className="flex items-center gap-4 mt-2 md:mt-0">
                 <div className="text-right">
                    <span className="block text-xl font-bold text-green-600 dark:text-green-400 font-mono">
                      {snapshot.totalValue.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                    </span>
                    <span className="text-xs text-slate-400">{t.totalValue} (Sum)</span>
                 </div>
                 <div className="flex items-center gap-1 ml-4">
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onEdit(snapshot); }}
                        className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
                        title={t.edit}
                    >
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                       </svg>
                    </button>
                    <button 
                        type="button"
                        onClick={(e) => { e.stopPropagation(); onDelete(snapshot.id); }}
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
              {snapshot.items.map(item => (
                <div key={item.id} className={`p-3 rounded border text-sm flex justify-between items-center transition-colors ${
                  (filter && (item.name.toLowerCase().includes(filter.toLowerCase()) || item.category.toLowerCase().includes(filter.toLowerCase())))
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
        {filteredSnapshots.length === 0 && (
          <div className="text-center py-12 text-slate-500 dark:text-slate-400">
            {t.noRecords}
          </div>
        )}
      </div>
    </div>
  );
};