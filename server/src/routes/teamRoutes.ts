import express from 'express';
import { getTeamMembers, assignAgent } from '../controllers/teamController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Get team members (protected route)
router.get('/team-members', authMiddleware, getTeamMembers);

// Assign agent to team leader (protected route)
router.post('/assign-agent', authMiddleware, assignAgent);

export default router; 