import { Request } from 'mssql';
import { getPool, sql } from '../../config/database';
import { COS_COVER_TABLE, WRITABLE_COLUMNS } from './cos-cover-form.config';
import type { COSCoverClient, COSCoverRecord } from './cos-cover-form.types';

const allowed = new Set<string>(WRITABLE_COLUMNS);

function clean(payload: COSCoverRecord): COSCoverRecord {
  const result: COSCoverRecord = {};
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (key === 'ID' || key === 'ChildID' || key === 'childId') continue;
    if (allowed.has(key)) result[key] = value;
  }
  return result;
}

function bind(req: Request, key: string, value: unknown): void {
  if (value === undefined) return;
  if (value === null) {
    req.input(key, sql.NVarChar, null);
    return;
  }
  if (typeof value === 'boolean') {
    req.input(key, sql.Bit, value);
    return;
  }
  if (typeof value === 'number' && Number.isInteger(value)) {
    req.input(key, sql.Int, value);
    return;
  }
  req.input(key, sql.NVarChar, String(value));
}

function col(name: string): string {
  return `[${name.replace(/]/g, ']]')}]`;
}

export async function getClient(childId: number): Promise<COSCoverClient | null> {
  const pool = await getPool();
  const result = await pool.request()
    .input('ChildID', sql.Int, childId)
    .query(`
      SELECT ChildID, Region, LastName, FirstName, SS, SSTemp, DOB,
             Gender, Notes, NonEarlyIntervention
      FROM dbo.stblPeople
      WHERE ChildID = @ChildID;
    `);
  return result.recordset[0] ?? null;
}

export async function findByChildId(childId: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input('ChildID', sql.Int, childId)
    .query(`
      SELECT *
      FROM ${COS_COVER_TABLE}
      WHERE ChildID = @ChildID
      ORDER BY CASE WHEN FormDate IS NULL THEN 1 ELSE 0 END,
               FormDate DESC, ID DESC;
    `);
  return result.recordset;
}

export async function findOne(childId: number, id: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input('ChildID', sql.Int, childId)
    .input('ID', sql.Int, id)
    .query(`
      SELECT *
      FROM ${COS_COVER_TABLE}
      WHERE ChildID = @ChildID AND ID = @ID;
    `);
  return result.recordset[0] ?? null;
}

export async function insert(childId: number, payload: COSCoverRecord) {
  const pool = await getPool();
  const data = clean(payload);
  const keys = Object.keys(data);
  const req = pool.request().input('ChildID', sql.Int, childId);

  for (const key of keys) bind(req, key, data[key]);

  const columns = ['[ChildID]', ...keys.map(col)].join(',');
  const values = ['@ChildID', ...keys.map((key) => `@${key}`)].join(',');

  const result = await req.query(`
    INSERT INTO ${COS_COVER_TABLE} (${columns})
    OUTPUT INSERTED.ID
    VALUES (${values});
  `);

  const id = Number(result.recordset[0]?.ID);
  if (!id) throw new Error('COS form was inserted but no ID was returned');

  return findOne(childId, id);
}

export async function update(childId: number, id: number, payload: COSCoverRecord) {
  const pool = await getPool();
  const data = clean(payload);
  delete data.LastUpdateDate;

  const keys = Object.keys(data);
  if (!keys.length) return findOne(childId, id);

  const req = pool.request()
    .input('ChildID', sql.Int, childId)
    .input('ID', sql.Int, id);

  for (const key of keys) bind(req, key, data[key]);

  const sets = keys.map((key) => `${col(key)}=@${key}`).join(',');

  await req.query(`
    UPDATE ${COS_COVER_TABLE}
    SET ${sets}, [LastUpdateDate] = GETDATE()
    WHERE ChildID = @ChildID AND ID = @ID;
  `);

  return findOne(childId, id);
}

export async function remove(childId: number, id: number) {
  const pool = await getPool();
  const result = await pool.request()
    .input('ChildID', sql.Int, childId)
    .input('ID', sql.Int, id)
    .query(`
      DELETE FROM ${COS_COVER_TABLE}
      WHERE ChildID = @ChildID AND ID = @ID;
      SELECT @@ROWCOUNT AS Affected;
    `);

  return Number(result.recordset[0]?.Affected ?? 0) > 0;
}
