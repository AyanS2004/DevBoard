const Pomodoro = require('../models/Pomodoro');

exports.getAll = async (req, res) => {
  try {
    const sessions = await Pomodoro.find({ user: req.user.id });
    res.json(sessions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const session = await Pomodoro.create({ ...req.body, user: req.user.id });
    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 