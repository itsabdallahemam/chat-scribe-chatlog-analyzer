import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Starting database cleanup...');

    // Delete all records from each table in reverse order of dependencies
    await prisma.$transaction([
      prisma.syntheticChatLog.deleteMany({}),
      prisma.chatLogEvaluation.deleteMany({}),
      prisma.userFeature.deleteMany({}),
      prisma.dashboardData.deleteMany({}),
      prisma.evaluation.deleteMany({}),
      prisma.team.deleteMany({}),
      prisma.agent.deleteMany({})
    ]);

    console.log('✅ Database cleared successfully!');
  } catch (error) {
    console.error('❌ Error clearing database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase()
  .then(() => console.log('Cleanup script finished'))
  .catch(error => console.error('Cleanup script failed:', error)); 