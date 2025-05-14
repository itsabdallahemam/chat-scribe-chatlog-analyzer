import { Router } from 'express';
import { signup, login, getMe, updateProfile, getAllUsers, getUserById, deleteUser } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.get('/users', authMiddleware, getAllUsers);
router.get('/users/:id', authMiddleware, getUserById);
router.delete('/users/:id', authMiddleware, deleteUser);

export default router; 