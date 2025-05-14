/*
  Warnings:

  - You are about to drop the column `role` on the `Agent` table. All the data in the column will be lost.
  - You are about to drop the `TeamLeader` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Agent] DROP COLUMN [role];

-- DropTable
DROP TABLE [dbo].[TeamLeader];

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
