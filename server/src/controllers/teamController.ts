import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Manager: Create a new team
export const createTeam = async (req: Request, res: Response) => {
  try {
    const { name, leaderId } = req.body;
    const managerId = (req as any).user.userId;
    // Only allow managers to create teams
    const manager = await prisma.agent.findUnique({ where: { id: managerId } });
    if (!manager || manager.role !== 'Manager') {
      return res.status(403).json({ message: 'Only managers can create teams' });
    }
    const team = await prisma.team.create({
      data: { name, leaderId, managerId },
    });
    res.status(201).json(team);
  } catch (error) {
    console.error('Create team error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Manager: Assign agent to a team
export const assignAgentToTeam = async (req: Request, res: Response) => {
  try {
    const { agentId, teamId } = req.body;
    const managerId = (req as any).user.userId;
    // Only allow managers to assign agents
    const manager = await prisma.agent.findUnique({ where: { id: managerId } });
    if (!manager || manager.role !== 'Manager') {
      return res.status(403).json({ message: 'Only managers can assign agents' });
    }
    const agent = await prisma.agent.update({
      where: { id: agentId },
      data: { teamId },
    });
    res.json(agent);
  } catch (error) {
    console.error('Assign agent error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Manager: Assign team leader to a team
export const assignTeamLeader = async (req: Request, res: Response) => {
  try {
    const { teamId, leaderId } = req.body;
    const managerId = (req as any).user.userId;
    // Only allow managers to assign leaders
    const manager = await prisma.agent.findUnique({ where: { id: managerId } });
    if (!manager || manager.role !== 'Manager') {
      return res.status(403).json({ message: 'Only managers can assign team leaders' });
    }
    const team = await prisma.team.update({
      where: { id: teamId },
      data: { leaderId },
    });
    res.json(team);
  } catch (error) {
    console.error('Assign leader error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Manager: View all teams
export const getAllTeams = async (req: Request, res: Response) => {
  try {
    const managerId = (req as any).user.userId;
    const manager = await prisma.agent.findUnique({ where: { id: managerId } });
    if (!manager || manager.role !== 'Manager') {
      return res.status(403).json({ message: 'Only managers can view all teams' });
    }
    const teams = await prisma.team.findMany({
      include: { leader: true, agents: true, manager: true },
    });
    res.json(teams);
  } catch (error) {
    console.error('Get all teams error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
