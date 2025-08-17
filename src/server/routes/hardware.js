import express from 'express';
import {
  // Hardware Management
  createHardware,
  getAllHardware,
  getHardwareById,
  updateHardware,
  deleteHardware,
  
  // Hardware Allocation Management
  allocateHardware,
  deallocateHardware,
  
  // IT Team Queries
  getCustomerHardwareMapping,
  getHardwareUtilizationReport,
  getMaintenanceSchedule,
  getHardwareByCustomer,
  getAvailableHardware
} from '../controllers/hardware.js';

const router = express.Router();

// Hardware Management Routes
router.post('/hardware', createHardware);
router.get('/hardware', getAllHardware);
router.get('/hardware/:id', getHardwareById);
router.put('/hardware/:id', updateHardware);
router.delete('/hardware/:id', deleteHardware);

// Hardware Allocation Routes
router.post('/hardware/allocate', allocateHardware);
router.put('/hardware/deallocate/:allocationId', deallocateHardware);

// IT Team Query Routes
router.get('/hardware/mapping/customer', getCustomerHardwareMapping);
router.get('/hardware/utilization', getHardwareUtilizationReport);
router.get('/hardware/maintenance', getMaintenanceSchedule);
router.get('/hardware/customer/:customerId', getHardwareByCustomer);
router.get('/hardware/available', getAvailableHardware);

export default router;
