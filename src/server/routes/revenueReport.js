import express from 'express';
import { getMonthlyRevenueReport } from '../controllers/revenueReport.js';

const router = express.Router();

// GET monthly revenue report, optional year query param
router.get('/', getMonthlyRevenueReport);

export default router;
