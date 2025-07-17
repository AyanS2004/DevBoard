const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const projectController = require('../controllers/projectController');

router.get('/', auth, projectController.getAll);
router.post('/', auth, projectController.create);
router.get('/:id', auth, projectController.getOne);
router.put('/:id', auth, projectController.update);
router.delete('/:id', auth, projectController.remove);

module.exports = router; 