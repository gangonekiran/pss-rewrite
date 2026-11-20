export type NoprFormRecord = Record<string, unknown>;

export interface NoprFormClient {
  ChildID: number;
  Region: number | null;
  LastName: string | null;
  FirstName: string | null;
  SS: string | null;
  DOB: string | null;
}

/** Values a new NOPR form starts with, and the referral date the status date is checked against. */
export interface NoprFormDefaults {
  Region: number | null;
  MostRecentReferralDate: string | null;
}
