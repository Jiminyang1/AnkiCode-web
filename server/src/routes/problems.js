const express = require('express');
const problemController = require('../controllers/problemController');
const requireAuth = require('../middleware/auth');

const router = express.Router();

router.use(requireAuth);

router.get('/', problemController.listProblems);
router.get('/:problemId', problemController.getProblem);
router.post('/', problemController.createProblem);
router.patch('/:problemId', problemController.updateProblem);
router.delete('/:problemId', problemController.deleteProblem);

module.exports = router;

