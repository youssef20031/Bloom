import User from '../models/user.js';
import bcrypt from "bcryptjs";

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
    // Check if req.body exists
    if (!req.body) {
        return res.status(400).send({ error: 'Missing request body' });
    }

    const updates = Object.keys(req.body);
    const allowedUpdates = ['name', 'email', 'password', 'age']; // Add your user fields here
    const isValidOperation = updates.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
        return res.status(400).send({ error: 'Invalid updates!' });
    }

    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).send();
        }

        updates.forEach((update) => user[update] = req.body[update]);
        await user.save();

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
};// get user by email
export const getUserByEmail = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) {
      return res.status(404).send();
    }
    res.send(user);
  } catch (error) {
    res.status(500).send(error);
  }
}
// User login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    // Optionally, generate JWT token here
    res.json({
      message: "Login successful",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
