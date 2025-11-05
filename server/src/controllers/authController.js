const jwt = require('jsonwebtoken');
const User = require('../models/User');

const sanitizeUser = (user) => ({
  id: user._id.toString(),
  name: user.name,
  email: user.email,
});

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ message: 'Email and password are required.' });
    return;
  }

  try {
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const isValid = await user.comparePassword(password);
    if (!isValid) {
      res.status(401).json({ message: 'Invalid credentials.' });
      return;
    }

    const token = jwt.sign({ userId: user._id.toString() }, process.env.JWT_SECRET || 'ankicode_dev_secret', {
      expiresIn: '7d',
    });

    res.json({ user: sanitizeUser(user), token });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Login failed', error);
    res.status(500).json({ message: 'Unable to login right now.' });
  }
};

exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      res.status(404).json({ message: 'User not found.' });
      return;
    }

    res.json({ user: sanitizeUser(user) });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to fetch current user', error);
    res.status(500).json({ message: 'Unable to load user.' });
  }
};

