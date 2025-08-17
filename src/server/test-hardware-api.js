// Test script for Hardware Management API
// Run this after starting the server to test the endpoints

const BASE_URL = 'http://localhost:3000/api/hardware';

// Helper function to make HTTP requests
async function makeRequest(url, options = {}) {
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    console.log(`\n${options.method || 'GET'} ${url}`);
    console.log(`Status: ${response.status}`);
    console.log('Response:', JSON.stringify(data, null, 2));
    
    return { status: response.status, data };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);
    return { status: 'ERROR', data: null };
  }
}

// Test functions
async function testHardwareAPI() {
  console.log('🧪 Testing Hardware Management API\n');
  
  // 1. Get all hardware
  console.log('1. Getting all hardware...');
  await makeRequest(`${BASE_URL}/hardware`);
  
  // 2. Get available hardware
  console.log('\n2. Getting available hardware...');
  await makeRequest(`${BASE_URL}/hardware/available`);
  
  // 3. Get hardware by type
  console.log('\n3. Getting servers only...');
  await makeRequest(`${BASE_URL}/hardware?type=server`);
  
  // 4. Get customer-hardware mapping
  console.log('\n4. Getting customer-hardware mapping...');
  await makeRequest(`${BASE_URL}/hardware/mapping/customer`);
  
  // 5. Get hardware utilization report
  console.log('\n5. Getting hardware utilization report...');
  await makeRequest(`${BASE_URL}/hardware/utilization`);
  
  // 6. Get maintenance schedule
  console.log('\n6. Getting maintenance schedule...');
  await makeRequest(`${BASE_URL}/hardware/maintenance?upcoming=true`);
  
  // 7. Get hardware by datacenter
  console.log('\n7. Getting hardware by datacenter...');
  await makeRequest(`${BASE_URL}/hardware?location=DC-East-01`);
  
  // 8. Get hardware by vendor
  console.log('\n8. Getting Dell hardware...');
  await makeRequest(`${BASE_URL}/hardware?vendor=Dell`);
  
  // 9. Get hardware by status
  console.log('\n9. Getting allocated hardware...');
  await makeRequest(`${BASE_URL}/hardware?status=allocated`);
  
  // 10. Get available servers in specific datacenter
  console.log('\n10. Getting available servers in DC-East-01...');
  await makeRequest(`${BASE_URL}/hardware/available?type=server&location=DC-East-01`);
}

// Example of how to create new hardware (commented out to avoid errors)
async function createSampleHardware() {
  console.log('\n📝 Example: Creating new hardware...');
  
  const newHardware = {
    serialNumber: 'SRV-002-2024',
    name: 'Test Server Beta',
    type: 'server',
    model: 'HP ProLiant DL380',
    vendor: 'HP',
    specifications: {
      cpu: 'Intel Xeon Silver 4214 (12 cores)',
      ram: '64GB DDR4 ECC',
      storage: '1TB NVMe SSD',
      network: '1GbE Dual Port',
      power: '550W Platinum',
      dimensions: '2U Rack Mount'
    },
    location: {
      datacenter: 'DC-East-01',
      rack: 'Rack-A-20',
      position: 'U20-U21'
    },
    purchaseDate: new Date().toISOString().split('T')[0],
    warrantyExpiry: new Date(Date.now() + 3 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    nextMaintenance: new Date(Date.now() + 6 * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    tags: ['test', 'development', 'staging']
  };
  
  console.log('Sample hardware data:');
  console.log(JSON.stringify(newHardware, null, 2));
  
  console.log('\nTo create this hardware, use:');
  console.log(`POST ${BASE_URL}/hardware`);
  console.log('Body:', JSON.stringify(newHardware, null, 2));
}

// Example of how to allocate hardware (commented out to avoid errors)
async function showAllocationExample() {
  console.log('\n🔗 Example: Allocating hardware to customer...');
  
  const allocationData = {
    customerId: "YOUR_CUSTOMER_ID_HERE",
    hardwareId: "YOUR_HARDWARE_ID_HERE",
    serviceId: "YOUR_SERVICE_ID_HERE",
    allocationType: "dedicated",
    usageDetails: {
      purpose: "Development environment",
      workload: "Web application development",
      performanceRequirements: "Standard development specs"
    },
    billing: {
      rate: 200,
      billingCycle: "monthly"
    }
  };
  
  console.log('Sample allocation data:');
  console.log(JSON.stringify(allocationData, null, 2));
  
  console.log('\nTo allocate hardware, use:');
  console.log(`POST ${BASE_URL}/hardware/allocate`);
  console.log('Body:', JSON.stringify(allocationData, null, 2));
}

// Main execution
async function main() {
  try {
    await testHardwareAPI();
    await createSampleHardware();
    await showAllocationExample();
    
    console.log('\n✅ Hardware API testing completed!');
    console.log('\n📚 For detailed API documentation, see: HARDWARE_API_README.md');
    console.log('\n🚀 To test with real data, first run the demo data setup:');
    console.log('   import setupHardwareDemoData from "./setupHardwareDemoData.js";');
    console.log('   await setupHardwareDemoData();');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the tests if this file is executed directly
if (typeof window === 'undefined') {
  // Node.js environment
  main().catch(console.error);
} else {
  // Browser environment
  console.log('🌐 Running in browser environment');
  console.log('To test the API, open the browser console and run:');
  console.log('testHardwareAPI()');
  
  // Make functions available globally for browser testing
  window.testHardwareAPI = testHardwareAPI;
  window.createSampleHardware = createSampleHardware;
  window.showAllocationExample = showAllocationExample;
}
