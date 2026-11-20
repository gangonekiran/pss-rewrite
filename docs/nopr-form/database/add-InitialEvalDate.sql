/*
  NOPR Form — add Date of Initial Evaluation to stblNoOnePlanForm (dbCDD)

  Requested change: the NOPR form needs a "Date of Initial Evaluation" field. Until now the
  date has been typed into the client's Notes because the form had no place for it.
  Decision (team lead, 2026-11-18): add a column; the date is optional.

  Safe to run more than once. Existing rows get NULL; no data is changed.
*/
USE [dbCDD]
GO

IF COL_LENGTH('dbo.stblNoOnePlanForm', 'InitialEvalDate') IS NULL
BEGIN
    ALTER TABLE [dbo].[stblNoOnePlanForm] ADD [InitialEvalDate] [datetime2](0) NULL;
END
GO

IF NOT EXISTS (
    SELECT 1 FROM sys.extended_properties
    WHERE major_id = OBJECT_ID('dbo.stblNoOnePlanForm')
      AND minor_id = COLUMNPROPERTY(OBJECT_ID('dbo.stblNoOnePlanForm'), 'InitialEvalDate', 'ColumnId')
      AND name = N'MS_Description'
)
BEGIN
    EXEC sys.sp_addextendedproperty
        @name = N'MS_Description',
        @value = N'Date of Initial Evaluation (optional). Not before Date of Birth; not after StatusDate.',
        @level0type = N'SCHEMA', @level0name = N'dbo',
        @level1type = N'TABLE',  @level1name = N'stblNoOnePlanForm',
        @level2type = N'COLUMN', @level2name = N'InitialEvalDate';
END
GO

/*
  Rollback (drops the column and any dates saved in it):

  EXEC sys.sp_dropextendedproperty
      @name = N'MS_Description',
      @level0type = N'SCHEMA', @level0name = N'dbo',
      @level1type = N'TABLE',  @level1name = N'stblNoOnePlanForm',
      @level2type = N'COLUMN', @level2name = N'InitialEvalDate';
  GO
  ALTER TABLE [dbo].[stblNoOnePlanForm] DROP COLUMN [InitialEvalDate];
  GO
*/
