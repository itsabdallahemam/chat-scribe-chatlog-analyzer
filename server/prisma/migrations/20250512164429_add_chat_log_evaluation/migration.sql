BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ChatLogEvaluation] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [chatlog] TEXT NOT NULL,
    [scenario] NVARCHAR(1000) NOT NULL,
    [coherence] INT NOT NULL,
    [politeness] INT NOT NULL,
    [relevance] INT NOT NULL,
    [resolution] INT NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ChatLogEvaluation_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [ChatLogEvaluation_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[ChatLogEvaluation] ADD CONSTRAINT [ChatLogEvaluation_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
