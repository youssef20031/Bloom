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

// get user by email
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