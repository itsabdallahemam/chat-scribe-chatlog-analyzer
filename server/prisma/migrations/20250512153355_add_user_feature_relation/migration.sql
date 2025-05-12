/*
  Warnings:

  - You are about to drop the `ApiKey` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `UserSettings` table. If the table is not empty, all the data it contains will be lost.

*/
BEGIN TRY

BEGIN TRAN;

-- DropForeignKey
ALTER TABLE [dbo].[ApiKey] DROP CONSTRAINT [ApiKey_userId_fkey];

-- DropForeignKey
ALTER TABLE [dbo].[UserSettings] DROP CONSTRAINT [UserSettings_userId_fkey];

-- DropTable
DROP TABLE [dbo].[ApiKey];

-- DropTable
DROP TABLE [dbo].[UserSettings];

-- CreateTable
CREATE TABLE [dbo].[UserFeature] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [featureName] NVARCHAR(1000) NOT NULL,
    [featureValue] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserFeature_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [UserFeature_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[UserFeature] ADD CONSTRAINT [UserFeature_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
