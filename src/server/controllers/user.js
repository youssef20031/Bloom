import User from '../models/user.js';

// Create a new user
export const createUser = async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    res.status(201).send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});
    res.send(users);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Get a single user by id
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};

// Update a user by id
export const updateUser = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(400).send(error);
  }
};

// Delete a user by id
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
};
// Get users by the role 
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;

    // Validate role
    const allowedRoles = ['customer', 'admin', 'presales', 'support', 'it'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ message: `Invalid role: ${role}` });
    }

    const users = await User.find({ role });

    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Search for users
export const searchUsers = async (req, res) => {
  try {
    const  query  = req.query.name;
    if (!query) return res.status(400).json({ message: "Query is required" });

    const users = await User.find({
      name: { $regex: query, $options: "i" } // case-insensitive search
    });

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};