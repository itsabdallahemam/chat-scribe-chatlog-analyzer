BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[ApiKey] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [name] NVARCHAR(1000) NOT NULL,
    [key] NVARCHAR(1000) NOT NULL,
    [isActive] BIT NOT NULL CONSTRAINT [ApiKey_isActive_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [ApiKey_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    [lastUsed] DATETIME2,
    CONSTRAINT [ApiKey_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [ApiKey_key_key] UNIQUE NONCLUSTERED ([key])
);

-- CreateTable
CREATE TABLE [dbo].[UserSettings] (
    [id] NVARCHAR(1000) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [theme] NVARCHAR(1000) NOT NULL CONSTRAINT [UserSettings_theme_df] DEFAULT 'light',
    [language] NVARCHAR(1000) NOT NULL CONSTRAINT [UserSettings_language_df] DEFAULT 'en',
    [notifications] BIT NOT NULL CONSTRAINT [UserSettings_notifications_df] DEFAULT 1,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [UserSettings_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [UserSettings_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [UserSettings_userId_key] UNIQUE NONCLUSTERED ([userId])
);

-- AddForeignKey
ALTER TABLE [dbo].[ApiKey] ADD CONSTRAINT [ApiKey_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[UserSettings] ADD CONSTRAINT [UserSettings_userId_fkey] FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
