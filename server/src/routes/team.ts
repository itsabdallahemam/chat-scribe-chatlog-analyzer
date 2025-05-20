import { Router } from 'express';
import { createTeam, assignAgentToTeam, assignTeamLeader, getAllTeams, updateTeam } from '../controllers/teamController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Manager routes
router.post('/create', authMiddleware, createTeam);
router.post('/assign-agent', authMiddleware, assignAgentToTeam);
router.post('/assign-leader', authMiddleware, assignTeamLeader);
router.get('/all', authMiddleware, getAllTeams);
router.post('/update', authMiddleware, updateTeam);

export default router;
