import React from 'react';
import { Button } from './ui/Button';
import { Snapshot } from '../types';

interface DataManagementViewProps {
  snapshots: Snapshot[];
  onClearAllData: () => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({ snapshots, onClearAllData }) => {
  const handleExportCSV = () => {
    // Expected Header: Date | Category | Name | Value | Family Member | Currency
    const header = ['Date', 'Category', 'Name', 'Value', 'Family Member', 'Currency'];
    
    // Flatten snapshots into rows
    const rows = snapshots.flatMap(s => 
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

  const handleDeleteAll = () => {
    if (window.confirm("⚠️ DANGER: Are you sure you want to delete ALL data?\n\nThis includes all snapshots, custom categories, and family members. This action cannot be undone unless you have a backup CSV.")) {
        onClearAllData();
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-fade-in">
      
      {/* Export Section */}
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

      {/* Danger Zone */}
      <div className="bg-white p-6 rounded-xl border border-red-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
        <div className="flex items-center gap-3 mb-4">
           <div className="p-2 bg-red-100 text-red-600 rounded-lg">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
           </div>
           <div>
              <h3 className="text-lg font-bold text-red-700">Danger Zone</h3>
              <p className="text-xs text-red-500">Irreversible actions regarding your data.</p>
           </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg border border-red-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-red-800">
             <strong>Delete All Data:</strong> This will wipe all snapshots, reset categories to default, and remove all family members from this browser.
          </p>
          <Button onClick={handleDeleteAll} variant="danger" className="whitespace-nowrap">
            Delete All Data
          </Button>
        </div>
      </div>

    </div>
  );
};