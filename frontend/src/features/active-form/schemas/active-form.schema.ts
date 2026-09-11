import { z } from 'zod';

const optionalDate = z.string().refine(
  (value) => !value || /^\d{4}-\d{2}-\d{2}$/.test(value),
  'Enter a valid date.',
);

const optionalText = z.string();

export const activeFormSchema = z.object({
  Region: z.number().int().min(1, 'Region is required.'),
  SvcCordFirstName: optionalText,
  SvcCordLastName: optionalText,
  ReferralDate: optionalDate.refine((value) => Boolean(value), 'Referral date is required.'),
  status: z.string().min(1, 'Status is required.'),
  InitialEvalDate: optionalDate.refine((value) => Boolean(value), 'Initial evaluation date is required.'),
  DelayReason: z.string(),
  DelayDetails: optionalText,
  MeetingDelayReason: z.string(),
  MeetingDelayDetails: optionalText,
  onePlanDate: optionalDate.refine((value) => Boolean(value), 'One Plan date is required.'),
  DDAll: z.boolean(), DDAdaptive: z.boolean(), DDCognitive: z.boolean(), DDCommunication: z.boolean(),
  DDMotor: z.boolean(), DDSocial: z.boolean(), DCAttachment: z.boolean(), DCAutism: z.boolean(),
  DCSuspected: z.boolean(), DCBlind: z.boolean(), DCDeaf: z.boolean(), DCDown: z.boolean(),
  DCCerebral: z.boolean(), DCCraniofacial: z.boolean(), DCFragile: z.boolean(), DCOral: z.boolean(),
  DCBirth: z.boolean(), DCTorticollis: z.boolean(), DCPlagiocephaly: z.boolean(), DCPrematurity: z.boolean(),
  DCBehavior: z.boolean(), DCNutrition: z.boolean(), DCNAS: z.boolean(), DCCysticFibrosis: z.boolean(),
  DCHIE: z.boolean(), DCFeeding: z.boolean(), DCOtherDesc: optionalText,
  NMNEI: z.boolean(), AutismDate: optionalDate, SuspectedDate: optionalDate, BlindDate: optionalDate, DeafDate: optionalDate,
}).superRefine((value, ctx) => {
  const dates = [
    ['ReferralDate', value.ReferralDate],
    ['InitialEvalDate', value.InitialEvalDate],
    ['onePlanDate', value.onePlanDate],
    ['AutismDate', value.AutismDate],
    ['SuspectedDate', value.SuspectedDate],
    ['BlindDate', value.BlindDate],
    ['DeafDate', value.DeafDate],
  ] as const;

  for (const [field, date] of dates) {
    if (date && Number.isNaN(Date.parse(`${date}T00:00:00`))) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: [field], message: 'Enter a valid date.' });
    }
  }

  if (value.InitialEvalDate && value.ReferralDate && value.InitialEvalDate < value.ReferralDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['InitialEvalDate'], message: 'Initial evaluation cannot be before referral date.' });
  }

  if (value.onePlanDate && value.ReferralDate && value.onePlanDate < value.ReferralDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['onePlanDate'], message: 'One Plan date cannot be before referral date.' });
  }
});

export type ActiveFormSchema = z.infer<typeof activeFormSchema>;
