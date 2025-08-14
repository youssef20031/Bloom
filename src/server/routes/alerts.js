import express from 'express';
import * as alertsController from "../controllers/alerts.js"

const router = express.Router();

router.get("/",alertsController.GetAllAlerts);

export default router;