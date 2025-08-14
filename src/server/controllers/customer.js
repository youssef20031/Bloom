import Customer from '../models/customer.js';
import Service from '../models/service.js';
import User from '../models/user.js';

// Get customer dashboard data (purchased services with details)
export const getCustomerDashboard = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Find customer by userId
    const customer = await Customer.findOne({ userId }).populate('purchasedServices.serviceId');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Get detailed service information
    const servicesWithDetails = await Promise.all(
      customer.purchasedServices.map(async (purchasedService) => {
        const service = await Service.findById(purchasedService.serviceId);
        return {
          id: purchasedService.serviceId._id,
          name: service?.name || 'Unknown Service',
          description: service?.description || '',
          type: service?.type || 'unknown',
          purchaseDate: purchasedService.purchaseDate,
          status: purchasedService.status,
          ipAddress: purchasedService.ipAddress,
          datacenterLocation: service?.hostingDetails?.datacenterLocation || 'N/A',
          vmSpecs: service?.hostingDetails?.vmSpecs || {}
        };
      })
    );

    res.json({
      customer: {
        companyName: customer.companyName,
        contactPerson: customer.contactPerson,
        phone: customer.phone,
        address: customer.address
      },
      services: servicesWithDetails
    });
  } catch (error) {
    console.error('Error fetching customer dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get specific service details
export const getServiceDetails = async (req, res) => {
  try {
    const { serviceId } = req.params;
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    
    res.json(service);
  } catch (error) {
    console.error('Error fetching service details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get customer profile information
export const getCustomerProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const customer = await Customer.findOne({ userId }).select('-purchasedServices');
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error fetching customer profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update customer profile
export const updateCustomerProfile = async (req, res) => {
  try {
    const { userId } = req.params;
    const updateData = req.body;
    
    // Remove fields that shouldn't be updated
    delete updateData.userId;
    delete updateData.purchasedServices;
    
    const customer = await Customer.findOneAndUpdate(
      { userId },
      updateData,
      { new: true, runValidators: true }
    );
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    res.json(customer);
  } catch (error) {
    console.error('Error updating customer profile:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get customer service summary
export const getCustomerServiceSummary = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const customer = await Customer.findOne({ userId });
    
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }
    
    const summary = {
      totalServices: customer.purchasedServices.length,
      activeServices: customer.purchasedServices.filter(service => service.status === 'active').length,
      expiredServices: customer.purchasedServices.filter(service => service.status === 'expired').length,
      totalSpent: 0, // This could be calculated from invoices if available
      lastPurchase: customer.purchasedServices.length > 0 
        ? Math.max(...customer.purchasedServices.map(s => new Date(s.purchaseDate)))
        : null
    };
    
    res.json(summary);
  } catch (error) {
    console.error('Error fetching customer service summary:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
