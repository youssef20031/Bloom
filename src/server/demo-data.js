import mongoose from 'mongoose';
import Customer from './models/customer.js';
import Service from './models/service.js';
import User from './models/user.js';

// Sample services data
const sampleServices = [
  {
    name: 'AI-Powered Analytics Platform',
    description: 'Advanced machine learning platform for business intelligence and predictive analytics',
    type: 'ai_hosted',
    hostingDetails: {
      datacenterLocation: 'US East (Virginia)',
      vmSpecs: {
        'CPU': '8 vCPUs',
        'RAM': '32 GB',
        'Storage': '500 GB SSD',
        'Network': '10 Gbps'
      }
    }
  },
  {
    name: 'Infrastructure Monitoring Suite',
    description: 'Comprehensive monitoring and alerting system for IT infrastructure',
    type: 'infrastructure',
    hostingDetails: {
      datacenterLocation: 'US West (Oregon)',
      vmSpecs: {
        'CPU': '4 vCPUs',
        'RAM': '16 GB',
        'Storage': '200 GB SSD',
        'Network': '5 Gbps'
      }
    }
  },
  {
    name: 'Natural Language Processing API',
    description: 'RESTful API for text analysis, sentiment analysis, and language processing',
    type: 'ai_only',
    hostingDetails: {
      datacenterLocation: 'Europe (Frankfurt)',
      vmSpecs: {
        'CPU': '16 vCPUs',
        'RAM': '64 GB',
        'Storage': '1 TB SSD',
        'Network': '20 Gbps'
      }
    }
  }
];

// Sample user data
const sampleUser = {
  name: 'John Smith',
  email: 'john.smith@techcorp.com',
  password: 'hashedpassword123', // In real app, this would be properly hashed
  role: 'customer',
  createdAt: new Date()
};

// Sample customer data
const sampleCustomer = {
  companyName: 'TechCorp Solutions',
  contactPerson: 'John Smith',
  phone: '+1 (555) 123-4567',
  address: {
    street: '123 Innovation Drive',
    city: 'San Francisco',
    country: 'United States'
  }
};

export const populateDemoData = async () => {
  try {
    console.log('Starting demo data population...');
    
    // Create user
    const user = new User(sampleUser);
    await user.save();
    console.log('User created:', user._id);
    
    // Create services
    const services = [];
    for (const serviceData of sampleServices) {
      const service = new Service(serviceData);
      await service.save();
      services.push(service);
      console.log('Service created:', service.name);
    }
    
    // Create customer with purchased services
    const customer = new Customer({
      userId: user._id,
      ...sampleCustomer,
      purchasedServices: [
        {
          serviceId: services[0]._id,
          purchaseDate: new Date('2024-01-15'),
          status: 'active',
          ipAddress: '192.168.1.100'
        },
        {
          serviceId: services[1]._id,
          purchaseDate: new Date('2024-02-20'),
          status: 'active',
          ipAddress: '192.168.1.101'
        },
        {
          serviceId: services[2]._id,
          purchaseDate: new Date('2024-03-10'),
          status: 'expired',
          ipAddress: '192.168.1.102'
        }
      ]
    });
    
    await customer.save();
    console.log('Customer created with purchased services');
    
    console.log('Demo data population completed successfully!');
    console.log('User ID for testing:', user._id);
    
    return user._id;
  } catch (error) {
    console.error('Error populating demo data:', error);
    throw error;
  }
};

export const clearDemoData = async () => {
  try {
    await User.deleteMany({ email: 'john.smith@techcorp.com' });
    await Customer.deleteMany({ companyName: 'TechCorp Solutions' });
    await Service.deleteMany({ name: { $in: sampleServices.map(s => s.name) } });
    console.log('Demo data cleared successfully!');
  } catch (error) {
    console.error('Error clearing demo data:', error);
    throw error;
  }
}; 