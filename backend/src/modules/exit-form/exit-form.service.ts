import { lookups as commonInfoLookups } from "../common-info/common-info.service";
import {
  EXIT_AT_AGE_3,
  EXIT_PRIOR_TO_AGE_3,
  EXIT_FORM_TYPE,
  NO_PART_B_REASONS,
  REFERRED_TO,
} from "./exit-form.config";
import * as repository from "./exit-form.repository";
import {
  applyExitPath,
  calculate,
  clearDependentFields,
  error,
  normalizePayload,
  toIsoDate,
  validateRecord,
} from "./exit-form.rules";
import type {
  ExitFormClient,
  ExitFormDefaults,
  ExitFormRecord,
  ExitFormWithCalculated,
} from "./exit-form.types";

function int(value: unknown, name: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) error(`${name} must be a positive integer`);
  return n;
}

async function child(childId: number): Promise<ExitFormClient> {
  const c = await repository.getClient(childId);
  if (!c) error("Client not found", 404);
  return c;
}

function withCalculated(form: ExitFormRecord, client: ExitFormClient): ExitFormWithCalculated {
  return { ...form, Calculated: calculate(form, client.DOB) };
}

/** Town decides County, and SU# when none was chosen (slstTownCodes). */
async function townMapping(p: ExitFormRecord) {
  if (p.Town === undefined || p.Town === null) return;
  const t = await commonInfoLookups.town(String(p.Town));
  if (!t) error("Town was not found in slstTownCodes");
  p.Town = t.Town;
  p.CountyCode = t.CountyCode;
  if (p.SU_id === undefined && t.SU_id !== null) p.SU_id = t.SU_id;
}

/** SUName is denormalised on the form; keep it in step with SU_id. */
async function suMapping(p: ExitFormRecord) {
  if (p.SU_id === undefined) return;
  if (p.SU_id === null) {
    p.SUName = null;
    return;
  }
  const su = await repository.getSupervisoryUnion(Number(p.SU_id));
  if (!su) error("SU# was not found in slstSU");
  p.SUName = su.SUName;
}

async function prepare(raw: ExitFormRecord) {
  const p = normalizePayload(raw);
  applyExitPath(p);
  clearDependentFields(p);
  await townMapping(p);
  await suMapping(p);
  return p;
}

export async function get(childIdRaw: unknown) {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);
  const forms = await repository.findByChildId(childId);
  return { client, forms: forms.map((f) => withCalculated(f, client)) };
}

export async function getOne(childIdRaw: unknown, idRaw: unknown) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  const client = await child(childId);
  const form = await repository.findOne(childId, id);
  if (!form) error("Exit Form not found", 404);
  return withCalculated(form, client);
}

export async function create(childIdRaw: unknown, raw: ExitFormRecord) {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);
  const p = await prepare(raw);

  if (p.Region === undefined || p.Region === null) error("Region must be selected");
  if (!p.ExitDate) error("Date of Exit is required");

  // FormDate is what the FITP extract and loop logic read as the exit date.
  if (!p.FormDate) p.FormDate = p.ExitDate;

  validateRecord(p, client.DOB);

  const saved = await repository.insert(childId, p);
  if (!saved) error("Exit Form could not be read back after saving", 500);
  return withCalculated(saved, client);
}

export async function update(childIdRaw: unknown, idRaw: unknown, raw: ExitFormRecord) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  const client = await child(childId);

  const existing = await repository.findOne(childId, id);
  if (!existing) error("Exit Form not found", 404);

  const p = await prepare(raw);

  if (p.Region === null) error("Region must be selected");
  if (p.ExitDate === null) error("Date of Exit is required");

  // Keep FormDate following ExitDate while the two were in step.
  if (
    p.ExitDate &&
    p.FormDate === undefined &&
    toIsoDate(existing.FormDate) === toIsoDate(existing.ExitDate)
  ) {
    p.FormDate = p.ExitDate;
  }

  validateRecord({ ...existing, ...p }, client.DOB);

  const saved = await repository.update(childId, id, p);
  if (!saved) error("Exit Form not found", 404);
  return withCalculated(saved, client);
}

export async function remove(childIdRaw: unknown, idRaw: unknown) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  await child(childId);
  if (!(await repository.remove(childId, id))) error("Exit Form not found", 404);
  return { success: true };
}

/**
 * Values to start a new Exit form with: the latest Active form
 * (falling back to the latest Referral form) for the same referral.
 */
export async function defaults(childIdRaw: unknown): Promise<ExitFormDefaults> {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);

  const [active, referral, previousFormType] = await Promise.all([
    repository.findLatestActive(childId),
    repository.findLatestReferral(childId),
    repository.findLatestKeyFormType(childId),
  ]);

  const source = active ?? referral ?? {};

  const warnings: string[] = [];
  if (!previousFormType) {
    warnings.push("This client has no Referral or Active form yet.");
  } else if (previousFormType !== "Active") {
    warnings.push(
      `The most recent form is "${previousFormType}". An Exit normally follows an Active form, ` +
        "otherwise it is reported as a loop error.",
    );
  }

  return {
    Region: ((source.Region ?? referral?.Region ?? client.Region ?? null) as number | null),
    ReferralDate: toIsoDate(source.ReferralDate ?? referral?.ReferralDate),
    previousFormType,
    warnings,
  };
}

export const lookups = {
  options: () => ({
    formType: EXIT_FORM_TYPE,
    exitPriorToAge3: EXIT_PRIOR_TO_AGE_3,
    exitAtAge3: EXIT_AT_AGE_3,
    referredTo: REFERRED_TO,
    noPartBReasons: NO_PART_B_REASONS,
  }),
};
