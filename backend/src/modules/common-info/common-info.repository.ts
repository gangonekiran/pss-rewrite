import { getPool } from "../../config/database";

export async function getAllRegions() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      ID,
      RName,
      Description,
      Inactive
    FROM stblReportingRegion
    WHERE Inactive = 0
    ORDER BY RName;
  `);

  return result.recordset;
}