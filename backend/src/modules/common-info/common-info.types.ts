export interface RegionLookup {
  ID: number;
  RName: string;
  Description: string | null;
  Inactive: boolean | null;
}

export interface TownLookup {
  Town: string;
  TownName: string;
  SU_id: number | null;
  CountyCode: string | null;
  CountyName: string | null;
}
