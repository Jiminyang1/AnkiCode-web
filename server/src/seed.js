const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const Problem = require('./models/Problem');
const ProblemDetail = require('./models/ProblemDetail');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('Missing MONGODB_URI. Set it before running the seed script.');
  process.exit(1);
}

const seed = async () => {
  await mongoose.connect(MONGODB_URI);

  const demoEmail = 'demo@ankicode.dev';
  const demoPassword = 'ankicode';

  let user = await User.findOne({ email: demoEmail });
  if (!user) {
    user = await User.create({
      name: 'Demo Learner',
      email: demoEmail,
      password: demoPassword,
    });
    console.log('Created demo user:', demoEmail);
  } else {
    console.log('Demo user already exists. Skipping user creation.');
  }

  const existingProblems = await Problem.countDocuments({ user: user._id });
  if (existingProblems === 0) {
    const problems = await Problem.insertMany([
      {
        user: user._id,
        leetcodeId: 1,
        title: 'Two Sum',
        difficulty: 'Easy',
        topic: 'Arrays',
        nextReview: new Date('2025-11-07'),
        reviewIntervalDays: 2,
      },
      {
        user: user._id,
        leetcodeId: 102,
        title: 'Binary Tree Level Order Traversal',
        difficulty: 'Medium',
        topic: 'Trees',
        nextReview: new Date('2025-11-06'),
        reviewIntervalDays: 2,
      },
    ]);

    await ProblemDetail.insertMany([
      {
        problem: problems[0]._id,
        notes: '',
        lastReviewed: new Date('2025-11-05'),
      },
      {
        problem: problems[1]._id,
        notes: 'Practice iterative BFS with queue to track levels.',
        lastReviewed: new Date('2025-11-03'),
      },
    ]);

    console.log('Seeded sample problems.');
  } else {
    console.log('User already has problems. Skipping problem seed.');
  }

  await mongoose.disconnect();
};

seed()
  .then(() => {
    console.log('Seeding completed.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Seeding failed', error);
    process.exit(1);
  });

