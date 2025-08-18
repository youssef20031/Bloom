import Product from '../models/product.js';
import ProductAllocation from '../models/productAllocation.js';
import Customer from '../models/customer.js';
import Service from '../models/service.js';

// Product Allocation Management
export const allocateProduct = async (req, res) => {
  try {
    const { customerId, productId, serviceId, allocationType, usageDetails, billing } = req.body;
    
    // Check if product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    // For hardware products, check if they're available for allocation
    if (['server', 'storage', 'network', 'gpu', 'cpu', 'memory'].includes(product.type)) {
      if (product.status !== 'available') {
        return res.status(400).json({ error: 'Product is not available for allocation' });
      }
    }
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Create allocation
    const allocation = new ProductAllocation({
      customerId,
      productId,
      serviceId,
      allocationType,
      usageDetails,
      billing,
      allocatedBy: req.user?.id
    });
    
    await allocation.save();
    
    // Update product status for hardware products
    if (['server', 'storage', 'network', 'gpu', 'cpu', 'memory'].includes(product.type)) {
      product.status = 'allocated';
      await product.save();
    }
    
    res.status(201).json(allocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deallocateProduct = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { notes } = req.body;
    
    const allocation = await ProductAllocation.findById(allocationId);
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    
    allocation.status = 'inactive';
    allocation.deallocationDate = new Date();
    allocation.deallocatedBy = req.user?.id;
    if (notes) allocation.notes = notes;
    
    await allocation.save();
    
    // Update product status for hardware products
    const product = await Product.findById(allocation.productId);
    if (product && ['server', 'storage', 'network', 'gpu', 'cpu', 'memory'].includes(product.type)) {
      product.status = 'available';
      await product.save();
    }
    
    res.json(allocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// IT Team Queries
export const getCustomerProductMapping = async (req, res) => {
  try {
    const { customerId, status, productType } = req.query;
    const filter = { status: 'active' };
    
    if (customerId) filter.customerId = customerId;
    if (productType) filter['product.type'] = productType;
    
    const allocations = await ProductAllocation.find(filter)
      .populate('customerId', 'companyName contactPerson')
      .populate('productId', 'name type model vendor specifications location status')
      .populate('serviceId', 'name type')
      .sort({ allocationDate: -1 });
    
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductUtilizationReport = async (req, res) => {
  try {
    const { datacenter, productType } = req.query;
    const filter = {};
    
    if (datacenter) filter['location.datacenter'] = datacenter;
    if (productType) filter.type = productType;
    
    // Only get hardware products for utilization report
    filter.type = { $in: ['server', 'storage', 'network', 'gpu', 'cpu', 'memory'] };
    
    const products = await Product.find(filter);
    const allocations = await ProductAllocation.find({ status: 'active' });
    
    const utilizationReport = products.map(product => {
      const allocation = allocations.find(a => a.productId.toString() === product._id.toString());
      return {
        product: product,
        allocation: allocation ? {
          customer: allocation.customerId,
          service: allocation.serviceId,
          allocationDate: allocation.allocationDate,
          usageDetails: allocation.usageDetails
        } : null,
        isAllocated: !!allocation
      };
    });
    
    res.json(utilizationReport);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMaintenanceSchedule = async (req, res) => {
  try {
    const { upcoming, overdue } = req.query;
    const now = new Date();
    let filter = {};
    
    if (upcoming === 'true') {
      filter.nextMaintenance = { $gte: now, $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) };
    } else if (overdue === 'true') {
      filter.nextMaintenance = { $lt: now };
    }
    
    // Only get hardware products for maintenance
    filter.type = { $in: ['server', 'storage', 'network', 'gpu', 'cpu', 'memory'] };
    
    const products = await Product.find(filter)
      .populate({
        path: '_id',
        model: 'ProductAllocation',
        match: { status: 'active' },
        populate: [
          { path: 'customerId', model: 'Customer', select: 'companyName contactPerson' },
          { path: 'serviceId', model: 'Service', select: 'name' }
        ]
      });
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProductsByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const allocations = await ProductAllocation.find({ 
      customerId, 
      status: 'active' 
    })
    .populate('productId', 'name type model vendor specifications location status')
    .populate('serviceId', 'name type')
    .sort({ allocationDate: -1 });
    
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAvailableHardware = async (req, res) => {
  try {
    const { type, location } = req.query;
    const filter = { 
      status: 'available',
      type: { $in: ['server', 'storage', 'network', 'gpu', 'cpu', 'memory'] }
    };
    
    if (type) filter.type = type;
    if (location) filter['location.datacenter'] = location;
    
    const products = await Product.find(filter).sort({ createdAt: -1 });
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Enhanced Product Management for Hardware
export const createHardwareProduct = async (req, res) => {
  try {
    const product = new Product(req.body);
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const updateHardwareStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status, notes, nextMaintenance } = req.body;
    
    const product = await Product.findByIdAndUpdate(
      productId,
      { status, notes, nextMaintenance },
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
