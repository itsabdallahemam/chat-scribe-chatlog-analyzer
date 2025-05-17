import { PrismaClient } from '@prisma/client';

async function debugChatLogEvaluations() {
  const prisma = new PrismaClient();
  
  try {
    console.log('Connecting to database...');
    
    // Get all agents
    const agents = await prisma.agent.findMany({
      select: {
        id: true,
        email: true,
        fullName: true,
        role: true
      }
    });
    
    console.log(`Found ${agents.length} agents in the database`);
    if (agents.length > 0) {
      console.log('Agent details:');
      agents.forEach(agent => {
        console.log(`- ${agent.email} (${agent.id}), Name: ${agent.fullName || 'Not set'}, Role: ${agent.role}`);
      });
    } else {
      console.log('No agents found in the database');
    }
    
    // Get all chat log evaluations
    const evaluations = await prisma.chatLogEvaluation.findMany();
    
    console.log(`\nFound ${evaluations.length} chat log evaluations in the database`);
    
    if (evaluations.length > 0) {
      // Group by userId
      const groupedByUser = evaluations.reduce((acc, evaluation) => {
        acc[evaluation.userId] = (acc[evaluation.userId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      console.log('\nEvaluations per user:');
      for (const userId in groupedByUser) {
        const agent = agents.find(a => a.id === userId);
        console.log(`- User: ${agent?.email || userId}: ${groupedByUser[userId]} evaluations`);
      }
      
      // Show a sample evaluation
      console.log('\nSample evaluation:');
      console.log(evaluations[0]);
    } else {
      console.log('No evaluations found in the database');
      console.log('\nYou need to upload and evaluate chat logs for the performance metrics to work.');
      console.log('Go to the Chat Evaluation page to upload a CSV file with chat logs to analyze.');
    }
  } catch (error) {
    console.error('Error accessing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the debug function
debugChatLogEvaluations()
  .then(() => console.log('Debug script completed'))
  .catch(error => console.error('Debug script failed:', error)); 