
import React from 'react';
import { Button } from './ui/Button';
import { Snapshot, Language, IncomeRecord } from '../types';
import { translations } from '../utils/translations';

interface DataManagementViewProps {
  snapshots: Snapshot[];
  incomeRecords?: IncomeRecord[];
  onClearAllData: () => void;
  language: Language;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({ snapshots, incomeRecords = [], onClearAllData, language }) => {
  const t = translations[language];

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportData = () => {
    const today = new Date().toISOString().split('T')[0];

    // 1. Export Asset Snapshots
    if (snapshots.length > 0) {
        const assetHeader = ['Date', 'Category', 'Name', 'Value', 'Family Member', 'Currency'];
        const assetRows = snapshots.flatMap(s => 
          s.items.map(i => {
            const cleanName = (i.name || '').replace(/,/g, ' ');
            const cleanCategory = (i.category || '').replace(/,/g, ' ');
            const cleanMember = (s.familyMember || 'Me').replace(/,/g, ' ');
            
            return [
              s.date,
              cleanCategory,
              cleanName,
              i.value,
              cleanMember,
              i.currency || 'USD'
            ].join(',');
          })
        );
        const assetCsv = [assetHeader.join(','), ...assetRows].join('\n');
        downloadCSV(assetCsv, `Asset_Snapshot_${today}.csv`);
    }

    // 2. Export Investment Income
    if (incomeRecords.length > 0) {
        // Need a small delay to ensure both downloads trigger in some browsers
        setTimeout(() => {
            const incomeHeader = ['Date', 'Category', 'Name', 'Value', 'Currency'];
            const incomeRows = incomeRecords.map(r => {
                const cleanName = (r.name || '').replace(/,/g, ' ');
                const cleanCategory = (r.category || '').replace(/,/g, ' ');
                return [
                    r.date,
                    cleanCategory,
                    cleanName,
                    r.value,
                    r.currency || 'USD'
                ].join(',');
            });
            const incomeCsv = [incomeHeader.join(','), ...incomeRows].join('\n');
            downloadCSV(incomeCsv, `Investment_Income_${today}.csv`);
        }, 500);
    }
  };

  const handleDeleteAll = () => {
    if (window.confirm(t.deleteConfirm)) {
        onClearAllData();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      
      {/* Export Section */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           </div>
           <div>
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.dataBackup}</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">{t.backupDesc}</p>
           </div>
        </div>
        
        <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-600 dark:text-slate-300">
             {t.downloadCSV}
          </p>
          <Button onClick={handleExportData} variant="primary" className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700">
            {t.downloadCSV}
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-red-200 dark:border-red-900 shadow-sm relative overflow-hidden transition-colors">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </div>
           <div>
              <h3 className="text-lg font-bold text-red-700 dark:text-red-400">{t.dangerZone}</h3>
              <p className="text-xs text-red-500 dark:text-red-400/70">{t.irriversible}</p>
           </div>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-900/50 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-red-800 dark:text-red-300">
             {t.deleteWarning}
          </p>
          <Button onClick={handleDeleteAll} variant="danger" className="whitespace-nowrap">
            {t.deleteAll}
          </Button>
        </div>
      </div>

    </div>
  );
};
