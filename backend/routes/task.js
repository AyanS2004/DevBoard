const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// User-based task routes (standalone tasks)
router.get('/user', auth, taskController.getUserTasks);
router.get('/user/counts', auth, taskController.getTaskCounts);
router.get('/user/status/:status', auth, taskController.getTasksByStatus);
router.post('/user', auth, taskController.create);
router.put('/user/:id', auth, taskController.update);
router.delete('/user/:id', auth, taskController.remove);
router.patch('/user/:id/move', auth, taskController.moveTask);

// Project-based task routes (for backward compatibility)
router.get('/projects/:id/tasks', auth, taskController.getByProject);
router.post('/projects/:id/tasks', auth, taskController.createForProject);

module.exports = router; 