export interface ActiveFormClient {
  ChildID: number;
  Region: string | null;
  LastName: string | null;
  FirstName: string | null;
  SS: string | null;
  SSTemp: boolean | null;
  DOB: string | null;
  Gender: string | null;
  Notes: string | null;
  NonEarlyIntervention: boolean | null;
}

export interface ActiveFormRecord {
  ID?: number;
  ChildID?: number;
  FormDate?: string | null;
  FormType?: string | null;
  status?: string | null;
  Region?: string | null;
  SU_id?: number | null;
  SUName?: string | null;
  CountyCode?: string | null;
  Town?: string | null;
  SvcCordFirstName?: string | null;
  SvcCordLastName?: string | null;
  SvcCordType?: string | null;
  CAPTA?: boolean | null;
  ReferralDate?: string | null;
  InitialEvalDate?: string | null;
  InitialMeetingDate?: string | null;
  onePlanDate?: string | null;
  DelayFC?: string | null;
  DelayFCOther?: string | null;
  DelayNotFC?: string | null;
  DelayNotFCOther?: string | null;
  MeetingDelayFC?: string | null;
  MeetingDelayFCOther?: string | null;
  MeetingDelayNC?: string | null;
  MeetingDelayNCOther?: string | null;
  DDAll?: boolean | null;
  DDAdaptive?: boolean | null;
  DDCognitive?: boolean | null;
  DDCommunication?: boolean | null;
  DDMotor?: boolean | null;
  DDSocial?: boolean | null;
  DCAttachment?: boolean | null;
  DCAutism?: boolean | null;
  DCSuspected?: boolean | null;
  DCBlind?: boolean | null;
  DCDeaf?: boolean | null;
  DCDown?: boolean | null;
  DCCerebral?: boolean | null;
  DCCraniofacial?: boolean | null;
  DCFragile?: boolean | null;
  DCOral?: boolean | null;
  DCBirth?: boolean | null;
  DCOther?: boolean | null;
  DCOtherDesc?: string | null;
  AutismDate?: string | null;
  SuspectedDate?: string | null;
  BlindDate?: string | null;
  DeafDate?: string | null;
  [key: string]: unknown;
}

export interface ActiveFormResponse {
  client: ActiveFormClient;
  forms: ActiveFormRecord[];
}

export interface SupervisoryUnionLookup {
  SU_id: number;
  SUName: string;
  SortOrder?: number | null;
}

export interface TownLookup {
  Town: string;
  TownName: string;
  SU_id: number | null;
  CountyCode: string | null;
  CountyName: string | null;
}

export interface ServiceCoordinatorTypeLookup {
  SvcCordType: string;
  SvcCordTypeDesc: string;
}

export interface DelayReasonLookup {
  Reason: string;
}

export interface DelayReasonsResponse {
  family: DelayReasonLookup[];
  provider: DelayReasonLookup[];
}

export interface ActiveFormValues {
  Region: string;
  SU_id: number | null;
  SUName: string;
  Town: string;
  CountyCode: string;
  SvcCordFirstName: string;
  SvcCordLastName: string;
  SvcCordType: string;
  ReferralDate: string;
  status: string;
  InitialEvalDate: string;
  DelayFC: string;
  DelayFCOther: string;
  DelayNotFC: string;
  DelayNotFCOther: string;
  onePlanDate: string;
  MeetingDelayFC: string;
  MeetingDelayFCOther: string;
  MeetingDelayNC: string;
  MeetingDelayNCOther: string;
  DDAll: boolean;
  DDAdaptive: boolean;
  DDCognitive: boolean;
  DDCommunication: boolean;
  DDMotor: boolean;
  DDSocial: boolean;
  DCAttachment: boolean;
  DCAutism: boolean;
  AutismDate: string;
  DCSuspected: boolean;
  SuspectedDate: string;
  DCBlind: boolean;
  BlindDate: string;
  DCDeaf: boolean;
  DeafDate: string;
  DCDown: boolean;
  DCCerebral: boolean;
  DCCraniofacial: boolean;
  DCFragile: boolean;
  DCOral: boolean;
  DCBirth: boolean;
  DCOther: boolean;
  DCOtherDesc: string;
}

export const DEFAULT_ACTIVE_FORM_VALUES: ActiveFormValues = {
  Region: '', SU_id: null, SUName: '', Town: '', CountyCode: '',
  SvcCordFirstName: '', SvcCordLastName: '', SvcCordType: '',
  ReferralDate: '', status: '', InitialEvalDate: '', DelayFC: '', DelayFCOther: '',
  DelayNotFC: '', DelayNotFCOther: '', onePlanDate: '', MeetingDelayFC: '',
  MeetingDelayFCOther: '', MeetingDelayNC: '', MeetingDelayNCOther: '',
  DDAll: false, DDAdaptive: false, DDCognitive: false, DDCommunication: false,
  DDMotor: false, DDSocial: false, DCAttachment: false, DCAutism: false,
  AutismDate: '', DCSuspected: false, SuspectedDate: '', DCBlind: false,
  BlindDate: '', DCDeaf: false, DeafDate: '', DCDown: false, DCCerebral: false,
  DCCraniofacial: false, DCFragile: false, DCOral: false, DCBirth: false,
  DCOther: false, DCOtherDesc: '',
};

export interface RegionLookup {
  ID: number;
  RName: string;
  Description?: string | null;
  Inactive?: boolean;
}
