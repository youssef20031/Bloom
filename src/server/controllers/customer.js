import express from 'express';
import bcrypt from 'bcryptjs';
import Customer from '../models/customer.js';
import SupportTicket from '../models/supportTicket.js';
import User from '../models/user.js';
import Product from '../models/product.js';
import Service from '../models/service.js'; // Import Service model
import mongoose from 'mongoose';

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
    const customers = await Customer.find()
      .populate("purchasedServices.serviceId", "name")  // only bring back 'name' field
      .populate("purchasedProducts.productId", "name"); // same for products

    res.json(customers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new customer
export const createCustomer = async (req, res) => {
    try {
        const { userId, companyName, contactPerson, phone, address } = req.body;
        if (!userId || !companyName || !contactPerson) {
            return res.status(400).json({ message: 'userId, companyName, and contactPerson are required' });
        }
        const exists = await Customer.findOne({ userId });
        if (exists) {
            return res.status(409).json({ message: 'Customer already exists for this userId' });
        }
        const newCustomer = await Customer.create({ userId, companyName, contactPerson, phone, address });
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
        const { companyName, contactPerson, phone, address } = req.body;
        const customer = await Customer.findByIdAndUpdate(
            id,
            { $set: { companyName, contactPerson, phone, address } },
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
        res.json({ hostingStatus: customer.hostingStatus });
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
        let queryUserId = userId;
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            const firstCustomer = await Customer.findOne();
            if (!firstCustomer) return res.status(404).json({ message: 'Customer not found' });
            queryUserId = firstCustomer.userId;
        }
        const customer = await Customer.findOne({ userId: queryUserId })
            .populate('userId', 'email firstName lastName')
            .populate('purchasedServices.serviceId', 'name description price')
            .populate('purchasedProducts.productId', 'name description price type model vendor'); // Populate purchased products

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

// Add a new service to a customer
export const addServiceToCustomer = async (req, res) => {
  try {
    const { customerId, serviceId, ipAddress } = req.body;

    // check that customer and service exist
    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const service = await Service.findById(serviceId);
    if (!service) return res.status(404).json({ message: "Service not found" });

    // push new service purchase into purchasedServices
    customer.purchasedServices.push({
      serviceId,
      purchaseDate: new Date(),
      status: "active",
      ipAddress
    });

    await customer.save();

    res.status(200).json({ message: "Service added to customer", customer });
  } catch (error) {
    console.error("Error adding service to customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Add a new product to a customer
export const addProductToCustomer = async (req, res) => {
  try {
    const { customerId, productId, quantity } = req.body;

    const customer = await Customer.findById(customerId);
    if (!customer) return res.status(404).json({ message: "Customer not found" });

    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ message: "Product not found" });

    customer.purchasedProducts.push({
      productId,
      purchaseDate: new Date(),
      status: "active",
      quantity: quantity || 1
    });

    await customer.save();

    res.status(200).json({ message: "Product added to customer", customer });
  } catch (error) {
    console.error("Error adding product to customer:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Create support ticket moved to dedicated support ticket controller

export const getCustomerTickets = async (req, res) => {
    try {
        const { customerId } = req.params;
        let queryCustomerId = customerId;
        if (!mongoose.Types.ObjectId.isValid(customerId)) {
            const firstCustomer = await Customer.findOne();
            if (!firstCustomer) return res.status(404).json({ message: 'Customer not found' });
            queryCustomerId = firstCustomer._id;
        }
        const tickets = await SupportTicket.find({ customerId: queryCustomerId })
            .populate('supportAgentId', 'firstName lastName email')
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (error) {
        console.error('Error fetching customer tickets:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};

// Get specific support ticket moved to dedicated support ticket controller

// Add message moved to dedicated support ticket controller


export const signupCustomer = async (req, res) => {
  try {
    const { name, email, password, companyName, contactPerson, phone, address } = req.body;

    // 1. Create the user
    const hashed = await bcrypt.hash(password, 10);
    const user = new User({
      name,
      email,
      password: hashed,
      role: 'customer'
    });
    await user.save();

    // 2. Create the customer linked to the user
    const customer = new Customer({
      userId: user._id,
      companyName,
      contactPerson,
      phone,
      address
    });
    await customer.save();

    res.status(201).json({
      message: 'Customer registered successfully',
      user,
      customer
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
