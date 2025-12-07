
import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { IncomeRecord, Language } from '../types';
import { Button } from './ui/Button';
import { translations } from '../utils/translations';

interface IncomeFormProps {
  onSave: (records: IncomeRecord[]) => void;
  onCancel: () => void;
  language: Language;
  availableCategories: string[];
  familyMembers: string[];
}

const COMMON_CURRENCIES = ['USD', 'EUR', 'CNY', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'SGD'];

export const IncomeForm: React.FC<IncomeFormProps> = ({ 
  onSave, 
  onCancel, 
  language,
  availableCategories,
  familyMembers
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [familyMember, setFamilyMember] = useState(familyMembers[0] || 'Me');
  
  // We use a simplified internal structure for the form state
  const [items, setItems] = useState<{ id: string; category: string; name: string; value: number; currency: string }[]>([
    { id: uuidv4(), category: availableCategories[0] || 'Dividend', name: '', value: 0, currency: 'USD' }
  ]);
  const t = translations[language];

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), category: '', name: '', value: 0, currency: 'USD' }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleItemChange = (id: string, field: string, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert form items to actual IncomeRecord objects
    const newRecords: IncomeRecord[] = items
      .filter(i => i.value !== 0) // Filter out empty lines
      .map(item => ({
        id: uuidv4(),
        date,
        category: item.category || 'Other',
        name: item.name || item.category || 'Income',
        value: Number(item.value),
        currency: item.currency,
        familyMember: familyMember
      }));

    onSave(newRecords);
  };

  const inputStyle = "w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-lg border border-emerald-100 dark:border-emerald-800 transition-colors">
        <h3 className="text-emerald-800 dark:text-emerald-300 font-bold mb-4 flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t.newIncomeRecord}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-lg">
          <div>
            <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">{t.date}</label>
            <input 
              type="date" 
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputStyle}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider mb-1">{t.familyMember}</label>
            <select
              value={familyMember}
              onChange={(e) => setFamilyMember(e.target.value)}
              className={inputStyle}
            >
              {familyMembers.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center border-b border-slate-200 dark:border-slate-700 pb-2">
          <h4 className="text-sm font-semibold text-slate-600 dark:text-slate-300 uppercase tracking-wider">{t.incomeDetails}</h4>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {t.total}: {items.reduce((acc, curr) => acc + Number(curr.value || 0), 0).toLocaleString()}
          </span>
        </div>
        
        {items.map((item) => (
          <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white dark:bg-slate-800 p-3 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm transition-colors">
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                list="income-categories"
                placeholder={t.category}
                value={item.category}
                onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-accent outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex-[2] w-full md:w-auto">
              <input
                type="text"
                placeholder={t.sourcePlaceholder}
                value={item.name}
                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-accent outline-none bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex-1 w-full md:w-auto flex gap-2">
               <input
                type="number"
                step="0.01"
                placeholder={t.value}
                value={item.value}
                onChange={(e) => handleItemChange(item.id, 'value', parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-accent outline-none font-mono bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
              <select
                value={item.currency || 'USD'}
                onChange={(e) => handleItemChange(item.id, 'currency', e.target.value)}
                className="w-20 px-2 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded focus:ring-1 focus:ring-accent outline-none bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                {COMMON_CURRENCIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <button 
              type="button" 
              onClick={() => handleRemoveItem(item.id)}
              className="text-red-400 hover:text-red-600 p-2"
              title="Remove Item"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="secondary" onClick={handleAddItem} className="w-full md:w-auto text-sm">
          + {t.addIncomeLine}
        </Button>
      </div>

      <datalist id="income-categories">
        {availableCategories.map(cat => (
          <option key={cat} value={cat} />
        ))}
      </datalist>

      <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>{t.cancel}</Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">{t.saveIncome}</Button>
      </div>
    </form>
  );
};
