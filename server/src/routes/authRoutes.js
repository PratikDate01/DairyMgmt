import express from 'express';
import { checkEmail, register, requestOTP, verifyOTP, getMe } from '../controllers/authController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/check-email', checkEmail);
router.post('/register', register);
router.post('/request-otp', requestOTP);
router.post('/verify-otp', verifyOTP);
router.get('/me', authMiddleware, getMe);

export default router;
