import React, { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/Button';
import { Card } from './ui/Card';

interface BulkEntryViewProps {
  categories: string[];
  familyMembers: string[];
  onImport: (items: BulkImportItem[]) => void;
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

export const BulkEntryView: React.FC<BulkEntryViewProps> = ({ categories, familyMembers, onImport }) => {
  const [inputText, setInputText] = useState('');
  const [stagedItems, setStagedItems] = useState<BulkImportItem[]>([]);
  const [step, setStep] = useState<'input' | 'review'>('input');

  const handleParse = () => {
    const rows = inputText.trim().split('\n');
    const parsed: BulkImportItem[] = [];

    rows.forEach(row => {
      // Basic heuristic for Excel/Sheets copy-paste (Tab separated)
      const delimiter = row.includes('\t') ? '\t' : ',';
      const cols = row.split(delimiter).map(c => c.trim());
      
      // Expected Format: Date | Category | Name | Value | Family Member | Currency
      
      if (cols.length >= 3) {
        let date = cols[0];
        // Attempt to standardize date to YYYY-MM-DD
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

        // Clean value
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
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      
      {step === 'input' && (
        <Card title="Bulk Data Import" className="animate-fade-in">
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Copy and paste data from Excel or Google Sheets. <br/>
              Expected format: <strong>Date</strong> | <strong>Category</strong> | <strong>Name</strong> | <strong>Value</strong> | <strong>Family Member</strong> | <strong>Currency</strong>
            </p>
            <textarea
              className="w-full h-64 p-4 border border-slate-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder={`2023-10-01\tBank\tChase\t5000\tDad\tUSD\n2023-10-01\tStock\tBABA\t1200\tMom\tCNY\n...`}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />
            <div className="flex justify-end">
              <Button onClick={handleParse} disabled={!inputText.trim()}>
                Parse Data
              </Button>
            </div>
          </div>
        </Card>
      )}

      {step === 'review' && (
        <Card title={`Review Import (${stagedItems.length} items)`} className="animate-fade-in">
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                    <th className="pb-2 pl-2">Date</th>
                    <th className="pb-2">Category</th>
                    <th className="pb-2">Name</th>
                    <th className="pb-2">Value</th>
                    <th className="pb-2">Currency</th>
                    <th className="pb-2">Member</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stagedItems.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="py-2 pr-2">
                        <input 
                          type="date" 
                          value={item.date}
                          onChange={(e) => handleUpdateItem(item.id, 'date', e.target.value)}
                          className="w-32 px-2 py-1 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.category}
                          onChange={(e) => handleUpdateItem(item.id, 'category', e.target.value)}
                          className="w-28 px-2 py-1 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
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
                          className="w-full px-2 py-1 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="py-2 pr-2">
                         <input 
                          type="number" 
                          value={item.value}
                          onChange={(e) => handleUpdateItem(item.id, 'value', parseFloat(e.target.value))}
                          className="w-24 px-2 py-1 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </td>
                      <td className="py-2 pr-2">
                         <input 
                          type="text" 
                          value={item.currency}
                          onChange={(e) => handleUpdateItem(item.id, 'currency', e.target.value)}
                          className="w-16 px-2 py-1 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none uppercase"
                        />
                      </td>
                      <td className="py-2 pr-2">
                        <select
                          value={item.familyMember}
                          onChange={(e) => handleUpdateItem(item.id, 'familyMember', e.target.value)}
                          className="w-24 px-2 py-1 border border-slate-200 rounded text-slate-700 focus:ring-1 focus:ring-blue-500 outline-none"
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

            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="secondary" onClick={() => setStep('input')}>Back</Button>
              <Button onClick={doImport} className="bg-emerald-600 hover:bg-emerald-700">Import Items</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};