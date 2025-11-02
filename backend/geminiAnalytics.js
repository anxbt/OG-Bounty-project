import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

let ai = null;

// Initialize Gemini if API key is available
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log('⚠️ Gemini API key not configured (optional fallback)');
  } else {
    ai = new GoogleGenAI({ apiKey });
    console.log('✅ Gemini AI fallback initialized (gemini-2.0-flash-exp)');
  }
} catch (error) {
  console.warn('⚠️ Gemini initialization failed:', error.message);
}

/**
 * Analyze incident using Gemini AI (fallback when 0G Compute is unavailable)
 * This is used as a backup to ensure the demo works smoothly
 */
export async function analyzeWithGemini(incidentData) {
  if (!ai) {
    throw new Error('Gemini API not configured (GEMINI_API_KEY missing or invalid)');
  }

  const prompt = `You are an AI safety analyst. Analyze this AI incident and explain WHY it was flagged.

Incident Details:
Title: ${incidentData.title || 'Unknown'}
Description: ${incidentData.description || 'No description'}
Severity: ${incidentData.severity || 'unknown'}
${incidentData.logs ? `Logs: ${incidentData.logs.substring(0, 500)}` : ''}

Respond with ONLY a valid JSON object (no markdown, no code blocks):
{
  "summary": "A concise 1-2 sentence explanation of what happened",
  "severityScore": <number between 1 and 10>,
  "analysis": "Detailed technical analysis of the incident",
  "flagReason": "Human-readable explanation of WHY this incident matters (e.g., model mismatch, safety violation, bias detected)",
  "technicalDetails": "Deeper technical explanation for engineers and researchers",
  "categories": ["category1", "category2"],
  "recommendations": "Brief recommendation for prevention"
}`;

  const startTime = Date.now();
  
  try {
    console.log('🔮 Gemini API Request:', {
      model: 'gemini-2.0-flash-exp',
      promptLength: prompt.length,
      timestamp: new Date().toISOString(),
      incident: incidentData.title || 'Unknown'
    });
    
    // Use new API format
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: prompt,
    });
    
    if (!response || !response.text) {
      throw new Error('No response from Gemini');
    }
    
    const text = response.text;
    
    // Log successful response with metadata
    const responseTime = Date.now() - startTime;
    console.log('✅ Gemini API Response:', {
      status: 'success',
      responseTime: `${responseTime}ms`,
      responseLength: text.length,
      timestamp: new Date().toISOString()
    });
    
    console.log('📝 Gemini raw response:', text.substring(0, 100) + '...');
    
    // Clean the response (remove markdown code blocks if present)
    let cleanText = text.trim();
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/```json\n?/g, '').replace(/```\n?$/g, '').trim();
    } else if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/```\n?/g, '').trim();
    }
    
    // Find JSON in the response (handle case where text wraps JSON)
    const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      cleanText = jsonMatch[0];
    }
    
    const analysis = JSON.parse(cleanText);
    
    // Ensure required fields exist
    if (!analysis.severityScore) {
      analysis.severityScore = 5;
    }
    
    console.log('✅ Gemini analysis complete:', {
      summary: analysis.summary.substring(0, 50) + '...',
      severityScore: analysis.severityScore,
      categories: analysis.categories?.length || 0
    });
    
    return analysis;
    
  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Handle rate limiting specifically
    if (error.message && error.message.includes('429')) {
      console.error('🚫 Gemini Rate Limited:', {
        error: 'Too Many Requests',
        responseTime: `${responseTime}ms`,
        message: 'API quota exceeded - wait before retrying',
        timestamp: new Date().toISOString()
      });
    } else if (error.message && (error.message.includes('API_KEY') || error.message.includes('invalid'))) {
      console.error('🚫 Gemini API Key Error:', {
        error: 'Invalid or expired API key',
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    } else {
      console.error('❌ Gemini analysis failed:', {
        error: error.message,
        responseTime: `${responseTime}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
    throw error;
  }
}

/**
 * Check if Gemini is available
 */
export function isGeminiAvailable() {
  return !!ai;
}

export default {
  analyzeWithGemini,
  isGeminiAvailable
};
