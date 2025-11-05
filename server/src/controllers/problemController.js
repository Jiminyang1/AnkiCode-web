const mongoose = require('mongoose');
const Problem = require('../models/Problem');
const ProblemDetail = require('../models/ProblemDetail');

const toISODate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().split('T')[0];
};

const toProblemDetailDto = (detail) => ({
  id: detail._id.toString(),
  problemId: detail.problem.toString(),
  notes: detail.notes ?? '',
  lastReviewed: toISODate(detail.lastReviewed),
});

const toProblemDto = (problem, detailsMap) => ({
  id: problem._id.toString(),
  leetcodeId: problem.leetcodeId,
  title: problem.title,
  difficulty: problem.difficulty,
  topic: problem.topic,
  nextReview: toISODate(problem.nextReview),
  reviewIntervalDays: problem.reviewIntervalDays,
  userId: problem.user.toString(),
  problemDetails: detailsMap?.get(problem._id.toString()) ?? [],
});

exports.listProblems = async (req, res) => {
  const userId = req.userId;

  try {
    const problems = await Problem.find({ user: userId }).sort({ nextReview: 1 }).lean();
    const problemIds = problems.map((problem) => problem._id);
    const details = await ProblemDetail.find({ problem: { $in: problemIds } }).lean();

    const detailsMap = details.reduce((acc, detail) => {
      const key = detail.problem.toString();
      const entry = acc.get(key) ?? [];
      entry.push(toProblemDetailDto(detail));
      acc.set(key, entry);
      return acc;
    }, new Map());

    res.json(problems.map((problem) => toProblemDto(problem, detailsMap)));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch problems', error);
    res.status(500).json({ message: 'Unable to fetch problems right now.' });
  }
};

exports.getProblem = async (req, res) => {
  const { problemId } = req.params;
  if (!mongoose.Types.ObjectId.isValid(problemId)) {
    res.status(404).json({ message: 'Problem not found.' });
    return;
  }

  try {
    const problem = await Problem.findById(problemId).lean();
    if (!problem) {
      res.status(404).json({ message: 'Problem not found.' });
      return;
    }

    const details = await ProblemDetail.find({ problem: problem._id }).lean();
    const detailsMap = new Map([[problem._id.toString(), details.map((detail) => toProblemDetailDto(detail))]]);

    res.json(toProblemDto(problem, detailsMap));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load problem', error);
    res.status(500).json({ message: 'Unable to load this problem.' });
  }
};

exports.createProblem = async (req, res) => {
  const userId = req.userId;
  const { leetcodeId, title, difficulty, topic, nextReview, reviewIntervalDays, notes } = req.body;

  try {
    const existing = await Problem.findOne({ user: userId, leetcodeId });
    if (existing) {
      res.status(409).json({ message: 'This problem is already in your deck.' });
      return;
    }

    const problem = await Problem.create({
      user: userId,
      leetcodeId,
      title,
      difficulty,
      topic,
      nextReview: nextReview ? new Date(nextReview) : new Date(),
      reviewIntervalDays: reviewIntervalDays ?? 1,
    });

    let detailDto = null;
    if (notes && notes.trim().length > 0) {
      const detail = await ProblemDetail.create({
        problem: problem._id,
        notes: notes.trim(),
        lastReviewed: nextReview ? new Date(nextReview) : new Date(),
      });
      detailDto = toProblemDetailDto(detail);
    }

    res.status(201).json({
      ...toProblemDto(problem, detailDto ? new Map([[problem._id.toString(), [detailDto]]]) : undefined),
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to create problem', error);
    res.status(500).json({ message: 'Unable to add problem right now.' });
  }
};

exports.updateProblem = async (req, res) => {
  const { problemId } = req.params;
  const updates = {};

  if (req.body.nextReview) {
    updates.nextReview = new Date(req.body.nextReview);
  }
  if (typeof req.body.reviewIntervalDays === 'number') {
    updates.reviewIntervalDays = req.body.reviewIntervalDays;
  }
  if (req.body.topic) {
    updates.topic = req.body.topic;
  }

  try {
    const problem = await Problem.findOneAndUpdate({ _id: problemId, user: req.userId }, updates, {
      new: true,
    }).lean();
    if (!problem) {
      res.status(404).json({ message: 'Problem not found.' });
      return;
    }

    const details = await ProblemDetail.find({ problem: problem._id }).lean();
    const detailsMap = new Map([[problem._id.toString(), details.map((detail) => toProblemDetailDto(detail))]]);
    res.json(toProblemDto(problem, detailsMap));
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to update problem', error);
    res.status(500).json({ message: 'Unable to update problem right now.' });
  }
};

exports.deleteProblem = async (req, res) => {
  const { problemId } = req.params;

  try {
    const problem = await Problem.findOne({ _id: problemId, user: req.userId });
    if (!problem) {
      res.status(404).json({ message: 'Problem not found.' });
      return;
    }

    await ProblemDetail.deleteMany({ problem: problem._id });
    await problem.deleteOne();

    res.status(204).send();
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to delete problem', error);
    res.status(500).json({ message: 'Unable to delete problem.' });
  }
};

