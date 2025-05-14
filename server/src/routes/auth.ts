import { Router } from 'express';
import { 
  signup, 
  login, 
  getMe, 
  updateProfile, 
  getTeamMembers, 
  assignAgentToTeamLeader 
} from '../controllers/authController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public routes
router.post('/signup', signup);
router.post('/login', login);

// Protected routes
router.get('/me', authMiddleware, getMe);
router.put('/profile', authMiddleware, updateProfile);

// Team leader routes
router.get('/team-members', authMiddleware, getTeamMembers);
router.post('/assign-agent', authMiddleware, assignAgentToTeamLeader);

export default router; 