// test-api.js
const axios = require('axios');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const API_URL = 'http://localhost:5000/api/v2';

async function testBalance(apiKey) {
    console.log('\n📊 Testing Balance Action...');
    try {
        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('action', 'balance');

        const response = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log('✅ Success!');
        console.log('Response:', response.data);
        return true;
    } catch (error) {
        console.log('❌ Failed!');
        if (error.response) {
            console.log('Error:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
        return false;
    }
}

async function testServices(apiKey) {
    console.log('\n📋 Testing Services Action...');
    try {
        const formData = new URLSearchParams();
        formData.append('key', apiKey);
        formData.append('action', 'services');

        const response = await axios.post(API_URL, formData, {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
        });
        
        console.log('✅ Success!');
        console.log(`Found ${response.data.length} services`);
        if (response.data.length > 0) {
            console.log('Sample service:', response.data[0]);
        }
        return true;
    } catch (error) {
        console.log('❌ Failed!');
        if (error.response) {
            console.log('Error:', error.response.data);
        } else {
            console.log('Error:', error.message);
        }
        return false;
    }
}

async function main() {
    console.log('🚀 API Test Script');
    console.log('==================');
    
    rl.question('\nEnter your API key: ', async (apiKey) => {
        console.log(`\nTesting API at: ${API_URL}`);
        
        let success = true;
        
        // Test 1: Balance
        const balanceOk = await testBalance(apiKey);
        if (!balanceOk) success = false;
        
        // Test 2: Services
        const servicesOk = await testServices(apiKey);
        if (!servicesOk) success = false;
        
        console.log('\n📊 Test Summary:');
        console.log('===============');
        console.log(`Balance Test: ${balanceOk ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Services Test: ${servicesOk ? '✅ PASS' : '❌ FAIL'}`);
        console.log(`Overall: ${success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED'}`);
        
        rl.close();
    });
}

// Run the test
main();