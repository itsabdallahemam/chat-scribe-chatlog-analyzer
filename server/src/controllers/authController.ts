import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Express Request type to include user
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const signup = async (req: Request, res: Response) => {
  try {
    console.log('Signup request received:', { ...req.body, password: '[REDACTED]' });
    const { email, password, name, role } = req.body;

    // Validate role
    if (!['admin', 'team_leader', 'agent'].includes(role)) {
      console.log('Invalid role:', role);
      return res.status(400).json({ message: 'Invalid role' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('User already exists:', email);
      return res.status(400).json({ message: 'User already exists' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    console.log('Creating user with data:', { email, name, role });
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        fullName: name,
        role,
      },
    });

    // Generate JWT token
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
      expiresIn: '7d',
    });

    // Return user data (excluding password) and token
    const { passwordHash: _, ...userWithoutPassword } = user;
    console.log('User created successfully:', { id: user.id, email: user.email, role: user.role });
    res.status(201).json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Signup error details:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    res.status(500).json({ message: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await prisma.user.findUnique({
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
    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
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

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await prisma.user.findUnique({
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

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { name } = req.body;

    const user = await prisma.user.update({
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

export const getTeamMembers = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get the user to check their role
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    let teamMembers;
    if (user.role === 'admin') {
      // Admin can see all users
      teamMembers = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          teamLeaderId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else if (user.role === 'team_leader') {
      // Team leader can see their team members
      teamMembers = await prisma.user.findMany({
        where: {
          teamLeaderId: userId,
        },
        select: {
          id: true,
          email: true,
          fullName: true,
          role: true,
          teamLeaderId: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    } else {
      // Agents can only see themselves
      teamMembers = [{
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        teamLeaderId: user.teamLeaderId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      }];
    }

    res.json(teamMembers);
  } catch (error) {
    console.error('Error fetching team members:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignAgentToTeamLeader = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const { agentId } = req.body;
    if (!agentId) {
      return res.status(400).json({ message: 'Agent ID is required' });
    }

    // Get the team leader
    const teamLeader = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!teamLeader || teamLeader.role !== 'team_leader') {
      return res.status(403).json({ message: 'Only team leaders can assign agents' });
    }

    // Get the agent
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return res.status(404).json({ message: 'Agent not found' });
    }

    if (agent.role !== 'agent') {
      return res.status(400).json({ message: 'Can only assign users with agent role' });
    }

    // Update the agent's team leader
    const updatedAgent = await prisma.user.update({
      where: { id: agentId },
      data: { teamLeaderId: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true,
        teamLeaderId: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedAgent);
  } catch (error) {
    console.error('Error assigning agent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 