import express from 'express';
import * as datacenterController from '../controllers/datacenter.js';

const router = express.Router();

router.post('/', datacenterController.createDatacenterAsset);
router.post('/:datacenterId/reading', datacenterController.addIotReading);
router.get('/', datacenterController.getAllAssetsWithLatestReading);
router.get("/:id",datacenterController.getDataCenterById)

// High-level health reports
// GET health overview for all or filtered by query
router.get('/health/overview', datacenterController.getHealthOverview);
// GET health overview filtered by customerId path param
router.get('/health/overview/:customerId', datacenterController.getHealthOverviewByCustomer);
router.get('/health/locations', datacenterController.getHealthByLocation);
router.get('/health/assets', datacenterController.getAssetsHealthList);

export default router;
