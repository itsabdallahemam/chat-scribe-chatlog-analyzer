import { Router } from 'express';
import { 
  getUserChatLogEvaluations, 
  saveChatLogEvaluations, 
  deleteChatLogEvaluation,
  deleteAllChatLogEvaluations
} from '../controllers/chatLogEvaluationController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.get('/', authMiddleware, getUserChatLogEvaluations);
router.post('/', authMiddleware, saveChatLogEvaluations);
router.delete('/:id', authMiddleware, deleteChatLogEvaluation);
router.delete('/', authMiddleware, deleteAllChatLogEvaluations);

export default router; 