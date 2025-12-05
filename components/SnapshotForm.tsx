import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Snapshot, AssetItem } from '../types';
import { Button } from './ui/Button';

interface SnapshotFormProps {
  existingSnapshot?: Snapshot | null;
  onSave: (snapshot: Snapshot) => void;
  onCancel: () => void;
  suggestedCategories: string[];
  familyMembers: string[];
}

const COMMON_CURRENCIES = ['USD', 'EUR', 'CNY', 'GBP', 'JPY', 'CAD', 'AUD', 'INR', 'SGD'];

export const SnapshotForm: React.FC<SnapshotFormProps> = ({ 
  existingSnapshot, 
  onSave, 
  onCancel, 
  suggestedCategories,
  familyMembers
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [familyMember, setFamilyMember] = useState(familyMembers[0] || 'Me');
  const [items, setItems] = useState<AssetItem[]>([
    { id: uuidv4(), category: 'Bank', name: '', value: 0, currency: 'USD', tags: [] }
  ]);
  const [note, setNote] = useState('');

  useEffect(() => {
    if (existingSnapshot) {
      setDate(existingSnapshot.date);
      setFamilyMember(existingSnapshot.familyMember);
      setItems(existingSnapshot.items);
      setNote(existingSnapshot.note || '');
    }
  }, [existingSnapshot]);

  const handleAddItem = () => {
    setItems([...items, { id: uuidv4(), category: '', name: '', value: 0, currency: 'USD', tags: [] }]);
  };

  const handleRemoveItem = (id: string) => {
    setItems(items.filter(i => i.id !== id));
  };

  const handleItemChange = (id: string, field: keyof AssetItem, value: any) => {
    setItems(items.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const totalValue = items.reduce((sum, item) => sum + Number(item.value), 0);
    
    onSave({
      id: existingSnapshot ? existingSnapshot.id : uuidv4(),
      date,
      familyMember,
      items: items.filter(i => i.name.trim() !== ''), // Remove empty rows
      note,
      totalValue
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-lg border border-slate-100">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Date</label>
          <input 
            type="date" 
            required
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Family Member</label>
          <select
            value={familyMember}
            onChange={(e) => setFamilyMember(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
          >
            {familyMembers.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
           <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Note (Optional)</label>
           <input 
            type="text" 
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. End of year review"
            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent outline-none"
           />
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center border-b pb-2">
          <h4 className="text-sm font-semibold text-slate-600 uppercase tracking-wider">Asset Items</h4>
          <span className="text-sm text-slate-500">
            Raw Total: {items.reduce((acc, curr) => acc + Number(curr.value || 0), 0).toLocaleString()} (Mixed)
          </span>
        </div>
        
        {items.map((item, index) => (
          <div key={item.id} className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-white p-3 rounded-md border border-slate-200 shadow-sm">
            <div className="flex-1 w-full md:w-auto">
              <input
                type="text"
                list="category-suggestions"
                placeholder="Category"
                value={item.category}
                onChange={(e) => handleItemChange(item.id, 'category', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
            <div className="flex-[2] w-full md:w-auto">
              <input
                type="text"
                placeholder="Name (e.g. Chase Checking)"
                value={item.name}
                onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none"
              />
            </div>
            <div className="flex-1 w-full md:w-auto flex gap-2">
               <input
                type="number"
                step="0.01"
                placeholder="Value"
                value={item.value}
                onChange={(e) => handleItemChange(item.id, 'value', parseFloat(e.target.value))}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none font-mono"
              />
              <select
                value={item.currency || 'USD'}
                onChange={(e) => handleItemChange(item.id, 'currency', e.target.value)}
                className="w-20 px-2 py-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none bg-slate-50"
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
          + Add Asset Line
        </Button>
      </div>

      <datalist id="category-suggestions">
        {suggestedCategories.map(cat => (
          <option key={cat} value={cat} />
        ))}
      </datalist>

      <div className="pt-6 border-t border-slate-200 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Snapshot</Button>
      </div>
    </form>
  );
};