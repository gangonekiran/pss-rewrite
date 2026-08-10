export type FormName = "active"|"cos-cover"|"exit"|"insurance"|"no-one-plan"|"referral"|"service-grid";
export interface InputFormRecord { [key:string]: unknown; }
export interface FormConfig { name:FormName; table:string; idColumn:string; childIdColumn:string; writableColumns:readonly string[]; }


export interface InputFormHistoryRow {
  id: number;
  date: string | null;
  formType: string | null;
  referral: string | null;
  nopr: string | null;
  interim: string | null;
  op: string | null;
  exit: string | null;
  loopError: boolean;
  formName: FormName;
}
