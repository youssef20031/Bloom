import express from 'express';
import bcrypt from 'bcryptjs';
import Customer from '../models/customer.js';
import SupportTicket from '../models/supportTicket.js';
import User from '../models/user.js';
import Product from '../models/product.js';
import LoginAttempt from '../models/LoginAttempt.js';
import { sendAlertEmail } from '../utils/alertService.js';

// Helper to format user response
const formatUserResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role
});

// Get customer profile by userId
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

// Get all customers with their purchased products
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

// Get specific customer with their purchased products
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

// Create support ticket moved to dedicated support ticket controller

// Get customer's support tickets
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

// Get specific support ticket moved to dedicated support ticket controller

// Add message moved to dedicated support ticket controller


export const signupCustomer = async (req, res) => {
  try {
    const { name, email, password, companyName, contactPerson, phone, address,  } = req.body;

    // 1. Create the user
    const user = new User({
      name,
      email,
      password, // TODO: hash before saving
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


// Register a new customer
export const register = async (req, res) => {
  try {
    const { name, email, password, role = 'customer' } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Missing fields' });
    }

    const exists = await Customer.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await Customer.create({ name, email, passwordHash, role });

    res.status(201).json({ user: formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ message: 'Register failed', error: err.message });
  }
};

// Login customer
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const forwarded = req.headers['x-forwarded-for'];
    const ip = Array.isArray(forwarded)
      ? forwarded[0]
      : (forwarded?.split(',')[0] || req.socket.remoteAddress);

    const user = await Customer.findOne({ email });
    if (!user) {
      await LoginAttempt.create({ email, ipAddress: ip, success: false });
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      await LoginAttempt.create({ email, ipAddress: ip, success: false });

      const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
      const attempts = await LoginAttempt.countDocuments({
        email,
        success: false,
        createdAt: { $gte: fifteenMinsAgo }
      });

      if (attempts >= 5) {
        await sendAlertEmail({ email, ip, count: attempts });
      }

      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await LoginAttempt.create({ email, ipAddress: ip, success: true });

    res.json({ user: formatUserResponse(user) });
  } catch (err) {
    res.status(500).json({ message: 'Login failed', error: err.message });
  }
};
