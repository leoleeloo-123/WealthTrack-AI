import { GoogleGenAI } from "@google/genai";
import { Snapshot } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const analyzeFinancialData = async (snapshots: Snapshot[], filterCategory?: string): Promise<string> => {
  if (!apiKey) return "API Key is missing. Please check your environment configuration.";

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

  const prompt = `
    You are an expert personal financial analyst. 
    Analyze the following asset history data (snapshots over time).
    ${context}
    
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
    return "Failed to generate financial insights. Please try again later.";
  }
};
