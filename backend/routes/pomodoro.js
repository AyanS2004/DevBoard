const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const pomodoroController = require('../controllers/pomodoroController');

router.get('/', auth, pomodoroController.getAll);
router.post('/', auth, pomodoroController.create);

module.exports = router; 