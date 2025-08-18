import express from 'express';
import * as userController from '../controllers/user.js';

const router = express.Router();

// Create a new user
router.post('/', userController.createUser);

// Get all users
router.get('/', userController.getAllUsers);
//Search for a User by its name 
router.get('/search', userController.searchUsers);
// Get all users by role (for a admin)
router.get('/role/:role', userController.getUsersByRole);

// Get a single user by id
router.get('/:id', userController.getUserById);

// Update a user by id
router.put('/:id', userController.updateUser);

// Delete a user by id
router.delete('/:id', userController.deleteUser);

// Get user by email
router.get('/email/:email', userController.getUserByEmail);

export default router;

