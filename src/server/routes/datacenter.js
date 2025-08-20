import express from 'express';
import * as datacenterController from '../controllers/datacenter.js';

const router = express.Router();

router.post('/', datacenterController.createDatacenterAsset);
router.post('/:datacenterId/reading', datacenterController.addIotReading);
router.get('/', datacenterController.getAllAssetsWithLatestReading);
router.get("/:id",datacenterController.getDataCenterById)

// High-level health reports
router.get('/health/overview', datacenterController.getHealthOverview);
router.get('/health/locations', datacenterController.getHealthByLocation);
router.get('/health/assets', datacenterController.getAssetsHealthList);

export default router;
