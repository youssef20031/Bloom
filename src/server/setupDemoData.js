import mongoose from 'mongoose';
import Customer from './models/customer.js';
import User from './models/user.js';
import Service from './models/service.js';
import SupportTicket from './models/supportTicket.js';

// Connect to MongoDB (you'll need to set up your connection string)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/bloom';

async function setupDemoData() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create demo user
    const demoUser = new User({
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      role: 'customer'
    });
    await demoUser.save();
    console.log('Created demo user:', demoUser._id);

    // Create demo service
    const demoService = new Service({
      name: 'Premium Hosting Package',
      description: 'High-performance hosting with 99.9% uptime guarantee',
      price: 99.99,
      features: ['Unlimited bandwidth', '24/7 support', 'SSL certificate']
    });
    await demoService.save();
    console.log('Created demo service:', demoService._id);

    // Create demo customer
    const demoCustomer = new Customer({
      userId: demoUser._id,
      companyName: 'TechCorp Solutions',
      contactPerson: 'John Doe',
      phone: '+1-555-0123',
      address: {
        street: '123 Business Ave',
        city: 'Tech City',
        country: 'USA'
      },
      purchasedServices: [{
        serviceId: demoService._id,
        purchaseDate: new Date(),
        status: 'active',
        ipAddress: '192.168.1.100'
      }]
    });
    await demoCustomer.save();
    console.log('Created demo customer:', demoCustomer._id);

    // Create demo support ticket
    const demoTicket = new SupportTicket({
      customerId: demoCustomer._id,
      issue: 'Need help setting up SSL certificate for our domain',
      priority: 'medium',
      status: 'open',
      history: [{
        message: 'Ticket created: Need help setting up SSL certificate for our domain',
        author: demoCustomer._id,
        timestamp: new Date()
      }]
    });
    await demoTicket.save();
    console.log('Created demo support ticket:', demoTicket._id);

    console.log('\nDemo data setup completed successfully!');
    console.log('Demo Customer ID:', demoCustomer._id);
    console.log('Demo User ID:', demoUser._id);
    console.log('Demo Service ID:', demoService._id);
    console.log('Demo Ticket ID:', demoTicket._id);

  } catch (error) {
    console.error('Error setting up demo data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

// Run the setup if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDemoData();
}

export default setupDemoData;
