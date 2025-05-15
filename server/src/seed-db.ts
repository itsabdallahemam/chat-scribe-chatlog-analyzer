import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedDatabase() {
  try {
    console.log('Starting database seed...');
    
    // Check if there are any agents already
    const existingAgents = await prisma.agent.count();
    
    if (existingAgents > 0) {
      console.log(`Database already has ${existingAgents} agents. Skipping seed.`);
      return;
    }
    
    // Create test agent
    console.log('Creating test agent...');
    const passwordHash = await bcrypt.hash('password123', 10);
    
    const testAgent = await prisma.agent.create({
      data: {
        email: 'agent@example.com',
        passwordHash,
        fullName: 'Test Agent',
        role: 'Agent'
      }
    });
    
    console.log(`Created test agent with ID: ${testAgent.id}`);
    console.log('Test agent login details:');
    console.log('Email: agent@example.com');
    console.log('Password: password123');
    
    console.log('Database seed completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedDatabase()
  .then(() => console.log('Seed script finished'))
  .catch(error => console.error('Seed script failed:', error)); 