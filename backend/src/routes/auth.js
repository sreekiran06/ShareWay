// routes/auth.js
const express = require('express');
const router = express.Router();
const { register, login, getMe, updateProfile, changePassword, refreshToken, logout, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/google', googleAuth);

module.exports = router;
