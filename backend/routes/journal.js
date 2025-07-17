const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const journalController = require('../controllers/journalController');

router.get('/', auth, journalController.getAll);
router.post('/', auth, journalController.create);
router.put('/:id', auth, journalController.update);
router.delete('/:id', auth, journalController.remove);

module.exports = router; 