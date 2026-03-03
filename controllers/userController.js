const userService = require('../services/userService');

const getUsers = async (req, res) => {
    const users = await userService.getAllUsers();
    res.json(users);
};

const getUser = async (req, res) => {
    const user = await userService.getUserById(req.params.id);
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
};

const createUser = async (req, res) => {
    const { name, email, role } = req.body;
    if (!name || !email) {
        return res.status(400).json({ error: 'Name and email are required' });
    }
    const newUser = await userService.createUser({ name, email, role });
    res.status(201).json(newUser);
};

const updateUser = async (req, res) => {
    const updatedUser = await userService.updateUser(req.params.id, req.body);
    if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser);
};

const deleteUser = async (req, res) => {
    const deletedUser = await userService.deleteUser(req.params.id);
    if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'User deleted successfully' });
};

module.exports = {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser
};
