const Comment = require('../models/Comment');

exports.add = async (req, res) => {
  try {
    const comment = await Comment.create({
      task: req.params.id,
      user: req.user.id,
      text: req.body.text
    });
    res.status(201).json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getByTask = async (req, res) => {
  try {
    const comments = await Comment.find({ task: req.params.id }).populate('user', 'name email');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 