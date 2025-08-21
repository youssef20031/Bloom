import Service from '../models/service.js';
import Product from '../models/product.js';

export const createService = async (req, res) => {
  try {
    const { associatedProducts = [] } = req.body;

    if (associatedProducts.length > 0) {
      // Count how many times each product appears
      const productCounts = associatedProducts.reduce((acc, id) => {
        acc[id] = (acc[id] || 0) + 1;
        return acc;
      }, {});

      // Fetch all unique products
      const products = await Product.find({
        _id: { $in: Object.keys(productCounts) }
      });

      if (products.length !== Object.keys(productCounts).length) {
        return res.status(400).json({ message: "One or more products do not exist" });
      }

      // Check stock availability per product
      for (const product of products) {
        const requiredQty = productCounts[product._id.toString()];
        if (product.stock < requiredQty) {
          return res.status(400).json({
            message: `Not enough stock for ${product.name}. Required: ${requiredQty}, Available: ${product.stock}`
          });
        }
      }

      // Deduct stock
      for (const product of products) {
        const requiredQty = productCounts[product._id.toString()];
        await Product.findByIdAndUpdate(product._id, {
          $inc: { stock: -requiredQty }
        });
      }
    }

    // Create the service
    const service = new Service(req.body);
    await service.save();

    res.status(201).json(service);
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
};
// Get All Services
export const getAllServices = async (req, res) => {
  try {
    const services = await Service.find({});
    res.send(services);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get Service By ID
export const getServiceById = async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).send();
    }
    res.send(service);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update Service
export const updateService = async (req, res) => {
  try {
    const service = await Service.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!service) {
      return res.status(404).send();
    }
    res.send(service);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Delete Service
export const deleteService = async (req, res) => {
  try {
    const service = await Service.findByIdAndDelete(req.params.id);
    if (!service) {
      return res.status(404).send();
    }
    res.send(service);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Search Services
export const searchServices = async (req, res) => {
  try {
    const  query  = req.query.name;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const services = await Service.find({
      name: { $regex: query, $options: "i" }
    });

    res.json(services);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
