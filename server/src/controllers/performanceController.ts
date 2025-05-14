import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PerformanceMetrics {
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  averageScore: number;
  totalEvaluations: number;
}

interface MetricSum {
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
}

interface Evaluation {
  coherence: number;
  politeness: number;
  relevance: number;
  resolution: number;
  [key: string]: any;
}

// Get performance metrics for the authenticated user
export const getUserPerformance = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    return await getPerformanceForUser(userId, res);
  } catch (error) {
    console.error('Get user performance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get performance metrics for a specific agent (team leader or self access)
export const getAgentPerformance = async (req: Request, res: Response) => {
  try {
    const currentUser = (req as any).user;
    const targetUserId = req.params.userId;

    // Allow access if:
    // 1. The user is a Team Leader, OR
    // 2. The user is trying to access their own data
    if (currentUser.role !== 'Team Leader' && currentUser.userId !== targetUserId) {
      return res.status(403).json({ message: 'You can only view your own or your team members performance' });
    }

    return await getPerformanceForUser(targetUserId, res);
  } catch (error) {
    console.error('Get agent performance error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Helper function to calculate performance metrics for a user
async function getPerformanceForUser(userId: string, res: Response) {
  // Get all evaluations for the user
  const evaluations = await (prisma as any).chatLogEvaluation.findMany({
    where: { userId },
  });

  if (evaluations.length === 0) {
    return res.status(404).json({ message: 'No evaluations found for this user' });
  }

  // Calculate average scores for each metric
  const totalEvaluations = evaluations.length;
  
  const sum = evaluations.reduce(
    (acc: MetricSum, evaluation: Evaluation) => ({
      coherence: acc.coherence + evaluation.coherence,
      politeness: acc.politeness + evaluation.politeness,
      relevance: acc.relevance + evaluation.relevance,
      resolution: acc.resolution + evaluation.resolution,
    }),
    { coherence: 0, politeness: 0, relevance: 0, resolution: 0 }
  );

  const metrics: PerformanceMetrics = {
    coherence: parseFloat((sum.coherence / totalEvaluations).toFixed(2)),
    politeness: parseFloat((sum.politeness / totalEvaluations).toFixed(2)),
    relevance: parseFloat((sum.relevance / totalEvaluations).toFixed(2)),
    resolution: parseFloat((sum.resolution / totalEvaluations).toFixed(2)),
    totalEvaluations,
    // Calculate weighted average (based on weights in the frontend)
    // Coherence (25%), Politeness (20%), Relevance (25%), Resolution (30%)
    averageScore: parseFloat(
      (
        (sum.coherence / totalEvaluations) * 0.25 +
        (sum.politeness / totalEvaluations) * 0.20 +
        (sum.relevance / totalEvaluations) * 0.25 +
        (sum.resolution / totalEvaluations) * 0.30
      ).toFixed(2)
    ),
  };

  return res.json(metrics);
} 