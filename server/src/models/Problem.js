const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    leetcodeId: { type: Number, required: true },
    title: { type: String, required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    topic: { type: String, required: true },
    nextReview: { type: Date, required: true },
    reviewIntervalDays: { type: Number, default: 1, min: 1 },
  },
  { timestamps: true },
);

problemSchema.index({ user: 1, leetcodeId: 1 }, { unique: true });

const Problem = mongoose.model('Problem', problemSchema);

module.exports = Problem;

