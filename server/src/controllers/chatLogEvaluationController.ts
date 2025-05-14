import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Get all chat log evaluations for the authenticated user
export const getUserChatLogEvaluations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const evaluations = await prisma.chatLogEvaluation.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(evaluations);
  } catch (error) {
    console.error('Get user chat log evaluations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Save multiple chat log evaluations for the authenticated user
export const saveChatLogEvaluations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const evaluations = req.body;

    if (!Array.isArray(evaluations) || evaluations.length === 0) {
      return res.status(400).json({ message: 'Invalid evaluations data' });
    }

    // Delete existing evaluations for this user (replacing all at once)
    await prisma.chatLogEvaluation.deleteMany({
      where: { userId },
    });

    // Insert new evaluations
    const createdEvaluations = await Promise.all(
      evaluations.map(async (evaluation) => {
        return prisma.chatLogEvaluation.create({
          data: {
            id: uuidv4(),
            userId,
            chatlog: evaluation.chatlog,
            scenario: evaluation.scenario || '',
            coherence: evaluation.coherence,
            politeness: evaluation.politeness,
            relevance: evaluation.relevance,
            resolution: evaluation.resolution,
          },
        });
      })
    );

    res.status(201).json(createdEvaluations);
  } catch (error) {
    console.error('Save chat log evaluations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete a chat log evaluation for the authenticated user
export const deleteChatLogEvaluation = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Evaluation ID is required' });
    }

    // Check if evaluation exists and belongs to user
    const evaluation = await prisma.chatLogEvaluation.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!evaluation) {
      return res.status(404).json({ message: 'Evaluation not found' });
    }

    // Delete the evaluation
    await prisma.chatLogEvaluation.delete({
      where: { id },
    });

    res.json({ message: 'Evaluation deleted successfully' });
  } catch (error) {
    console.error('Delete chat log evaluation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete all chat log evaluations for the authenticated user
export const deleteAllChatLogEvaluations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    
    await prisma.chatLogEvaluation.deleteMany({
      where: { userId },
    });
    
    res.json({ message: 'All evaluations deleted successfully' });
  } catch (error) {
    console.error('Delete all chat log evaluations error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 