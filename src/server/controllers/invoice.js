import Invoice from '../models/invoice.js';
import PDFDocument from 'pdfkit';

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

// Generate PDF for an invoice
export const getInvoicePdf = async (req, res) => {
    try {
        const invoice = await Invoice.findById(req.params.id).populate('customerId', 'name email');
        if (!invoice) return res.status(404).json({ message: 'Invoice not found' });

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename=invoice-${invoice.invoiceNumber || invoice._id}.pdf`);

        const doc = new PDFDocument({ size: 'A4', margin: 50 });
        doc.pipe(res);

        // Header
        doc
          .fontSize(20)
          .fillColor('#1f2937')
          .text('INVOICE', { align: 'right' })
          .moveDown();

        // Company (placeholder) & Invoice meta
        doc
          .fontSize(10)
          .fillColor('#374151')
          .text('Bloom Cloud Services', { continued: true })
          .text('  •  support@bloomcloud.example')
          .moveDown(0.5);

        doc
          .fontSize(11)
          .fillColor('#111827')
          .text(`Invoice #: ${invoice.invoiceNumber}`)
          .text(`Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}`)
          .text(`Due Date: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`)
          .text(`Status: ${invoice.status}`)
          .moveDown();

        // Bill To
        doc
          .fontSize(12)
          .fillColor('#1f2937')
          .text('Bill To', { underline: true })
          .moveDown(0.3)
          .fontSize(10)
          .fillColor('#374151')
          .text(invoice.customerId?.name || 'Customer')
          .text(invoice.customerId?.email || '')
          .moveDown();

        // Table Header
        const tableTop = doc.y + 10;
        const colX = { desc: 50, qty: 330, price: 390, total: 470 };

        doc
          .fontSize(10)
          .fillColor('#111827')
          .text('Description', colX.desc, tableTop)
          .text('Qty', colX.qty, tableTop, { width: 40, align: 'right' })
          .text('Unit', colX.price, tableTop, { width: 60, align: 'right' })
          .text('Line Total', colX.total, tableTop, { width: 80, align: 'right' });

        doc.moveTo(50, tableTop + 12).lineTo(550, tableTop + 12).strokeColor('#e5e7eb').stroke();

        let y = tableTop + 20;
        const lineItems = invoice.lineItems && invoice.lineItems.length > 0 ? invoice.lineItems : [{ description: 'Service', quantity: 1, unitPrice: invoice.amount }];
        lineItems.forEach(item => {
            const qty = item.quantity || 1;
            const unit = item.unitPrice || 0;
            const lineTotal = qty * unit;
            doc
              .fontSize(10)
              .fillColor('#374151')
              .text(item.description || 'Item', colX.desc, y, { width: 260 })
              .text(qty.toString(), colX.qty, y, { width: 40, align: 'right' })
              .text(unit.toFixed(2), colX.price, y, { width: 60, align: 'right' })
              .text(lineTotal.toFixed(2), colX.total, y, { width: 80, align: 'right' });
            y += 16;
            if (y > 720) { doc.addPage(); y = 60; }
        });

        // Summary
        doc.moveDown();
        if (y > 660) { doc.addPage(); y = 60; }
        doc.moveTo(50, y + 4).lineTo(550, y + 4).strokeColor('#e5e7eb').stroke();
        y += 12;

        doc.fontSize(11).fillColor('#111827');
        const totalLabelX = 390;
        doc.text('Total:', totalLabelX, y, { width: 60, align: 'right' });
        doc.text(invoice.amount.toFixed(2), 470, y, { width: 80, align: 'right' });
        y += 20;

        // Footer
        doc.fontSize(9).fillColor('#6b7280').text('Thank you for your business!', 50, y + 20, { align: 'center', width: 500 });

        doc.end();
    } catch (error) {
        console.error('Invoice PDF generation error:', error);
        if (!res.headersSent) res.status(500).json({ message: 'Failed to generate invoice PDF' });
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