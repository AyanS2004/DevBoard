const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const commentController = require('../controllers/commentController');

router.post('/tasks/:id/comments', auth, commentController.add);
router.get('/tasks/:id/comments', auth, commentController.getByTask);

module.exports = router; 