import express from 'express';
import * as customerController from '../controllers/customer.js';

const router = express.Router();

// Customer profile routes
router.get('/profile/:userId', customerController.getCustomerProfile);

// Support ticket routes
router.post('/tickets', customerController.createSupportTicket);
router.get('/tickets/:customerId', customerController.getCustomerTickets);
router.get('/tickets/detail/:ticketId', customerController.getSupportTicket);
router.post('/tickets/:ticketId/message', customerController.addTicketMessage);

export default router;
