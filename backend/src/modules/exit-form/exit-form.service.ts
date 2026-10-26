import { EXIT_AT_AGE_3, EXIT_PRIOR_TO_AGE_3, REFERRED_TO } from "./exit-form.config.js";
import * as repository from "./exit-form.repository.js";
import {
  applyExitPath,
  clearDependentFields,
  error,
  normalizePayload,
  toIsoDate,
  validateRecord,
} from "./exit-form.rules.js";
import type { ExitFormClient, ExitFormDefaults, ExitFormRecord } from "./exit-form.types.js";

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

function prepare(raw: ExitFormRecord) {
  const p = normalizePayload(raw);
  applyExitPath(p);
  clearDependentFields(p);
  return p;
}

export async function get(childIdRaw: unknown) {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);
  const forms = await repository.findByChildId(childId);
  return { client, forms };
}

export async function getOne(childIdRaw: unknown, idRaw: unknown) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  await child(childId);
  const form = await repository.findOne(childId, id);
  if (!form) error("Exit Form not found", 404);
  return form;
}

export async function create(childIdRaw: unknown, raw: ExitFormRecord) {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);
  const p = prepare(raw);

  if (p.Region === undefined || p.Region === null) error("Region must be selected");
  if (!p.ExitDate) error("Date of Exit is required");

  // FormDate is what the FITP extract and loop logic read as the exit date.
  if (!p.FormDate) p.FormDate = p.ExitDate;

  validateRecord(p, client.DOB);

  const saved = await repository.insert(childId, p);
  if (!saved) error("Exit Form could not be read back after saving", 500);
  return saved;
}

export async function update(childIdRaw: unknown, idRaw: unknown, raw: ExitFormRecord) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  const client = await child(childId);

  const existing = await repository.findOne(childId, id);
  if (!existing) error("Exit Form not found", 404);

  const p = prepare(raw);

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
  return saved;
}

export async function remove(childIdRaw: unknown, idRaw: unknown) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  await child(childId);
  if (!(await repository.remove(childId, id))) error("Exit Form not found", 404);
  return { success: true };
}

/**
 * Values to start a new Exit form with: the region and referral date of
 * the latest Active form, falling back to the latest Referral form.
 */
export async function defaults(childIdRaw: unknown): Promise<ExitFormDefaults> {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);

  const [active, referral] = await Promise.all([
    repository.findLatestActive(childId),
    repository.findLatestReferral(childId),
  ]);

  const source = active ?? referral ?? {};

  return {
    Region: (source.Region ?? referral?.Region ?? client.Region ?? null) as number | null,
    ReferralDate: toIsoDate(source.ReferralDate ?? referral?.ReferralDate),
  };
}

export const lookups = {
  options: () => ({
    exitPriorToAge3: EXIT_PRIOR_TO_AGE_3,
    exitAtAge3: EXIT_AT_AGE_3,
    referredTo: REFERRED_TO,
  }),
};
