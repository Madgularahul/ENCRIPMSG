/**
 * API Test Script for EncripMsg Backend
 * Usage: node test-api.js
 */

const http = require('http');

function testHealth() {
  http.get('http://localhost:5000/api/health', (res) => {
    let data = '';
    res.on('data', chunk => data += chunk);
    res.on('end', () => {
      console.log('✅ Health Check Response:', JSON.parse(data));
    });
  }).on('error', (err) => {
    console.error('❌ API Test Error: Ensure server is running on http://localhost:5000');
  });
}

testHealth();
