import express from 'express';
import * as datacenterController from '../controllers/datacenter.js';

const router = express.Router();

router.post('/', datacenterController.createDatacenterAsset);
router.post('/:datacenterId/reading', datacenterController.addIotReading);
router.get('/', datacenterController.getAllAssetsWithLatestReading);
router.get("/:id",datacenterController.getDataCenterById)

export default router;
