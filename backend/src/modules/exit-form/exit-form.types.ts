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

/**
 * Values derived from the stored dates. They are returned with every
 * form for the Transition Information step and are never saved.
 * A null means one of the dates it needs is missing.
 *
 * "X before exit" counts are positive when X happened before the exit
 * date, matching the legacy DateDiff(day, X, EndDate) in BaseResults0801.
 */
export interface ExitFormCalculated {
  thirdBirthday: string | null;
  daysLEANotificationBeforeExit: number | null;
  daysTransitionConferenceBeforeExit: number | null;
  daysTransitionPlanBeforeExit: number | null;
  /** Positive when the child exits before turning 3. */
  daysExitBeforeThirdBirthday: number | null;
  /** LEA notified between 6 months and 90 days before the 3rd birthday. */
  leaNotificationWindowMet: boolean | null;
  /** Transition conference 90-180 days before exit (legacy FedComplianceC). */
  transitionConferenceWindowMet: boolean | null;
  /** Transition plan 90-180 days before exit (legacy FedComplianceA). */
  transitionPlanWindowMet: boolean | null;
}

export type ExitFormWithCalculated = ExitFormRecord & {
  Calculated: ExitFormCalculated;
};

/** Values copied into a new Exit form from the child's earlier forms. */
export interface ExitFormDefaults {
  Region: number | null;
  ReferralDate: string | null;
  /** Most recent Referral/NOPR/Active/Exit form type, or null if none. */
  previousFormType: string | null;
  warnings: string[];
}
