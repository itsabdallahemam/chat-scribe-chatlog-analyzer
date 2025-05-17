import { Router } from 'express';
import { 
  getUserChatLogEvaluations, 
  saveChatLogEvaluations, 
  deleteChatLogEvaluation,
  deleteAllChatLogEvaluations,
  getAgentChatLogEvaluations
} from '../controllers/chatLogEvaluationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.get('/', authMiddleware, getUserChatLogEvaluations);
router.get('/user/:userId', authMiddleware, getAgentChatLogEvaluations);
router.post('/', authMiddleware, saveChatLogEvaluations);
router.delete('/:id', authMiddleware, deleteChatLogEvaluation);
router.delete('/', authMiddleware, deleteAllChatLogEvaluations);

export default router; 