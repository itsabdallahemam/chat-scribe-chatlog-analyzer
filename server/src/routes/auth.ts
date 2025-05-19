import { Router } from 'express';
import { signup, login, getMe, updateProfile, getAllUsers, getUserById, deleteUser, changePassword, getTeamAgents } from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);
router.put('/change-password', authMiddleware, changePassword);
router.get('/users', authMiddleware, getAllUsers);
router.get('/users/:id', authMiddleware, getUserById);
router.delete('/users/:id', authMiddleware, deleteUser);
router.get('/team/agents', authMiddleware, getTeamAgents);

export default router;