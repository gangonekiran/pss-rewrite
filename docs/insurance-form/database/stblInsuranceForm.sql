/*
  stblInsuranceForm — Insurance Form table (dbCDD)
  Scripted from the local dbCDD database on 2026-11-14 (sys.columns, sys.default_constraints,
  sys.foreign_keys, sys.indexes). The table came from the Access back end by SSMA migration.
  The table has no MS_Description extended properties in dbCDD.
  Default constraint names are system-generated and differ between servers.
  Code lists (not in the database): see docs/insurance-form/04-data-dictionary.md §2.
*/
USE [dbCDD]
GO
SET ANSI_NULLS ON
GO
SET QUOTED_IDENTIFIER ON
GO
CREATE TABLE [dbo].[stblInsuranceForm](
	[ID] [int] IDENTITY(1,1) NOT NULL,
	[ChildID] [int] NULL,
	[FormDate] [datetime2](0) NULL,
	[FormType] [nvarchar](12) NULL,
	[InsCoNumber] [nvarchar](255) NULL,
	[InsuranceName] [nvarchar](255) NULL,
	[BranchAddress] [nvarchar](255) NULL,
	[PolicyNumber] [nvarchar](255) NULL,
	[CoverageCode] [nvarchar](5) NULL,
	[EffectiveDate] [datetime2](0) NULL,
	[EndDate] [datetime2](0) NULL,
	[PolicyHolder] [nvarchar](255) NULL,
	[GroupNumber] [nvarchar](255) NULL,
	[GroupName] [nvarchar](255) NULL,
	[Phone] [nvarchar](255) NULL,
	[BillingConsent] [int] NULL,
	[ParentSignatureDate] [datetime2](0) NULL,
	[DeclineReasonCap] [bit] NULL,
	[DeclineReasonPremium] [bit] NULL,
	[DeclineReasonBenefits] [bit] NULL,
	[DeclineReasonEligibility] [bit] NULL,
	[ParentSignatureDate2] [datetime2](0) NULL,
	[SSMA_TimeStamp] [timestamp] NOT NULL,
	[InsertDate] [datetime] NOT NULL,
	[InsertUser] [varchar](50) NOT NULL,
	[LastUpdateDate] [datetime] NOT NULL,
	[LastUpdateUser] [varchar](50) NOT NULL,
 CONSTRAINT [stblInsuranceForm$PrimaryKey] PRIMARY KEY CLUSTERED 
(
	[ID] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY]
GO

-- Defaults and foreign key
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT ('Insurance') FOR [FormType]
GO
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT ((0)) FOR [DeclineReasonCap]
GO
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT ((0)) FOR [DeclineReasonPremium]
GO
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT ((0)) FOR [DeclineReasonBenefits]
GO
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT ((0)) FOR [DeclineReasonEligibility]
GO
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT (getdate()) FOR [InsertDate]
GO
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT (suser_sname()) FOR [InsertUser]
GO
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT (getdate()) FOR [LastUpdateDate]
GO
ALTER TABLE [dbo].[stblInsuranceForm] ADD  DEFAULT (suser_sname()) FOR [LastUpdateUser]
GO
ALTER TABLE [dbo].[stblInsuranceForm]  WITH NOCHECK ADD  CONSTRAINT [stblInsuranceForm$stblPeoplestblInsuranceForm] FOREIGN KEY([ChildID])
REFERENCES [dbo].[stblPeople] ([ChildID])
ON UPDATE CASCADE
ON DELETE CASCADE
GO
ALTER TABLE [dbo].[stblInsuranceForm] CHECK CONSTRAINT [stblInsuranceForm$stblPeoplestblInsuranceForm]
GO

-- Recommended, not applied (see 07-erd.md §3 and 08-normalization-notes.md):
-- CREATE INDEX [IX_stblInsuranceForm_ChildID_FormDate] ON [dbo].[stblInsuranceForm] ([ChildID], [FormDate] DESC, [ID] DESC);
-- ALTER TABLE [dbo].[stblInsuranceForm] WITH CHECK CHECK CONSTRAINT [stblInsuranceForm$stblPeoplestblInsuranceForm];
-- ALTER TABLE [dbo].[stblInsuranceForm] ADD CONSTRAINT [CK_stblInsuranceForm_BillingConsent] CHECK ([BillingConsent] IN (1, 2, 3));
