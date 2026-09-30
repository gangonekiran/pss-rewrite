export const COS_COVER_TABLE = 'dbo.stblCOSCoverForm';

export const WRITABLE_COLUMNS = [
  'FormDate', 'FormType', 'Region', 'OnePlanDate', 'EntryOrExit', 'ExitDate',
  'Outcome1', 'Outcome1Support', 'Outcome2', 'Outcome2Support',
  'Outcome3', 'Outcome3Support',
] as const;

export type WritableColumn = (typeof WRITABLE_COLUMNS)[number];
