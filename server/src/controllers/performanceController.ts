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
  console.log(`[PERFORMANCE DEBUG] Getting performance data for user ID: ${userId}`);
  
  // Get all evaluations for the user
  const evaluations = await (prisma as any).chatLogEvaluation.findMany({
    where: { userId },
  });

  console.log(`[PERFORMANCE DEBUG] Found ${evaluations.length} evaluations for user ${userId}`);

  if (evaluations.length === 0) {
    console.log(`[PERFORMANCE DEBUG] No evaluations found for user ${userId}, returning 404`);
    return res.status(404).json({ message: 'No evaluations found for this user' });
  }

  console.log(`[PERFORMANCE DEBUG] Evaluation data sample:`, evaluations[0]);

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

  console.log(`[PERFORMANCE DEBUG] Calculated sums:`, sum);

  // Calculate the metrics - ensure resolution is on a 0-1 scale
  const coherenceAvg = parseFloat((sum.coherence / totalEvaluations).toFixed(2));
  const politenessAvg = parseFloat((sum.politeness / totalEvaluations).toFixed(2));
  const relevanceAvg = parseFloat((sum.relevance / totalEvaluations).toFixed(2));
  
  // Resolution is on a 0-1 scale, but might have been stored as 0-5
  // Check the sample to see if we need to normalize
  const sampleResolution = evaluations[0].resolution;
  const isResolutionNormalized = sampleResolution <= 1;
  
  // If resolution is already 0-1, use it directly, otherwise normalize from 0-5 to 0-1
  const resolutionAvg = isResolutionNormalized 
    ? parseFloat((sum.resolution / totalEvaluations).toFixed(2))
    : parseFloat(((sum.resolution / totalEvaluations) / 5).toFixed(2));
  
  console.log(`[PERFORMANCE DEBUG] Resolution average calculation. Is normalized: ${isResolutionNormalized}, value: ${resolutionAvg}`);

  // Calculate weighted average using the normalized resolution value
  const calculatedAverage = parseFloat(
    (
      (coherenceAvg * 0.25) +
      (politenessAvg * 0.20) +
      (relevanceAvg * 0.25) +
      // If resolution is already normalized (0-1), multiply by 5 to get it on the same scale as other metrics
      ((isResolutionNormalized ? resolutionAvg * 5 : sum.resolution / totalEvaluations) * 0.30)
    ).toFixed(2)
  );

  const metrics: PerformanceMetrics = {
    coherence: coherenceAvg,
    politeness: politenessAvg,
    relevance: relevanceAvg,
    resolution: resolutionAvg,
    totalEvaluations,
    averageScore: calculatedAverage
  };

  console.log(`[PERFORMANCE DEBUG] Calculated metrics:`, metrics);

  return res.json(metrics);
} 