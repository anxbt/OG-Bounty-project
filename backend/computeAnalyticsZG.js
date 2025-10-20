/**
 * Real 0G Compute Analytics Service
 * 
 * This service uses the actual 0G Compute Network to analyze AI incidents
 * using decentralized GPU-powered AI models.
 */

import { ethers } from 'ethers';
import { createZGComputeNetworkBroker } from '@0glabs/0g-serving-broker';
import dotenv from 'dotenv';

dotenv.config();

const RPC_URL = process.env.OG_RPC_URL || 'https://evmrpc-testnet.0g.ai';
const PRIVATE_KEY = process.env.PRIVATE_KEY;

// Provider addresses from 0G Network
const PROVIDERS = {
  'gpt-oss-120b': '0xf07240Efa67755B5311bc75784a061eDB47165Dd',
  'deepseek-r1-70b': '0x3feE5a4dd5FDb8a32dDA97Bed899830605dBD9D3'
};

let broker = null;
let isInitialized = false;
let initializationError = null;

/**
 * Initialize 0G Compute Broker
 */
async function initializeBroker() {
  if (isInitialized && broker) {
    return broker;
  }

  if (initializationError) {
    console.log('⚠️  Previous initialization failed, skipping 0G Compute');
    return null;
  }

  try {
    console.log('🔧 Initializing 0G Compute Network Broker...');
    
    if (!PRIVATE_KEY) {
      throw new Error('PRIVATE_KEY not found in environment');
    }

    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
    
    broker = await createZGComputeNetworkBroker(wallet);
    
    // Check balance
    const account = await broker.ledger.getLedger();
    const balance = ethers.formatEther(account.totalBalance);
    console.log(`✅ 0G Compute Broker initialized`);
    console.log(`💰 Account balance: ${balance} OG`);
    
    if (parseFloat(balance) < 0.01) {
      console.log('⚠️  Warning: Low balance. Some compute features may be limited.');
      console.log('   To add funds: await broker.ledger.addLedger(10)');
    }

    isInitialized = true;
    return broker;
    
  } catch (error) {
    console.error('❌ Failed to initialize 0G Compute Broker:', error.message);
    initializationError = error;
    
    // Fall back to simulated mode
    console.log('📊 Falling back to simulated analytics mode');
    return null;
  }
}

/**
 * Query 0G Compute AI model for incident analysis
 */
async function queryComputeModel(prompt, preferredModel = 'gpt-oss-120b') {
  if (!broker) {
    await initializeBroker();
  }

  if (!broker) {
    // Return simulated response if broker not available
    return null;
  }

  try {
    const providerAddress = PROVIDERS[preferredModel] || PROVIDERS['gpt-oss-120b'];
    
    // Get service metadata
    const { endpoint, model } = await broker.inference.getServiceMetadata(providerAddress);
    
    // Prepare messages
    const messages = [
      {
        role: 'system',
        content: 'You are an AI safety analyst. Analyze AI incidents and provide structured insights in JSON format.'
      },
      {
        role: 'user',
        content: prompt
      }
    ];
    
    // Generate auth headers
    const headers = await broker.inference.getRequestHeaders(
      providerAddress,
      JSON.stringify(messages)
    );
    
    // Send request to 0G Compute Network
    console.log(`🤖 Sending request to 0G Compute (${model})...`);
    const response = await fetch(`${endpoint}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: JSON.stringify({
        messages: messages,
        model: model,
        temperature: 0.7,
        max_tokens: 1000
      })
    });
    
    if (!response.ok) {
      throw new Error(`Compute request failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    const answer = data.choices[0].message.content;
    const chatID = data.id;
    
    // Verify response (for verifiable services)
    try {
      const isValid = await broker.inference.processResponse(
        providerAddress,
        answer,
        chatID
      );
      console.log(`✅ Response verification: ${isValid ? 'Valid' : 'Unverified'}`);
    } catch (verifyErr) {
      console.log('ℹ️  Response verification not available for this service');
    }
    
    console.log(`✅ Received response from 0G Compute (${answer.length} chars)`);
    return answer;
    
  } catch (error) {
    console.error('❌ 0G Compute request failed:', error.message);
    return null;
  }
}

/**
 * Analyze incidents using 0G Compute
 */
export async function computeAnalyticsWithZG(incidents) {
  console.log(`\n🧠 Starting 0G Compute Analytics Analysis for ${incidents.length} incidents...`);
  
  if (incidents.length === 0) {
    return getFallbackAnalytics([]);
  }

  try {
    // Prepare incident summary for AI analysis
    const incidentSummary = incidents.map((inc, idx) => ({
      id: idx + 1,
      severity: inc.severity,
      title: inc.title,
      timestamp: inc.timestamp,
      model: inc.ai_model || 'Unknown',
      description: inc.description?.substring(0, 200) || 'No description'
    }));

    const prompt = `Analyze these AI safety incidents and provide structured insights:

${JSON.stringify(incidentSummary, null, 2)}

Provide analysis in JSON format with:
1. "keyFindings": Array of 3-5 key findings
2. "riskTrends": Description of severity trends
3. "modelVulnerabilities": Object with model names as keys and vulnerability descriptions
4. "recommendations": Array of 3-5 priority recommendations
5. "predictedRisks": Object with next week risk predictions

Focus on safety, patterns, and actionable insights.`;

    // Query 0G Compute Network
    const response = await queryComputeModel(prompt);
    
    if (response) {
      try {
        // Parse AI response
        const aiAnalysis = JSON.parse(response);
        
        // Combine AI insights with statistical analysis
        const analytics = {
          overview: computeOverview(incidents),
          trends: computeTrends(incidents),
          modelPerformance: analyzeModelPerformance(incidents),
          riskPredictions: aiAnalysis.predictedRisks || generateRiskPredictions(incidents),
          patterns: {
            keyFindings: aiAnalysis.keyFindings || [],
            modelVulnerabilities: aiAnalysis.modelVulnerabilities || {},
            trendAnalysis: aiAnalysis.riskTrends || 'No trends available'
          },
          recommendations: aiAnalysis.recommendations || generateRecommendations(incidents),
          computeJobId: `0g-compute-${Date.now()}`,
          computeProvider: '0G Network (Decentralized)',
          computeModel: 'gpt-oss-120b',
          processedAt: new Date().toISOString(),
          aiPowered: true
        };
        
        console.log('✅ 0G Compute Analytics Complete');
        return analytics;
        
      } catch (parseError) {
        console.warn('⚠️  Could not parse AI response, using hybrid approach');
        // Fall through to fallback
      }
    }
    
    // Fallback to statistical analysis
    console.log('📊 Using statistical analysis mode');
    return getFallbackAnalytics(incidents);
    
  } catch (error) {
    console.error('❌ 0G Compute Analytics error:', error);
    return getFallbackAnalytics(incidents);
  }
}

/**
 * Fallback analytics using statistical methods
 */
function getFallbackAnalytics(incidents) {
  return {
    overview: computeOverview(incidents),
    trends: computeTrends(incidents),
    modelPerformance: analyzeModelPerformance(incidents),
    riskPredictions: generateRiskPredictions(incidents),
    patterns: detectPatterns(incidents),
    recommendations: generateRecommendations(incidents),
    computeJobId: `local-${Date.now()}`,
    computeProvider: 'Local Analysis',
    computeModel: 'Statistical',
    processedAt: new Date().toISOString(),
    aiPowered: false
  };
}

// Statistical analysis functions
function computeOverview(incidents) {
  const total = incidents.length;
  const critical = incidents.filter(i => i.severity === 'critical').length;
  const warning = incidents.filter(i => i.severity === 'warning').length;
  const info = incidents.filter(i => i.severity === 'info').length;
  
  const oldestTimestamp = incidents.length > 0 
    ? Math.min(...incidents.map(i => new Date(i.timestamp).getTime()))
    : Date.now();
  const newestTimestamp = incidents.length > 0
    ? Math.max(...incidents.map(i => new Date(i.timestamp).getTime()))
    : Date.now();
  
  const daysDiff = (newestTimestamp - oldestTimestamp) / (1000 * 60 * 60 * 24) || 1;
  const avgPerDay = total / daysDiff;
  const growthRate = total > 1 ? (avgPerDay / total) * 100 : 0;
  
  return {
    total,
    critical,
    warning,
    info,
    growthRate: Math.round(growthRate * 10) / 10,
    avgSeverity: total > 0 ? (critical * 2 + warning * 1) / total : 0
  };
}

function computeTrends(incidents) {
  const trends = {};
  
  incidents.forEach(incident => {
    const date = new Date(incident.timestamp).toISOString().split('T')[0];
    if (!trends[date]) {
      trends[date] = { total: 0, critical: 0, warning: 0, info: 0 };
    }
    trends[date].total++;
    trends[date][incident.severity]++;
  });
  
  return Object.entries(trends).map(([date, data]) => ({ date, ...data }));
}

function analyzeModelPerformance(incidents) {
  const modelStats = {};
  
  incidents.forEach(incident => {
    const model = incident.ai_model || 'Unknown Model';
    if (!modelStats[model]) {
      modelStats[model] = { total: 0, critical: 0, warning: 0, info: 0 };
    }
    modelStats[model].total++;
    modelStats[model][incident.severity]++;
  });
  
  return Object.entries(modelStats).map(([model, stats]) => ({
    model,
    incidents: stats.total,
    criticalRate: stats.total > 0 ? (stats.critical / stats.total) * 100 : 0,
    ...stats
  })).sort((a, b) => b.criticalRate - a.criticalRate);
}

function generateRiskPredictions(incidents) {
  const recent = incidents.slice(-10);
  const criticalRate = recent.filter(i => i.severity === 'critical').length / (recent.length || 1);
  
  return {
    nextWeek: {
      expectedIncidents: Math.max(5, Math.round(recent.length * 1.2)),
      criticalProbability: Math.round(criticalRate * 100),
      riskLevel: criticalRate > 0.3 ? 'high' : criticalRate > 0.15 ? 'medium' : 'low'
    }
  };
}

function detectPatterns(incidents) {
  const models = [...new Set(incidents.map(i => i.ai_model).filter(Boolean))];
  const severityDist = {
    critical: incidents.filter(i => i.severity === 'critical').length,
    warning: incidents.filter(i => i.severity === 'warning').length,
    info: incidents.filter(i => i.severity === 'info').length
  };
  
  return {
    commonModels: models.slice(0, 5),
    severityDistribution: severityDist,
    timePatterns: 'Various time patterns detected'
  };
}

function generateRecommendations(incidents) {
  const recommendations = [];
  const critical = incidents.filter(i => i.severity === 'critical');
  
  if (critical.length > 0) {
    recommendations.push({
      priority: 'high',
      title: 'Address Critical Incidents',
      description: `${critical.length} critical incidents require immediate attention`
    });
  }
  
  const models = analyzeModelPerformance(incidents);
  if (models.length > 0 && models[0].criticalRate > 30) {
    recommendations.push({
      priority: 'high',
      title: `Review ${models[0].model}`,
      description: `High failure rate (${Math.round(models[0].criticalRate)}%) detected`
    });
  }
  
  recommendations.push({
    priority: 'medium',
    title: 'Implement Monitoring',
    description: 'Set up real-time alerts for critical incidents'
  });
  
  return recommendations;
}

// Initialize broker on module load
if (PRIVATE_KEY) {
  initializeBroker().catch(err => {
    console.log('ℹ️  0G Compute initialization deferred');
  });
}

export default {
  computeAnalytics: computeAnalyticsWithZG,
  initializeBroker,
  queryComputeModel
};
