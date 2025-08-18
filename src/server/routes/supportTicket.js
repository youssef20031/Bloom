import { Router } from 'express';
import { getOpenTickets } from '../controllers/supportController.js';

const router = Router();

// GET /api/support/tickets/open
router.get('/tickets/open', getOpenTickets);

export default router;
