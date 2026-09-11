export interface ActiveFormClient {
  ChildID: number;
  Region: number;
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
  Region?: number;
  SvcCordFirstName?: string | null;
  SvcCordLastName?: string | null;
  ReferralDate?: string | null;
  InitialEvalDate?: string | null;
  onePlanDate?: string | null;
  DelayReason?: string | null;
  DelayDetails?: string | null;
  MeetingDelayReason?: string | null;
  MeetingDelayDetails?: string | null;
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
  DCTorticollis?: boolean | null;
  DCPlagiocephaly?: boolean | null;
  DCPrematurity?: boolean | null;
  DCBehavior?: boolean | null;
  DCNutrition?: boolean | null;
  DCNAS?: boolean | null;
  DCCysticFibrosis?: boolean | null;
  DCHIE?: boolean | null;
  DCFeeding?: boolean | null;
 
  DCOtherDesc?: string | null;
  NMNEI?: boolean | null;
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

export interface SupervisoryUnionLookup { SU_id: number; SUName: string; SortOrder?: number | null; }
export interface TownLookup { Town: string; TownName: string; SU_id: number | null; CountyCode: string | null; CountyName: string | null; }
export interface ServiceCoordinatorTypeLookup { SvcCordType: string; SvcCordTypeDesc: string; }
export interface DelayReasonLookup { Reason: string; }
export interface DelayReasonsResponse { family: DelayReasonLookup[]; provider: DelayReasonLookup[]; }
export interface RegionLookup { ID: number; RName: string; Description?: string | null; Inactive?: boolean; }

export interface ActiveFormValues {
  Region: number;
  SvcCordFirstName: string;
  SvcCordLastName: string;
  ReferralDate: string;
  status: string;
  InitialEvalDate: string;
  DelayReason: string;
  DelayDetails: string;
  MeetingDelayReason: string;
  MeetingDelayDetails: string;
  onePlanDate: string;
  DDAll: boolean; DDAdaptive: boolean; DDCognitive: boolean; DDCommunication: boolean;
  DDMotor: boolean; DDSocial: boolean; DCAttachment: boolean; DCAutism: boolean;
  DCSuspected: boolean; DCBlind: boolean; DCDeaf: boolean; DCDown: boolean;
  DCCerebral: boolean; DCCraniofacial: boolean; DCFragile: boolean; DCOral: boolean;
  DCBirth: boolean; DCTorticollis: boolean; DCPlagiocephaly: boolean; DCPrematurity: boolean;
  DCBehavior: boolean; DCNutrition: boolean; DCNAS: boolean; DCCysticFibrosis: boolean;
  DCHIE: boolean; DCFeeding: boolean; DCOtherDesc: string; NMNEI: boolean;
  AutismDate: string; SuspectedDate: string; BlindDate: string; DeafDate: string;
}

export const DEFAULT_ACTIVE_FORM_VALUES: ActiveFormValues = {
  Region: 0, SvcCordFirstName: '', SvcCordLastName: '', ReferralDate: '', status: '', InitialEvalDate: '',
  DelayReason: '', DelayDetails: '', MeetingDelayReason: '', MeetingDelayDetails: '', onePlanDate: '',
  DDAll: false, DDAdaptive: false, DDCognitive: false, DDCommunication: false, DDMotor: false,
  DDSocial: false, DCAttachment: false, DCAutism: false, DCSuspected: false, DCBlind: false,
  DCDeaf: false, DCDown: false, DCCerebral: false, DCCraniofacial: false, DCFragile: false,
  DCOral: false, DCBirth: false, DCTorticollis: false, DCPlagiocephaly: false, DCPrematurity: false,
  DCBehavior: false, DCNutrition: false, DCNAS: false, DCCysticFibrosis: false, DCHIE: false,
  DCFeeding: false, DCOtherDesc: '', NMNEI: false, AutismDate: '', SuspectedDate: '',
  BlindDate: '', DeafDate: '',
};
