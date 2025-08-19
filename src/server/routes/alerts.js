import express from 'express';
import * as alertsController from "../controllers/alerts.js";

const router = express.Router();

router.get("/",alertsController.GetAllAlerts);
router.patch('/:id/read', alertsController.MarkAlertAsRead);

export default router;