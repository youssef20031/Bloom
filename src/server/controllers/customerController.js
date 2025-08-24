import SupportTicket from '../models/supportTicket.js';

// Get all tickets for a specific customer
export async function getCustomerTickets(req, res) {
  try {
    const { customerId } = req.params;
    const { status } = req.query;
    const query = { customerId };
    if (status) {
      query.status = status;
    }
    const tickets = await SupportTicket.find(query).sort({ createdAt: -1 });
    res.json(tickets);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tickets' });
  }
}

