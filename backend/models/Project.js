const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  tags: [{ type: String }],
  color: { type: String },
  deadline: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema); 