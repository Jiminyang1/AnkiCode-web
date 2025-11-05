const mongoose = require('mongoose');
const ProblemDetail = require('../models/ProblemDetail');
const Problem = require('../models/Problem');

const toISODate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

const toDto = (detail) => ({
  id: detail._id.toString(),
  problemId: detail.problem.toString(),
  notes: detail.notes ?? '',
  lastReviewed: toISODate(detail.lastReviewed),
});

exports.createDetail = async (req, res) => {
  const { problemId, notes, lastReviewed } = req.body;
  if (!problemId || !mongoose.Types.ObjectId.isValid(problemId)) {
    res.status(400).json({ message: 'Valid problemId is required.' });
    return;
  }

  try {
    const problem = await Problem.findOne({ _id: problemId, user: req.userId });
    if (!problem) {
      res.status(404).json({ message: 'Problem not found.' });
      return;
    }

    const detail = await ProblemDetail.create({
      problem: problem._id,
      notes: notes ?? '',
      lastReviewed: lastReviewed ? new Date(lastReviewed) : new Date(),
    });

    res.status(201).json(toDto(detail));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create problem detail', error);
    res.status(500).json({ message: 'Unable to create notes.' });
  }
};

exports.updateDetail = async (req, res) => {
  const { detailId } = req.params;

  try {
    const detail = await ProblemDetail.findById(detailId);
    if (!detail) {
      res.status(404).json({ message: 'Problem detail not found.' });
      return;
    }

    const problem = await Problem.findOne({ _id: detail.problem, user: req.userId });
    if (!problem) {
      res.status(403).json({ message: 'Not allowed to update this note.' });
      return;
    }

    if (typeof req.body.notes === 'string') {
      detail.notes = req.body.notes;
    }
    if (req.body.lastReviewed) {
      detail.lastReviewed = new Date(req.body.lastReviewed);
    }

    await detail.save();
    res.json(toDto(detail));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update problem detail', error);
    res.status(500).json({ message: 'Unable to update notes.' });
  }
};

exports.deleteDetail = async (req, res) => {
  const { detailId } = req.params;

  try {
    const detail = await ProblemDetail.findById(detailId);
    if (!detail) {
      res.status(404).json({ message: 'Problem detail not found.' });
      return;
    }

    const problem = await Problem.findOne({ _id: detail.problem, user: req.userId });
    if (!problem) {
      res.status(403).json({ message: 'Not allowed to delete this note.' });
      return;
    }

    await detail.deleteOne();
    res.status(204).send();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to delete problem detail', error);
    res.status(500).json({ message: 'Unable to delete notes right now.' });
  }
};

