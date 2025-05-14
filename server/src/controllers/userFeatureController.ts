import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all features for the authenticated user
export const getUserFeatures = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const features = await prisma.userFeature.findMany({
      where: { userId },
    });
    res.json(features);
  } catch (error) {
    console.error('Get user features error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add or update a feature for the authenticated user
export const upsertUserFeature = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { featureName, featureValue } = req.body;
    if (!featureName) {
      return res.status(400).json({ message: 'featureName is required' });
    }
    const feature = await prisma.userFeature.upsert({
      where: {
        userId_featureName: { userId, featureName },
      },
      update: { featureValue },
      create: { userId, featureName, featureValue },
    });
    res.json(feature);
  } catch (error) {
    console.error('Upsert user feature error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a feature for the authenticated user
export const deleteUserFeature = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { featureName } = req.query as { featureName: string };
    if (!featureName) {
      return res.status(400).json({ message: 'featureName is required' });
    }
    await prisma.userFeature.delete({
      where: {
        userId_featureName: { userId, featureName },
      },
    });
    res.json({ message: 'Feature deleted' });
  } catch (error) {
    console.error('Delete user feature error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 