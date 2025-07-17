const mongoose = require('mongoose');

const SubtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  done: { type: Boolean, default: false },
});

const TaskSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' }, // Optional - can be standalone
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['todo', 'inProgress', 'done'], default: 'todo' },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
  dueDate: { type: Date },
  completedAt: { type: Date },
  subtasks: [SubtaskSchema],
  comments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Comment' }],
  tags: [{ type: String }],
  category: { type: String, default: 'General' },
  estimatedTime: { type: Number }, // in minutes
  actualTime: { type: Number }, // in minutes
}, { timestamps: true });

// Index for better query performance
TaskSchema.index({ user: 1, status: 1 });
TaskSchema.index({ user: 1, createdAt: -1 });

module.exports = mongoose.model('Task', TaskSchema); 