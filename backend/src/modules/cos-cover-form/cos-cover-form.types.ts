export type COSCoverRecord = Record<string, unknown>;

export interface COSCoverClient {
  ChildID: number;
  Region: string | null;
  LastName: string;
  FirstName: string;
  SS: string | null;
  SSTemp: boolean;
  DOB: string | null;
  Gender: string | null;
  Notes: string | null;
  NonEarlyIntervention: boolean;
}
