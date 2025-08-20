import express from 'express';
import {
  createSupportTicket,
  getSupportTicket,
  addTicketMessage,
  listSupportTickets,
  updateTicketStatus,
  assignSupportAgent,
  deleteSupportTicket
} from '../controllers/supportTicket.js';

const router = express.Router();

// Collection routes
router.get('/', listSupportTickets);
router.post('/', createSupportTicket);

// Item routes
router.get('/:ticketId', getSupportTicket);
router.post('/:ticketId/message', addTicketMessage);
router.put('/:ticketId/status', updateTicketStatus);
router.put('/:ticketId/assign', assignSupportAgent);
router.delete('/:ticketId', deleteSupportTicket);

export default router;
