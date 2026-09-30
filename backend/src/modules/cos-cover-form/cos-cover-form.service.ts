import * as repository from './cos-cover-form.repository';
import type { COSCoverRecord } from './cos-cover-form.types';

function error(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function int(value: unknown, name: string): number {
  const n = Number(value);
  if (!Number.isInteger(n) || n <= 0) error(`${name} must be a positive integer`);
  return n;
}

function date(value: unknown, field: string): string | null {
  if (value === undefined || value === null || String(value).trim() === '') return null;
  const s = String(value).trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) error(`${field} must use YYYY-MM-DD format`);
  const parsed = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== s) {
    error(`${field} must be a valid date`);
  }
  return s;
}

function childId(value: unknown): number {
  return int(value, 'ChildID');
}

async function getClient(id: number) {
  const client = await repository.getClient(id);
  if (!client) error('Client not found', 404);
  return client;
}

function validatePayload(raw: COSCoverRecord): COSCoverRecord {
  const payload = { ...raw };

  payload.FormDate = date(payload.FormDate, 'FormDate');
  payload.OnePlanDate = date(payload.OnePlanDate, 'OnePlanDate');
  payload.ExitDate = date(payload.ExitDate, 'ExitDate');

  if (payload.FormType !== undefined && String(payload.FormType).trim() === '') {
    error('FormType cannot be empty');
  }

  if (payload.Region !== undefined && String(payload.Region).trim() === '') {
    error('Region cannot be empty');
  }

  if (payload.EntryOrExit !== undefined &&
      payload.EntryOrExit !== 'Entry' && payload.EntryOrExit !== 'Exit') {
    error('EntryOrExit must be Entry or Exit');
  }

  if (payload.EntryOrExit === 'Entry') payload.ExitDate = null;

  for (const field of ['Outcome1', 'Outcome2', 'Outcome3']) {
    const value = payload[field];
    if (value === undefined || value === null || String(value).trim() === '') continue;
    const score = Number(value);
    if (!Number.isInteger(score) || score < 1 || score > 7) {
      error(`${field} must be between 1 and 7`);
    }
    payload[field] = score;
  }

  for (const field of ['Outcome1Support', 'Outcome2Support', 'Outcome3Support']) {
    const value = payload[field];
    if (value === undefined || value === null || String(value).trim() === '') continue;
    const n = Number(value);
    if (n !== 0 && n !== 1) error(`${field} must be 0 or 1`);
    payload[field] = n;
  }

  return payload;
}

export async function get(childIdRaw: unknown) {
  const id = childId(childIdRaw);
  const client = await getClient(id);
  const forms = await repository.findByChildId(id);
  return { client, forms };
}

export async function getOne(childIdRaw: unknown, idRaw: unknown) {
  const childIdValue = childId(childIdRaw);
  const id = int(idRaw, 'ID');
  await getClient(childIdValue);

  const form = await repository.findOne(childIdValue, id);
  if (!form) error('COS Form not found', 404);
  return form;
}

export async function create(childIdRaw: unknown, raw: COSCoverRecord) {
  const id = childId(childIdRaw);
  await getClient(id);
  return repository.insert(id, validatePayload(raw ?? {}));
}

export async function update(childIdRaw: unknown, idRaw: unknown, raw: COSCoverRecord) {
  const childIdValue = childId(childIdRaw);
  const id = int(idRaw, 'ID');
  await getClient(childIdValue);

  const existing = await repository.findOne(childIdValue, id);
  if (!existing) error('COS Form not found', 404);

  return repository.update(childIdValue, id, validatePayload(raw ?? {}));
}

export async function remove(childIdRaw: unknown, idRaw: unknown) {
  const childIdValue = childId(childIdRaw);
  const id = int(idRaw, 'ID');
  await getClient(childIdValue);

  if (!(await repository.remove(childIdValue, id))) {
    error('COS Form not found', 404);
  }

  return { success: true };
}
