import mongoose from 'mongoose';
import dotenv from 'dotenv';
import SupportTicket from './models/supportTicket.js';
dotenv.config();
const MONGO_URI = process.env.MONGO_URI;
async function cleanupDuplicates() {
  await mongoose.connect(MONGO_URI);
  const allTickets = await SupportTicket.find({});
  const seen = new Set();
  let removed = 0;
  for (const ticket of allTickets) {
    const key = `${ticket.customerId}|${ticket.issue}|${ticket.status}|${ticket.createdAt.toISOString().slice(0,10)}`;
    if (seen.has(key)) {
      await SupportTicket.deleteOne({ _id: ticket._id });
      removed++;
    } else {
      seen.add(key);
    }
  }
  await mongoose.disconnect();
  console.log(`Cleanup complete. Removed ${removed} duplicate tickets.`);
}
cleanupDuplicates().catch(console.error);

