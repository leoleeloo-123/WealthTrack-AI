
import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { SnapshotForm } from './components/SnapshotForm';
import { IncomeForm } from './components/IncomeForm';
import { SettingsView } from './components/SettingsView';
import { BulkEntryView, BulkImportItem } from './components/BulkEntryView';
import { DataManagementView } from './components/DataManagementView';
import { MasterDatabaseView } from './components/MasterDatabaseView';
import { InvestmentIncomeView } from './components/InvestmentIncomeView';
import { Snapshot, ViewMode, AssetItem, Language, Theme, IncomeRecord } from './types';
import { Button } from './components/ui/Button';
import { translations } from './utils/translations';
import { generateDemoData } from './utils/demoData';

const DEFAULT_CATEGORIES = ['Bank', 'Stock', 'Real Estate', 'Crypto', 'Bond', 'Loan', 'Vehicle', 'Cash', 'Other'];
const DEFAULT_INCOME_CATEGORIES = ['Dividend', 'Interest', 'Rent', 'Salary', 'Bonus', 'Capital Gains', 'Other'];
const DEFAULT_MEMBERS = ['Me'];

// --- Translation Maps ---
const EN_TO_ZH: Record<string, string> = {
  // Asset Categories
  'Bank': '银行',
  'Stock': '股票',
  'Real Estate': '房地产',
  'Crypto': '加密货币',
  'Bond': '债券',
  'Loan': '贷款',
  'Vehicle': '车辆',
  'Cash': '现金',
  'Other': '其他',
  'Fixed Income': '固定收益',
  'Private Loan': '私人贷款',
  // Income Categories
  'Dividend': '股息',
  'Interest': '利息',
  'Rent': '租金',
  'Salary': '工资',
  'Bonus': '奖金',
  'Capital Gains': '资本收益',
  // Family
  'Me': '我',
  'Dad': '爸爸',
  'Mom': '妈妈',
  'Kid': '孩子'
};

const ZH_TO_EN: Record<string, string> = {
  // Asset Categories
  '银行': 'Bank',
  '股票': 'Stock',
  '房地产': 'Real Estate',
  '加密货币': 'Crypto',
  '债券': 'Bond',
  '贷款': 'Loan',
  '车辆': 'Vehicle',
  '现金': 'Cash',
  '其他': 'Other',
  '固定收益': 'Fixed Income',
  '私人贷款': 'Private Loan',
  // Income Categories
  '股息': 'Dividend',
  '利息': 'Interest',
  '租金': 'Rent',
  '工资': 'Salary',
  '奖金': 'Bonus',
  '资本收益': 'Capital Gains',
  // Family
  '我': 'Me',
  '爸爸': 'Dad',
  '妈妈': 'Mom',
  '孩子': 'Kid'
};

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
  const [incomeRecords, setIncomeRecords] = useState<IncomeRecord[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<string[]>([]);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  
  // Settings State
  const [language, setLanguage] = useState<Language>('en');
  const [theme, setTheme] = useState<Theme>('light');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Form Management
  const [editingSnapshot, setEditingSnapshot] = useState<Snapshot | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formTab, setFormTab] = useState<'asset' | 'income'>('asset');
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const t = translations[language];

  // Load from local storage
  useEffect(() => {
    // Configs
    const savedCats = localStorage.getItem('wealthtrack_categories');
    setCategories(savedCats ? JSON.parse(savedCats) : DEFAULT_CATEGORIES);

    const savedIncomeCats = localStorage.getItem('wealthtrack_income_categories');
    setIncomeCategories(savedIncomeCats ? JSON.parse(savedIncomeCats) : DEFAULT_INCOME_CATEGORIES);

    const savedMembers = localStorage.getItem('wealthtrack_members');
    setFamilyMembers(savedMembers ? JSON.parse(savedMembers) : DEFAULT_MEMBERS);

    // Settings
    const savedLang = localStorage.getItem('wealthtrack_language');
    if (savedLang) setLanguage(savedLang as Language);

    const savedTheme = localStorage.getItem('wealthtrack_theme');
    if (savedTheme) setTheme(savedTheme as Theme);

    // Data - check if exists, else generate DEMO
    const savedData = localStorage.getItem('wealthtrack_data');
    const savedIncome = localStorage.getItem('wealthtrack_income');

    if (savedData || savedIncome) {
        if (savedData) setSnapshots(JSON.parse(savedData) || []);
        if (savedIncome) setIncomeRecords(JSON.parse(savedIncome) || []);
    } else {
        // New User -> Generate Demo
        const demo = generateDemoData();
        setSnapshots(demo.snapshots);
        setIncomeRecords(demo.incomeRecords);
        setIsDemoMode(true);
    }

    setIsLoaded(true);
  }, []);

  // Persistence Effects
  useEffect(() => { if (isLoaded) localStorage.setItem('wealthtrack_data', JSON.stringify(snapshots)); }, [snapshots, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem('wealthtrack_income', JSON.stringify(incomeRecords)); }, [incomeRecords, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem('wealthtrack_categories', JSON.stringify(categories)); }, [categories, isLoaded]);
  useEffect(() => { if (isLoaded) localStorage.setItem('wealthtrack_income_categories', JSON.stringify(incomeCategories)); }, [incomeCategories, isLoaded]);
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

  const handleSetLanguage = (newLang: Language) => {
    if (newLang === language) return;

    // Determine Mapping
    let mapping: Record<string, string> = {};
    if (language === 'en' && newLang === 'zh') mapping = EN_TO_ZH;
    else if (language === 'zh' && newLang === 'en') mapping = ZH_TO_EN;

    // 1. Translate Asset Categories (Deduplicate)
    const newCategories = Array.from(new Set(categories.map(c => mapping[c] || c)));

    // 2. Translate Income Categories (Deduplicate)
    const newIncomeCategories = Array.from(new Set(incomeCategories.map(c => mapping[c] || c)));

    // 3. Translate Family Members (Deduplicate)
    const newMembers = Array.from(new Set(familyMembers.map(m => mapping[m] || m)));

    // 4. Translate Snapshots
    const newSnapshots = snapshots.map(s => ({
      ...s,
      familyMember: mapping[s.familyMember] || s.familyMember,
      items: s.items.map(i => ({
        ...i,
        category: mapping[i.category] || i.category
      }))
    }));

    // 5. Translate Income Records
    const newIncomeRecords = incomeRecords.map(r => ({
      ...r,
      category: mapping[r.category] || r.category
    }));

    // Update State
    setCategories(newCategories);
    setIncomeCategories(newIncomeCategories);
    setFamilyMembers(newMembers);
    setSnapshots(newSnapshots);
    setIncomeRecords(newIncomeRecords);
    setLanguage(newLang);
  };

  const handleAddCategory = (name: string) => { if (!categories.includes(name)) setCategories([...categories, name]); };
  const handleDeleteCategory = (name: string) => { setCategories(categories.filter(c => c !== name)); };
  const handleRenameCategory = (oldName: string, newName: string) => {
    setCategories(categories.map(c => c === oldName ? newName : c));
    setSnapshots(prev => prev.map(snapshot => ({
      ...snapshot,
      items: snapshot.items.map(item => item.category === oldName ? { ...item, category: newName } : item)
    })));
  };

  const handleAddIncomeCategory = (name: string) => { if (!incomeCategories.includes(name)) setIncomeCategories([...incomeCategories, name]); };
  const handleDeleteIncomeCategory = (name: string) => { setIncomeCategories(incomeCategories.filter(c => c !== name)); };
  const handleRenameIncomeCategory = (oldName: string, newName: string) => {
    setIncomeCategories(incomeCategories.map(c => c === oldName ? newName : c));
    setIncomeRecords(prev => prev.map(r => r.category === oldName ? { ...r, category: newName } : r));
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

  const handleSaveIncome = (records: IncomeRecord[]) => {
    setIncomeRecords(prev => [...prev, ...records]);
    setIsFormOpen(false);
    // Optionally switch view to verify
    if (view !== 'investmentIncome') setView('investmentIncome');
  };

  const handleDeleteSnapshot = (id: string) => { setSnapshots(prev => prev.filter(s => s.id !== id)); };

  const handleDeleteIncomeGroup = (date: string) => {
     setIncomeRecords(prev => prev.filter(r => r.date !== date));
  };

  const handleClearAllData = () => {
    setSnapshots([]);
    setIncomeRecords([]);
    setCategories(DEFAULT_CATEGORIES);
    setIncomeCategories(DEFAULT_INCOME_CATEGORIES);
    setFamilyMembers(DEFAULT_MEMBERS);
    setIsDemoMode(false);
    localStorage.removeItem('wealthtrack_data');
    localStorage.removeItem('wealthtrack_income');
    localStorage.removeItem('wealthtrack_categories');
    localStorage.removeItem('wealthtrack_income_categories');
    localStorage.removeItem('wealthtrack_members');
  };

  const handleGenerateDemoData = () => {
    const demo = generateDemoData();
    // Append to existing
    setSnapshots(prev => [...prev, ...demo.snapshots]);
    setIncomeRecords(prev => [...prev, ...demo.incomeRecords]);
    setIsDemoMode(true);
    setView('dashboard');
  };

  const startEdit = (snapshot: Snapshot) => { 
    setEditingSnapshot(snapshot); 
    setFormTab('asset'); // Force asset tab when editing snapshot
    setIsFormOpen(true); 
    setMobileMenuOpen(false); 
  };

  const startNew = () => { 
    setEditingSnapshot(null); 
    setFormTab('asset'); // Default to asset but allow switching
    setIsFormOpen(true); 
    setMobileMenuOpen(false); 
  };

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

  const handleImportIncome = (items: IncomeRecord[]) => {
    const uniqueCategories = new Set(incomeCategories);
    let catsChanged = false;
    
    items.forEach(item => {
      const cat = item.category.trim();
      if (cat && !uniqueCategories.has(cat)) { uniqueCategories.add(cat); catsChanged = true; }
    });
    
    if (catsChanged) setIncomeCategories(Array.from(uniqueCategories));

    const existingSignatures = new Set(incomeRecords.map(r => `${r.date}-${r.category}-${r.name}-${r.value}`));
    const newItems = items.filter(r => !existingSignatures.has(`${r.date}-${r.category}-${r.name}-${r.value}`));
    setIncomeRecords([...incomeRecords, ...newItems]);
    setView('investmentIncome');
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
        
        <nav className={`flex-1 p-4 space-y-2 ${mobileMenuOpen ? 'block' : 'hidden'} md:block overflow-y-auto`}>
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

          <button onClick={() => handleNavClick('investmentIncome')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'investmentIncome' && !isFormOpen ? 'bg-secondary dark:bg-slate-800 text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}>
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>
            {t.investmentIncome}
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
          
          <div className="pt-4 mt-auto border-t border-slate-700/50">
             <Button onClick={startNew} className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white border-0 shadow-lg">
               + {t.newRecord}
             </Button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
        {/* Demo Mode Banner */}
        {isDemoMode && (
          <div className="bg-indigo-600 text-white px-4 py-3 rounded-lg shadow-md mb-6 flex justify-between items-center animate-fade-in">
            <div className="flex items-center gap-3">
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-bold tracking-wider">{t.demoMode}</span>
              <span className="text-sm">{t.demoModeDesc}</span>
            </div>
            <button 
              onClick={() => handleNavClick('dataManagement')}
              className="text-xs bg-white text-indigo-700 px-3 py-1.5 rounded-full font-medium hover:bg-indigo-50 transition-colors"
            >
              {t.clearDemo}
            </button>
          </div>
        )}

        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
              {isFormOpen ? (editingSnapshot ? t.editSnapshot : t.newRecord) : (
                view === 'dashboard' ? t.overview : 
                view === 'history' ? t.assetHistory : 
                view === 'masterDatabase' ? t.masterDatabase : 
                view === 'investmentIncome' ? t.investmentIncome :
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
                 view === 'investmentIncome' ? t.incomeDesc :
                 view === 'bulk' ? t.bulkDesc :
                 view === 'dataManagement' ? t.backupDesc :
                 'Configure your asset categories and family members.'
               )}
            </p>
          </div>
        </header>

        {isFormOpen ? (
          <div className="max-w-4xl mx-auto bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-100 dark:border-slate-700 transition-colors">
            
            {/* Form Type Tabs (Only for new records) */}
            {!editingSnapshot && (
              <div className="flex border-b border-slate-200 dark:border-slate-700">
                <button 
                  onClick={() => setFormTab('asset')}
                  className={`flex-1 py-4 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 ${formTab === 'asset' ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  {t.assetSnapshots}
                </button>
                <button 
                  onClick={() => setFormTab('income')}
                  className={`flex-1 py-4 text-sm font-semibold uppercase tracking-wider transition-colors border-b-2 ${formTab === 'income' ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400 bg-emerald-50/50 dark:bg-emerald-900/10' : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'}`}
                >
                  {t.incomeRecords}
                </button>
              </div>
            )}
            
            <div className="p-6 md:p-8">
              {formTab === 'asset' ? (
                <SnapshotForm 
                  existingSnapshot={editingSnapshot} 
                  onSave={handleSaveSnapshot} 
                  onCancel={() => { setIsFormOpen(false); setEditingSnapshot(null); }}
                  suggestedCategories={categories}
                  familyMembers={familyMembers}
                  language={language}
                />
              ) : (
                <IncomeForm 
                  onSave={handleSaveIncome}
                  onCancel={() => { setIsFormOpen(false); setEditingSnapshot(null); }}
                  language={language}
                  availableCategories={incomeCategories}
                />
              )}
            </div>
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
                incomeRecords={incomeRecords} 
                availableCategories={categories}
                familyMembers={familyMembers}
                onEdit={startEdit} 
                onDelete={handleDeleteSnapshot}
                onDeleteIncome={handleDeleteIncomeGroup}
                language={language}
              />
            )}
             {view === 'masterDatabase' && (
              <MasterDatabaseView 
                snapshots={snapshots} 
                incomeRecords={incomeRecords}
                availableCategories={categories}
                familyMembers={familyMembers}
                language={language}
              />
            )}
            {view === 'investmentIncome' && (
              <InvestmentIncomeView 
                incomeRecords={incomeRecords}
                language={language}
              />
            )}
            {view === 'settings' && (
              <SettingsView 
                categories={categories}
                onAddCategory={handleAddCategory}
                onRenameCategory={handleRenameCategory}
                onDeleteCategory={handleDeleteCategory}
                incomeCategories={incomeCategories}
                onAddIncomeCategory={handleAddIncomeCategory}
                onRenameIncomeCategory={handleRenameIncomeCategory}
                onDeleteIncomeCategory={handleDeleteIncomeCategory}
                familyMembers={familyMembers}
                onAddMember={handleAddMember}
                onRenameMember={handleRenameMember}
                onDeleteMember={handleDeleteMember}
                theme={theme}
                onSetTheme={setTheme}
                language={language}
                onSetLanguage={handleSetLanguage}
              />
            )}
             {view === 'bulk' && (
              <BulkEntryView 
                categories={categories}
                familyMembers={familyMembers}
                onImport={handleBulkImport}
                onImportIncome={handleImportIncome}
                language={language}
              />
            )}
            {view === 'dataManagement' && (
              <DataManagementView 
                snapshots={snapshots}
                incomeRecords={incomeRecords}
                onClearAllData={handleClearAllData}
                onGenerateDemoData={handleGenerateDemoData}
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
