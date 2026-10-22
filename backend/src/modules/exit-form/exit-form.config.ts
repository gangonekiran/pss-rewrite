export const EXIT_FORM_TABLE = "dbo.stblExitForm";
export const REFERRAL_FORM_TABLE = "dbo.stblReferralForm";
export const ACTIVE_FORM_TABLE = "dbo.stblActiveForm";
export const SU_LOOKUP = "dbo.slstSU";
export const KEY_FORMS_VIEW = "dbo.sqryKeyFormsCombined";
export const FORM_NAMES_LOOKUP = "dbo.slstFormNames";

/**
 * Legacy value stored in FormType. slstFormNames, sqryFormListComplete
 * (loop errors) and the FITP extract all expect the literal 'Exit'.
 * CAPTA is stored separately in the CAPTA column.
 */
export const EXIT_FORM_TYPE = "Exit";

/**
 * Column types drive both payload validation and SQL parameter binding.
 * InsertDate/InsertUser/LastUpdateDate/LastUpdateUser are left to the
 * column defaults and are never written from the API.
 */
export type ColumnKind = "int" | "yesNo" | "bit" | "date" | "text";

export const COLUMNS = {
  FormDate: { kind: "date" },
  FormType: { kind: "text", max: 12 },
  Region: { kind: "int" },
  MonthReporting: { kind: "int" },
  SU_id: { kind: "int" },
  SUName: { kind: "text", max: 50 },
  CountyCode: { kind: "text", max: 12 },
  Town: { kind: "text", max: 3 },
  SvcCordFirstName: { kind: "text", max: 50 },
  SvcCordLastName: { kind: "text", max: 50 },
  SvcCordType: { kind: "int" },
  SvcCordOtherDesc: { kind: "text", max: 255 },
  CAPTA: { kind: "yesNo" },
  ReferralDate: { kind: "date" },
  ReReferralDate: { kind: "date" },
  COSFEnter30Months: { kind: "yesNo" },
  COSFEntryForm: { kind: "yesNo" },
  COSFEntryFormReason: { kind: "text" },
  COSFGot6MonthsSvcs: { kind: "yesNo" },
  COSFExitForm: { kind: "yesNo" },
  COSFExitFormReason: { kind: "text" },
  ExitDate: { kind: "date" },
  TransitionPlanCompleted: { kind: "date" },
  TransitionPlanReason: { kind: "text" },
  CLLEANotificationDate: { kind: "date" },
  Notified90Days: { kind: "yesNo" },
  NotifiedReason: { kind: "text" },
  NotifyStatePartC: { kind: "yesNo" },
  TransitionMeeting: { kind: "date" },
  TransitionMeeting90day: { kind: "yesNo" },
  NoTransitionMtgReason: { kind: "text" },
  ExitPriorToAge3: { kind: "int" },
  MovedOtherRegion: { kind: "text", max: 255 },
  ExitAtAge3: { kind: "int" },
  EXFNoPartB1: { kind: "bit" },
  EXFNoPartB2: { kind: "bit" },
  EXFNoPartB3: { kind: "bit" },
  ReferredTo: { kind: "int" },
} as const satisfies Record<string, { kind: ColumnKind; max?: number }>;

export type WritableColumn = keyof typeof COLUMNS;

export const WRITABLE_COLUMNS = Object.keys(COLUMNS) as WritableColumn[];

/**
 * Code lists taken from the MS_Description of each stblExitForm column.
 * There are no lookup tables for these in dbCDD, so they live here.
 */
export const EXIT_PRIOR_TO_AGE_3 = [
  { code: 1, label: "Development at appropriate level" },
  { code: 2, label: "Moved to other region" },
  { code: 3, label: "Moved out of state" },
  { code: 4, label: "Withdrawn by parent or guardian" },
  { code: 5, label: "Unable to contact" },
  { code: 6, label: "Deceased" },
] as const;

export const EXIT_AT_AGE_3 = [
  { code: 1, label: "Child is potentially eligible for Part B services" },
  {
    code: 2,
    label:
      "Child is potentially eligible for Part B services - child's family declined further service",
  },
  {
    code: 3,
    label:
      "Child is thought to be eligible, however, potential eligibility for EEE not determined",
  },
  { code: 4, label: "Child is NOT eligible for Part B" },
] as const;

export const REFERRED_TO = [
  { code: 1, label: "Head Start" },
  { code: 2, label: "Community-based Child Care Program or Preschool" },
  { code: 3, label: "School based Pre-School Classroom" },
  { code: 4, label: "Children's Integrated Services Coordinator" },
  // 5 is new (not in the column's MS_Description). Legacy annual exit reports
  // count every code except 99 as "referred", so Other is counted correctly.
  { code: 5, label: "Other" },
  { code: 99, label: "Exited with no referral" },
] as const;

/**
 * Legacy convention: an exit takes exactly one path, and the column for
 * the other path holds 0 (not NULL). BaseResults0801 reads
 * ExitPriortoAge3 = 0 as "Exit at age 3" and ExitAtAge3 = 0 as "Ignore";
 * DCInd8*ReasonForDelay filter on the same 0 values.
 */
export const NOT_THIS_EXIT_PATH = 0;

/** Exit-at-age-3 code meaning "not eligible", the only one that uses EXFNoPartB1-3. */
export const EXIT_AT_AGE_3_NOT_ELIGIBLE = 4;

/** ExitPriorToAge3 code that uses MovedOtherRegion. */
export const EXIT_PRIOR_MOVED_OTHER_REGION = 2;

export const NO_PART_B_REASONS = [
  { column: "EXFNoPartB1", label: "Child's development is at appropriate level" },
  {
    column: "EXFNoPartB2",
    label: "Child did not meet Part C's criteria for potential eligibility",
  },
  {
    column: "EXFNoPartB3",
    label: "Child did not meet Part B's eligibility at Transition Conference",
  },
] as const;

/**
 * UI status values (Client Information step) and how they map to the
 * legacy FormType + CAPTA columns.
 */
export const STATUS_OPTIONS = [
  { value: "exit", label: "Exit CIS-EI", capta: false },
  { value: "exit-capta", label: "Exit CIS-EI - CAPTA", capta: true },
] as const;
