
import { GoogleGenAI } from "@google/genai";
import { Snapshot, Language, StockPosition } from "../types";

// In Vite, this process.env.API_KEY is replaced by the string value defined in vite.config.ts
// It comes from your Vercel Environment Variables.
const apiKey = process.env.API_KEY || '';

// Initialize client only if key exists to prevent immediate crash
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

const checkKey = (language: Language) => {
  if (!apiKey || !ai) {
    console.error("Gemini API Key is missing. Please ensure 'API_KEY' is set in your Vercel Project Settings (Environment Variables) and redeploy.");
    return { 
      ok: false, 
      msg: language === 'zh' 
        ? "API 密钥缺失。请在 Vercel 设置中检查 'API_KEY' 并重新部署。" 
        : "API Key is missing. Please check your Vercel Environment Variables configuration."
    };
  }
  return { ok: true, msg: '' };
};

export const analyzeFinancialData = async (snapshots: Snapshot[], filterCategory?: string, language: Language = 'en'): Promise<string> => {
  const check = checkKey(language);
  if (!check.ok) return check.msg;

  if (!ai) return check.msg; // TS Guard

  // Prepare a summarized version of data to save tokens
  const summary = snapshots.map(s => ({
    date: s.date,
    total: s.totalValue,
    breakdown: s.items
      .filter(i => !filterCategory || i.category === filterCategory || i.name.includes(filterCategory))
      .map(i => `${i.category}-${i.name}: ${i.value}`)
  })).slice(-10); // Analyze last 10 snapshots for trends

  const context = filterCategory 
    ? `Focus specifically on the asset category or tag: "${filterCategory}".` 
    : "Provide a holistic overview of the total net worth and asset allocation.";

  const langInstruction = language === 'zh' 
    ? "Please respond entirely in Mandarin Chinese (Simplified)." 
    : "Please respond in English.";

  const prompt = `
    You are an expert personal financial analyst. 
    Analyze the following asset history data (snapshots over time).
    ${context}
    ${langInstruction}
    
    Data:
    ${JSON.stringify(summary, null, 2)}

    Please provide:
    1. A brief trend analysis (Growth rate, volatility).
    2. Observations on asset allocation (if visible).
    3. Constructive feedback or potential risks (e.g., lack of diversification if obvious).
    
    Keep the tone professional, encouraging, and concise. Use Markdown formatting.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: "You are a helpful financial assistant. Output valid Markdown.",
      }
    });
    return response.text || "No analysis generated.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return language === 'zh' ? "生成分析失败，请稍后再试。" : "Failed to generate financial insights. Please try again later.";
  }
};

export const analyzeStockPortfolio = async (positions: StockPosition[], language: Language = 'en'): Promise<string> => {
  const check = checkKey(language);
  if (!check.ok) return check.msg;
  
  if (!ai) return check.msg; // TS Guard

  const tickers = positions.map(p => p.ticker).join(', ');
  const portfolioSummary = positions.map(p => ({
    ticker: p.ticker,
    avgCost: p.avgCost,
    currentPrice: p.currentPrice,
    gainPercent: ((p.currentPrice - p.avgCost) / p.avgCost * 100).toFixed(2) + '%'
  }));

  const langInstruction = language === 'zh' 
    ? "Please respond entirely in Mandarin Chinese (Simplified)." 
    : "Please respond in English.";

  const prompt = `
    Analyze the following stock portfolio.
    Holdings: ${JSON.stringify(portfolioSummary)}
    
    ${langInstruction}

    Use Google Search to find the latest news, market sentiment, and analyst consensus for these specific companies.
    
    Please provide:
    1. **Market Outlook**: Brief summary of how these stocks are performing recently.
    2. **News Highlights**: Any major recent news affecting these companies.
    3. **Risk/Opportunity**: Based on the cost basis vs current price, suggest if the positions look healthy or risky.
    
    Format nicely with Markdown.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Enable Google Search Grounding
      }
    });
    
    let text = response.text || "";
    
    // Append Grounding metadata if available (Sources)
    if (response.candidates?.[0]?.groundingMetadata?.groundingChunks) {
      const chunks = response.candidates[0].groundingMetadata.groundingChunks;
      const links = chunks
        .map((c: any) => c.web?.uri ? `[${c.web.title || 'Source'}](${c.web.uri})` : null)
        .filter(Boolean)
        .join('  \n');
      
      if (links) {
        text += `\n\n**Sources:**\n${links}`;
      }
    }

    return text;
  } catch (error) {
    console.error("Gemini Stock Analysis Error:", error);
    return language === 'zh' ? "无法获取市场分析，请稍后再试。" : "Failed to retrieve market analysis. Please try again later.";
  }
};

export const getLiveStockPrices = async (tickers: string[]): Promise<Record<string, number>> => {
  if (!ai) return {};
  if (tickers.length === 0) return {};

  const prompt = `
    Find the current, real-time stock price for the following tickers: ${tickers.join(', ')}.
    
    Return STRICTLY a JSON object where the key is the ticker symbol and the value is the current price as a number.
    Do not include currency symbols. Do not include markdown code blocks (like \`\`\`json). Just the raw JSON string.
    Example: { "AAPL": 150.50, "GOOG": 2800.10 }
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }], // Must enable search to get live data
      }
    });

    const text = response.text || "{}";
    // Clean up any potential markdown wrapper
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const prices = JSON.parse(cleanText);
    return prices;
  } catch (error) {
    console.error("Failed to fetch live prices:", error);
    return {};
  }
};
