import { Router } from 'express';
import {
    chat,
    report,
    reportDocx,
    reportPdf,
    createSession,
    getSessions,
    getSessionById,
    updateSessionStatus,
} from '../controllers/chatBot.js';

const router = Router();

// --- Chat & Report Endpoints ---

// POST to main chat endpoint
router.post('/chat', chat);

// POST to generate human-readable report
router.post('/report', report);

// POST to download DOCX report
router.post('/report_docx', reportDocx);

// POST to download PDF report
router.post('/report_pdf', reportPdf);


// --- Session CRUD Endpoints ---

// POST to create a new session
router.post('/sessions', createSession);

// GET all sessions (with optional filters)
router.get('/sessions', getSessions);

// GET a single session by its ID
router.get('/sessions/:id', getSessionById);

// PATCH to update a session's status
router.patch('/sessions/:id/status', updateSessionStatus);


export default router;