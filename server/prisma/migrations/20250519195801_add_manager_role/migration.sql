-- AlterTable
ALTER TABLE "Team" ADD COLUMN     "managerId" TEXT;

-- AddForeignKey
ALTER TABLE "Team" ADD CONSTRAINT "Team_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Agent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
