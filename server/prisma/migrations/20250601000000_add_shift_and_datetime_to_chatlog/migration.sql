BEGIN TRY

BEGIN TRAN;

-- Add shift and dateTime columns to the ChatLogEvaluation table
ALTER TABLE [dbo].[ChatLogEvaluation] ADD [shift] NVARCHAR(1000) NULL;
ALTER TABLE [dbo].[ChatLogEvaluation] ADD [dateTime] DATETIME2 NULL;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH 