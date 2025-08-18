// Test script for Hardware Management API
// Run this after starting the server to test the endpoints

const BASE_URL = 'http://localhost:3000/api/product-allocation';

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
async function testProductAllocationAPI() {
  console.log('🧪 Testing Product Allocation API\n');
  
  // 1. Get customer-product mapping
  console.log('1. Getting customer-product mapping...');
  await makeRequest(`${BASE_URL}/mapping/customer`);
  
  // 2. Get available hardware
  console.log('\n2. Getting available hardware...');
  await makeRequest(`${BASE_URL}/available`);
  
  // 3. Get products by type
  console.log('\n3. Getting servers only...');
  await makeRequest(`${BASE_URL}/available?type=server`);
  
  // 4. Get customer-product mapping
  console.log('\n4. Getting customer-product mapping...');
  await makeRequest(`${BASE_URL}/mapping/customer`);
  
  // 5. Get product utilization report
  console.log('\n5. Getting product utilization report...');
  await makeRequest(`${BASE_URL}/utilization`);
  
  // 6. Get maintenance schedule
  console.log('\n6. Getting maintenance schedule...');
  await makeRequest(`${BASE_URL}/maintenance?upcoming=true`);
  
  // 7. Get products by datacenter
  console.log('\n7. Getting products by datacenter...');
  await makeRequest(`${BASE_URL}/utilization?datacenter=DC-East-01`);
  
  // 8. Get available servers in specific datacenter
  console.log('\n8. Getting available servers in DC-East-01...');
  await makeRequest(`${BASE_URL}/available?type=server&location=DC-East-01`);
}

// Example of how to create new hardware product (commented out to avoid errors)
async function createSampleHardwareProduct() {
  console.log('\n📝 Example: Creating new hardware product...');
  
  const newHardwareProduct = {
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
  
  console.log('Sample hardware product data:');
  console.log(JSON.stringify(newHardwareProduct, null, 2));
  
  console.log('\nTo create this hardware product, use:');
  console.log(`POST ${BASE_URL}/hardware`);
  console.log('Body:', JSON.stringify(newHardwareProduct, null, 2));
}

// Example of how to allocate product (commented out to avoid errors)
async function showAllocationExample() {
  console.log('\n🔗 Example: Allocating product to customer...');
  
  const allocationData = {
    customerId: "YOUR_CUSTOMER_ID_HERE",
    productId: "YOUR_PRODUCT_ID_HERE",
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
  
  console.log('\nTo allocate product, use:');
  console.log(`POST ${BASE_URL}/allocate`);
  console.log('Body:', JSON.stringify(allocationData, null, 2));
}

// Main execution
async function main() {
  try {
    await testProductAllocationAPI();
    await createSampleHardwareProduct();
    await showAllocationExample();
    
    console.log('\n✅ Product Allocation API testing completed!');
    console.log('\n📚 For detailed API documentation, see: PRODUCT_ALLOCATION_README.md');
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
  window.testProductAllocationAPI = testProductAllocationAPI;
  window.createSampleHardwareProduct = createSampleHardwareProduct;
  window.showAllocationExample = showAllocationExample;
}
