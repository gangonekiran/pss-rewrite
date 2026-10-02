import { getPool, sql } from "../../config/database";
import { COMMON_INFO_TABLES } from "./common-info.config";
import type { RegionLookup, TownLookup } from "./common-info.types";

const { regions, towns, counties } = COMMON_INFO_TABLES;

export async function getAllRegions() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      ID,
      RName,
      Description,
      Inactive
    FROM ${regions}
    WHERE Inactive = 0
    ORDER BY RName;
  `);

  return result.recordset as RegionLookup[];
}

/**
 * Towns with their county, optionally filtered by a partial
 * town code or town name.
 */
export async function getTowns(search?: string) {
  const pool = await getPool();
  const req = pool.request();

  let where = "";

  if (search?.trim()) {
    req.input(
      "Search",
      sql.VarChar(100),
      `%${search.trim()}%`,
    );

    where =
      "WHERE t.TownName LIKE @Search OR t.Town LIKE @Search";
  }

  const r = await req.query(`
    SELECT
      t.Town,
      t.TownName,
      t.SU_id,
      t.CountyCode,
      c.CountyName
    FROM ${towns} t
    LEFT JOIN ${counties} c
      ON c.CountyCode = t.CountyCode
    ${where}
    ORDER BY t.TownName;
  `);

  return r.recordset as TownLookup[];
}

/**
 * One town by exact town code or town name.
 */
export async function getTown(town: string) {
  const pool = await getPool();

  const r = await pool
    .request()
    .input("Town", sql.VarChar(100), town)
    .query(`
      SELECT TOP 1
        t.Town,
        t.TownName,
        t.SU_id,
        t.CountyCode,
        c.CountyName
      FROM ${towns} t
      LEFT JOIN ${counties} c
        ON c.CountyCode = t.CountyCode
      WHERE t.Town = @Town
         OR t.TownName = @Town;
    `);

  return r.recordset[0] as TownLookup | undefined;
}
