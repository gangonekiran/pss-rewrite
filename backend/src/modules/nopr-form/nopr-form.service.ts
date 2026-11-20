import { REF_STATUS, RETIRED_REF_STATUS } from "./nopr-form.config.js";
import * as repository from "./nopr-form.repository.js";
import {
  applyFormDate,
  checkRetiredReason,
  error,
  normalizePayload,
  toIsoDate,
  validateRecord,
} from "./nopr-form.rules.js";
import type { NoprFormClient, NoprFormDefaults, NoprFormRecord } from "./nopr-form.types.js";

function int(value: unknown, name: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) error(`${name} must be a positive integer`);
  return n;
}

async function child(childId: number): Promise<NoprFormClient> {
  const c = await repository.getClient(childId);
  if (!c) error("Client not found", 404);
  return c;
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
  if (!form) error("NOPR Form not found", 404);
  return form;
}

export async function create(childIdRaw: unknown, raw: NoprFormRecord) {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);

  const p = normalizePayload(raw);
  checkRetiredReason(p, undefined);
  applyFormDate(p);

  validateRecord(p, client.DOB, await repository.findMostRecentReferralDate(childId));

  const saved = await repository.insert(childId, p);
  if (!saved) error("NOPR Form could not be read back after saving", 500);
  return saved;
}

export async function update(childIdRaw: unknown, idRaw: unknown, raw: NoprFormRecord) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  const client = await child(childId);

  const existing = await repository.findOne(childId, id);
  if (!existing) error("NOPR Form not found", 404);

  const p = normalizePayload(raw);
  checkRetiredReason(p, existing.RefStatus);
  applyFormDate(p);

  validateRecord(
    { ...existing, ...p },
    client.DOB,
    await repository.findMostRecentReferralDate(childId),
  );

  const saved = await repository.update(childId, id, p);
  if (!saved) error("NOPR Form not found", 404);
  return saved;
}

export async function remove(childIdRaw: unknown, idRaw: unknown) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  await child(childId);
  if (!(await repository.remove(childId, id))) error("NOPR Form not found", 404);
  return { success: true };
}

/**
 * Values to start a new NOPR form with: the region of the latest Active form,
 * falling back to the latest Referral form and then the client. Also returns
 * the most recent referral date, which the status date can't be before.
 */
export async function defaults(childIdRaw: unknown): Promise<NoprFormDefaults> {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);

  const [region, referral] = await Promise.all([
    repository.findLatestRegion(childId),
    repository.findMostRecentReferralDate(childId),
  ]);

  return {
    Region: region ?? client.Region ?? null,
    MostRecentReferralDate: toIsoDate(referral),
  };
}

export const lookups = {
  options: () => ({
    refStatus: REF_STATUS,
    retiredRefStatus: RETIRED_REF_STATUS,
  }),
};
