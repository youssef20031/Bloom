import mongoose from 'mongoose';
import Product from './models/product.js';
import ProductAllocation from './models/productAllocation.js';
import Customer from './models/customer.js';
import Service from './models/service.js';

const setupHardwareDemoData = async () => {
  try {
    // Sample hardware product data
    const hardwareProductData = [
      {
        serialNumber: 'SRV-001-2024',
        name: 'Production Server Alpha',
        type: 'server',
        model: 'Dell PowerEdge R750',
        vendor: 'Dell',
        specifications: {
          cpu: 'Intel Xeon Gold 6338 (32 cores)',
          ram: '128GB DDR4 ECC',
          storage: '2TB NVMe SSD + 4TB HDD',
          network: '10GbE Dual Port',
          power: '750W Platinum',
          dimensions: '2U Rack Mount'
        },
        location: {
          datacenter: 'DC-East-01',
          rack: 'Rack-A-15',
          position: 'U15-U16'
        },
        status: 'available',
        purchaseDate: new Date('2024-01-15'),
        warrantyExpiry: new Date('2027-01-15'),
        nextMaintenance: new Date('2024-07-15'),
        tags: ['production', 'high-performance', 'enterprise']
      },
      {
        serialNumber: 'GPU-001-2024',
        name: 'AI Training GPU Cluster',
        type: 'gpu',
        model: 'NVIDIA A100 80GB',
        vendor: 'NVIDIA',
        specifications: {
          cpu: 'N/A',
          ram: '80GB HBM2e',
          storage: 'N/A',
          network: 'PCIe 4.0 x16',
          power: '400W',
          dimensions: 'Full Height, Full Length'
        },
        location: {
          datacenter: 'DC-East-01',
          rack: 'Rack-B-20',
          position: 'U20'
        },
        status: 'available',
        purchaseDate: new Date('2024-02-01'),
        warrantyExpiry: new Date('2027-02-01'),
        nextMaintenance: new Date('2024-08-01'),
        tags: ['ai-training', 'gpu', 'high-performance']
      },
      {
        serialNumber: 'STR-001-2024',
        name: 'Storage Array Beta',
        type: 'storage',
        model: 'NetApp AFF A400',
        vendor: 'NetApp',
        specifications: {
          cpu: 'Intel Xeon D-1541',
          ram: '64GB DDR4',
          storage: '50TB NVMe Flash',
          network: '25GbE Quad Port',
          power: '1200W Redundant',
          dimensions: '4U Rack Mount'
        },
        location: {
          datacenter: 'DC-East-01',
          rack: 'Rack-C-10',
          position: 'U10-U13'
        },
        status: 'available',
        purchaseDate: new Date('2024-01-20'),
        warrantyExpiry: new Date('2027-01-20'),
        nextMaintenance: new Date('2024-07-20'),
        tags: ['storage', 'flash', 'enterprise']
      },
      {
        serialNumber: 'NET-001-2024',
        name: 'Core Switch Gamma',
        type: 'network',
        model: 'Cisco Nexus 9300',
        vendor: 'Cisco',
        specifications: {
          cpu: 'Intel Xeon D-1541',
          ram: '32GB DDR4',
          storage: '64GB SSD',
          network: '48x 10GbE + 4x 100GbE',
          power: '1100W Redundant',
          dimensions: '1U Rack Mount'
        },
        location: {
          datacenter: 'DC-East-01',
          rack: 'Rack-D-1',
          position: 'U1'
        },
        status: 'available',
        purchaseDate: new Date('2024-01-10'),
        warrantyExpiry: new Date('2027-01-10'),
        nextMaintenance: new Date('2024-07-10'),
        tags: ['network', 'core-switch', 'enterprise']
      }
    ];

    // Insert hardware products
    const hardwareProducts = await Product.insertMany(hardwareProductData);
    console.log(`Inserted ${hardwareProducts.length} hardware products`);

    // Get existing customers and services for allocation
    const customers = await Customer.find().limit(2);
    const services = await Service.find().limit(2);

    if (customers.length > 0 && services.length > 0 && hardwareProducts.length > 0) {
      // Create some allocations
      const allocationData = [
        {
          customerId: customers[0]._id,
          productId: hardwareProducts[0]._id, // Server
          serviceId: services[0]._id,
          allocationType: 'dedicated',
          usageDetails: {
            purpose: 'Production web hosting',
            workload: 'High-traffic web applications',
            performanceRequirements: '99.9% uptime, low latency'
          },
          billing: {
            rate: 500,
            billingCycle: 'monthly',
            lastBilled: new Date()
          },
          notes: 'Allocated for production environment'
        },
        {
          customerId: customers[1]?._id || customers[0]._id,
          productId: hardwareProducts[1]._id, // GPU
          serviceId: services[1]?._id || services[0]._id,
          allocationType: 'dedicated',
          usageDetails: {
            purpose: 'AI model training',
            workload: 'Deep learning workloads',
            performanceRequirements: 'High GPU utilization, batch processing'
          },
          billing: {
            rate: 800,
            billingCycle: 'monthly',
            lastBilled: new Date()
          },
          notes: 'Allocated for AI training workloads'
        }
      ];

      const allocations = await ProductAllocation.insertMany(allocationData);
      console.log(`Created ${allocations.length} product allocations`);

      // Update product status to allocated
      await Product.updateMany(
        { _id: { $in: [hardwareProducts[0]._id, hardwareProducts[1]._id] } },
        { status: 'allocated' }
      );
      console.log('Updated product status for allocated pieces');
    }

    console.log('Hardware product demo data setup completed successfully!');
  } catch (error) {
    console.error('Error setting up hardware product demo data:', error);
  }
};

export default setupHardwareDemoData;
