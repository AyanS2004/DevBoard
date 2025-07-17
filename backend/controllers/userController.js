const User = require('../models/User');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.toggleTheme = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    user.darkMode = !user.darkMode;
    await user.save();
    res.json({ darkMode: user.darkMode });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 