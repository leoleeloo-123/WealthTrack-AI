


import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Snapshot, Language, IncomeRecord } from '../types';
import { translations } from '../utils/translations';

// --- Interfaces for Bulk Import Logic ---
export interface BulkImportItem {
  id: string;
  date: string;
  category: string;
  name: string;
  value: number;
  familyMember: string;
  currency: string;
}

interface DataManagementViewProps {
  snapshots: Snapshot[];
  incomeRecords?: IncomeRecord[];
  
  // Bulk Import Props
  categories: string[];
  familyMembers: string[];
  onImport: (items: BulkImportItem[]) => void;
  onImportIncome: (items: IncomeRecord[]) => void;

  onClearAllData: () => void;
  onGenerateDemoData: () => void;
  language: Language;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({ 
  snapshots, 
  incomeRecords = [], 
  categories,
  familyMembers,
  onImport,
  onImportIncome,
  onClearAllData, 
  onGenerateDemoData,
  language 
}) => {
  const t = translations[language];

  // --- Bulk Import State & Logic ---
  const [inputText, setInputText] = useState('');
  const [importType, setImportType] = useState<'snapshot' | 'income'>('snapshot');
  const [stagedItems, setStagedItems] = useState<BulkImportItem[]>([]);
  const [stagedIncome, setStagedIncome] = useState<IncomeRecord[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');

  const handleParse = () => {
    const rows = inputText.trim().split('\n');
    
    if (importType === 'snapshot') {
        const parsed: BulkImportItem[] = [];
        rows.forEach(row => {
          const delimiter = row.includes('\t') ? '\t' : ',';
          const cols = row.split(delimiter).map(c => c.trim());
          
          if (cols.length >= 3) {
            let date = cols[0];
            const dateObj = new Date(date);
            if (!isNaN(dateObj.getTime())) {
              date = dateObj.toISOString().split('T')[0];
            } else {
              date = new Date().toISOString().split('T')[0];
            }

            const category = cols[1] || 'Other';
            const name = cols[2] || category; // Default name to category if empty
            const valueStr = cols[3] || '0';
            const familyMember = cols[4] || familyMembers[0] || 'Me';
            const currency = cols[5] || 'USD';

            const value = parseFloat(valueStr.replace(/[^0-9.-]/g, ''));

            if (!isNaN(value)) {
              parsed.push({
                id: uuidv4(),
                date,
                category: categories.find(c => c.toLowerCase() === category.toLowerCase()) || category,
                name,
                value,
                familyMember,
                currency
              });
            }
          }
        });
        setStagedItems(parsed);
        if (parsed.length > 0) setStep('review');
    } else {
        const parsed: IncomeRecord[] = [];
        rows.forEach(row => {
          const delimiter = row.includes('\t') ? '\t' : ',';
          const cols = row.split(delimiter).map(c => c.trim());
          
          if (cols.length >= 3) {
             let date = cols[0];
             const dateObj = new Date(date);
             if (!isNaN(dateObj.getTime())) date = dateObj.toISOString().split('T')[0];
             else date = new Date().toISOString().split('T')[0];
             
             const category = cols[1] || 'Income';
             const name = cols[2] || 'Source';
             const valueStr = cols[3] || '0';
             const familyMember = cols[4] || familyMembers[0] || 'Me'; 
             const currency = cols[5] || 'USD';

             const value = parseFloat(valueStr.replace(/[^0-9.-]/g, ''));

             if (!isNaN(value)) {
               parsed.push({
                 id: uuidv4(),
                 date,
                 category,
                 name,
                 value,
                 familyMember,
                 currency
               });
             }
          }
        });
        setStagedIncome(parsed);
        if (parsed.length > 0) setStep('review');
    }
  };

  const doImport = () => {
    if (importType === 'snapshot') {
        onImport(stagedItems);
        setStagedItems([]);
    } else {
        onImportIncome(stagedIncome);
        setStagedIncome([]);
    }
    setInputText('');
    setStep('input');
    // Scroll to top of main container if possible, or just reset logic
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // --- Export Logic ---
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
        setTimeout(() => {
            const incomeHeader = ['Date', 'Category', 'Name', 'Value', 'Family Member', 'Currency'];
            const incomeRows = incomeRecords.map(r => {
                const cleanName = (r.name || '').replace(/,/g, ' ');
                const cleanCategory = (r.category || '').replace(/,/g, ' ');
                const cleanMember = (r.familyMember || 'Me').replace(/,/g, ' ');
                return [
                    r.date,
                    cleanCategory,
                    cleanName,
                    r.value,
                    cleanMember,
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
    <div className="max-w-6xl mx-auto space-y-12 animate-fade-in">
      
      {/* ================= SECTION 1: BULK IMPORT ================= */}
      <section className="space-y-4">
         <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 px-1 border-l-4 border-blue-500 pl-3">
            {t.bulkImport}
         </h2>
         
         {step === 'input' && (
            <Card className="animate-fade-in">
              <div className="space-y-6">
                
                {/* Import Type Switcher */}
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700">
                   <span className="font-semibold text-slate-700 dark:text-slate-200">{t.importType}:</span>
                   <div className="flex gap-2">
                     <button 
                       onClick={() => setImportType('snapshot')}
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${importType === 'snapshot' ? 'bg-blue-600 text-white shadow' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                     >
                       {t.assetSnapshots}
                     </button>
                     <button 
                       onClick={() => setImportType('income')}
                       className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${importType === 'income' ? 'bg-emerald-600 text-white shadow' : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'}`}
                     >
                       {t.incomeRecords}
                     </button>
                   </div>
                </div>

                <div>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                    {t.bulkDesc}
                  </p>
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                     <span>{t.expectedFormat}: <strong>{t.date}</strong> | <strong>{t.category}</strong> | <strong>{t.name}</strong> | <strong>{t.value}</strong> | <strong>{t.familyMember}</strong> | <strong>{t.currency}</strong></span>
                  </p>
                  <textarea
                    className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
                    placeholder={importType === 'snapshot' 
                      ? `2023-10-01\tBank\tChase\t5000\tDad\tUSD\n...` 
                      : `2023-12-31\tDividend\tApple Stock\t45.50\tMe\tUSD\n2023-12-31\tInterest\tT-Bill\t120.00\tMom\tUSD`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                  />
                  <div className="flex justify-end mt-4">
                    <Button onClick={handleParse} disabled={!inputText.trim()}>
                      {t.parseData}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          )}

          {step === 'review' && (
            <Card title={`${t.reviewImport} (${importType === 'snapshot' ? stagedItems.length : stagedIncome.length})`} className="animate-fade-in">
              <div className="space-y-4">
                
                <div className="flex justify-end gap-3 pb-4 border-b border-slate-100 dark:border-slate-700">
                  <Button variant="secondary" onClick={() => setStep('input')}>{t.back}</Button>
                  <Button onClick={doImport} className="bg-emerald-600 hover:bg-emerald-700">{t.importItems}</Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm text-slate-700 dark:text-slate-300">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        <th className="pb-2 pl-2">{t.date}</th>
                        <th className="pb-2">{t.category}</th>
                        <th className="pb-2">{t.name}</th>
                        <th className="pb-2">{t.value}</th>
                        <th className="pb-2">{t.familyMember}</th>
                        <th className="pb-2">{t.currency}</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                      {/* RENDER SNAPSHOT ITEMS */}
                      {importType === 'snapshot' && stagedItems.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="py-2 pr-2">{item.date}</td>
                          <td className="py-2 pr-2">{item.category}</td>
                          <td className="py-2 pr-2">{item.name}</td>
                          <td className="py-2 pr-2">{item.value}</td>
                          <td className="py-2 pr-2">{item.familyMember}</td>
                          <td className="py-2 pr-2">{item.currency}</td>
                          <td className="py-2 text-right">
                             <button onClick={() => setStagedItems(prev => prev.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600">x</button>
                          </td>
                        </tr>
                      ))}
                      
                      {/* RENDER INCOME ITEMS */}
                      {importType === 'income' && stagedIncome.map(item => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                          <td className="py-2 pr-2">{item.date}</td>
                          <td className="py-2 pr-2">{item.category}</td>
                          <td className="py-2 pr-2">{item.name}</td>
                          <td className="py-2 pr-2 font-mono text-emerald-600">{item.value}</td>
                          <td className="py-2 pr-2">{item.familyMember}</td>
                          <td className="py-2 pr-2">{item.currency}</td>
                          <td className="py-2 text-right">
                             <button onClick={() => setStagedIncome(prev => prev.filter(i => i.id !== item.id))} className="text-red-400 hover:text-red-600">x</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>
          )}
      </section>

      {/* ================= SECTION 2: DATA MANAGEMENT & BACKUP ================= */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 px-1 border-l-4 border-emerald-500 pl-3">
          {t.dataManagement}
        </h2>

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

        {/* Demo Data Section */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg>
            </div>
            <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">{t.generateDemo}</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t.generateDemoDesc}</p>
            </div>
            </div>
            
            <div className="bg-slate-50 dark:bg-slate-700/50 p-4 rounded-lg border border-slate-100 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm text-slate-600 dark:text-slate-300">
                {t.generateDemoDesc}
            </p>
            <Button onClick={onGenerateDemoData} variant="secondary" className="whitespace-nowrap">
                {t.generate}
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
      </section>

    </div>
  );
};
