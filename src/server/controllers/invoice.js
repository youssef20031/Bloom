import Invoice from '../models/invoice.js';

// Get all invoices
export const getAllInvoices = async (req, res) => {
    try {
        const invoices = await Invoice.find().populate('customerId', 'name email');
        res.status(200).json(invoices);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Get a single invoice by ID
export const getInvoiceById = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('customerId', 'name email');
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.status(200).json(invoice);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Create a new invoice
export const createInvoice = async (req, res) => {
    const invoice = new Invoice(req.body);
    try {
        const newInvoice = await invoice.save();
        res.status(201).json(newInvoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Update an existing invoice
export const updateInvoice = async (req, res) => {
    try {
        const updatedInvoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
        if (!updatedInvoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.status(200).json(updatedInvoice);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Delete an invoice
export const deleteInvoice = async (req, res) => {
    try {
        const invoice = await Invoice.findByIdAndDelete(req.params.id);
        if (!invoice) {
            return res.status(404).json({ message: 'Invoice not found' });
        }
        res.status(200).json({ message: 'Invoice deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};