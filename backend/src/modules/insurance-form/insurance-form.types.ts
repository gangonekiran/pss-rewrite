export type InsuranceFormRecord = Record<string, unknown>;

export interface InsuranceFormClient {
  ChildID: number;
  LastName: string | null;
  FirstName: string | null;
  SS: string | null;
  DOB: string | null;
}
