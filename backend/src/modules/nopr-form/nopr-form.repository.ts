import { getPool, sql } from "../../config/database.js";
import { bindColumn, pickColumns, quoteColumn } from "../../utils/sql-columns.js";
import {
  ACTIVE_FORM_TABLE,
  NOPR_FORM_TABLE,
  NOPR_FORM_TYPE,
  REFERRAL_FORM_TABLE,
  SAVED_COLUMNS,
} from "./nopr-form.config.js";
import type { NoprFormClient, NoprFormRecord } from "./nopr-form.types.js";

type SavedColumn = keyof typeof SAVED_COLUMNS;

export async function getClient(childId: number): Promise<NoprFormClient | null> {
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
        DOB
      FROM dbo.stblPeople
      WHERE ChildID = @ChildID;
    `);
  return r.recordset[0] ?? null;
}

/** Newest status first. */
export async function findByChildId(childId: number): Promise<NoprFormRecord[]> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT *
      FROM ${NOPR_FORM_TABLE}
      WHERE ChildID = @ChildID
      ORDER BY
        CASE WHEN FormDate IS NULL THEN 1 ELSE 0 END,
        FormDate DESC,
        ID DESC;
    `);
  return r.recordset;
}

export async function findOne(childId: number, id: number): Promise<NoprFormRecord | null> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("ID", sql.Int, id)
    .query(`
      SELECT *
      FROM ${NOPR_FORM_TABLE}
      WHERE ChildID = @ChildID
        AND ID = @ID;
    `);
  return r.recordset[0] ?? null;
}

export async function insert(childId: number, payload: NoprFormRecord) {
  const pool = await getPool();
  const data = pickColumns(payload, SAVED_COLUMNS);
  const keys = Object.keys(data);

  const req = pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("FormType", sql.NVarChar(12), NOPR_FORM_TYPE);

  for (const k of keys) bindColumn(req, k, data[k], SAVED_COLUMNS[k as SavedColumn]);

  const columns = ["[ChildID]", "[FormType]", ...keys.map(quoteColumn)].join(",");
  const values = ["@ChildID", "@FormType", ...keys.map((k) => `@${k}`)].join(",");

  const result = await req.query(`
    INSERT INTO ${NOPR_FORM_TABLE} (${columns})
    OUTPUT INSERTED.ID
    VALUES (${values});
  `);

  const id = Number(result.recordset[0]?.ID);
  if (!id) throw new Error("NOPR Form was inserted but no ID was returned");

  return findOne(childId, id);
}

export async function update(childId: number, id: number, payload: NoprFormRecord) {
  const pool = await getPool();
  const data = pickColumns(payload, SAVED_COLUMNS);
  const keys = Object.keys(data);

  if (!keys.length) return findOne(childId, id);

  const req = pool
    .request()
    .input("ChildID", sql.Int, childId)
    .input("ID", sql.Int, id);

  for (const k of keys) bindColumn(req, k, data[k], SAVED_COLUMNS[k as SavedColumn]);

  const sets = keys.map((k) => `${quoteColumn(k)}=@${k}`).join(",");

  await req.query(`
    UPDATE ${NOPR_FORM_TABLE}
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
      DELETE FROM ${NOPR_FORM_TABLE}
      WHERE ChildID = @ChildID
        AND ID = @ID;

      SELECT @@ROWCOUNT AS Affected;
    `);
  return Number(r.recordset[0]?.Affected ?? 0) > 0;
}

/**
 * The child's most recent referral date: the latest Referral Date or
 * Re-referral Date on any of their Referral forms.
 */
export async function findMostRecentReferralDate(childId: number): Promise<unknown> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT MAX(d.ReferralDate) AS MostRecentReferralDate
      FROM ${REFERRAL_FORM_TABLE} AS rf
      CROSS APPLY (VALUES (rf.ReferralDate), (rf.ReReferralDate)) AS d (ReferralDate)
      WHERE rf.ChildID = @ChildID;
    `);
  return r.recordset[0]?.MostRecentReferralDate ?? null;
}

/** Region of the latest Active form, falling back to the latest Referral form. */
export async function findLatestRegion(childId: number): Promise<number | null> {
  const pool = await getPool();
  const r = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      SELECT COALESCE(
        (SELECT TOP 1 Region
         FROM ${ACTIVE_FORM_TABLE}
         WHERE ChildID = @ChildID AND Region IS NOT NULL
         ORDER BY CASE WHEN FormDate IS NULL THEN 1 ELSE 0 END, FormDate DESC, ID DESC),
        (SELECT TOP 1 Region
         FROM ${REFERRAL_FORM_TABLE}
         WHERE ChildID = @ChildID AND Region IS NOT NULL
         ORDER BY COALESCE(ReReferralDate, ReferralDate, FormDate) DESC, ID DESC)
      ) AS Region;
    `);
  const region = r.recordset[0]?.Region;
  return region === null || region === undefined ? null : Number(region);
}
