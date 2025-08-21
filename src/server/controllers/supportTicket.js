import mongoose from 'mongoose';
import SupportTicket from '../models/supportTicket.js';
import Customer from '../models/customer.js';

// Create a support ticket (from customer dashboard)
export const createSupportTicket = async (req, res) => {
  try {
    const { userId, customerId, issue, initialMessage } = req.body;

    if (!issue || issue.trim().length === 0) {
      return res.status(400).json({ message: 'Issue description is required' });
    }

    let resolvedCustomerId = customerId;

    // If userId is provided, resolve to the owning customer document
    if (!resolvedCustomerId && userId) {
      if (!mongoose.Types.ObjectId.isValid(userId)) {
        return res.status(400).json({ message: 'Invalid user ID format' });
      }
      const customer = await Customer.findOne({ userId });
      if (!customer) {
        return res.status(404).json({ message: 'Customer not found for provided userId' });
      }
      resolvedCustomerId = customer._id;
    }

    if (!resolvedCustomerId) {
      return res.status(400).json({ message: 'customerId or userId is required' });
    }

    const historyEntry = initialMessage
      ? [{ message: initialMessage, author: mongoose.Types.ObjectId.isValid(userId) ? userId : undefined }]
      : [];

    const ticket = new SupportTicket({
      customerId: resolvedCustomerId,
      issue: issue.trim(),
      history: historyEntry
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all tickets for a given customer (by userId)
export const getCustomerTickets = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const customer = await Customer.findOne({ userId });
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const tickets = await SupportTicket.find({ customerId: customer._id })
      .sort({ createdAt: -1 });

    res.json(tickets);
  } catch (error) {
    console.error('Error fetching customer tickets:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Append a message to a ticket history
export const addMessageToTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, authorId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: 'Invalid ticket ID format' });
    }

    if (!message || message.trim().length === 0) {
      return res.status(400).json({ message: 'Message is required' });
    }

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    ticket.history.push({ message: message.trim(), author: mongoose.Types.ObjectId.isValid(authorId) ? authorId : undefined });
    await ticket.save();

    res.json(ticket);
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update the status of a ticket
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(ticketId)) {
      return res.status(400).json({ message: 'Invalid ticket ID format' });
    }

    const allowed = ['open', 'in_progress', 'closed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: 'Invalid status value' });
    }

    const ticket = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { status },
      { new: true }
    );

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Error updating ticket status:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 