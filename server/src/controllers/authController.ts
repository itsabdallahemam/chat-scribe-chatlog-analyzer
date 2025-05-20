import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const signup = async (req: Request, res: Response) => {
  try {
    const { email, password, name, role } = req.body;

    // Check if user already exists
    const existingUser = await (prisma as any).agent.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user with role (default to "Agent" if not provided)
    const user = await (prisma as any).agent.create({
      data: {
        email,
        passwordHash,
        fullName: name,
        role: role || "Agent",
      },
    });

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user data (excluding password) and token
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await (prisma as any).agent.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check password
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user data (excluding password) and token
    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getMe = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await (prisma as any).agent.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProfile = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name } = req.body;

    const user = await (prisma as any).agent.update({
      where: { id: userId },
      data: { fullName: name },
    });

    const { passwordHash: _, ...userWithoutPassword } = user;
    res.json(userWithoutPassword);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const changePassword = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { currentPassword, newPassword } = req.body;

    // Validate request
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current password and new password are required' });
    }

    // Find user
    const user = await (prisma as any).agent.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Current password is incorrect' });
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await (prisma as any).agent.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const users = await (prisma as any).agent.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(users);
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Add a new function to get a user by ID
export const getUserById = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    const user = await (prisma as any).agent.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Update the deleteUser function to handle related records
export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId = req.params.id;

    // Check if user exists
    const existingUser = await (prisma as any).agent.findUnique({
      where: {
        id: userId,
      },
    });

    if (!existingUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Prevent deleting a Team Leader (optional validation)
    if (existingUser.role === 'Team Leader') {
      return res.status(403).json({ message: 'Team Leaders cannot be deleted through this endpoint' });
    }

    // Delete all related records first to avoid foreign key constraints
    
    // Delete UserFeature records
    await (prisma as any).userFeature.deleteMany({
      where: { userId },
    });
    
    // Delete ChatLogEvaluation records
    await (prisma as any).chatLogEvaluation.deleteMany({
      where: { userId },
    });
    
    // Delete Evaluation records
    await (prisma as any).evaluation.deleteMany({
      where: { userId },
    });
    
    // Delete DashboardData records
    await (prisma as any).dashboardData.deleteMany({
      where: { userId },
    });

    // Now delete the agent
    await (prisma as any).agent.delete({
      where: {
        id: userId,
      },
    });

    res.status(200).json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Get all agents in the team of the current team leader
export const getTeamAgents = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    // Find the team where the current user is the leader
    const team = await prisma.team.findFirst({
      where: { leaderId: userId },
      include: {
        agents: {
          select: {
            id: true,
            email: true,
            fullName: true,
            role: true,
            createdAt: true,
            updatedAt: true,
            teamId: true,
          },
        },
      },
    });
    if (!team) {
      return res.status(404).json({ message: 'No team found for this leader' });
    }
    res.json(team.agents);
  } catch (error) {
    console.error('Get team agents error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};