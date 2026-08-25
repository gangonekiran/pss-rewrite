import { getPool, sql } from "../../config/database";
import { FORM_CONFIGS } from "./input-form.config";
import type { FormConfig, FormName, InputFormRecord } from "./input-form.types";
function cfg(name: FormName): FormConfig {
  const c = FORM_CONFIGS[name];
  if (!c) throw new Error(`Unsupported form: ${name}`);
  return c;
}
function clean(c: FormConfig, p: InputFormRecord): InputFormRecord {
  const allowed = new Set(c.writableColumns);
  return Object.fromEntries(
    Object.entries(p).filter(([k]) => allowed.has(k) && k !== c.idColumn),
  );
}
async function identity(pool: any, c: FormConfig) {
  const r = await pool
    .request()
    .input("t", sql.NVarChar, c.table.replace(/^dbo\./i, ""))
    .input("c", sql.NVarChar, c.idColumn)
    .query(
      `SELECT CAST(COLUMNPROPERTY(OBJECT_ID('dbo.'+@t),@c,'IsIdentity') AS bit) IsIdentity`,
    );
  return !!r.recordset[0]?.IsIdentity;
}
async function nextId(pool: any, c: FormConfig) {
  const r = await pool
    .request()
    .query(`SELECT ISNULL(MAX([${c.idColumn}]),0)+1 NextId FROM ${c.table}`);
  return Number(r.recordset[0].NextId);
}
function inputs(req: any, p: InputFormRecord, cols: string[]) {
  for (const col of cols) req.input(col, p[col] === undefined ? null : p[col]);
}
export async function findByChildId(name: FormName, childId: number) {
  const c = cfg(name),
    p = await getPool();
  return (
    await p
      .request()
      .input(c.childIdColumn, sql.Int, childId)
      .query(
        `SELECT * FROM ${c.table} WHERE [${c.childIdColumn}]=@${c.childIdColumn} ORDER BY [${c.idColumn}] DESC`,
      )
  ).recordset;
}
export async function findOne(name: FormName, childId: number, id: number) {
  const c = cfg(name),
    p = await getPool();
  return (
    (
      await p
        .request()
        .input(c.childIdColumn, sql.Int, childId)
        .input(c.idColumn, sql.Int, id)
        .query(
          `SELECT TOP 1 * FROM ${c.table} WHERE [${c.childIdColumn}]=@${c.childIdColumn} AND [${c.idColumn}]=@${c.idColumn}`,
        )
    ).recordset[0] ?? null
  );
}
export async function insert(
  name: FormName,
  childId: number,
  payload: InputFormRecord,
) {
  const c = cfg(name),
    p = await getPool(),
    data = clean(c, { ...payload, [c.childIdColumn]: childId }),
    isId = await identity(p, c),
    req = p.request();
  const cols = Object.keys(data);
  inputs(req, data, cols);
  let names = cols.map((x) => `[${x}]`).join(","),
    vals = cols.map((x) => `@${x}`).join(",");
  if (!isId) {
    const id = await nextId(p, c);
    req.input(c.idColumn, sql.Int, id);
    names = `[${c.idColumn}],${names}`;
    vals = `@${c.idColumn},${vals}`;
  }
  const r = await req.query(
    `INSERT INTO ${c.table} (${names}) VALUES (${vals}); SELECT TOP 1 * FROM ${c.table} WHERE [${c.childIdColumn}]=@${c.childIdColumn} ${isId ? `ORDER BY [${c.idColumn}] DESC` : `AND [${c.idColumn}]=@${c.idColumn}`}`,
  );
  return r.recordset[0];
}
export async function update(
  name: FormName,
  childId: number,
  id: number,
  payload: InputFormRecord,
) {
  const c = cfg(name),
    p = await getPool(),
    data = clean(c, { ...payload, [c.childIdColumn]: childId }),
    cols = Object.keys(data).filter((x) => x !== c.childIdColumn);
  if (!cols.length) return findOne(name, childId, id);
  const req = p
    .request()
    .input(c.childIdColumn, sql.Int, childId)
    .input(c.idColumn, sql.Int, id);
  inputs(req, data, cols);
  const set = cols.map((x) => `[${x}]=@${x}`).join(",");
  const r = await req.query(
    `UPDATE ${c.table} SET ${set},[LastUpdateDate]=GETDATE() WHERE [${c.idColumn}]=@${c.idColumn} AND [${c.childIdColumn}]=@${c.childIdColumn}; SELECT TOP 1 * FROM ${c.table} WHERE [${c.idColumn}]=@${c.idColumn} AND [${c.childIdColumn}]=@${c.childIdColumn}`,
  );
  return r.recordset[0] ?? null;
}
export async function remove(name: FormName, childId: number, id: number) {
  const c = cfg(name),
    p = await getPool();
  const r = await p
    .request()
    .input(c.childIdColumn, sql.Int, childId)
    .input(c.idColumn, sql.Int, id)
    .query(
      `DELETE FROM ${c.table} WHERE [${c.idColumn}]=@${c.idColumn} AND [${c.childIdColumn}]=@${c.childIdColumn}`,
    );
  return r.rowsAffected[0] > 0;
}
