/*
  Warnings:

  - A unique constraint covering the columns `[userId,featureName]` on the table `UserFeature` will be added. If there are existing duplicate values, this will fail.

*/
BEGIN TRY

BEGIN TRAN;

-- CreateIndex
ALTER TABLE [dbo].[UserFeature] ADD CONSTRAINT [UserFeature_userId_featureName_key] UNIQUE NONCLUSTERED ([userId], [featureName]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
