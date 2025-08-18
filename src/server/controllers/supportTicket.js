import Ticket from '../models/Ticket.js';

// GET /api/support/tickets/open
export const getOpenTickets = async (req, res) => {
  try {
    const tickets = await Ticket.find({ status: 'open' })
      .sort({ createdAt: 1 })
      .populate('customerId', 'name email')
      .lean();

    const result = tickets.map(t => ({
      _id: t._id,
      subject: t.subject,
      status: t.status,
      createdAt: t.createdAt,
      customer: t.customerId ? { _id: t.customerId._id, name: t.customerId.name, email: t.customerId.email } : null
    }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch open tickets', error: err.message });
  }
};
