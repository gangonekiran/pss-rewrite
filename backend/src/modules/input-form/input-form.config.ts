import type { FormConfig, FormName } from "./input-form.types";

/**
 * Central configuration for all client input forms.
 *
 * Each form configuration defines:
 * - The SQL Server table used by the form
 * - The primary key column for the form record
 * - The ChildID column used to associate the form with a client
 * - The columns that are allowed to be inserted/updated
 *
 * Keeping these definitions in one place allows the application
 * to use the same configuration for different form types and
 * avoids duplicating database mapping logic throughout the code.
 */
export const FORM_CONFIGS: Record<FormName, FormConfig> = {

  /**
   * Active Form
   *
   * Stores Active form information for a client.
   */
  active: {
    name: "active",

    // SQL Server table containing Active form records.
    table: "dbo.stblActiveForm",

    // Primary key of the Active form record.
    idColumn: "ID",

    // Links the form record to the client.
    childIdColumn: "ChildID",

    // Only these columns are permitted to be written to the database.
    // Database-managed/read-only columns should not be included here.
    writableColumns: [
      "ChildID",
      "FormDate",
      "FormType",
      "Region",
      "MonthReporting",
      "SU_id",
      "SUName",
      "CountyCode",
      "Town",
      "FamilyIsSvcCord",
      "SvcCordFirstName",
      "SvcCordLastName",
      "SvcCordType",
      "SvcCordOtherDesc",
      "CAPTA",
      "ReferralDate",
      "ReReferralDate",
      "Address",
      "ZipCode",
      "Ethnicity",
      "InterimDate",
      "InitialEvalDate",
      "EvalWithin45Days",
      "DelayFC",
      "DelayFCOther",
      "DelayNotFC",
      "DelayNotFCOther",
      "InitEval45Compliant",
      "InitEval45FC",
      "InitEval45NC",
      "InitialMeetingDate",
      "MeetingWithin45Days",
      "MeetingDelayFC",
      "MeetingDelayFCOther",
      "MeetingDelayNC",
      "MeetingDelayNCOther",
      "InitMeeting45Compliant",
      "InitMeeting45FC",
      "InitMeeting45NC",
      "BothCompliant",
      "BothFC",
      "BothNC",
      "DDAll",
      "DDAdaptive",
      "DDCognitive",
      "DDCommunication",
      "DDMotor",
      "DDSocial",
      "DCAttachment",
      "DCAutism",
      "DCSuspected",
      "DCBlind",
      "DCDeaf",
      "DCDown",
      "DCCerebral",
      "DCCraniofacial",
      "DCFragile",
      "DCOral",
      "DCBirth",
      "DCOther",
      "DCOtherDesc",
      "ConsentDate",
      "InsertUser",
      "LastUpdateDate",
      "LastUpdateUser",
      "AutismDate",
      "SuspectedDate",
      "BlindDate",
      "DeafDate",
    ],
  },

  /**
   * COS Cover Form
   *
   * Stores COS Cover information for a client.
   */
  "cos-cover": {
    name: "cos-cover",

    // SQL Server table containing COS Cover form records.
    table: "dbo.stblCOSCoverForm",

    // Primary key of the COS Cover form record.
    idColumn: "COSCoverID",

    // Links the form record to the client.
    childIdColumn: "ChildID",

    // Columns that can be written by the application.
    writableColumns: [
      "ChildID",
      "FormDate",
      "FormType",
      "Region",
      "OnePlanDate",
      "EntryOrExit",
      "EligCommunication",
      "EligMildDelay",
      "EligSignificantDelay",
      "EligAutism",
      "EligCerebralPalsy",
      "EligVision",
      "EligOther",
      "EligOtherDesc",
      "Ethnicity",
      "CAPTAReferral",
      "ExitDate",
      "TimeInProgram",
      "SvcChildCare",
      "SvcSpecChildCare",
      "SvcHeadStart",
      "SvcECMH",
      "SvcFamilySupport",
      "SvcNursing",
      "SvcCSHN",
      "SvcReachUp",
      "SvcWIC",
      "LevelOfServices",
      "LevelOfServicesOtherDesc",
      "Outcome1",
      "Outcome1Support",
      "NewSkills1",
      "NewSkills1Explain",
      "Outcome2",
      "Outcome2Support",
      "NewSkills2",
      "NewSkills2Explain",
      "Outcome3",
      "Outcome3Support",
      "NewSkills3",
      "NewSkills3Explain",
      "InsertUser",
      "LastUpdateDate",
      "LastUpdateUser",
    ],
  },

  /**
   * Exit Form
   *
   * Stores client exit and transition information.
   */
  exit: {
    name: "exit",

    // SQL Server table containing Exit form records.
    table: "dbo.stblExitForm",

    // Primary key of the Exit form record.
    idColumn: "ID",

    // Links the form record to the client.
    childIdColumn: "ChildID",

    // Columns that can be written by the application.
    writableColumns: [
      "ChildID",
      "FormDate",
      "FormType",
      "Region",
      "MonthReporting",
      "SU_id",
      "SUName",
      "CountyCode",
      "Town",
      "SvcCordFirstName",
      "SvcCordLastName",
      "SvcCordType",
      "SvcCordOtherDesc",
      "CAPTA",
      "ReferralDate",
      "ReReferralDate",
      "COSFEnter30Months",
      "COSFEntryForm",
      "COSFEntryFormReason",
      "COSFGot6MonthsSvcs",
      "COSFExitForm",
      "COSFExitFormReason",
      "ExitDate",
      "TransitionPlanCompleted",
      "TransitionPlanReason",
      "CLLEANotificationDate",
      "Notified90Days",
      "NotifiedReason",
      "NotifyStatePartC",
      "TransitionMeeting",
      "TransitionMeeting90day",
      "NoTransitionMtgReason",
      "ExitPriorToAge3",
      "MovedOtherRegion",
      "ExitAtAge3",
      "EXFNoPartB1",
      "EXFNoPartB2",
      "EXFNoPartB3",
      "ReferredTo",
      "InsertUser",
      "LastUpdateDate",
      "LastUpdateUser",
    ],
  },

  /**
   * Insurance Form
   *
   * Stores insurance coverage information for a client.
   */
  insurance: {
    name: "insurance",

    // SQL Server table containing Insurance form records.
    table: "dbo.stblInsuranceForm",

    // Primary key of the Insurance form record.
    idColumn: "ID",

    // Links the form record to the client.
    childIdColumn: "ChildID",

    // Columns that can be written by the application.
    writableColumns: [
      "ChildID",
      "FormDate",
      "FormType",
      "InsCoNumber",
      "InsuranceName",
      "BranchAddress",
      "PolicyNumber",
      "CoverageCode",
      "EffectiveDate",
      "EndDate",
      "PolicyHolder",
      "GroupNumber",
      "GroupName",
      "Phone",
      "BillingConsent",
      "ParentSignatureDate",
      "DeclineReasonCap",
      "DeclineReasonPremium",
      "DeclineReasonBenefits",
      "DeclineReasonEligibility",
      "ParentSignatureDate2",
      "InsertUser",
      "LastUpdateDate",
      "LastUpdateUser",
    ],
  },

  /**
   * No One Plan Form
   *
   * Stores information for clients who do not have an active One Plan.
   */
  "no-one-plan": {
    name: "no-one-plan",

    // SQL Server table containing No One Plan form records.
    table: "dbo.stblNoOnePlanForm",

    // Primary key of the No One Plan form record.
    idColumn: "ID",

    // Links the form record to the client.
    childIdColumn: "ChildID",

    // Columns that can be written by the application.
    writableColumns: [
      "ChildID",
      "FormDate",
      "FormType",
      "Region",
      "MonthReporting",
      "RefStatus",
      "Screening",
      "ReferredBack",
      "StatusDate",
      "InsertUser",
      "LastUpdateDate",
      "LastUpdateUser",
    ],
  },

  /**
   * Referral Form
   *
   * Stores referral, referral source, insurance, and eligibility information.
   */
  referral: {
    name: "referral",

    // SQL Server table containing Referral form records.
    table: "dbo.stblReferralForm",

    // Primary key of the Referral form record.
    idColumn: "ID",

    // Links the form record to the client.
    childIdColumn: "ChildID",

    // Columns that can be written by the application.
    writableColumns: [
      "ChildID",
      "FormDate",
      "FormType",
      "Region",
      "MonthReporting",
      "SU_id",
      "SUName",
      "CountyCode",
      "Town",
      "FamilyIsSvcCord",
      "SvcCordFirstName",
      "SvcCordLastName",
      "SvcCordType",
      "SvcCordOtherDesc",
      "ReferralDate",
      "ReReferralDate",
      "Ethnicity",
      "PrimaryLanguage",
      "PrimaryLanguageOther",
      "SecondaryLanguage",
      "SecondaryLanguageOther",
      "CAPTAReferral",
      "Custody",
      "EducationalSurrogate",
      "Medicaid",
      "Private",
      "NoInsurance",
      "CSHN",
      "RefSrcCISIntake",
      "RefSrcPrimaryProv",
      "RefSrcChildCare",
      "RefSrcFamily",
      "RefSrcSchool",
      "RefSrcDCF",
      "RefSrcOther",
      "RefSrcOtherDesc",
      "RefConAll",
      "RefConAdaptive",
      "RefConCognitive",
      "RefConCommunication",
      "RefConMotor",
      "RefConSocial",
      "RefConScreening",
      "RefConOther",
      "RefConOtherDesc",
      "InsertUser",
      "LastUpdateDate",
      "LastUpdateUser",
      "NonEarlyIntervention",
    ],
  },

  /**
   * Service Grid Form
   *
   * Stores service grid information for a client.
   */
  "service-grid": {
    name: "service-grid",

    // SQL Server table containing Service Grid form records.
    table: "dbo.stblServiceGridForm",

    // Primary key of the Service Grid form record.
    idColumn: "ServiceGridID",

    // Links the form record to the client.
    childIdColumn: "ChildID",

    // Columns that can be written by the application.
    writableColumns: [
      "ChildID",
      "FormDate",
      "FormType",
      "ReferralDate",
      "ConsentDate",
      "InsertUser",
      "LastUpdateDate",
      "LastUpdateUser",
    ],
  },
};