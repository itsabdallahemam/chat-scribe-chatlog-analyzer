import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Schema for assigning an agent
const assignAgentSchema = z.object({
  agentId: z.string(),
});

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

export const assignAgent = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validate request body
    const { agentId } = assignAgentSchema.parse(req.body);

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
    if (error instanceof z.ZodError) {
      return res.status(400).json({ message: 'Invalid request data', errors: error.errors });
    }
    console.error('Error assigning agent:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}; 