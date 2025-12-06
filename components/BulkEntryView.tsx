import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Language } from '../types';
import { translations } from '../utils/translations';

interface BulkEntryViewProps {
  categories: string[];
  familyMembers: string[];
  onImport: (items: BulkImportItem[]) => void;
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

export const BulkEntryView: React.FC<BulkEntryViewProps> = ({ categories, familyMembers, onImport, language }) => {
  const [inputText, setInputText] = useState('');
  const [stagedItems, setStagedItems] = useState<BulkImportItem[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');
  const t = translations[language];

  const handleParse = () => {
    const rows = inputText.trim().split('\n');
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
        const name = cols[2] || 'Asset';
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
  };

  const handleUpdateItem = (id: string, field: keyof BulkImportItem, val: any) => {
    setStagedItems(prev => prev.map(item => item.id === id ? { ...item, [field]: val } : item));
  };

  const handleRemoveItem = (id: string) => {
    setStagedItems(prev => prev.filter(item => item.id !== id));
  };

  const doImport = () => {
    onImport(stagedItems);
    setStagedItems([]);
    setInputText('');
    setStep('input');
    // Scroll to top of the main container
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const inputStyle = "px-2 py-1 border border-slate-200 dark:border-slate-600 rounded text-slate-700 dark:text-slate-200 focus:ring-1 focus:ring-blue-500 outline-none bg-white dark:bg-slate-700";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {step === 'input' && (
        <Card title={t.bulkImport} className="animate-fade-in">
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {t.bulkDesc} <br/>
              {t.expectedFormat}: <strong>{t.date}</strong> | <strong>{t.category}</strong> | <strong>{t.name}</strong> | <strong>{t.value}</strong> | <strong>{t.familyMember}</strong> | <strong>{t.currency}</strong>
            </p>
            <textarea
              className="w-full h-64 p-4 border border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-200"
              placeholder={`2023-10-01\tBank\tChase\t5000\tDad\tUSD\n2023-10-01\tStock\tBABA\t1200\tMom\tCNY\n...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={handleParse} disabled={!inputText.trim()}>
                {t.parseData}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 'review' && (
        <Card title={`${t.reviewImport} (${stagedItems.length})`} className="animate-fade-in">
          <div className="space-y-4">
            
            {/* Actions Moved to Top */}
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
                    <th className="pb-2">{t.currency}</th>
                    <th className="pb-2">{t.familyMember}</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                  {stagedItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="py-2 pr-2">
                        <input 
                          type="date" 
                          value={item.date}
                          onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                          className={`w-32 ${inputStyle}`}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                          className={`w-28 ${inputStyle}`}
                        >
                          {categories.map(c => <option key={c} value={c}>{c}</option>)}
                          {!categories.includes(item.category) && <option value={item.category}>{item.category} (New)</option>}
                        </select>
                      </td>
                      <td className="py-2 pr-2">
                        <input 
                          type="text" 
                          value={item.name}
                          onChange={(e) => handleUpdateItem(item.id, 'name', e.target.value)}
                          className={`w-full ${inputStyle}`}
                        />
                      </td>
                      <td className="py-2 pr-2">
                         <input 
                          type="number" 
                          value={item.value}
                          onChange={(e) => handleUpdateItem(item.id, 'value', parseFloat(e.target.value))}
                          className={`w-24 ${inputStyle}`}
                        />
                      </td>
                      <td className="py-2 pr-2">
                         <input 
                          type="text" 
                          value={item.currency}
                          onChange={(e) => handleUpdateItem(item.id, 'currency', e.target.value)}
                          className={`w-16 uppercase ${inputStyle}`}
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.familyMember}
                          onChange={(e) => handleUpdateItem(item.id, 'familyMember', e.target.value)}
                          className={`w-24 ${inputStyle}`}
                        >
                          {familyMembers.map(m => <option key={m} value={m}>{m}</option>)}
                          {!familyMembers.includes(item.familyMember) && <option value={item.familyMember}>{item.familyMember} (New)</option>}
                        </select>
                      </td>
                      <td className="py-2 text-right">
                        <button onClick={() => handleRemoveItem(item.id)} className="text-red-400 hover:text-red-600">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                        </button>
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