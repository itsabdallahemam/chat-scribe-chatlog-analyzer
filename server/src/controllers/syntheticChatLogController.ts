import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

// Get all synthetic chat logs for the authenticated user
export const getUserSyntheticChatLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const chatLogs = await prisma.syntheticChatLog.findMany({
      where: { userId },
      orderBy: { startTime: 'desc' },
    });

    // Format dates before sending to client
    const formattedChatLogs = chatLogs.map(log => ({
      ...log,
      startTime: log.startTime.toISOString(),
      endTime: log.endTime.toISOString(),
      createdAt: log.createdAt.toISOString(),
      updatedAt: log.updatedAt.toISOString()
    }));

    res.json(formattedChatLogs);
  } catch (error) {
    console.error('Get user synthetic chat logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Save multiple synthetic chat logs for the authenticated user
export const saveSyntheticChatLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const chatLogs = req.body;

    if (!Array.isArray(chatLogs) || chatLogs.length === 0) {
      return res.status(400).json({ message: 'Invalid chat logs data' });
    }

    // Validate each chat log
    for (const chatLog of chatLogs) {
      if (!chatLog.agentName || !chatLog.shift || !chatLog.scenario || !chatLog.chatlog) {
        return res.status(400).json({ 
          message: 'Invalid chat log data',
          details: 'Missing required fields: agentName, shift, scenario, or chatlog'
        });
      }

      if (typeof chatLog.escalated !== 'boolean') {
        return res.status(400).json({ 
          message: 'Invalid chat log data',
          details: 'escalated field must be a boolean'
        });
      }

      if (!(chatLog.startTime instanceof Date) && isNaN(Date.parse(chatLog.startTime))) {
        return res.status(400).json({ 
          message: 'Invalid chat log data',
          details: 'startTime must be a valid date'
        });
      }

      if (!(chatLog.endTime instanceof Date) && isNaN(Date.parse(chatLog.endTime))) {
        return res.status(400).json({ 
          message: 'Invalid chat log data',
          details: 'endTime must be a valid date'
        });
      }

      // Validate metadata if present
      if (chatLog.metadata) {
        try {
          const metadata = JSON.parse(chatLog.metadata);
          if (typeof metadata !== 'object') {
            return res.status(400).json({ 
              message: 'Invalid chat log data',
              details: 'metadata must be a valid JSON object'
            });
          }
        } catch (error) {
          return res.status(400).json({ 
            message: 'Invalid chat log data',
            details: 'metadata must be a valid JSON string'
          });
        }
      }
    }

    // Insert new chat logs
    const createdChatLogs = await Promise.all(
      chatLogs.map(async (chatLog) => {
        return prisma.syntheticChatLog.create({
          data: {
            id: uuidv4(),
            userId,
            agentName: chatLog.agentName,
            shift: chatLog.shift,
            scenario: chatLog.scenario,
            chatlog: chatLog.chatlog,
            escalated: chatLog.escalated,
            customerSatisfaction: chatLog.customerSatisfaction || 0,
            performanceTrajectory: chatLog.performanceTrajectory,
            startTime: new Date(chatLog.startTime),
            endTime: new Date(chatLog.endTime),
            metadata: chatLog.metadata,
          },
        });
      })
    );

    res.status(201).json(createdChatLogs);
  } catch (error: any) {
    console.error('Save synthetic chat logs error:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ 
        message: 'Duplicate entry',
        details: 'A chat log with this ID already exists'
      });
    }
    res.status(500).json({ 
      message: 'Internal server error',
      details: error.message || 'Unknown error occurred'
    });
  }
};

// Delete a synthetic chat log for the authenticated user
export const deleteSyntheticChatLog = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: 'Chat log ID is required' });
    }

    // Check if chat log exists and belongs to user
    const chatLog = await prisma.syntheticChatLog.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!chatLog) {
      return res.status(404).json({ message: 'Chat log not found' });
    }

    // Delete the chat log
    await prisma.syntheticChatLog.delete({
      where: { id },
    });

    res.json({ message: 'Chat log deleted successfully' });
  } catch (error) {
    console.error('Delete synthetic chat log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Delete all synthetic chat logs for the authenticated user
export const deleteAllSyntheticChatLogs = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    await prisma.syntheticChatLog.deleteMany({
      where: { userId }
    });

    res.json({ message: 'All chat logs deleted successfully' });
  } catch (error) {
    console.error('Delete all synthetic chat logs error:', error);
    res.status(500).json({ message: 'Failed to delete chat logs' });
  }
}; 