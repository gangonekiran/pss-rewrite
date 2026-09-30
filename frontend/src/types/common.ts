export interface Option {
  label: string;
  value: string | number;
}

export interface Pagination {
  page: number;
  pageSize: number;
  totalRecords: number;
}

export interface Sort {
  field: string;
  direction: 'asc' | 'desc';
}

export interface TownLookup {
  Town: string;
  TownName: string;
  SU_id: number | null;
  CountyCode: string | null;
  CountyName: string | null;
}

export interface RegionLookup {
  ID: number;
  RName: string;
  Description?: string | null;
  Inactive?: boolean;
}
