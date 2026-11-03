/*
  stblExitForm — Exit Form table (dbCDD)
  Extracted from the dbCDD DDL script dated 9/9/2026 (Access → SQL Server migration by SSMA).
  Checked against the local dbCDD database on 2026-11-02: same 45 columns, types, defaults,
  check constraints and FK.
  Note: the draft schema in Docs.zip (CIS_Database_Schema.sql, 8/30/2026) is NOT the real table:
  it types most code and date columns as bit / varchar.
  Code lists (not in the database): see docs/exit-form/04-data-dictionary.md §2.
*/
USE [dbCDD]
GO
/****** Object:  Table [dbo].[stblExitForm]    Script Date: 9/9/2026 12:35:38 AM ******/
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[stblExitForm](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[ChildID] [int] NULL,
	[FormDate] [datetime2](0) NULL,
	[FormType] [nvarchar](12) NULL,
	[Region] [int] NULL,
	[MonthReporting] [int] NULL,
	[SU_id] [int] NULL,
	[SUName] [nvarchar](50) NULL,
	[CountyCode] [nvarchar](12) NULL,
	[Town] [nvarchar](3) NULL,
	[SvcCordFirstName] [nvarchar](50) NULL,
	[SvcCordLastName] [nvarchar](50) NULL,
	[SvcCordType] [int] NULL,
	[SvcCordOtherDesc] [nvarchar](255) NULL,
	[CAPTA] [int] NULL,
	[ReferralDate] [datetime2](0) NULL,
	[ReReferralDate] [datetime2](0) NULL,
	[COSFEnter30Months] [int] NULL,
	[COSFEntryForm] [int] NULL,
	[COSFEntryFormReason] [nvarchar](max) NULL,
	[COSFGot6MonthsSvcs] [int] NULL,
	[COSFExitForm] [int] NULL,
	[COSFExitFormReason] [nvarchar](max) NULL,
	[ExitDate] [datetime2](0) NULL,
	[TransitionPlanCompleted] [datetime2](0) NULL,
	[TransitionPlanReason] [nvarchar](max) NULL,
	[CLLEANotificationDate] [datetime2](0) NULL,
	[Notified90Days] [int] NULL,
	[NotifiedReason] [nvarchar](max) NULL,
	[NotifyStatePartC] [int] NULL,
	[TransitionMeeting] [datetime2](0) NULL,
	[TransitionMeeting90day] [int] NULL,
	[NoTransitionMtgReason] [nvarchar](max) NULL,
	[ExitPriorToAge3] [int] NULL,
	[MovedOtherRegion] [nvarchar](255) NULL,
	[ExitAtAge3] [int] NULL,
	[EXFNoPartB1] [bit] NULL,
	[EXFNoPartB2] [bit] NULL,
	[EXFNoPartB3] [bit] NULL,
	[ReferredTo] [int] NULL,
	[SSMA_TimeStamp] [timestamp] NOT NULL,
	[InsertDate] [datetime] NOT NULL,
	[InsertUser] [varchar](50) NOT NULL,
	[LastUpdateDate] [datetime] NOT NULL,
	[LastUpdateUser] [varchar](50) NOT NULL,
 CONSTRAINT [stblExitForm$PrimaryKey] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON, OPTIMIZE_FOR_SEQUENTIAL_KEY = OFF) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

-- Defaults, foreign key and check constraints
ALTER TABLE [dbo].[stblExitForm] ADD  DEFAULT ('Exit') FOR [FormType]
GO
ALTER TABLE [dbo].[stblExitForm] ADD  DEFAULT ((0)) FOR [EXFNoPartB1]
GO
ALTER TABLE [dbo].[stblExitForm] ADD  DEFAULT ((0)) FOR [EXFNoPartB2]
GO
ALTER TABLE [dbo].[stblExitForm] ADD  DEFAULT ((0)) FOR [EXFNoPartB3]
GO
ALTER TABLE [dbo].[stblExitForm] ADD  DEFAULT (getdate()) FOR [InsertDate]
GO
ALTER TABLE [dbo].[stblExitForm] ADD  DEFAULT (suser_sname()) FOR [InsertUser]
GO
ALTER TABLE [dbo].[stblExitForm] ADD  DEFAULT (getdate()) FOR [LastUpdateDate]
GO
ALTER TABLE [dbo].[stblExitForm] ADD  DEFAULT (suser_sname()) FOR [LastUpdateUser]
GO
ALTER TABLE [dbo].[stblExitForm]  WITH NOCHECK ADD  CONSTRAINT [stblExitForm$stblPeoplestblExitForm] FOREIGN KEY([ChildID])
REFERENCES [dbo].[stblPeople] ([ChildID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[stblExitForm] CHECK CONSTRAINT [stblExitForm$stblPeoplestblExitForm]
GO
ALTER TABLE [dbo].[stblExitForm]  WITH NOCHECK ADD  CONSTRAINT [SSMA_CC$stblExitForm$CountyCode$disallow_zero_length] CHECK  ((len([CountyCode])>(0)))
GO
ALTER TABLE [dbo].[stblExitForm] CHECK CONSTRAINT [SSMA_CC$stblExitForm$CountyCode$disallow_zero_length]
GO
ALTER TABLE [dbo].[stblExitForm]  WITH NOCHECK ADD  CONSTRAINT [SSMA_CC$stblExitForm$SUName$disallow_zero_length] CHECK  ((len([SUName])>(0)))
GO
ALTER TABLE [dbo].[stblExitForm] CHECK CONSTRAINT [SSMA_CC$stblExitForm$SUName$disallow_zero_length]
GO
ALTER TABLE [dbo].[stblExitForm]  WITH NOCHECK ADD  CONSTRAINT [SSMA_CC$stblExitForm$Town$disallow_zero_length] CHECK  ((len([Town])>(0)))
GO
ALTER TABLE [dbo].[stblExitForm] CHECK CONSTRAINT [SSMA_CC$stblExitForm$Town$disallow_zero_length]
GO

-- Column descriptions (MS_Description)
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[ID]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'ID'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[ChildID]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'ChildID'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Effective Date of Form (always last day of month, calculated from MonthReporting)' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'FormDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Static field set to "Exit"' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'FormType'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Enter Reporting Region' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'Region'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Month and Year being reported' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'MonthReporting'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Enter Supervisory Union number.' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'SU_id'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Enter or select name of Supervisory Union.' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'SUName'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Enter name of county where child resides.' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'CountyCode'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Enter name of town where child resides.' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'Town'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Service Coordinator''s First Name' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'SvcCordFirstName'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Service Coordinator''s Last Name' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'SvcCordLastName'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'1 = EI, 2= School, 4 = Other' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'SvcCordType'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'If CIS Service Coordinator is "Other" then fill in description here' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'SvcCordOtherDesc'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Yes = CAPTA, No = No CAPTA, Null=No Data' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'CAPTA'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[ReferralDate]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'ReferralDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[ReReferralDate]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'ReReferralDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Yes/No/Null' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'COSFEnter30Months'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Yes/No/Null' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'COSFEntryForm'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[COSFEntryFormReason]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'COSFEntryFormReason'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Yes/No/Null' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'COSFGot6MonthsSvcs'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Yes/No/Null' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'COSFExitForm'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[COSFExitFormReason]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'COSFExitFormReason'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[ExitDate]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'ExitDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[TransitionPlanCompleted]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'TransitionPlanCompleted'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[TransitionPlanReason]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'TransitionPlanReason'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[CLLEANotificationDate]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'CLLEANotificationDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Yes/No/Null - Notified within 6 months to 90 days of 3rd birthday' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'Notified90Days'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'If not notified within 6 months of 3rd birthday' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'NotifiedReason'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Yes/No/Null - Notification sent to State Part C office' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'NotifyStatePartC'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[TransitionMeeting]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'TransitionMeeting'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Yes/No/Null' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'TransitionMeeting90day'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[NoTransitionMtgReason]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'NoTransitionMtgReason'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'1=Development at appropriate leve, 2=Moved to other region, 3=Moved out of state, 4=Withdrawn by parent or guardian, 5=Unable to contact, 6=Deceased' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'ExitPriorToAge3'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Specify region' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'MovedOtherRegion'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'1=Child is potentially elible, 2=Child is potentially eligible - Family declined, 3=Child thought to be eligible - EEE not determined, 4=Child not eligible' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'ExitAtAge3'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Child''s Development is at Appropriate level' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'EXFNoPartB1'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Child did not meet Part C''s criteria for potential eligibility' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'EXFNoPartB2'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'Child did not meet Part B''s eligibility at Transition Conference' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'EXFNoPartB3'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'1=Head Start, 2=Community-based Child Care Program or Preschool, 3=School based pre-school classroom, 4=Children''s Integrated Services Coordinator, 99=Not eligible - exited with no referrals' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'ReferredTo'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[SSMA_TimeStamp]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'SSMA_TimeStamp'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'The time the record was added to the database' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'InsertDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'The user who added the record to the database' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'InsertUser'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'The time the record was last updated in the database' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'LastUpdateDate'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'The user who last modified the record in the database' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'COLUMN',@level2name=N'LastUpdateUser'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm].[PrimaryKey]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm', @level2type=N'CONSTRAINT',@level2name=N'stblExitForm$PrimaryKey'
GO
EXEC sys.sp_addextendedproperty @name=N'MS_Description', @value=N'CISState_be_tables.[stblExitForm]' , @level0type=N'SCHEMA',@level0name=N'dbo', @level1type=N'TABLE',@level1name=N'stblExitForm'
GO
