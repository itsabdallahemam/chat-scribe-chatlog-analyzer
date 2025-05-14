/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ChatLogEvaluation] DROP CONSTRAINT [ChatLogEvaluation_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[DashboardData] DROP CONSTRAINT [DashboardData_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[Evaluation] DROP CONSTRAINT [Evaluation_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[UserFeature] DROP CONSTRAINT [UserFeature_userId_fkey];

-- DropTable
DROP TABLE [dbo].[User];

-- CreateTable
CREATE TABLE [dbo].[Agent] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000),
    [role] NVARCHAR(1000) NOT NULL CONSTRAINT [Agent_role_df] DEFAULT 'Agent',
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [Agent_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [Agent_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Agent_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[TeamLeader] (
    [id] NVARCHAR(1000) NOT NULL,
    [email] NVARCHAR(1000) NOT NULL,
    [passwordHash] NVARCHAR(1000) NOT NULL,
    [fullName] NVARCHAR(1000),
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [TeamLeader_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [TeamLeader_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [TeamLeader_email_key] UNIQUE NONCLUSTERED ([email])
);

-- AddForeignKey
ALTER TABLE [dbo].[Evaluation] ADD CONSTRAINT [Evaluation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[Agent]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DashboardData] ADD CONSTRAINT [DashboardData_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[Agent]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserFeature] ADD CONSTRAINT [UserFeature_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[Agent]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChatLogEvaluation] ADD CONSTRAINT [ChatLogEvaluation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[Agent]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
