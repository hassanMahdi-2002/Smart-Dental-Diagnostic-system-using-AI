const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post(
  '/register', 
  authController.registerValidation, 
  authController.register
);

router.post(
  '/login', 
  authController.loginValidation, 
  authController.login
);

router.route('/profile')
  .get(protect, authController.getProfile)      // عرض بيانات المستخدم
  .patch(protect, authController.updateProfile); // تحديث بيانات المستخدم

module.exports = router;