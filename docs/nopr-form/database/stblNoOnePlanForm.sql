/*
  dbCDD.dbo.stblNoOnePlanForm — table definition as used by the NOPR Form.

  Scripted from the dbCDD schema (2026-09-09 script) and checked against the local database
  (2026-11-18). The last column, InitialEvalDate, is new: it is added by
  add-InitialEvalDate.sql, which is the script to run on an existing database.
  This file is for reference; do not run it on a database that already has the table.
*/
USE [dbCDD]
GO

SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[stblNoOnePlanForm](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[ChildID] [int] NULL,
	[FormDate] [datetime2](0) NULL,
	[FormType] [nvarchar](12) NULL,
	[Region] [int] NULL,
	[MonthReporting] [int] NULL,
	[RefStatus] [int] NULL,
	[Screening] [int] NULL,
	[ReferredBack] [bit] NULL,
	[StatusDate] [datetime2](0) NULL,
	[SSMA_TimeStamp] [timestamp] NOT NULL,
	[InsertDate] [datetime] NOT NULL,
	[InsertUser] [varchar](50) NOT NULL,
	[LastUpdateDate] [datetime] NOT NULL,
	[LastUpdateUser] [varchar](50) NOT NULL,
	[InitialEvalDate] [datetime2](0) NULL,   -- new (add-InitialEvalDate.sql)
 CONSTRAINT [stblNoOnePlanForm$PrimaryKey] PRIMARY KEY CLUSTERED
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY]
GO

ALTER TABLE [dbo].[stblNoOnePlanForm] ADD  DEFAULT ('No One Plan') FOR [FormType]
GO
ALTER TABLE [dbo].[stblNoOnePlanForm] ADD  DEFAULT ((0)) FOR [ReferredBack]
GO
ALTER TABLE [dbo].[stblNoOnePlanForm] ADD  DEFAULT (getdate()) FOR [InsertDate]
GO
ALTER TABLE [dbo].[stblNoOnePlanForm] ADD  DEFAULT (suser_sname()) FOR [InsertUser]
GO
ALTER TABLE [dbo].[stblNoOnePlanForm] ADD  DEFAULT (getdate()) FOR [LastUpdateDate]
GO
ALTER TABLE [dbo].[stblNoOnePlanForm] ADD  DEFAULT (suser_sname()) FOR [LastUpdateUser]
GO

ALTER TABLE [dbo].[stblNoOnePlanForm]  WITH NOCHECK ADD  CONSTRAINT [stblNoOnePlanForm$stblPeoplestblNoOnePlanForm] FOREIGN KEY([ChildID])
REFERENCES [dbo].[stblPeople] ([ChildID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[stblNoOnePlanForm] CHECK CONSTRAINT [stblNoOnePlanForm$stblPeoplestblNoOnePlanForm]
GO

/* Column descriptions (MS_Description) that matter for the form */
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Effective Date of Form (always last day of month, calculated from MonthReporting)' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblNoOnePlanForm', @level2type=N'COLUMN',@level2name=N'FormDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Static field set to "No One Plan"' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblNoOnePlanForm', @level2type=N'COLUMN',@level2name=N'FormType'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Enter Reporting Region' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblNoOnePlanForm', @level2type=N'COLUMN',@level2name=N'Region'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Month and Year being reported' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblNoOnePlanForm', @level2type=N'COLUMN',@level2name=N'MonthReporting'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'1=Initial Visit Made-Screening declined, 2=Screened-No further needed, 3=Further eval declined, 4=Evaluated-Not eligible, 5= Eligible-Family Declined, 6=Moved or Lost Contact, 7= Turned 3' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblNoOnePlanForm', @level2type=N'COLUMN',@level2name=N'RefStatus'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'1=Early Intervention, 2=Early Childhood & Family Mental Health, 3=Family Support, 4=Nursing' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblNoOnePlanForm', @level2type=N'COLUMN',@level2name=N'Screening'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Date above status was determined' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblNoOnePlanForm', @level2type=N'COLUMN',@level2name=N'StatusDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Date of Initial Evaluation (optional). Not before Date of Birth; not after StatusDate.' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblNoOnePlanForm', @level2type=N'COLUMN',@level2name=N'InitialEvalDate'
GO
