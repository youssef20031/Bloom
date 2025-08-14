import express from 'express';
import {
    getAllInvoices,
    getInvoiceById,
    createInvoice,
    updateInvoice,
    deleteInvoice,
} from '../controllers/invoice.js';

const router = express.Router();

// GET all invoices
router.get('/', getAllInvoices);

// GET a single invoice by ID
router.get('/:id', getInvoiceById);

// POST a new invoice
router.post('/', createInvoice);

// PUT to update an invoice
router.put('/:id', updateInvoice);

// DELETE an invoice
router.delete('/:id', deleteInvoice);

export default router;

