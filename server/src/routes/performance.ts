import express from 'express';
import { getUserPerformance, getAgentPerformance } from '../controllers/performanceController';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authMiddleware);

// Get performance metrics for the authenticated user
router.get('/me', getUserPerformance);

// Get performance metrics for a specific agent (team leader only)
router.get('/agent/:userId', getAgentPerformance);

export default router; 