import { BILLING_CONSENT, DECLINE_REASONS } from "./insurance-form.config.js";
import * as repository from "./insurance-form.repository.js";
import {
  clearDependentFields,
  error,
  normalizePayload,
  validateRecord,
} from "./insurance-form.rules.js";
import type { InsuranceFormClient, InsuranceFormRecord } from "./insurance-form.types.js";

function int(value: unknown, name: string) {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) error(`${name} must be a positive integer`);
  return n;
}

async function child(childId: number): Promise<InsuranceFormClient> {
  const c = await repository.getClient(childId);
  if (!c) error("Client not found", 404);
  return c;
}

function prepare(raw: InsuranceFormRecord) {
  const p = normalizePayload(raw);
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
  if (!form) error("Insurance Form not found", 404);
  return form;
}

export async function create(childIdRaw: unknown, raw: InsuranceFormRecord) {
  const childId = int(childIdRaw, "ChildID");
  const client = await child(childId);
  const p = prepare(raw);

  validateRecord(p, client.DOB);

  const saved = await repository.insert(childId, p);
  if (!saved) error("Insurance Form could not be read back after saving", 500);
  return saved;
}

export async function update(childIdRaw: unknown, idRaw: unknown, raw: InsuranceFormRecord) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  const client = await child(childId);

  const existing = await repository.findOne(childId, id);
  if (!existing) error("Insurance Form not found", 404);

  const p = prepare(raw);

  validateRecord({ ...existing, ...p }, client.DOB);

  const saved = await repository.update(childId, id, p);
  if (!saved) error("Insurance Form not found", 404);
  return saved;
}

export async function remove(childIdRaw: unknown, idRaw: unknown) {
  const childId = int(childIdRaw, "ChildID");
  const id = int(idRaw, "ID");
  await child(childId);
  if (!(await repository.remove(childId, id))) error("Insurance Form not found", 404);
  return { success: true };
}

export const lookups = {
  options: () => ({
    billingConsent: BILLING_CONSENT,
    declineReasons: DECLINE_REASONS,
  }),
};
