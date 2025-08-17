import Hardware from '../models/hardware.js';
import HardwareAllocation from '../models/hardwareAllocation.js';
import Customer from '../models/customer.js';
import Service from '../models/service.js';

// Hardware Management
export const createHardware = async (req, res) => {
  try {
    const hardware = new Hardware(req.body);
    await hardware.save();
    res.status(201).json(hardware);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getAllHardware = async (req, res) => {
  try {
    const { status, type, location, vendor } = req.query;
    const filter = {};
    
    if (status) filter.status = status;
    if (type) filter.type = type;
    if (location) filter['location.datacenter'] = location;
    if (vendor) filter.vendor = vendor;
    
    const hardware = await Hardware.find(filter).sort({ createdAt: -1 });
    res.json(hardware);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHardwareById = async (req, res) => {
  try {
    const hardware = await Hardware.findById(req.params.id);
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware not found' });
    }
    res.json(hardware);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHardware = async (req, res) => {
  try {
    const hardware = await Hardware.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware not found' });
    }
    res.json(hardware);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deleteHardware = async (req, res) => {
  try {
    const hardware = await Hardware.findByIdAndDelete(req.params.id);
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware not found' });
    }
    res.json({ message: 'Hardware deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Hardware Allocation Management
export const allocateHardware = async (req, res) => {
  try {
    const { customerId, hardwareId, serviceId, allocationType, usageDetails, billing } = req.body;
    
    // Check if hardware is available
    const hardware = await Hardware.findById(hardwareId);
    if (!hardware) {
      return res.status(404).json({ error: 'Hardware not found' });
    }
    if (hardware.status !== 'available') {
      return res.status(400).json({ error: 'Hardware is not available for allocation' });
    }
    
    // Check if customer exists
    const customer = await Customer.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    
    // Create allocation
    const allocation = new HardwareAllocation({
      customerId,
      hardwareId,
      serviceId,
      allocationType,
      usageDetails,
      billing,
      allocatedBy: req.user?.id
    });
    
    await allocation.save();
    
    // Update hardware status
    hardware.status = 'allocated';
    await hardware.save();
    
    res.status(201).json(allocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const deallocateHardware = async (req, res) => {
  try {
    const { allocationId } = req.params;
    const { notes } = req.body;
    
    const allocation = await HardwareAllocation.findById(allocationId);
    if (!allocation) {
      return res.status(404).json({ error: 'Allocation not found' });
    }
    
    allocation.status = 'inactive';
    allocation.deallocationDate = new Date();
    allocation.deallocatedBy = req.user?.id;
    if (notes) allocation.notes = notes;
    
    await allocation.save();
    
    // Update hardware status
    const hardware = await Hardware.findById(allocation.hardwareId);
    if (hardware) {
      hardware.status = 'available';
      await hardware.save();
    }
    
    res.json(allocation);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// IT Team Queries
export const getCustomerHardwareMapping = async (req, res) => {
  try {
    const { customerId, status, hardwareType } = req.query;
    const filter = { status: 'active' };
    
    if (customerId) filter.customerId = customerId;
    if (hardwareType) filter['hardware.type'] = hardwareType;
    
    const allocations = await HardwareAllocation.find(filter)
      .populate('customerId', 'companyName contactPerson')
      .populate('hardwareId', 'name type model vendor specifications location status')
      .populate('serviceId', 'name type')
      .sort({ allocationDate: -1 });
    
    res.json(allocations);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHardwareUtilizationReport = async (req, res) => {
  try {
    const { datacenter, hardwareType } = req.query;
    const filter = {};
    
    if (datacenter) filter['location.datacenter'] = datacenter;
    if (hardwareType) filter.type = hardwareType;
    
    const hardware = await Hardware.find(filter);
    const allocations = await HardwareAllocation.find({ status: 'active' });
    
    const utilizationReport = hardware.map(hw => {
      const allocation = allocations.find(a => a.hardwareId.toString() === hw._id.toString());
      return {
        hardware: hw,
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
    
    const hardware = await Hardware.find(filter)
      .populate({
        path: '_id',
        model: 'HardwareAllocation',
        match: { status: 'active' },
        populate: [
          { path: 'customerId', model: 'Customer', select: 'companyName contactPerson' },
          { path: 'serviceId', model: 'Service', select: 'name' }
        ]
      });
    
    res.json(hardware);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHardwareByCustomer = async (req, res) => {
  try {
    const { customerId } = req.params;
    
    const allocations = await HardwareAllocation.find({ 
      customerId, 
      status: 'active' 
    })
    .populate('hardwareId', 'name type model vendor specifications location status')
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
    const filter = { status: 'available' };
    
    if (type) filter.type = type;
    if (location) filter['location.datacenter'] = location;
    
    const hardware = await Hardware.find(filter).sort({ createdAt: -1 });
    res.json(hardware);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
