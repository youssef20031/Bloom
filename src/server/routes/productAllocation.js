import express from 'express';
import {
  // Product Allocation Management
  allocateProduct,
  deallocateProduct,
  
  // IT Team Queries
  getCustomerProductMapping,
  getProductUtilizationReport,
  getMaintenanceSchedule,
  getProductsByCustomer,
  getAvailableHardware,
  
  // Enhanced Product Management for Hardware
  createHardwareProduct,
  updateHardwareStatus
} from '../controllers/productAllocation.js';

const router = express.Router();

// Product Allocation Routes
router.post('/allocate', allocateProduct);
router.put('/deallocate/:allocationId', deallocateProduct);

// IT Team Query Routes
router.get('/mapping/customer', getCustomerProductMapping);
router.get('/utilization', getProductUtilizationReport);
router.get('/maintenance', getMaintenanceSchedule);
router.get('/customer/:customerId', getProductsByCustomer);
router.get('/available', getAvailableHardware);

// Enhanced Product Management for Hardware
router.post('/hardware', createHardwareProduct);
router.put('/hardware/:productId/status', updateHardwareStatus);

export default router;
