import express from 'express';
import * as customerController from '../controllers/customer.js';

const router = express.Router();

/* ===============================
   CUSTOMER PROFILE
   =============================== */
router.get('/profile/:userId', customerController.getCustomerProfile);

/* ===============================
   CUSTOMER PURCHASES
   =============================== */
router.get('/purchases/all', customerController.getAllCustomersWithPurchases);
router.get('/purchases/:customerId', customerController.getCustomerWithPurchases);

/* ===============================
   SUPPORT TICKETS
   =============================== */
router.post('/tickets', customerController.createSupportTicket);
router.get('/tickets/:customerId', customerController.getCustomerTickets);
router.get('/tickets/detail/:ticketId', customerController.getSupportTicket);
router.post('/tickets/:ticketId/message', customerController.addTicketMessage);

/* ===============================
   CUSTOMER CRUD + HOSTING STATUS
   =============================== */
router.get('/', customerController.getCustomers);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.put('/:id/hosting/status', customerController.updateHostingStatus);

export default router;
