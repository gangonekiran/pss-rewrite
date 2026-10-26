export type ExitFormRecord = Record<string, unknown>;

export interface ExitFormClient {
  ChildID: number;
  Region: number | null;
  LastName: string | null;
  FirstName: string | null;
  SS: string | null;
  SSTemp: boolean | null;
  DOB: string | null;
  Gender: string | null;
  Notes: string | null;
  NonEarlyIntervention: boolean;
}

/** Values copied into a new Exit form from the child's earlier forms. */
export interface ExitFormDefaults {
  Region: number | null;
  ReferralDate: string | null;
}
