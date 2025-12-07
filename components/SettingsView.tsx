
import React, { useState } from 'react';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { Language, Theme } from '../types';
import { translations } from '../utils/translations';

interface SettingsViewProps {
  categories: string[];
  onAddCategory: (category: string) => void;
  onRenameCategory: (oldName: string, newName: string) => void;
  onDeleteCategory: (category: string) => void;
  
  incomeCategories: string[];
  onAddIncomeCategory: (category: string) => void;
  onRenameIncomeCategory: (oldName: string, newName: string) => void;
  onDeleteIncomeCategory: (category: string) => void;

  familyMembers: string[];
  onAddMember: (name: string) => void;
  onRenameMember: (oldName: string, newName: string) => void;
  onDeleteMember: (name: string) => void;

  theme: Theme;
  onSetTheme: (theme: Theme) => void;
  language: Language;
  onSetLanguage: (lang: Language) => void;
}

const ListEditor: React.FC<{
  title: string;
  items: string[];
  onAdd: (val: string) => void;
  onRename: (oldVal: string, newVal: string) => void;
  onDelete: (val: string) => void;
  placeholder: string;
  warning?: string;
  lang: Language;
}> = ({ title, items, onAdd, onRename, onDelete, placeholder, warning, lang }) => {
  const [newItem, setNewItem] = useState('');
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const t = translations[lang];

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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mb-6 transition-colors">
      <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-2">{title}</h3>
      {warning && (
        <p className="text-sm text-amber-600 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-400 px-2 py-1 rounded border border-amber-100 dark:border-amber-800/50 mb-4 inline-block">
          {warning}
        </p>
      )}

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input
          type="text"
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          placeholder={placeholder}
          className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all bg-white dark:bg-slate-700 dark:text-white"
        />
        <Button type="submit" disabled={!newItem.trim()}>
          {t.add}
        </Button>
      </form>

      <div className="space-y-2">
        {items.map(item => (
          <div key={item} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg border border-slate-100 dark:border-slate-700 group hover:border-blue-200 dark:hover:border-blue-700 hover:shadow-sm transition-all">
            {editingItem === item ? (
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  className="flex-1 px-2 py-1 border border-blue-300 dark:border-blue-500 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-600 dark:text-white"
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
                  className="text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600 p-1.5 rounded transition-colors"
                  title="Cancel"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
            ) : (
              <>
                <span className="font-medium text-slate-700 dark:text-slate-200">{item}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => startEdit(item)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors" title="Rename">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                  </button>
                  <button onClick={() => onDelete(item)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors" title="Delete">
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
  const t = translations[props.language];

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      
      {/* General Settings */}
      <Card title={t.generalSettings}>
        <div className="space-y-6">
          
          {/* Theme */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">{t.theme}</span>
            </div>
            <div className="flex items-center bg-slate-100 dark:bg-slate-700 p-1 rounded-lg">
              <button 
                onClick={() => props.onSetTheme('light')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${props.theme === 'light' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {t.light}
              </button>
              <button 
                onClick={() => props.onSetTheme('dark')}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${props.theme === 'dark' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-500 dark:text-slate-400'}`}
              >
                {t.dark}
              </button>
            </div>
          </div>

          {/* Language */}
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
               <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-600 dark:text-slate-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
              </div>
              <span className="font-medium text-slate-700 dark:text-slate-200">{t.language}</span>
            </div>
            <select
              value={props.language}
              onChange={(e) => props.onSetLanguage(e.target.value as Language)}
              className="px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-sm text-slate-700 dark:text-slate-200 outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="en">English</option>
              <option value="zh">中文 (Chinese)</option>
            </select>
          </div>

        </div>
      </Card>

      {/* Tag Control Section */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-4 px-1">{t.tagControl}</h2>
        
        <ListEditor
          title={t.assetCategories}
          items={props.categories}
          onAdd={props.onAddCategory}
          onRename={props.onRenameCategory}
          onDelete={props.onDeleteCategory}
          placeholder={t.newCategoryPlaceholder}
          warning={t.renameWarning}
          lang={props.language}
        />

        <ListEditor
          title={t.incomeCategories}
          items={props.incomeCategories}
          onAdd={props.onAddIncomeCategory}
          onRename={props.onRenameIncomeCategory}
          onDelete={props.onDeleteIncomeCategory}
          placeholder={t.newCategoryPlaceholder}
          warning={t.renameWarning}
          lang={props.language}
        />
        
        <ListEditor
          title={t.familyMembers}
          items={props.familyMembers}
          onAdd={props.onAddMember}
          onRename={props.onRenameMember}
          onDelete={props.onDeleteMember}
          placeholder={t.newMemberPlaceholder}
          warning={t.renameWarning}
          lang={props.language}
        />
      </div>
    </div>
  );
};
