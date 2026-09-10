import { z } from 'zod';

const date = z.string().refine((value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value), 'Enter a valid date.');

export const activeFormSchema = z.object({
  Region: z.string().min(1, 'Region is required.'),
  SU_id: z.number().int().positive().nullable(),
  SUName: z.string(),
  Town: z.string(),
  CountyCode: z.string(),
  SvcCordFirstName: z.string(),
  SvcCordLastName: z.string(),
  SvcCordType: z.string(),
  ReferralDate: date,
  status: z.string(),
  InitialEvalDate: date,
  DelayFC: z.string(), DelayFCOther: z.string(),
  DelayNotFC: z.string(), DelayNotFCOther: z.string(),
  onePlanDate: date,
  MeetingDelayFC: z.string(), MeetingDelayFCOther: z.string(),
  MeetingDelayNC: z.string(), MeetingDelayNCOther: z.string(),
  DDAll: z.boolean(), DDAdaptive: z.boolean(), DDCognitive: z.boolean(),
  DDCommunication: z.boolean(), DDMotor: z.boolean(), DDSocial: z.boolean(),
  DCAttachment: z.boolean(), DCAutism: z.boolean(), AutismDate: date,
  DCSuspected: z.boolean(), SuspectedDate: date, DCBlind: z.boolean(), BlindDate: date,
  DCDeaf: z.boolean(), DeafDate: date, DCDown: z.boolean(), DCCerebral: z.boolean(),
  DCCraniofacial: z.boolean(), DCFragile: z.boolean(), DCOral: z.boolean(),
  DCBirth: z.boolean(), DCOther: z.boolean(), DCOtherDesc: z.string(),
}).superRefine((value, ctx) => {
  if (value.ReferralDate && value.InitialEvalDate && value.InitialEvalDate < value.ReferralDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['InitialEvalDate'], message: 'Initial evaluation cannot be before referral date.' });
  }
  if (value.ReferralDate && value.onePlanDate && value.onePlanDate < value.ReferralDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['onePlanDate'], message: 'One Plan date cannot be before referral date.' });
  }
});

export type ActiveFormSchema = z.infer<typeof activeFormSchema>;
