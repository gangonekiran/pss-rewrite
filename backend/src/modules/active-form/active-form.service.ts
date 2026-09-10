import * as repository from "./active-form.repository";
import type { ActiveFormRecord } from "./active-form.types";

function error(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}
function int(value: unknown, name: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0)
    error(`${name} must be a positive integer`);
  return n;
}

function date(value: unknown, field: string): string | null {
  if (value === undefined || value === null || String(value).trim() === "")
    return null;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s))
    error(`${field} must use YYYY-MM-DD format`);
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s)
    error(`${field} must be a valid date`);
  return s;
}

function aliases(raw: ActiveFormRecord) {
  const p = { ...raw };
  if (p.status !== undefined && p.FormType === undefined) p.FormType = p.status;
  if (p.onePlanDate !== undefined && p.InitialMeetingDate === undefined)
    p.InitialMeetingDate = p.onePlanDate;
  delete p.status;
  delete p.onePlanDate;
  return p;
}

/*function validateDates(p: ActiveFormRecord, dob: string | null) {
  const referral = date(p.ReferralDate, "ReferralDate");
  const evalDate = date(p.InitialEvalDate, "InitialEvalDate");
  const onePlan = date(p.InitialMeetingDate, "OnePlanDate");
  if (dob) {
    if (referral && referral < dob)
      error("ReferralDate cannot be before child DOB");
    if (evalDate && evalDate < dob)
      error("InitialEvalDate cannot be before child DOB");
    if (onePlan && onePlan < dob)
      error("OnePlanDate cannot be before child DOB");
  }
  if (referral && evalDate && evalDate < referral)
    error("InitialEvalDate cannot be before ReferralDate");
  if (referral && onePlan && onePlan < referral)
    error("OnePlanDate cannot be before ReferralDate");
}*/

function validateDates(p: ActiveFormRecord, dob: string | null) {
  const referral = date(p.ReferralDate, "ReferralDate");
  const evalDate = date(p.InitialEvalDate, "InitialEvalDate");
  const onePlan = date(p.InitialMeetingDate, "OnePlanDate");

  if (dob) {
    if (referral && referral < dob) {
      error("ReferralDate cannot be before child DOB");
    }

    if (evalDate && evalDate < dob) {
      error("InitialEvalDate cannot be before child DOB");
    }

    if (onePlan && onePlan < dob) {
      error("OnePlanDate cannot be before child DOB");
    }
  }
}

async function child(childId: number) {
  const c = await repository.getClient(childId);
  if (!c) error("Client not found", 404);
  return c;
}

async function townMapping(p: ActiveFormRecord) {
  if (p.Town === undefined || p.Town === null || String(p.Town).trim() === "")
    return;
  const t = await repository.getTown(String(p.Town).trim());
  if (!t) error("Town was not found in slstTownCodes");
  p.Town = t.Town;
  p.CountyCode = t.CountyCode;
  if (p.SU_id === undefined && t.SU_id !== null) p.SU_id = t.SU_id;
}

export async function get(childIdRaw: unknown) {
  const id = int(childIdRaw, "ChildID");
  const client = await child(id);
  return { client, forms: await repository.findByChildId(id) };
}
export async function getOne(childIdRaw: unknown, idRaw: unknown) {
  const childId = int(childIdRaw, "ChildID"),
    id = int(idRaw, "ID");
  await child(childId);
  const form = await repository.findOne(childId, id);
  if (!form) error("Active Form not found", 404);
  return form;
}
export async function create(childIdRaw: unknown, raw: ActiveFormRecord) {
  const childId = int(childIdRaw, "ChildID"),
    c = await child(childId),
    p = aliases(raw ?? {});
  if (p.Region !== undefined && String(p.Region).trim() === "")
    error("Region must be selected");
  validateDates(p, c.DOB);
  await townMapping(p);
  return repository.insert(childId, p);
}
export async function update(
  childIdRaw: unknown,
  idRaw: unknown,
  raw: ActiveFormRecord,
) {
  const childId = int(childIdRaw, "ChildID"),
    id = int(idRaw, "ID"),
    c = await child(childId);
  const existing = await repository.findOne(childId, id);
  if (!existing) error("Active Form not found", 404);
  const p = aliases(raw ?? {});
  validateDates({ ...existing, ...p }, c.DOB);
  await townMapping(p);
  return repository.update(childId, id, p);
}
export async function remove(childIdRaw: unknown, idRaw: unknown) {
  const childId = int(childIdRaw, "ChildID"),
    id = int(idRaw, "ID");
  await child(childId);
  if (!(await repository.remove(childId, id)))
    error("Active Form not found", 404);
  return { success: true };
}
export const lookups = {
  regions: () => repository.getAllRegions(),
  supervisoryUnions: () => repository.getSupervisoryUnions(),
  towns: (s?: string) => repository.getTowns(s),
  serviceCoordinatorTypes: () => repository.getServiceCoordinatorTypes(),
  delayReasons: () => repository.getDelayReasons(),
};
