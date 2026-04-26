const express = require('express');
const router = express.Router();
const { register, login, getMe, getAllUsers, toggleNotifications } = require('../controllers/authController');
const { protect, adminOnly } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.get('/users', protect, adminOnly, getAllUsers);
router.put('/notifications/toggle', protect, toggleNotifications);

module.exports = router;
