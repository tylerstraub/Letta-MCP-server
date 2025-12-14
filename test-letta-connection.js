#!/usr/bin/env node
/**
 * Test script to verify Letta API connection
 * Usage: node test-letta-connection.js
 */
import dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
dotenv.config();

const apiBase = process.env.LETTA_BASE_URL || '';
const password = process.env.LETTA_PASSWORD || '';

if (!apiBase) {
    console.error('❌ LETTA_BASE_URL not set in .env file');
    process.exit(1);
}

// Remove trailing slash and ensure /v1
let baseUrl = apiBase.replace(/\/$/, '');
if (!baseUrl.endsWith('/v1')) {
    baseUrl = `${baseUrl}/v1`;
}

console.log('🔍 Testing Letta API Connection...\n');
console.log(`Base URL: ${baseUrl}`);
console.log(`Password: ${password ? '***' + password.slice(-4) : '(empty)'}\n`);

// Test endpoints
const endpoints = [
    '/agents/',
    '/models/',
    '/tools/mcp/servers',
];

for (const endpoint of endpoints) {
    const fullUrl = `${baseUrl}${endpoint}`;
    console.log(`Testing: ${fullUrl}`);
    
    try {
        const response = await axios.get(fullUrl, {
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-BARE-PASSWORD': `password ${password}`,
                'Authorization': `Bearer ${password}`,
            },
            timeout: 5000,
            validateStatus: (status) => status < 500, // Don't throw on 4xx
        });
        
        if (response.status === 200) {
            console.log(`  ✅ Success (${response.status})`);
        } else if (response.status === 404) {
            console.log(`  ❌ Not Found (404) - Endpoint may not exist`);
        } else if (response.status === 401 || response.status === 403) {
            console.log(`  ❌ Authentication failed (${response.status})`);
        } else {
            console.log(`  ⚠️  Status: ${response.status}`);
        }
    } catch (error) {
        if (error.code === 'ECONNREFUSED') {
            console.log(`  ❌ Connection refused - Is Letta running?`);
        } else if (error.code === 'ETIMEDOUT') {
            console.log(`  ❌ Connection timeout`);
        } else if (error.response) {
            console.log(`  ❌ Error ${error.response.status}: ${error.response.statusText}`);
            if (error.response.data) {
                console.log(`     Details: ${JSON.stringify(error.response.data).slice(0, 100)}`);
            }
        } else {
            console.log(`  ❌ Error: ${error.message}`);
        }
    }
    console.log('');
}

console.log('💡 Tips:');
console.log('  - If all endpoints return 404, check your LETTA_BASE_URL');
console.log('  - If you get 401/403, check your LETTA_PASSWORD');
console.log('  - If connection refused, verify Letta is running and accessible');

