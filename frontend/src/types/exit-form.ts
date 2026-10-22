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
  NonEarlyIntervention: boolean | null;
}

/** Derived by the API from the saved dates; never sent back. */
export interface ExitFormCalculated {
  thirdBirthday: string | null;
  daysLEANotificationBeforeExit: number | null;
  daysTransitionConferenceBeforeExit: number | null;
  daysTransitionPlanBeforeExit: number | null;
  daysExitBeforeThirdBirthday: number | null;
  leaNotificationWindowMet: boolean | null;
  transitionConferenceWindowMet: boolean | null;
  transitionPlanWindowMet: boolean | null;
}

/** A stblExitForm row as returned by /api/exit-forms. Yes/No columns are -1 / 0. */
export interface ExitFormRecord {
  ID?: number;
  ChildID?: number;
  FormDate?: string | null;
  FormType?: string | null;
  Region?: number | null;
  SU_id?: number | null;
  SUName?: string | null;
  CountyCode?: string | null;
  Town?: string | null;
  SvcCordFirstName?: string | null;
  SvcCordLastName?: string | null;
  CAPTA?: number | null;
  ReferralDate?: string | null;
  ExitDate?: string | null;
  TransitionPlanCompleted?: string | null;
  TransitionPlanReason?: string | null;
  CLLEANotificationDate?: string | null;
  Notified90Days?: number | null;
  NotifiedReason?: string | null;
  NotifyStatePartC?: number | null;
  TransitionMeeting?: string | null;
  TransitionMeeting90day?: number | null;
  NoTransitionMtgReason?: string | null;
  ExitPriorToAge3?: number | null;
  MovedOtherRegion?: string | null;
  ExitAtAge3?: number | null;
  EXFNoPartB1?: boolean | null;
  EXFNoPartB2?: boolean | null;
  EXFNoPartB3?: boolean | null;
  ReferredTo?: number | null;
  Calculated?: ExitFormCalculated;
  [key: string]: unknown;
}

export interface ExitFormResponse {
  client: ExitFormClient;
  forms: ExitFormRecord[];
}

/** Prefill for a new Exit form, from the child's latest Active / Referral form. */
export interface ExitFormDefaults {
  Region: number | null;
  ReferralDate: string | null;
  /** Most recent Referral / NOPR / Active / Exit form type, or null if none. */
  previousFormType: string | null;
  warnings: string[];
}

export interface CodeOption {
  code: number;
  label: string;
}

export interface ExitFormOptions {
  formType: string;
  exitPriorToAge3: CodeOption[];
  exitAtAge3: CodeOption[];
  referredTo: CodeOption[];
  noPartBReasons: Array<{ column: 'EXFNoPartB1' | 'EXFNoPartB2' | 'EXFNoPartB3'; label: string }>;
}

/** When the child left the program: one of the two legacy exit paths. */
export type ExitPath = '' | 'prior' | 'atAge3';

/** react-hook-form model. Radios hold strings; mapping to the API is in exit-form.mappers.ts. */
export interface ExitFormValues {
  // General Information
  Region: number;
  ReferralDate: string;
  ExitDate: string;

  // Transition Information
  TransitionPlanCompleted: string;
  CLLEANotificationDate: string;
  TransitionMeeting: string;

  // Exit Details
  exitPath: ExitPath;
  ExitPriorToAge3: string;
  MovedOtherRegion: string;
  ExitAtAge3: string;
  EXFNoPartB1: boolean;
  EXFNoPartB2: boolean;
  EXFNoPartB3: boolean;
  ReferredTo: string;
}

export const DEFAULT_EXIT_FORM_VALUES: ExitFormValues = {
  Region: 0,
  ReferralDate: '',
  ExitDate: '',

  TransitionPlanCompleted: '',
  CLLEANotificationDate: '',
  TransitionMeeting: '',

  exitPath: '',
  ExitPriorToAge3: '',
  MovedOtherRegion: '',
  ExitAtAge3: '',
  EXFNoPartB1: false,
  EXFNoPartB2: false,
  EXFNoPartB3: false,
  ReferredTo: '',
};
