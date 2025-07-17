const Task = require('../models/Task');
const aiService = require('../services/aiService');

// Get all tasks for a user
exports.getUserTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ user: req.user.id })
      .sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get tasks by status for a user
exports.getTasksByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const tasks = await Task.find({ 
      user: req.user.id, 
      status: status 
    }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get task counts by status for a user
exports.getTaskCounts = async (req, res) => {
  try {
    const [todo, inProgress, done] = await Promise.all([
      Task.countDocuments({ user: req.user.id, status: 'todo' }),
      Task.countDocuments({ user: req.user.id, status: 'inProgress' }),
      Task.countDocuments({ user: req.user.id, status: 'done' })
    ]);
    
    res.json({
      todo,
      inProgress,
      done,
      total: todo + inProgress + done
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create a new task
exports.create = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      user: req.user.id
    };
    
    // Set completedAt if status is 'done' and not already set
    if (taskData.status === 'done' && !taskData.completedAt) {
      taskData.completedAt = new Date();
    }
    
    // Apply AI suggestions if not provided
    if (!taskData.category) {
      const categorization = aiService.categorizeTask(taskData.title, taskData.description);
      taskData.category = categorization.category;
    }
    
    if (!taskData.priority) {
      taskData.priority = aiService.suggestPriority(taskData.title, taskData.description, taskData.dueDate);
    }
    
    if (!taskData.estimatedTime) {
      const timeEstimate = aiService.estimateTaskTime(taskData.title, taskData.description, taskData.category);
      taskData.estimatedTime = timeEstimate.minutes;
    }
    
    const task = await Task.create(taskData);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update a task
exports.update = async (req, res) => {
  try {
    // Fetch the current task
    const currentTask = await Task.findOne({ _id: req.params.id, user: req.user.id });
    if (!currentTask) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Determine if status is being changed
    let updates = { ...req.body };
    if (updates.status) {
      if (updates.status === 'done' && (!currentTask.completedAt || !updates.completedAt)) {
        updates.completedAt = new Date();
      } else if (currentTask.status === 'done' && updates.status !== 'done') {
        updates.completedAt = null;
      }
    }

    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      updates,
      { new: true }
    );
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Delete a task
exports.remove = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.user.id 
    });
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Move task to different status
exports.moveTask = async (req, res) => {
  try {
    const { status } = req.body;
    const task = await Task.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { 
        status,
        completedAt: status === 'done' ? new Date() : null
      },
      { new: true }
    );
    
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    res.json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get tasks by project (for backward compatibility)
exports.getByProject = async (req, res) => {
  try {
    const tasks = await Task.find({ 
      project: req.params.id, 
      user: req.user.id 
    }).sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Create task for a project
exports.createForProject = async (req, res) => {
  try {
    const taskData = {
      ...req.body,
      user: req.user.id,
      project: req.params.id
    };
    // Set completedAt if status is 'done' and not already set
    if (taskData.status === 'done' && !taskData.completedAt) {
      taskData.completedAt = new Date();
    }
    const task = await Task.create(taskData);
    res.status(201).json(task);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 