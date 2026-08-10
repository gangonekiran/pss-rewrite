export type InputFormName =
  | "active"
  | "cos-cover"
  | "exit"
  | "insurance"
  | "no-one-plan"
  | "referral"
  | "service-grid";

export interface InputFormHistoryItem {
  id: number;
  date: string | null;
  formType: string;
  referral: string | null;
  nopr: string | null;
  interim: string | null;
  op: string | null;
  exit: string | null;
  loopError: boolean;
  formName: InputFormName;
}

export interface InputFormPayload {
  FormDate?: string;
  FormType?: string;
  Region?: string;
  ReferralDate?: string;
  InterimDate?: string;
  OnePlanDate?: string;
  ExitDate?: string;
  InsertUser?: string;
  [key: string]: unknown;
}

export const INPUT_FORM_OPTIONS: Array<{
  name: InputFormName;
  label: string;
}> = [
  { name: "active", label: "Active" },
  { name: "cos-cover", label: "COS" },
  { name: "exit", label: "Exit" },
  { name: "insurance", label: "Insurance" },
  { name: "no-one-plan", label: "No One Plan" },
  { name: "referral", label: "Referral" },
  { name: "service-grid", label: "Service Grid" },
];
