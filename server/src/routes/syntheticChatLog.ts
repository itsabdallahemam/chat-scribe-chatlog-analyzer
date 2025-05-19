import { Router } from 'express';
import { 
  getUserSyntheticChatLogs, 
  saveSyntheticChatLogs, 
  deleteSyntheticChatLog,
  deleteAllSyntheticChatLogs
} from '../controllers/syntheticChatLogController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.get('/', authMiddleware, getUserSyntheticChatLogs);
router.post('/', authMiddleware, saveSyntheticChatLogs);
router.delete('/:id', authMiddleware, deleteSyntheticChatLog);
router.delete('/', authMiddleware, deleteAllSyntheticChatLogs);

export default router; 