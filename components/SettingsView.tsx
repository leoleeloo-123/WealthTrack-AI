import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Snapshot } from '../types';

interface SettingsViewProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (category: string) => void;
  
  familyMembers: string[];
  onAddMember: (name: string) => void;
  onRenameMember: (oldName: string, newName: string) => void;
  onDeleteMember: (name: string) => void;

  snapshots: Snapshot[];
}

const ListEditor: React.FC<{
  title: string;
  items: string[];
  onAdd: (val: string) => void;
  onRename: (oldVal: string, newVal: string) => void;
  onDelete: (val: string) => void;
  placeholder: string;
  warning?: string;
}> = ({ title, items, onAdd, onRename, onDelete, placeholder, warning }) => {
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const startEdit = (item: string) => {
    setEditingItem(item);
    setEditValue(item);
  };

  const saveEdit = () => {
    if (editingItem && editValue.trim() && editValue !== editingItem) {
      onRename(editingItem, editValue.trim());
    }
    setEditingItem(null);
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <h3 className="text-lg font-bold text-slate-800 mb-2">{title}</h3>
      {warning && (
        <p className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100 mb-4 inline-block">
          {warning}
        </p>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-shadow"
        />
        <Button type="submit" disabled={!newItem.trim()}>
          Add
        </Button>
      </form>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-100 group hover:border-blue-200 hover:shadow-sm transition-all">
            {editingItem === item ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-2 py-1 border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button 
                  onClick={saveEdit} 
                  className="text-white bg-green-500 hover:bg-green-600 p-1.5 rounded transition-colors"
                  title="Save"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                </button>
                <button 
                  onClick={() => setEditingItem(null)} 
                  className="text-slate-500 hover:bg-slate-200 p-1.5 rounded transition-colors"
                  title="Cancel"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <>
                <span className="font-medium text-slate-700">{item}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Rename">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onDelete(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export const SettingsView: React.FC<SettingsViewProps> = (props) => {
  const handleExportCSV = () => {
    // Expected Header: Date | Category | Name | Value | Family Member | Currency
    const header = ['Date', 'Category', 'Name', 'Value', 'Family Member', 'Currency'];
    
    // Flatten snapshots into rows
    const rows = props.snapshots.flatMap(s => 
      s.items.map(i => {
        // Basic sanitization: replace commas in name/category to avoid breaking CSV columns
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

    const csvContent = [header.join(','), ...rows].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `wealthtrack_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      
      {/* Data Management Section */}
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
           </div>
           <div>
              <h3 className="text-lg font-bold text-slate-800">Data Backup</h3>
              <p className="text-xs text-slate-500">Export your data to safeguard against updates or to move to another device.</p>
           </div>
        </div>
        
        <div className="bg-slate-50 p-4 rounded-lg border border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-slate-600">
             Download a <strong>.csv</strong> file compatible with Excel. 
             <br/>You can restore this data later using the <strong>Bulk Import</strong> feature.
          </p>
          <Button onClick={handleExportCSV} variant="primary" className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-700">
            Download CSV
          </Button>
        </div>
      </div>

      <ListEditor
        title="Asset Categories"
        items={props.categories}
        onAdd={props.onAddCategory}
        onRename={props.onRenameCategory}
        onDelete={props.onDeleteCategory}
        placeholder="New Category (e.g. Art, Watches)"
        warning="Renaming a category here will update all historical records."
      />
      
      <ListEditor
        title="Family Members"
        items={props.familyMembers}
        onAdd={props.onAddMember}
        onRename={props.onRenameMember}
        onDelete={props.onDeleteMember}
        placeholder="New Member (e.g. Dad, Mom, Kid)"
        warning="Renaming a member here will update all historical records."
      />
    </div>
  );
};