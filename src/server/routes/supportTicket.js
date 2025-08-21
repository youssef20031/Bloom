import express from 'express';
import {
	createSupportTicket,
	getCustomerTickets,
	addMessageToTicket,
	updateTicketStatus
} from '../controllers/supportTicket.js';

const router = express.Router();

// Create a new ticket
router.post('/', createSupportTicket);

// Get tickets for a customer by userId
router.get('/customer/:userId', getCustomerTickets);

// Add a message to ticket
router.post('/:ticketId/messages', addMessageToTicket);

// Update ticket status
router.patch('/:ticketId/status', updateTicketStatus);

export default router; 