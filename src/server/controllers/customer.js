import express from 'express';
import Customer from '../models/customer.js';
import SupportTicket from '../models/supportTicket.js';
import User from '../models/user.js';
import Product from '../models/product.js';

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

// Create a new support ticket
export const createSupportTicket = async (req, res) => {
  try {
    const { customerId, issue, priority = 'medium' } = req.body;
    
    // Validate required fields
    if (!customerId || !issue) {
      return res.status(400).json({ 
        message: 'Customer ID and issue description are required' 
      });
    }
    
    // Verify customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    // Create support ticket
    const supportTicket = new SupportTicket({
      customerId,
      issue,
      priority,
      status: 'open',
      history: [{
        message: `Ticket created: ${issue}`,
        author: customerId,
        timestamp: new Date()
      }]
    });
    
    await supportTicket.save();
    
    res.status(201).json({
      message: 'Support ticket created successfully',
      ticket: supportTicket
    });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

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

// Get specific support ticket
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

// Add message to support ticket
export const addTicketMessage = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const { message, authorId } = req.body;
    
    if (!message || !authorId) {
      return res.status(400).json({ 
        message: 'Message and author ID are required' 
      });
    }
    
    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Support ticket not found' });
    }
    
    ticket.history.push({
      message,
      author: authorId,
      timestamp: new Date()
    });
    
    await ticket.save();
    
    res.json({
      message: 'Message added successfully',
      ticket
    });
  } catch (error) {
    console.error('Error adding message to ticket:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};


