import dotenv from 'dotenv';
import { GoogleGenerativeAI } from '@google/generative-ai';

dotenv.config();

let genAI = null;
let model = null;

// Initialize Gemini if API key is available
if (process.env.GEMINI_API_KEY) {
  try {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    model = genAI.getGenerativeModel({ model: "gemini-pro" });
    console.log('✅ Gemini AI fallback initialized');
  } catch (error) {
    console.warn('⚠️ Gemini initialization failed:', error.message);
  }
}

/**
 * Analyze incident using Gemini AI (fallback when 0G Compute is unavailable)
 * This is used as a backup to ensure the demo works smoothly
 */
export async function analyzeWithGemini(incidentData) {
  if (!model) {
    throw new Error('Gemini API not configured');
  }

  const prompt = `You are an AI safety analyst. Analyze this AI incident and provide structured output.

Incident Details:
Title: ${incidentData.title}
Description: ${incidentData.description}
Severity: ${incidentData.severity}
${incidentData.logs ? `Logs: ${incidentData.logs.substring(0, 500)}` : ''}

Provide your analysis in the following JSON format (respond ONLY with valid JSON, no markdown):
{
  "summary": "A concise 1-2 sentence explanation of what went wrong",
  "severityScore": <number between 1-10>,
  "analysis": "Detailed technical analysis of the incident",
  "categories": ["category1", "category2"],
  "recommendations": "Brief recommendation for prevention"
}`;

  try {
    console.log('🔮 Querying Gemini AI...');
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Clean the response (remove markdown code blocks if present)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?$/g, '');
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '');
    }
    
    const analysis = JSON.parse(cleanText);
    console.log('✅ Gemini analysis complete');
    
    return analysis;
  } catch (error) {
    console.error('❌ Gemini analysis failed:', error);
    throw error;
  }
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable() {
  return !!model;
}

export default {
  analyzeWithGemini,
  isGeminiAvailable
};
