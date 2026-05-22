import express from 'express';
import jwt from 'jsonwebtoken';
import { dbService } from '../services/db.service.js';
import { User } from '../models/User.js';
import { protect } from '../middleware/auth.js';
import bcrypt from 'bcryptjs';

const router = express.Router();

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'super_secret_lab_key_12345', {
    expiresIn: '30d'
  });
};

// Register User
router.post('/register', async (req, res) => {
  const { name, email, password, role, department, semester, phone } = req.body;
  try {
    const userExists = await dbService.findOne('User', { email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    let hashedPassword = password;
    if (global.isMockDB) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }

    const user = await dbService.create('User', {
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      status: 'active'
    });

    if (user.role === 'student') {
      await dbService.create('Student', {
        user: user._id,
        rollNumber: `ROLL-${Math.floor(100000 + Math.random() * 900000)}`,
        department: department || 'General Science',
        semester: semester || 1,
        phone: phone || '',
        attendancePercentage: 100,
        assignedEquipment: []
      });
    }

    res.status(201).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login User
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await dbService.findOne('User', { email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    let isMatch = false;
    if (global.isMockDB) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      const userInstance = await User.findById(user._id);
      isMatch = await userInstance.comparePassword(password);
    }

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password.' });
    }

    res.status(200).json({
      success: true,
      token: generateToken(user._id),
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Forgot Password
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  try {
    const user = await dbService.findOne('User', { email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No user registered with this email address.' });
    }

    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    await dbService.findByIdAndUpdate('User', user._id, {
      resetPasswordToken: resetToken,
      resetPasswordExpires: Date.now() + 3600000 // 1 hour
    });

    res.status(200).json({
      success: true,
      message: 'Password reset link generated.',
      resetLink: `/reset-password/${resetToken}`
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Reset Password
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;
  try {
    const user = await dbService.findOne('User', { resetPasswordToken: token });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    await dbService.findByIdAndUpdate('User', user._id, {
      password: hashedPassword,
      resetPasswordToken: null,
      resetPasswordExpires: null
    });

    res.status(200).json({ success: true, message: 'Password has been reset successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Current User Session
router.get('/me', protect, async (req, res) => {
  res.status(200).json({
    success: true,
    user: { id: req.user._id, name: req.user.name, email: req.user.email, role: req.user.role }
  });
});

export default router;
