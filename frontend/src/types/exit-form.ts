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

/** Values shown in Transition Information, worked out from the dates as the user types. */
export interface ExitFormCalculated {
  thirdBirthday: string | null;
  daysReferralToTransitionPlan: number | null;
  daysLEANotificationBeforeExit: number | null;
  daysTransitionConferenceBeforeExit: number | null;
  daysExitBeforeThirdBirthday: number | null;
}

/** A stblExitForm row as returned by /api/exit-forms (the columns the form uses). */
export interface ExitFormRecord {
  ID?: number;
  ChildID?: number;
  FormDate?: string | null;
  FormType?: string | null;
  Region?: number | null;
  ReferralDate?: string | null;
  ExitDate?: string | null;
  TransitionPlanCompleted?: string | null;
  TransitionPlanReason?: string | null;
  CLLEANotificationDate?: string | null;
  TransitionMeeting?: string | null;
  ExitPriorToAge3?: number | null;
  MovedOtherRegion?: string | null;
  ExitAtAge3?: number | null;
  ReferredTo?: number | null;
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
}

export interface CodeOption {
  code: number;
  label: string;
}

export interface ExitFormOptions {
  exitPriorToAge3: CodeOption[];
  exitAtAge3: CodeOption[];
  referredTo: CodeOption[];
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
  TransitionPlanReason: string;
  CLLEANotificationDate: string;
  TransitionMeeting: string;

  // Exit Details
  exitPath: ExitPath;
  ExitPriorToAge3: string;
  MovedOtherRegion: string;
  ExitAtAge3: string;
  ReferredTo: string;
}

export const DEFAULT_EXIT_FORM_VALUES: ExitFormValues = {
  Region: 0,
  ReferralDate: '',
  ExitDate: '',

  TransitionPlanCompleted: '',
  TransitionPlanReason: '',
  CLLEANotificationDate: '',
  TransitionMeeting: '',

  exitPath: '',
  ExitPriorToAge3: '',
  MovedOtherRegion: '',
  ExitAtAge3: '',
  ReferredTo: '',
};
