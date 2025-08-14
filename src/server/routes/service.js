import express from 'express';
import * as serviceController from '../controllers/service.js';

const router = express.Router();

// Create a new service
router.post('/', serviceController.createService);

// Get all services
router.get('/', serviceController.getAllServices);
//Search for a service by its name 
router.get('/search', serviceController.searchServices);
// Get a single service by ID
router.get('/:id', serviceController.getServiceById);

// Update a service by ID
router.put('/:id', serviceController.updateService);

// Delete a service by ID
router.delete('/:id', serviceController.deleteService);


export default router;
