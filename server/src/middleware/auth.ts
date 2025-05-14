import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string };
    
    // Get agent details including role from database
    const agent = await (prisma as any).agent.findUnique({
      where: { id: decoded.userId },
      select: { id: true, role: true }
    });

    if (!agent) {
      return res.status(401).json({ message: 'User not found' });
    }

    // Add user info to request
    (req as any).user = {
      userId: agent.id,
      role: agent.role
    };
    
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Invalid token' });
  }
}; 