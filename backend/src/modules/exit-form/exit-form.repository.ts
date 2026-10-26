import type { Request } from "mssql";
import { getPool, sql } from "../../config/database";
import {
  ACTIVE_FORM_TABLE,
  COLUMNS,
  EXIT_FORM_TABLE,
  EXIT_FORM_TYPE,
  REFERRAL_FORM_TABLE,
  type WritableColumn,
} from "./exit-form.config";
import type { ExitFormClient, ExitFormRecord } from "./exit-form.types";

const columnNames = new Set<string>(Object.keys(COLUMNS));

/** Keeps only writable columns; ID and ChildID never come from the body. */
function clean(payload: ExitFormRecord) {
  const result: ExitFormRecord = {};
  for (const [key, value] of Object.entries(payload ?? {})) {
    if (columnNames.has(key) && value !== undefined) result[key] = value;
  }
  return result;
}

function bind(req: Request, key: string, value: unknown) {
  const spec: { kind: string; max?: number } = COLUMNS[key as WritableColumn];

  switch (spec.kind) {
    case "date":
      // The legacy "SQL Server" ODBC driver rejects Date/DateTime parameters
      // (HY004). YYYY-MM-DD strings convert to the datetime2 columns safely
      // regardless of the server's DATEFORMAT.
      return req.input(key, sql.NVarChar(10), value);
    case "int":
    case "yesNo":
      return req.input(key, sql.Int, value);
    case "bit":
      return req.input(key, sql.Bit, value);
    default:
      return req.input(key, spec.max ? sql.NVarChar(spec.max) : sql.NVarChar(sql.MAX), value);
  }
}

function col(name: string) {
  return `[${name.replace(/]/g, "]]")}]`;
}

export async function getClient(childId: number): Promise<ExitFormClient | null> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT
        ChildID,
        Region,
        LastName,
        FirstName,
        SS,
        SSTemp,
        DOB,
        Gender,
        Notes,
        NonEarlyIntervention
      FROM dbo.stblPeople
      WHERE ChildID = @ChildID;
    `);
  return r.recordset[0] ?? null;
}

export async function findByChildId(childId: number): Promise<ExitFormRecord[]> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT *
      FROM ${EXIT_FORM_TABLE}
      WHERE ChildID = @ChildID
      ORDER BY
        CASE WHEN ExitDate IS NULL THEN 1 ELSE 0 END,
        ExitDate DESC,
        ID DESC;
    `);
  return r.recordset;
}

export async function findOne(childId: number, id: number): Promise<ExitFormRecord | null> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("ID", sql.Int, id)
    .query(`
      SELECT *
      FROM ${EXIT_FORM_TABLE}
      WHERE ChildID = @ChildID
        AND ID = @ID;
    `);
  return r.recordset[0] ?? null;
}

export async function insert(childId: number, payload: ExitFormRecord) {
  const pool = await getPool();
  const data = clean(payload);
  const keys = Object.keys(data);

  const req = pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("FormType", sql.NVarChar(12), EXIT_FORM_TYPE);

  for (const k of keys) bind(req, k, data[k]);

  const columns = ["[ChildID]", "[FormType]", ...keys.map(col)].join(",");
  const values = ["@ChildID", "@FormType", ...keys.map((k) => `@${k}`)].join(",");

  const result = await req.query(`
    INSERT INTO ${EXIT_FORM_TABLE} (${columns})
    OUTPUT INSERTED.ID
    VALUES (${values});
  `);

  const id = Number(result.recordset[0]?.ID);
  if (!id) throw new Error("Exit Form was inserted but no ID was returned");

  return findOne(childId, id);
}

export async function update(childId: number, id: number, payload: ExitFormRecord) {
  const pool = await getPool();
  const data = clean(payload);
  const keys = Object.keys(data);

  if (!keys.length) return findOne(childId, id);

  const req = pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("ID", sql.Int, id);

  for (const k of keys) bind(req, k, data[k]);

  const sets = keys.map((k) => `${col(k)}=@${k}`).join(",");

  await req.query(`
    UPDATE ${EXIT_FORM_TABLE}
    SET
      ${sets},
      [LastUpdateDate] = GETDATE(),
      [LastUpdateUser] = SUSER_SNAME()
    WHERE ChildID = @ChildID
      AND ID = @ID;
  `);

  return findOne(childId, id);
}

export async function remove(childId: number, id: number) {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("ID", sql.Int, id)
    .query(`
      DELETE FROM ${EXIT_FORM_TABLE}
      WHERE ChildID = @ChildID
        AND ID = @ID;

      SELECT @@ROWCOUNT AS Affected;
    `);
  return Number(r.recordset[0]?.Affected ?? 0) > 0;
}

/** The only values a new Exit form copies from earlier forms. */
const PREFILL_COLUMNS = "Region, ReferralDate";

/** Latest Referral form, by (re)referral date. */
export async function findLatestReferral(childId: number) {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT TOP 1 ${PREFILL_COLUMNS}
      FROM ${REFERRAL_FORM_TABLE}
      WHERE ChildID = @ChildID
      ORDER BY
        COALESCE(ReReferralDate, ReferralDate, FormDate) DESC,
        ID DESC;
    `);
  return (r.recordset[0] as ExitFormRecord | undefined) ?? null;
}

/** Latest Active form, by form date. */
export async function findLatestActive(childId: number) {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT TOP 1 ${PREFILL_COLUMNS}
      FROM ${ACTIVE_FORM_TABLE}
      WHERE ChildID = @ChildID
      ORDER BY
        CASE WHEN FormDate IS NULL THEN 1 ELSE 0 END,
        FormDate DESC,
        ID DESC;
    `);
  return (r.recordset[0] as ExitFormRecord | undefined) ?? null;
}
