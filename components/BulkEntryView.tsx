
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Language, IncomeRecord } from '../types';
import { translations } from '../utils/translations';

interface BulkEntryViewProps {
  categories: string[];
  familyMembers: string[];
  onImport: (items: BulkImportItem[]) => void;
  onImportIncome: (items: IncomeRecord[]) => void;
  language: Language;
}

export interface BulkImportItem {
  id: string;
  date: string;
  category: string;
  name: string;
  value: number;
  familyMember: string;
  currency: string;
}

export const BulkEntryView: React.FC<BulkEntryViewProps> = ({ categories, familyMembers, onImport, onImportIncome, language }) => {
  const [inputText, setInputText] = useState('');
  const [importType, setImportType] = useState<'snapshot' | 'income'>('snapshot');
  const [stagedItems, setStagedItems] = useState<BulkImportItem[]>([]);
  const [stagedIncome, setStagedIncome] = useState<IncomeRecord[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');
  
  const t = translations[language];

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
        // Parse Income Records: Date | Category | Name | Value | Family Member | Currency
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
             const familyMember = cols[4] || familyMembers[0] || 'Me'; // Default to first member
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
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputStyle = "px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {step === 'input' && (
        <Card title={t.bulkImport} className="animate-fade-in">
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
    </div>
  );
};
