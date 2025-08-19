import express from 'express';
import bcrypt from 'bcryptjs';
import Customer from '../models/customer.js';
import SupportTicket from '../models/supportTicket.js';
import User from '../models/user.js';
import Product from '../models/product.js';

// Helper to format user response
const formatUserResponse = (user) => ({
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role
});

/* ===============================
   CUSTOMER MANAGEMENT
   =============================== */

// Get all customers
export const getCustomers = async (req, res) => {
    try {
        const customers = await Customer.find().sort({ name: 1 });
        res.json(customers);
    } catch (err) {
        console.error('Error fetching customers:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Create a new customer
export const createCustomer = async (req, res) => {
    try {
        const { name, email, hostingStatus = 'inactive' } = req.body;
        if (!name || !email) {
            return res.status(400).json({ message: 'Name and email are required' });
        }

        const exists = await Customer.findOne({ email });
        if (exists) {
            return res.status(409).json({ message: 'Email already exists' });
        }

        const newCustomer = await Customer.create({ name, email, hostingStatus });
        res.status(201).json(newCustomer);
    } catch (err) {
        console.error('Error creating customer:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update customer
export const updateCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, email, hostingStatus } = req.body;

        const customer = await Customer.findByIdAndUpdate(
            id,
            { $set: { name, email, hostingStatus } },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (err) {
        console.error('Error updating customer:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Delete customer
export const deleteCustomer = async (req, res) => {
    try {
        const { id } = req.params;
        const deleted = await Customer.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json({ message: 'Customer deleted' });
    } catch (err) {
        console.error('Error deleting customer:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Update hosting status only
export const updateHostingStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { hostingStatus } = req.body;

        const customer = await Customer.findByIdAndUpdate(
            id,
            { hostingStatus },
            { new: true }
        );

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (err) {
        console.error('Error updating hosting status:', err);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/* ===============================
   CUSTOMER PROFILES & PURCHASES
   =============================== */

export const getCustomerProfile = async (req, res) => {
    try {
        const { userId } = req.params;

        const customer = await Customer.findOne({ userId })
            .populate('userId', 'email firstName lastName')
            .populate('purchasedServices.serviceId', 'name description price');

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getAllCustomersWithPurchases = async (req, res) => {
    try {
        const customers = await Customer.find()
            .populate('purchasedProducts.productId', 'name description price type model vendor')
            .populate('userId', 'email firstName lastName')
            .sort({ companyName: 1 });

        res.json(customers);
    } catch (error) {
        console.error('Error fetching customers with purchases:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCustomerWithPurchases = async (req, res) => {
    try {
        const { customerId } = req.params;

        const customer = await Customer.findById(customerId)
            .populate('purchasedProducts.productId', 'name description price type model vendor')
            .populate('userId', 'email firstName lastName');

        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        res.json(customer);
    } catch (error) {
        console.error('Error fetching customer with purchases:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/* ===============================
   SUPPORT TICKETS
   =============================== */

export const createSupportTicket = async (req, res) => {
    try {
        const { customerId, issue, priority = 'medium' } = req.body;
        if (!customerId || !issue) {
            return res.status(400).json({ message: 'Customer ID and issue description are required' });
        }

        const customer = await Customer.findById(customerId);
        if (!customer) {
            return res.status(404).json({ message: 'Customer not found' });
        }

        const supportTicket = new SupportTicket({
            customerId,
            issue,
            priority,
            status: 'open',
            history: [{ message: `Ticket created: ${issue}`, author: customerId, timestamp: new Date() }]
        });

        await supportTicket.save();

        res.status(201).json({ message: 'Support ticket created successfully', ticket: supportTicket });
    } catch (error) {
        console.error('Error creating support ticket:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getCustomerTickets = async (req, res) => {
    try {
        const { customerId } = req.params;
        const tickets = await SupportTicket.find({ customerId })
            .populate('supportAgentId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching customer tickets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const getSupportTicket = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const ticket = await SupportTicket.findById(ticketId)
            .populate('customerId', 'companyName contactPerson')
            .populate('supportAgentId', 'firstName lastName email')
            .populate('history.author', 'firstName lastName email');

        if (!ticket) {
            return res.status(404).json({ message: 'Support ticket not found' });
        }

        res.json(ticket);
    } catch (error) {
        console.error('Error fetching support ticket:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

export const addTicketMessage = async (req, res) => {
    try {
        const { ticketId } = req.params;
        const { message, authorId } = req.body;

        if (!message || !authorId) {
            return res.status(400).json({ message: 'Message and author ID are required' });
        }

        const ticket = await SupportTicket.findById(ticketId);
        if (!ticket) {
            return res.status(404).json({ message: 'Support ticket not found' });
        }

        ticket.history.push({ message, author: authorId, timestamp: new Date() });
        await ticket.save();

        res.json({ message: 'Message added successfully', ticket });
    } catch (error) {
        console.error('Error adding message to ticket:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

/* ===============================
   AUTH (Register only)
   =============================== */

export const register = async (req, res) => {
    try {
        const { userId, name, email, password, role = 'customer' } = req.body;

        if (!userId || !name || !email || !password) {
            return res.status(400).json({ message: 'Missing fields (userId, name, email, password required)' });
        }

        // Check if customer already exists for this userId
        const exists = await Customer.findOne({ userId });
        if (exists) {
            return res.status(409).json({ message: 'Customer already registered with this user ID' });
        }

        // Make sure userId exists in User collection
        const userExists = await User.findById(userId);
        if (!userExists) {
            return res.status(404).json({ message: 'User account not found' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const customer = await Customer.create({
            userId,
            name,
            email,
            passwordHash,
            role
        });

        res.status(201).json({ user: formatUserResponse(customer) });
    } catch (err) {
        console.error('Error registering customer:', err);
        res.status(500).json({ message: 'Register failed', error: err.message });
    }
};


