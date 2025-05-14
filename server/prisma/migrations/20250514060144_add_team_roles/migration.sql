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

-- AlterTable
ALTER TABLE [dbo].[User] ADD [role] NVARCHAR(1000) NOT NULL CONSTRAINT [User_role_df] DEFAULT 'agent',
[teamLeaderId] NVARCHAR(1000);

-- CreateIndex
CREATE NONCLUSTERED INDEX [User_teamLeaderId_idx] ON [dbo].[User]([teamLeaderId]);

-- AddForeignKey
ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_teamLeaderId_fkey] FOREIGN KEY ([teamLeaderId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[Evaluation] ADD CONSTRAINT [Evaluation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[DashboardData] ADD CONSTRAINT [DashboardData_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserFeature] ADD CONSTRAINT [UserFeature_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[ChatLogEvaluation] ADD CONSTRAINT [ChatLogEvaluation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
