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
