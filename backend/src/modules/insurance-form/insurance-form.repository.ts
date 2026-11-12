import { getPool, sql } from "../../config/database.js";
import { bindColumn, pickColumns, quoteColumn } from "../../utils/sql-columns.js";
import {
  COLUMNS,
  INSURANCE_FORM_TABLE,
  INSURANCE_FORM_TYPE,
  type WritableColumn,
} from "./insurance-form.config.js";
import type { InsuranceFormClient, InsuranceFormRecord } from "./insurance-form.types.js";

export async function getClient(childId: number): Promise<InsuranceFormClient | null> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT
        ChildID,
        LastName,
        FirstName,
        SS,
        DOB
      FROM dbo.stblPeople
      WHERE ChildID = @ChildID;
    `);
  return r.recordset[0] ?? null;
}

/** Newest first, the same order the FITP extract uses to pick the current form. */
export async function findByChildId(childId: number): Promise<InsuranceFormRecord[]> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT *
      FROM ${INSURANCE_FORM_TABLE}
      WHERE ChildID = @ChildID
      ORDER BY
        CASE WHEN FormDate IS NULL THEN 1 ELSE 0 END,
        FormDate DESC,
        ID DESC;
    `);
  return r.recordset;
}

export async function findOne(childId: number, id: number): Promise<InsuranceFormRecord | null> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("ID", sql.Int, id)
    .query(`
      SELECT *
      FROM ${INSURANCE_FORM_TABLE}
      WHERE ChildID = @ChildID
        AND ID = @ID;
    `);
  return r.recordset[0] ?? null;
}

export async function insert(childId: number, payload: InsuranceFormRecord) {
  const pool = await getPool();
  const data = pickColumns(payload, COLUMNS);
  const keys = Object.keys(data);

  const req = pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("FormType", sql.NVarChar(12), INSURANCE_FORM_TYPE);

  for (const k of keys) bindColumn(req, k, data[k], COLUMNS[k as WritableColumn]);

  const columns = ["[ChildID]", "[FormType]", ...keys.map(quoteColumn)].join(",");
  const values = ["@ChildID", "@FormType", ...keys.map((k) => `@${k}`)].join(",");

  const result = await req.query(`
    INSERT INTO ${INSURANCE_FORM_TABLE} (${columns})
    OUTPUT INSERTED.ID
    VALUES (${values});
  `);

  const id = Number(result.recordset[0]?.ID);
  if (!id) throw new Error("Insurance Form was inserted but no ID was returned");

  return findOne(childId, id);
}

export async function update(childId: number, id: number, payload: InsuranceFormRecord) {
  const pool = await getPool();
  const data = pickColumns(payload, COLUMNS);
  const keys = Object.keys(data);

  if (!keys.length) return findOne(childId, id);

  const req = pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("ID", sql.Int, id);

  for (const k of keys) bindColumn(req, k, data[k], COLUMNS[k as WritableColumn]);

  const sets = keys.map((k) => `${quoteColumn(k)}=@${k}`).join(",");

  await req.query(`
    UPDATE ${INSURANCE_FORM_TABLE}
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
      DELETE FROM ${INSURANCE_FORM_TABLE}
      WHERE ChildID = @ChildID
        AND ID = @ID;

      SELECT @@ROWCOUNT AS Affected;
    `);
  return Number(r.recordset[0]?.Affected ?? 0) > 0;
}
