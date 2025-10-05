// Simple test script to verify backend API
import fetch from 'node-fetch';

async function testBackend() {
  try {
    console.log('Testing backend at http://localhost:8787');
    
    // Test basic endpoint
    const basicResponse = await fetch('http://localhost:8787/');
    const basicData = await basicResponse.json();
    console.log('✅ Basic endpoint:', basicData);
    
    // Test incident reporting
    const incidentData = {
      title: "Test Frontend Integration",
      severity: "info",
      description: "Testing the new frontend API integration",
      logs: "Frontend connection test logs"
    };
    
    const incidentResponse = await fetch('http://localhost:8787/incident', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(incidentData)
    });
    
    const incidentResult = await incidentResponse.json();
    console.log('📋 Incident report result:', incidentResult);
    
  } catch (error) {
    console.error('❌ Error testing backend:', error.message);
  }
}

testBackend();