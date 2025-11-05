const express = require('express');
const detailController = require('../controllers/problemDetailController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.post('/', detailController.createDetail);
router.patch('/:detailId', detailController.updateDetail);
router.delete('/:detailId', detailController.deleteDetail);

module.exports = router;

