const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Driver = require('../models/Driver');
const logger = require('../utils/logger');
const { OAuth2Client } = require('google-auth-library');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });
const generateRefreshToken = (id) => jwt.sign({ id }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, { expiresIn: '30d' });

const sendTokenResponse = (user, statusCode, res, message = 'Success') => {
  const token = generateToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  const userObj = user.toObject ? user.toObject() : user;
  delete userObj.password;
  delete userObj.refreshToken;

  res.status(statusCode).json({
    success: true,
    message,
    token,
    refreshToken,
    user: userObj
  });
};

exports.register = async (req, res) => {
  try {
    const { name, email, phone, password, role, referralCode } = req.body;

    const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: existingUser.email === email ? 'Email already registered' : 'Phone number already registered'
      });
    }

    let referredBy = null;
    if (referralCode) {
      const referrer = await User.findOne({ referralCode });
      if (referrer) referredBy = referrer._id;
    }

    const user = await User.create({ name, email, phone, password, role: role === 'driver' ? 'driver' : 'user', referredBy });

    logger.info(`New user registered: ${user.email}`);
    sendTokenResponse(user, 201, res, 'Registration successful');
  } catch (error) {
    logger.error(`Registration error: ${error.message}`);
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Email or phone already exists' });
    }
    res.status(500).json({ success: false, message: 'Registration failed', error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, phone, password } = req.body;

    if ((!email && !phone) || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email/phone and password' });
    }

    const query = email ? { email } : { phone };
    const user = await User.findOne(query).select('+password');

    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account is deactivated. Contact support.' });
    }

    user.lastLogin = Date.now();
    await user.save({ validateBeforeSave: false });

    logger.info(`User logged in: ${user.email}`);
    sendTokenResponse(user, 200, res, 'Login successful');
  } catch (error) {
    logger.error(`Login error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    let driverProfile = null;
    if (user.role === 'driver') {
      driverProfile = await Driver.findOne({ user: user._id });
    }
    res.status(200).json({ success: true, user, driverProfile });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { name, phone, avatar } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (avatar) updates.avatar = avatar;

    const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true, runValidators: true });
    res.status(200).json({ success: true, message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    if (!(await user.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    user.password = newPassword;
    await user.save();

    sendTokenResponse(user, 200, res, 'Password changed successfully');
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ success: false, message: 'Refresh token required' });

    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) return res.status(401).json({ success: false, message: 'User not found' });

    const newToken = generateToken(user._id);
    res.status(200).json({ success: true, token: newToken });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Invalid refresh token' });
  }
};

exports.logout = async (req, res) => {
  res.status(200).json({ success: true, message: 'Logged out successfully' });
};

exports.googleAuth = async (req, res) => {
  try {
    const { accessToken, role } = req.body;
    
    if (!accessToken) {
      return res.status(400).json({ success: false, message: 'Google access token required' });
    }

    const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    
    if (!response.ok) {
      return res.status(401).json({ success: false, message: 'Invalid Google access token' });
    }
    
    const payload = await response.json();
    const { email, name, picture } = payload;
    
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email not provided by Google' });
    }
    
    let user = await User.findOne({ email });
    
    if (!user) {
      user = await User.create({
        name,
        email,
        avatar: picture,
        role: role === 'driver' ? 'driver' : 'user',
        isGoogleAuth: true,
        isActive: true,
        isVerified: true
      });
      logger.info(`New user registered via Google: ${user.email}`);
    } else {
      user.lastLogin = Date.now();
      await user.save({ validateBeforeSave: false });
      logger.info(`User logged in via Google: ${user.email}`);
    }

    sendTokenResponse(user, user.isNew ? 201 : 200, res, 'Google Login successful');
  } catch (error) {
    logger.error(`Google Auth error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Google Authentication failed', error: error.message });
  }
};
