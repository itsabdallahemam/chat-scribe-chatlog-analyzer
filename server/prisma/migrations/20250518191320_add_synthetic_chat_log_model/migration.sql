/*
  Warnings:

  - Made the column `customerSatisfaction` on table `SyntheticChatLog` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SyntheticChatLog" DROP CONSTRAINT "SyntheticChatLog_userId_fkey";

-- AlterTable
ALTER TABLE "SyntheticChatLog" ALTER COLUMN "customerSatisfaction" SET NOT NULL;
