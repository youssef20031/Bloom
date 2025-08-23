import express from 'express';
import * as alertsController from "../controllers/alerts.js";

const router = express.Router();

router.get("/", alertsController.GetAllAlerts);
router.patch('/:id/read', alertsController.MarkAlertAsRead);
router.post('/test', alertsController.CreateTestAlert);
router.post('/test/random', alertsController.CreateRandomTestAlert);
router.patch('/:id/resolve', alertsController.ResolveAlert);

export default router;