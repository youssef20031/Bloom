import SupportTicket from '../models/supportTicket.js';
import Customer from '../models/customer.js';
import User from '../models/user.js';

// Create a new support ticket
export const createSupportTicket = async (req, res) => {
    try {
        let { customerId, issue, priority = 'medium' } = req.body;

        if (!customerId || !issue) {
            return res.status(400).json({ message: 'Customer ID and issue description are required' });
        }

        let customer = await Customer.findById(customerId);
        if (!customer) {
            // maybe passed a userId, find customer record
            customer = await Customer.findOne({ userId: customerId });
            if (!customer) return res.status(404).json({ message: 'Customer not found' });
            customerId = customer._id;
        } else {
            customerId = customer._id;
        }

        const supportTicket = new SupportTicket({
            customerId,
            issue,
            priority,
            status: 'open',
            history: [{ message: `Ticket created: ${issue}`, author: customerId, timestamp: new Date() }]
        });

        await supportTicket.save();
        res.status(201).json({ message: 'Support ticket created successfully', ticket: supportTicket });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Get support ticket by id
export const getSupportTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await SupportTicket.findById(ticketId)
            .populate('customerId', 'companyName contactPerson')
            .populate('supportAgentId', 'name email')
            .populate('history.author', 'name email');

        if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
        res.json(ticket);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Add message to a support ticket
export const addTicketMessage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message, authorId } = req.body;

        if (!message || !authorId) {
            return res.status(400).json({ message: 'Message and author ID are required' });
        }

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });

        ticket.history.push({ message, author: authorId, timestamp: new Date() });
        await ticket.save();
        res.json({ message: 'Message added successfully', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// List all tickets (optional filters by status or agent)
export const listSupportTickets = async (req, res) => {
    try {
        const { status, agentId } = req.query;
        const filter = {};
        if (status) filter.status = status;
        if (agentId) filter.supportAgentId = agentId;

        const tickets = await SupportTicket.find(filter)
            .populate('customerId', 'companyName contactPerson')
            .populate('supportAgentId', 'name email')
            .sort({ createdAt: -1 });

        res.json(tickets);
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Update status of a ticket
export const updateTicketStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { status } = req.body; // 'open' | 'in_progress' | 'closed'
        if (!status) return res.status(400).json({ message: 'Status is required' });

        const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { status }, { new: true });
        if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });

        res.json({ message: 'Status updated', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Assign support agent to a ticket
export const assignSupportAgent = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { supportAgentId } = req.body;
        if (!supportAgentId) return res.status(400).json({ message: 'supportAgentId is required' });

        const agent = await User.findById(supportAgentId);
        if (!agent) return res.status(404).json({ message: 'Support agent not found' });

        const ticket = await SupportTicket.findByIdAndUpdate(ticketId, { supportAgentId }, { new: true })
            .populate('supportAgentId', 'name email');

        if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
        res.json({ message: 'Agent assigned', ticket });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};

// Delete a support ticket
export const deleteSupportTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await SupportTicket.findByIdAndDelete(ticketId);
        if (!ticket) return res.status(404).json({ message: 'Support ticket not found' });
        res.json({ message: 'Support ticket deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Internal server error', error: error.message });
    }
};