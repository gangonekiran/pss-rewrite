export type ActiveFormRecord = Record<string, unknown>;

export interface ActiveFormClient {
  ChildID: number; Region: string | null; LastName: string; FirstName: string;
  SS: string | null; SSTemp: boolean; DOB: string | null; Gender: string | null;
  Notes: string | null; NonEarlyIntervention: boolean;
}

export interface ActiveFormWithClient {
  client: ActiveFormClient;
  form: ActiveFormRecord | null;
}

export interface TownLookup {
  Town: string; TownName: string; SU_id: number | null;
  CountyCode: string | null; CountyName: string | null;
}
