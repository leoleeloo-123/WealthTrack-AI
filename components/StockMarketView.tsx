
import React, { useState, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Button } from './ui/Button';
import { Card } from './ui/Card';
import { StockPosition, Language } from '../types';
import { translations } from '../utils/translations';
import { analyzeStockPortfolio, getLiveStockPrices } from '../services/geminiService';

interface StockMarketViewProps {
  stocks: StockPosition[];
  onUpdateStocks: (stocks: StockPosition[]) => void;
  language: Language;
}

export const StockMarketView: React.FC<StockMarketViewProps> = ({ stocks, onUpdateStocks, language }) => {
  const [ticker, setTicker] = useState('');
  const [qty, setQty] = useState('');
  const [cost, setCost] = useState('');
  
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);
  const [analysisResult, setAnalysisResult] = useState('');
  
  const t = translations[language];

  // Calculated Stats
  const { totalCost, totalMarketValue, totalGainLoss, totalReturn } = useMemo(() => {
    let tCost = 0;
    let tValue = 0;

    stocks.forEach(s => {
      tCost += s.avgCost * s.quantity;
      tValue += s.currentPrice * s.quantity;
    });

    const gain = tValue - tCost;
    const ret = tCost > 0 ? (gain / tCost) * 100 : 0;

    return {
      totalCost: tCost,
      totalMarketValue: tValue,
      totalGainLoss: gain,
      totalReturn: ret
    };
  }, [stocks]);

  const handleAddStock = (e: React.FormEvent) => {
    e.preventDefault();
    if (ticker && qty && cost) {
      const quantity = parseFloat(qty);
      const avgCost = parseFloat(cost);
      if (!isNaN(quantity) && !isNaN(avgCost)) {
        const newStock: StockPosition = {
          id: uuidv4(),
          ticker: ticker.toUpperCase(),
          quantity,
          avgCost,
          currentPrice: avgCost, // Default current price to cost initially
          currency: 'USD'
        };
        onUpdateStocks([...stocks, newStock]);
        setTicker('');
        setQty('');
        setCost('');
      }
    }
  };

  const handleUpdatePrice = (id: string, priceStr: string) => {
    const price = parseFloat(priceStr);
    if (!isNaN(price)) {
      onUpdateStocks(stocks.map(s => s.id === id ? { ...s, currentPrice: price } : s));
    }
  };

  const handleDelete = (id: string) => {
    onUpdateStocks(stocks.filter(s => s.id !== id));
  };

  const handleAnalyze = async () => {
    if (stocks.length === 0) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    const result = await analyzeStockPortfolio(stocks, language);
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  const handleUpdatePrices = async () => {
    if (stocks.length === 0) return;
    setIsUpdatingPrices(true);
    
    // Get list of unique tickers
    const uniqueTickers = Array.from(new Set(stocks.map(s => s.ticker))) as string[];
    const prices = await getLiveStockPrices(uniqueTickers);
    
    if (Object.keys(prices).length > 0) {
      // Update state
      const updatedStocks = stocks.map(s => {
        // Try to match ticker (case insensitive)
        const newPrice = prices[s.ticker] || prices[s.ticker.toUpperCase()] || prices[s.ticker.toLowerCase()];
        if (newPrice) {
          return { ...s, currentPrice: newPrice };
        }
        return s;
      });
      onUpdateStocks(updatedStocks);
      alert(t.priceUpdateSuccess);
    } else {
      alert(t.priceUpdateFail);
    }
    
    setIsUpdatingPrices(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Portfolio Summary KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/20 dark:to-blue-900/20 border-indigo-100 dark:border-indigo-800">
           <div className="text-indigo-800 dark:text-indigo-300">
             <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">{t.totalMarketValue}</h3>
             <p className="text-3xl font-bold font-mono">${totalMarketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
           </div>
        </Card>
        
        <Card className={totalGainLoss >= 0 ? "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-800" : "bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-800"}>
           <div className={totalGainLoss >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-700 dark:text-red-400"}>
             <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">{t.totalGainLoss}</h3>
             <p className="text-3xl font-bold font-mono">
               {totalGainLoss >= 0 ? '+' : '-'}${Math.abs(totalGainLoss).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
             </p>
             <span className="text-sm font-medium">({totalReturn >= 0 ? '+' : ''}{totalReturn.toFixed(2)}%)</span>
           </div>
        </Card>

        {/* Add Stock Form */}
        <Card title={t.addStock}>
           <form onSubmit={handleAddStock} className="flex flex-col gap-3">
             <div className="grid grid-cols-3 gap-2">
               <input 
                 className="px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                 placeholder={t.ticker}
                 value={ticker}
                 onChange={(e) => setTicker(e.target.value)}
                 required
               />
               <input 
                 className="px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                 placeholder={t.quantity}
                 type="number" step="any"
                 value={qty}
                 onChange={(e) => setQty(e.target.value)}
                 required
               />
               <input 
                 className="px-3 py-2 border rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white text-sm"
                 placeholder={t.avgCost}
                 type="number" step="any"
                 value={cost}
                 onChange={(e) => setCost(e.target.value)}
                 required
               />
             </div>
             <Button type="submit" className="w-full text-sm py-1.5">{t.add}</Button>
           </form>
        </Card>
      </div>

      {/* Holdings Table */}
      <Card title={t.holdings}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-700/50 text-xs uppercase font-semibold text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-4 py-3">{t.ticker}</th>
                <th className="px-4 py-3 text-right">{t.quantity}</th>
                <th className="px-4 py-3 text-right">{t.avgCost}</th>
                <th className="px-4 py-3 text-right w-32">{t.currentPrice} ✏️</th>
                <th className="px-4 py-3 text-right">{t.marketValue}</th>
                <th className="px-4 py-3 text-right">{t.gainLoss}</th>
                <th className="px-4 py-3 text-center"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {stocks.map(stock => {
                const mktVal = stock.quantity * stock.currentPrice;
                const gain = mktVal - (stock.quantity * stock.avgCost);
                const gainPercent = stock.avgCost > 0 ? (gain / (stock.quantity * stock.avgCost) * 100) : 0;
                
                return (
                  <tr key={stock.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800 dark:text-slate-100">{stock.ticker}</td>
                    <td className="px-4 py-3 text-right font-mono">{stock.quantity}</td>
                    <td className="px-4 py-3 text-right font-mono text-slate-500">${stock.avgCost.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right">
                       <input 
                         type="number" 
                         step="any"
                         value={stock.currentPrice}
                         onChange={(e) => handleUpdatePrice(stock.id, e.target.value)}
                         className="w-24 text-right px-2 py-1 border border-slate-200 dark:border-slate-600 rounded bg-white dark:bg-slate-800 focus:ring-1 focus:ring-blue-500 outline-none"
                       />
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-medium text-slate-800 dark:text-slate-200">${mktVal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                    <td className="px-4 py-3 text-right">
                       <div className={`font-mono font-bold ${gain >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                         {gain >= 0 ? '+' : ''}{gain.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                       </div>
                       <div className={`text-xs ${gain >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                         {gainPercent.toFixed(2)}%
                       </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                       <button onClick={() => handleDelete(stock.id)} className="text-slate-400 hover:text-red-500 p-1">
                         <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                       </button>
                    </td>
                  </tr>
                );
              })}
              {stocks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-400">{t.noRecords}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* AI Analysis Section */}
      <Card title={t.aiMarketAnalysis} className="border-indigo-200 dark:border-indigo-900">
         <div className="flex flex-col gap-4">
           <p className="text-sm text-slate-600 dark:text-slate-300">
             {t.refreshPrices}
           </p>
           <div className="flex justify-start gap-3">
             <Button 
               onClick={handleUpdatePrices} 
               isLoading={isUpdatingPrices}
               disabled={stocks.length === 0}
               className="bg-emerald-600 hover:bg-emerald-700"
             >
                🔄 {t.updatePrices}
             </Button>

             <Button 
               onClick={handleAnalyze} 
               isLoading={isAnalyzing} 
               disabled={stocks.length === 0}
               className="bg-indigo-600 hover:bg-indigo-700"
             >
                ✨ {t.analyzePortfolio}
             </Button>
           </div>
           
           {analysisResult && (
             <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                <div className="markdown-body prose prose-sm max-w-none text-slate-800 dark:text-slate-200" dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/- /g, '• ') }} />
             </div>
           )}
         </div>
      </Card>
    </div>
  );
};
