import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { SnapshotForm } from './components/SnapshotForm';
import { SettingsView } from './components/SettingsView';
import { BulkEntryView, BulkImportItem } from './components/BulkEntryView';
import { DataManagementView } from './components/DataManagementView';
import { MasterDatabaseView } from './components/MasterDatabaseView';
import { Snapshot, ViewMode, AssetItem, Language, Theme } from './types';
import { Button } from './components/ui/Button';
import { translations } from './utils/translations';

const DEFAULT_CATEGORIES = ['Bank', 'Stock', 'Real Estate', 'Crypto', 'Bond', 'Loan', 'Vehicle', 'Cash', 'Other'];
const DEFAULT_MEMBERS = ['Me'];

const Logo = () => (
  <svg className="w-10 h-10 rounded-xl shadow-lg" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="logo_grad_mini" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#1e3a8a" />
        <stop offset="100%" stopColor="#10b981" />
      </linearGradient>
    </defs>
    <rect width="512" height="512" fill="url(#logo_grad_mini)" />
    <path d="M0 320 L120 250 L220 300 L350 150 L450 180 L512 100" fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth="40" strokeLinecap="round" strokeLinejoin="round"/>
    <text x="50%" y="54%" fontFamily="sans-serif" fontSize="300" fontWeight="bold" fill="white" textAnchor="middle" dominantBaseline="middle">$</text>
  </svg>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  
  // Settings State
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');

  const [editingSnapshot, setEditingSnapshot] = useState<Snapshot | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = translations[language];

  // Load from local storage
  useEffect(() => {
    // Data
    const savedData = localStorage.getItem('wealthtrack_data');
    if (savedData) setSnapshots(JSON.parse(savedData) || []);

    // Configs
    const savedCats = localStorage.getItem('wealthtrack_categories');
    setCategories(savedCats ? JSON.parse(savedCats) : DEFAULT_CATEGORIES);

    const savedMembers = localStorage.getItem('wealthtrack_members');
    setFamilyMembers(savedMembers ? JSON.parse(savedMembers) : DEFAULT_MEMBERS);

    // Settings
    const savedLang = localStorage.getItem('wealthtrack_language');
    if (savedLang) setLanguage(savedLang as Language);

    const savedTheme = localStorage.getItem('wealthtrack_theme');
    if (savedTheme) setTheme(savedTheme as Theme);

    setIsLoaded(true);
  }, []);

  // Persistence Effects
  useEffect(() => { if (isLoaded) localStorage.setItem('wealthtrack_data', JSON.stringify(snapshots)); }, [snapshots, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem('wealthtrack_categories', JSON.stringify(categories)); }, [categories, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem('wealthtrack_members', JSON.stringify(familyMembers)); }, [familyMembers, isLoaded]);
  
  useEffect(() => { 
    if (isLoaded) localStorage.setItem('wealthtrack_language', language); 
  }, [language, isLoaded]);
  
  useEffect(() => { 
    if (isLoaded) localStorage.setItem('wealthtrack_theme', theme); 
  }, [theme, isLoaded]);

  // Apply Theme Class
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // --- Handlers ---

  const handleAddCategory = (name: string) => { if (!categories.includes(name)) setCategories([...categories, name]); };
  const handleDeleteCategory = (name: string) => { setCategories(categories.filter(c => c !== name)); };
  const handleRenameCategory = (oldName: string, newName: string) => {
    setCategories(categories.map(c => c === oldName ? newName : c));
    setSnapshots(prev => prev.map(snapshot => ({
      ...snapshot,
      items: snapshot.items.map(item => item.category === oldName ? { ...item, category: newName } : item)
    })));
  };

  const handleAddMember = (name: string) => { if (!familyMembers.includes(name)) setFamilyMembers([...familyMembers, name]); };
  const handleDeleteMember = (name: string) => { setFamilyMembers(familyMembers.filter(m => m !== name)); };
  const handleRenameMember = (oldName: string, newName: string) => {
    setFamilyMembers(familyMembers.map(m => m === oldName ? newName : m));
    setSnapshots(prev => prev.map(snapshot => ({
      ...snapshot,
      familyMember: snapshot.familyMember === oldName ? newName : snapshot.familyMember
    })));
  };

  const handleSaveSnapshot = (snapshot: Snapshot) => {
    if (editingSnapshot) setSnapshots(prev => prev.map(s => s.id === snapshot.id ? snapshot : s));
    else setSnapshots(prev => [...prev, snapshot]);
    setIsFormOpen(false);
    setEditingSnapshot(null);
  };

  const handleDeleteSnapshot = (id: string) => { setSnapshots(prev => prev.filter(s => s.id !== id)); };

  const handleClearAllData = () => {
    setSnapshots([]);
    setCategories(DEFAULT_CATEGORIES);
    setFamilyMembers(DEFAULT_MEMBERS);
    localStorage.removeItem('wealthtrack_data');
    localStorage.removeItem('wealthtrack_categories');
    localStorage.removeItem('wealthtrack_members');
  };

  const startEdit = (snapshot: Snapshot) => { setEditingSnapshot(snapshot); setIsFormOpen(true); setMobileMenuOpen(false); };
  const startNew = () => { setEditingSnapshot(null); setIsFormOpen(true); setMobileMenuOpen(false); };
  const handleNavClick = (mode: ViewMode) => { setView(mode); setIsFormOpen(false); setMobileMenuOpen(false); };

  const handleBulkImport = (importItems: BulkImportItem[]) => {
    const uniqueCategories = new Set(categories);
    const uniqueMembers = new Set(familyMembers);
    let catsChanged = false, membersChanged = false;

    importItems.forEach(item => {
      const cat = item.category.trim();
      const mem = item.familyMember.trim();
      if (cat && !uniqueCategories.has(cat)) { uniqueCategories.add(cat); catsChanged = true; }
      if (mem && !uniqueMembers.has(mem)) { uniqueMembers.add(mem); membersChanged = true; }
    });

    if (catsChanged) setCategories(Array.from(uniqueCategories));
    if (membersChanged) setFamilyMembers(Array.from(uniqueMembers));

    const newSnapshots = [...snapshots];
    const groupedData: { [key: string]: BulkImportItem[] } = {};
    importItems.forEach(item => {
      const key = `${item.date}::${item.familyMember}`;
      if (!groupedData[key]) groupedData[key] = [];
      groupedData[key].push(item);
    });

    Object.keys(groupedData).forEach(key => {
      const [date, member] = key.split('::');
      const items = groupedData[key];
      const existingIndex = newSnapshots.findIndex(s => s.date === date && s.familyMember === member);
      const newAssets: AssetItem[] = items.map(i => ({
        id: uuidv4(), category: i.category, name: i.name, value: i.value, currency: i.currency, tags: []
      }));
      const totalValue = newAssets.reduce((sum, item) => sum + item.value, 0);

      if (existingIndex >= 0) {
        newSnapshots[existingIndex] = { ...newSnapshots[existingIndex], items: newAssets, totalValue, note: 'Updated via Bulk Import' };
      } else {
        newSnapshots.push({ id: uuidv4(), date, familyMember: member, items: newAssets, totalValue, note: 'Imported via Bulk Entry' });
      }
    });

    setSnapshots(newSnapshots);
    setView('history');
  };

  return (
    <div className={`min-h-screen bg-slate-50 dark:bg-slate-900 flex flex-col md:flex-row transition-colors duration-300`}>
      <aside className="w-full md:w-64 bg-primary dark:bg-slate-950 text-white flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out border-r border-slate-700">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Logo />
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-blue-400">
                {t.appTitle}
              </h1>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest">{t.aiPowered}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:hidden">
             <button onClick={startNew} className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg flex items-center justify-center">
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </button>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-slate-300 hover:text-white p-1">
              <svg className={`w-6 h-6 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        <nav className={`flex-1 p-4 space-y-2 ${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
          <button onClick={() => handleNavClick('dashboard')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'dashboard' && !isFormOpen ? 'bg-secondary dark:bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            {t.dashboard}
          </button>
          
          <button onClick={() => handleNavClick('history')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'history' && !isFormOpen ? 'bg-secondary dark:bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {t.history}
          </button>

          <button onClick={() => handleNavClick('masterDatabase')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'masterDatabase' && !isFormOpen ? 'bg-secondary dark:bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
            {t.masterDatabase}
          </button>

          <button onClick={() => handleNavClick('bulk')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'bulk' && !isFormOpen ? 'bg-secondary dark:bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {t.bulkImport}
          </button>

          <button onClick={() => handleNavClick('dataManagement')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'dataManagement' && !isFormOpen ? 'bg-secondary dark:bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            {t.dataManagement}
          </button>

          <button onClick={() => handleNavClick('settings')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'settings' && !isFormOpen ? 'bg-secondary dark:bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            {t.settings}
          </button>
        </nav>

        <div className={`p-4 border-t border-slate-700 ${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
           <Button onClick={startNew} className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white border-0">
             + {t.newSnapshot}
           </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isFormOpen ? (editingSnapshot ? t.editSnapshot : t.newSnapshot) : (
                view === 'dashboard' ? t.overview : 
                view === 'history' ? t.assetHistory : 
                view === 'masterDatabase' ? t.masterDatabase : 
                view === 'bulk' ? t.bulkDataImport : 
                view === 'dataManagement' ? t.dataManagement :
                t.settings
              )}
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
               {isFormOpen ? t.formDesc : (
                 view === 'dashboard' ? 'Track, analyze, and optimize your wealth.' :
                 view === 'history' ? 'View and manage your historical records.' :
                 view === 'masterDatabase' ? t.masterDbDesc :
                 view === 'bulk' ? t.bulkDesc :
                 view === 'dataManagement' ? t.backupDesc :
                 'Configure your asset categories and family members.'
               )}
            </p>
          </div>
        </header>

        {isFormOpen ? (
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 p-6 md:p-8 transition-colors">
            <SnapshotForm 
              existingSnapshot={editingSnapshot} 
              onSave={handleSaveSnapshot} 
              onCancel={() => { setIsFormOpen(false); setEditingSnapshot(null); }}
              suggestedCategories={categories}
              familyMembers={familyMembers}
              language={language}
            />
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard 
                snapshots={snapshots} 
                availableCategories={categories} 
                familyMembers={familyMembers}
                language={language}
              />
            )}
            {view === 'history' && (
              <HistoryView 
                snapshots={snapshots} 
                availableCategories={categories}
                familyMembers={familyMembers}
                onEdit={startEdit} 
                onDelete={handleDeleteSnapshot} 
                language={language}
              />
            )}
             {view === 'masterDatabase' && (
              <MasterDatabaseView 
                snapshots={snapshots} 
                availableCategories={categories}
                familyMembers={familyMembers}
                language={language}
              />
            )}
            {view === 'settings' && (
              <SettingsView 
                categories={categories}
                onAddCategory={handleAddCategory}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={handleDeleteCategory}
                familyMembers={familyMembers}
                onAddMember={handleAddMember}
                onRenameMember={handleRenameMember}
                onDeleteMember={handleDeleteMember}
                theme={theme}
                onSetTheme={setTheme}
                language={language}
                onSetLanguage={setLanguage}
              />
            )}
             {view === 'bulk' && (
              <BulkEntryView 
                categories={categories}
                familyMembers={familyMembers}
                onImport={handleBulkImport}
                language={language}
              />
            )}
            {view === 'dataManagement' && (
              <DataManagementView 
                snapshots={snapshots}
                onClearAllData={handleClearAllData}
                language={language}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;