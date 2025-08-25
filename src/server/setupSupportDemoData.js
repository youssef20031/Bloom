import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './models/user.js';
import Customer from './models/customer.js';
import SupportTicket from './models/supportTicket.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

// Random ticket data generation
const subjects = [
  'Backup restore failed', 'Email delivery failure', 'Security patch installation', '5G network problem',
  'Payment declined', 'System integration issues', 'System monitoring alerts', 'Printer not connecting',
  'VPN authentication failure', 'Cloud function timeout', 'DNS propagation delay', 'Load balancer error',
  'Payment gateway timeout issue', 'SSL certificate renewal reminder', 'Repository access issue'
];
const statuses = ['open', 'closed'];
const customerList = [
  { name: 'Navy', email: 'helpdesk@navy.com' },
  { name: 'Siemens', email: 'support@siemens.com' },
  { name: 'Stripe', email: 'info@stripe.com' },
  { name: 'Tesla', email: 'helpdesk@tesla.com' },
  { name: 'Lenovo', email: 'tech@lenovo.com' },
  { name: 'Amazon', email: 'helpdesk@amazon.com' },
  { name: 'Philips', email: 'helpdesk@philips.com' },
  { name: 'Accenture', email: 'helpdesk@accenture.com' },
  { name: 'Microsoft', email: 'tech@microsoft.com' },
  { name: 'Twitter', email: 'helpdesk@twitter.com' },
  { name: 'Airbnb', email: 'support@airbnb.com' },
  { name: 'Hitachi', email: 'tech@hitachi.com' },
  { name: 'Etihad', email: 'info@etihad.com' },
  { name: 'Samsung', email: 'helpdesk@samsung.com' },
  { name: 'GE Healthcare', email: 'info@gehealthcare.com' },
  { name: 'Google', email: 'support@google.com' },
  { name: 'Norton', email: 'info@norton.com' }
];
function getRandomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}
function generateRandomTickets(count) {
  const uniqueTickets = new Set();
  const tickets = [];
  let i = 0;
  while (tickets.length < count && i < count * 2) { // safety limit
    const subject = subjects[Math.floor(Math.random() * subjects.length)];
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const customer = customerList[Math.floor(Math.random() * customerList.length)];
    const createdAt = getRandomDate(new Date(2023, 0, 1), new Date(2025, 11, 31));
    const key = `${customer.name}|${subject}|${status}|${createdAt.toISOString().slice(0,10)}`;
    if (!uniqueTickets.has(key)) {
      uniqueTickets.add(key);
      tickets.push({
        ticketId: `TK${(1000 + tickets.length).toString().padStart(4, '0')}`,
        subject,
        status,
        createdAt: createdAt.toISOString().slice(0,10),
        name: customer.name,
        email: customer.email
      });
    }
    i++;
  }
  return tickets;
}
const ticketData = generateRandomTickets(100);

async function setupDemoData() {
  await mongoose.connect(MONGO_URI);
  // Clean up customers with email:null
  await Customer.deleteMany({ email: null });
  for (const row of ticketData) {
    // Find or create User
    let user = await User.findOne({ email: row.email });
    if (!user) {
      user = await User.create({ name: row.name, email: row.email, password: 'demo123', role: 'customer' });
    }
    // Find or create Customer
    let customer = await Customer.findOne({ companyName: row.name });
    if (!customer) {
      customer = await Customer.create({ userId: user._id, companyName: row.name, contactPerson: row.name, email: row.email });
    }
    // Check for duplicate ticket by subject, status, createdAt, and customerId
    const duplicateTicket = await SupportTicket.findOne({
      customerId: customer._id,
      issue: row.subject,
      status: row.status,
      createdAt: new Date(row.createdAt)
    });
    if (duplicateTicket) {
      console.log(`Duplicate ticket for ${row.name} (${row.subject}, ${row.status}, ${row.createdAt}) exists, skipping.`);
      continue;
    }
    // Create SupportTicket
    await SupportTicket.create({
      ticketId: row.ticketId,
      customerId: customer._id,
      issue: row.subject,
      status: row.status,
      createdAt: new Date(row.createdAt),
      history: [{ message: `Ticket created: ${row.subject}`, author: user._id, timestamp: new Date(row.createdAt) }]
    });
    console.log(`Inserted ticket ${row.ticketId} for customer ${row.name}`);
  }
  await mongoose.disconnect();
  console.log('Demo data import complete.');
}

setupDemoData().catch(console.error);
