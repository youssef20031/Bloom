import express from 'express';
import * as productController from '../controllers/product.js';

const router = express.Router();

// Create a new product
router.post('/', productController.createProduct);

// Get all products
router.get('/', productController.getAllProducts);
//Search for a product by its name 
router.get('/search', productController.searchProducts);
// Get a single product by ID
router.get('/:id', productController.getProductById);

// Update a product by ID
router.put('/:id', productController.updateProduct);

// Delete a product by ID
router.delete('/:id', productController.deleteProduct);


export default router;
