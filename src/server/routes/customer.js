import express from 'express';
import * as customerController from '../controllers/customer.js';

const router = express.Router();

// Authentication routes
router.post('/signup', customerController.signupCustomer);
// Customer profile routes
router.get('/profile/:userId', customerController.getCustomerProfile);

/* ===============================
   CUSTOMER PURCHASES
   =============================== */
router.get('/purchases/all', customerController.getAllCustomersWithPurchases);
router.get('/purchases/:customerId', customerController.getCustomerWithPurchases);
router.post("/add-service", customerController.addServiceToCustomer);
router.post("/add-product", customerController.addProductToCustomer);
/* ===============================
   SUPPORT TICKETS
   =============================== */
router.get('/tickets/:customerId', customerController.getCustomerTickets);
/* ===============================
   CUSTOMER CRUD + HOSTING STATUS
   =============================== */
router.get('/', customerController.getCustomers);
router.post('/', customerController.createCustomer);
router.put('/:id', customerController.updateCustomer);
router.delete('/:id', customerController.deleteCustomer);
router.put('/:id/hosting/status', customerController.updateHostingStatus);

export default router;
