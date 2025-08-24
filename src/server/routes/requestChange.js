import express from 'express';
import {
  createRequestChange,
  getAllRequestChanges,
  getApprovedRequestChanges,
  updateRequestChangeStatus
} from '../controllers/requestChange.js';

const router = express.Router();

// Create a new request change
router.post('/', createRequestChange);

// Get all request changes
router.get('/', getAllRequestChanges);

// Get all approved request changes
router.get('/approved', getApprovedRequestChanges);

// Update status of a request change
router.put('/:id/status', updateRequestChangeStatus);

export default router;
