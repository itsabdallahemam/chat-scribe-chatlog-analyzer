import { Router } from 'express';
import { getUserFeatures, upsertUserFeature, deleteUserFeature } from '../controllers/userFeatureController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.get('/', authMiddleware, getUserFeatures);
router.post('/', authMiddleware, upsertUserFeature);
router.delete('/', authMiddleware, deleteUserFeature);

export default router; 