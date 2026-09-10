export const ACTIVE_FORM_TABLE = "dbo.stblActiveForm";

export const WRITABLE_COLUMNS = [
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
  "LastUpdateUser",
  "AutismDate",
  "SuspectedDate",
  "BlindDate",
  "DeafDate",
] as const;

export type WritableColumn = (typeof WRITABLE_COLUMNS)[number];

export const DELAY_FAMILY_LOOKUP = "dbo.slstActiveDelayFC";
export const DELAY_PROVIDER_LOOKUP = "dbo.slstActiveDelayNFC";
export const SU_LOOKUP = "dbo.slstSU";
export const TOWN_LOOKUP = "dbo.slstTownCodes";
export const COUNTY_LOOKUP = "dbo.slstCounties";
export const SERVICE_COORDINATOR_LOOKUP = "dbo.slstSvcCordType";

/**
 * Existing-schema aliases:
 * status -> FormType
 * onePlanDate -> InitialMeetingDate
 *
 * stblActiveForm has no OnePlanDate column. The separate
 * stblCOSCoverForm.OnePlanDate is not modified here.
 */
