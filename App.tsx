import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Dashboard } from './components/Dashboard';
import { HistoryView } from './components/HistoryView';
import { SnapshotForm } from './components/SnapshotForm';
import { SettingsView } from './components/SettingsView';
import { BulkEntryView, BulkImportItem } from './components/BulkEntryView';
import { DataManagementView } from './components/DataManagementView';
import { Snapshot, ViewMode, AssetItem } from './types';
import { Button } from './components/ui/Button';

const DEFAULT_CATEGORIES = ['Bank', 'Stock', 'Real Estate', 'Crypto', 'Bond', 'Loan', 'Vehicle', 'Cash', 'Other'];
const DEFAULT_MEMBERS = ['Me'];

const App: React.FC = () => {
  const [view, setView] = useState<ViewMode>('dashboard');
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [familyMembers, setFamilyMembers] = useState<string[]>([]);
  const [editingSnapshot, setEditingSnapshot] = useState<Snapshot | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Load from local storage
  useEffect(() => {
    // Load Data
    const savedData = localStorage.getItem('wealthtrack_data');
    if (savedData) {
      try {
        setSnapshots(JSON.parse(savedData));
      } catch (e) {
        console.error("Failed to parse data", e);
        setSnapshots([]);
      }
    } else {
      setSnapshots([]);
    }

    // Load Categories
    const savedCats = localStorage.getItem('wealthtrack_categories');
    if (savedCats) {
      try {
        setCategories(JSON.parse(savedCats));
      } catch (e) {
        setCategories(DEFAULT_CATEGORIES);
      }
    } else {
      setCategories(DEFAULT_CATEGORIES);
    }

    // Load Family Members
    const savedMembers = localStorage.getItem('wealthtrack_members');
    if (savedMembers) {
      try {
        setFamilyMembers(JSON.parse(savedMembers));
      } catch (e) {
        setFamilyMembers(DEFAULT_MEMBERS);
      }
    } else {
      setFamilyMembers(DEFAULT_MEMBERS);
    }

    setIsLoaded(true);
  }, []);

  // Save Data to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('wealthtrack_data', JSON.stringify(snapshots));
    }
  }, [snapshots, isLoaded]);

  // Save Categories to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('wealthtrack_categories', JSON.stringify(categories));
    }
  }, [categories, isLoaded]);

  // Save Family Members to local storage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem('wealthtrack_members', JSON.stringify(familyMembers));
    }
  }, [familyMembers, isLoaded]);

  // --- Category Management Handlers ---

  const handleAddCategory = (name: string) => {
    if (!categories.includes(name)) {
      setCategories([...categories, name]);
    }
  };

  const handleDeleteCategory = (name: string) => {
    setCategories(categories.filter(c => c !== name));
  };

  const handleRenameCategory = (oldName: string, newName: string) => {
    setCategories(categories.map(c => c === oldName ? newName : c));
    setSnapshots(prev => prev.map(snapshot => ({
      ...snapshot,
      items: snapshot.items.map(item => 
        item.category === oldName ? { ...item, category: newName } : item
      )
    })));
  };

  // --- Family Member Management Handlers ---

  const handleAddMember = (name: string) => {
    if (!familyMembers.includes(name)) {
      setFamilyMembers([...familyMembers, name]);
    }
  };

  const handleDeleteMember = (name: string) => {
    setFamilyMembers(familyMembers.filter(m => m !== name));
  };

  const handleRenameMember = (oldName: string, newName: string) => {
    setFamilyMembers(familyMembers.map(m => m === oldName ? newName : m));
    setSnapshots(prev => prev.map(snapshot => ({
      ...snapshot,
      familyMember: snapshot.familyMember === oldName ? newName : snapshot.familyMember
    })));
  };

  // --- Snapshot Handlers ---

  const handleSaveSnapshot = (snapshot: Snapshot) => {
    if (editingSnapshot) {
      setSnapshots(prev => prev.map(s => s.id === snapshot.id ? snapshot : s));
    } else {
      setSnapshots(prev => [...prev, snapshot]);
    }
    setIsFormOpen(false);
    setEditingSnapshot(null);
  };

  const handleDeleteSnapshot = (id: string) => {
    setSnapshots(prevSnapshots => {
      const updated = prevSnapshots.filter(s => s.id !== id);
      return updated;
    });
  };

  const handleClearAllData = () => {
    setSnapshots([]);
    setCategories(DEFAULT_CATEGORIES);
    setFamilyMembers(DEFAULT_MEMBERS);
    localStorage.removeItem('wealthtrack_data');
    localStorage.removeItem('wealthtrack_categories');
    localStorage.removeItem('wealthtrack_members');
  };

  const startEdit = (snapshot: Snapshot) => {
    setEditingSnapshot(snapshot);
    setIsFormOpen(true);
    setMobileMenuOpen(false); // Close menu on mobile if open
  };

  const startNew = () => {
    setEditingSnapshot(null);
    setIsFormOpen(true);
    setMobileMenuOpen(false); // Close menu on mobile if open
  };

  const handleNavClick = (mode: ViewMode) => {
    setView(mode);
    setIsFormOpen(false);
    setMobileMenuOpen(false); // Auto close menu on mobile
  };

  const handleBulkImport = (importItems: BulkImportItem[]) => {
    // 1. Check for and register new Categories and Family Members
    const uniqueCategories = new Set(categories);
    const uniqueMembers = new Set(familyMembers);
    let catsChanged = false;
    let membersChanged = false;

    importItems.forEach(item => {
      const cat = item.category.trim();
      const mem = item.familyMember.trim();

      if (cat && !uniqueCategories.has(cat)) {
        uniqueCategories.add(cat);
        catsChanged = true;
      }
      if (mem && !uniqueMembers.has(mem)) {
        uniqueMembers.add(mem);
        membersChanged = true;
      }
    });

    if (catsChanged) setCategories(Array.from(uniqueCategories));
    if (membersChanged) setFamilyMembers(Array.from(uniqueMembers));

    // 2. Process Snapshots
    const newSnapshots = [...snapshots];

    // Group items by date AND family member
    const groupedData: { [key: string]: BulkImportItem[] } = {};
    
    importItems.forEach(item => {
      // Key format: YYYY-MM-DD::FamilyMember
      const key = `${item.date}::${item.familyMember}`;
      if (!groupedData[key]) groupedData[key] = [];
      groupedData[key].push(item);
    });

    Object.keys(groupedData).forEach(key => {
      const [date, member] = key.split('::');
      const items = groupedData[key];

      // Find existing snapshot for this date AND member
      const existingIndex = newSnapshots.findIndex(s => s.date === date && s.familyMember === member);

      const newAssets: AssetItem[] = items.map(i => ({
        id: uuidv4(),
        category: i.category,
        name: i.name,
        value: i.value,
        currency: i.currency,
        tags: []
      }));

      // Naive total calculation (ignoring currency differences for the raw object)
      const totalValue = newAssets.reduce((sum, item) => sum + item.value, 0);

      if (existingIndex >= 0) {
        // OVERWRITE existing records
        const existing = newSnapshots[existingIndex];
        newSnapshots[existingIndex] = {
          ...existing,
          items: newAssets,
          totalValue,
          note: existing.note ? existing.note : 'Updated via Bulk Import'
        };
      } else {
        // Create new
        newSnapshots.push({
          id: uuidv4(),
          date,
          familyMember: member,
          items: newAssets,
          totalValue,
          note: 'Imported via Bulk Entry'
        });
      }
    });

    setSnapshots(newSnapshots);
    setView('history');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-primary text-white flex-shrink-0 flex flex-col transition-all duration-300 ease-in-out">
        <div className="p-6 border-b border-slate-700 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-teal-400">
              WealthTrack AI
            </h1>
            <p className="text-xs text-slate-400 mt-1">Smart Family Asset Tracker</p>
          </div>
          
          {/* Mobile Controls */}
          <div className="flex items-center gap-2 md:hidden">
            {/* Small + Button (Visible when menu is collapsed, or even when open for quick access) */}
             <button
               onClick={startNew}
               className="bg-emerald-600 hover:bg-emerald-700 text-white p-2 rounded-full shadow-lg transition-transform active:scale-95 flex items-center justify-center"
               title="New Snapshot"
             >
               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
             </button>

            {/* Expand/Collapse Chevron */}
            <button 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-300 hover:text-white p-1"
            >
              <svg 
                className={`w-6 h-6 transition-transform duration-300 ${mobileMenuOpen ? 'rotate-180' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>
          </div>
        </div>
        
        {/* Nav Links - Hidden on Mobile unless expanded */}
        <nav className={`flex-1 p-4 space-y-2 ${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
          <button 
            onClick={() => handleNavClick('dashboard')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'dashboard' && !isFormOpen ? 'bg-secondary text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
            Dashboard
          </button>
          
          <button 
            onClick={() => handleNavClick('history')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'history' && !isFormOpen ? 'bg-secondary text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            History & Data
          </button>

          <button 
            onClick={() => handleNavClick('bulk')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'bulk' && !isFormOpen ? 'bg-secondary text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            Bulk Import
          </button>

          <button 
            onClick={() => handleNavClick('dataManagement')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'dataManagement' && !isFormOpen ? 'bg-secondary text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" /></svg>
            Data Management
          </button>

          <button 
            onClick={() => handleNavClick('settings')}
            className={`w-full text-left px-4 py-3 rounded-lg flex items-center gap-3 transition-colors ${view === 'settings' && !isFormOpen ? 'bg-secondary text-white shadow-lg' : 'text-slate-300 hover:bg-slate-800'}`}
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            Settings
          </button>
        </nav>

        {/* Footer / Desktop New Snapshot Button - Hidden on Mobile unless expanded */}
        <div className={`p-4 border-t border-slate-700 ${mobileMenuOpen ? 'block' : 'hidden'} md:block`}>
           <Button onClick={startNew} className="w-full justify-center bg-emerald-600 hover:bg-emerald-700 text-white border-0">
             + New Snapshot
           </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {isFormOpen ? (editingSnapshot ? 'Edit Snapshot' : 'New Snapshot') : (
                view === 'dashboard' ? 'Overview' : 
                view === 'history' ? 'Asset History' : 
                view === 'bulk' ? 'Bulk Data Import' : 
                view === 'dataManagement' ? 'Data Management' :
                'Settings'
              )}
            </h2>
            <p className="text-slate-500 text-sm mt-1">
               {isFormOpen ? 'Log your assets for a specific date and family member.' : (
                 view === 'dashboard' ? 'Track, analyze, and optimize your wealth.' :
                 view === 'history' ? 'View and manage your historical records.' :
                 view === 'bulk' ? 'Paste and import large datasets from Excel.' :
                 view === 'dataManagement' ? 'Backup, export, or reset your data.' :
                 'Configure your asset categories and family members.'
               )}
            </p>
          </div>
        </header>

        {isFormOpen ? (
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg border border-slate-100 p-6 md:p-8">
            <SnapshotForm 
              existingSnapshot={editingSnapshot} 
              onSave={handleSaveSnapshot} 
              onCancel={() => { setIsFormOpen(false); setEditingSnapshot(null); }}
              suggestedCategories={categories}
              familyMembers={familyMembers}
            />
          </div>
        ) : (
          <>
            {view === 'dashboard' && (
              <Dashboard 
                snapshots={snapshots} 
                availableCategories={categories} 
                familyMembers={familyMembers}
              />
            )}
            {view === 'history' && (
              <HistoryView 
                snapshots={snapshots} 
                onEdit={startEdit} 
                onDelete={handleDeleteSnapshot} 
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
              />
            )}
             {view === 'bulk' && (
              <BulkEntryView 
                categories={categories}
                familyMembers={familyMembers}
                onImport={handleBulkImport}
              />
            )}
            {view === 'dataManagement' && (
              <DataManagementView 
                snapshots={snapshots}
                onClearAllData={handleClearAllData}
              />
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default App;