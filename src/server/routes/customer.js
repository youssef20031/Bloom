import express from 'express';
import {
  getCustomerDashboard,
  getServiceDetails,
  getCustomerProfile,
  updateCustomerProfile,
  getCustomerServiceSummary
} from '../controllers/customer.js';

const router = express.Router();

// Customer dashboard routes
router.get('/dashboard/:userId', getCustomerDashboard);
router.get('/service/:serviceId', getServiceDetails);
router.get('/profile/:userId', getCustomerProfile);
router.put('/profile/:userId', updateCustomerProfile);
router.get('/summary/:userId', getCustomerServiceSummary);

export default router; 