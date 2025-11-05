const mongoose = require('mongoose');

const problemDetailSchema = new mongoose.Schema(
  {
    problem: { type: mongoose.Schema.Types.ObjectId, ref: 'Problem', required: true, index: true },
    notes: { type: String, default: '' },
    lastReviewed: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const ProblemDetail = mongoose.model('ProblemDetail', problemDetailSchema);

module.exports = ProblemDetail;

