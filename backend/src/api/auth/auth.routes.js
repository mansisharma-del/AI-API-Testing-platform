import express from 'express';
import { register, login, getMe } from './auth.controller.js';
import { authMiddleware } from '../../core/middlewares/auth.middleware.js';
import config from '../../core/config/index.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);

export default router;