import { getPool, sql } from "../../config/database";
import type { InputFormHistoryRow } from "./input-form.types";

/**
 * Builds the Input Form History grid for one client.
 * Only columns confirmed in the existing CorNet schema are used.
 * Loop Error is returned as false because stblLoopErrors column details
 * were not part of the supplied schema definition.
 */
export async function getHistory(
  childId: number,
): Promise<InputFormHistoryRow[]> {
  const pool = await getPool();

  const result = await pool.request().input("ChildID", sql.Int, childId).query(`
  SELECT
    ID AS id,
    FormDate AS date,
    FormType AS formType,
    ReferralDate AS referral,
    CAST(NULL AS date) AS nopr,
    InterimDate AS interim,
    CAST(NULL AS date) AS op,
    CAST(NULL AS date) AS [exit],
    CAST(0 AS bit) AS loopError,
    'active' AS formName
  FROM dbo.stblActiveForm
  WHERE ChildID = @ChildID

  UNION ALL

  SELECT
    ID AS id,
    FormDate AS date,
    FormType AS formType,
    CAST(NULL AS date) AS referral,
    FormDate AS nopr,
    CAST(NULL AS date) AS interim,
    CAST(NULL AS date) AS op,
    CAST(NULL AS date) AS [exit],
    CAST(0 AS bit) AS loopError,
    'no-one-plan' AS formName
  FROM dbo.stblNoOnePlanForm
  WHERE ChildID = @ChildID

  UNION ALL

  SELECT
    ID AS id,
    FormDate AS date,
    FormType AS formType,
    ReferralDate AS referral,
    CAST(NULL AS date) AS nopr,
    CAST(NULL AS date) AS interim,
    CAST(NULL AS date) AS op,
    CAST(NULL AS date) AS [exit],
    CAST(0 AS bit) AS loopError,
    'referral' AS formName
  FROM dbo.stblReferralForm
  WHERE ChildID = @ChildID

  UNION ALL

  SELECT
    ServiceGridID AS id,
    FormDate AS date,
    FormType AS formType,
    ReferralDate AS referral,
    CAST(NULL AS date) AS nopr,
    CAST(NULL AS date) AS interim,
    CAST(NULL AS date) AS op,
    CAST(NULL AS date) AS [exit],
    CAST(0 AS bit) AS loopError,
    'service-grid' AS formName
  FROM dbo.stblServiceGridForm
  WHERE ChildID = @ChildID

  UNION ALL

  SELECT
    COSCoverID AS id,
    FormDate AS date,
    FormType AS formType,
    CAST(NULL AS date) AS referral,
    CAST(NULL AS date) AS nopr,
    CAST(NULL AS date) AS interim,
    OnePlanDate AS op,
    ExitDate AS [exit],
    CAST(0 AS bit) AS loopError,
    'cos-cover' AS formName
  FROM dbo.stblCOSCoverForm
  WHERE ChildID = @ChildID

  UNION ALL

  SELECT
    ID AS id,
    FormDate AS date,
    FormType AS formType,
    ReferralDate AS referral,
    CAST(NULL AS date) AS nopr,
    CAST(NULL AS date) AS interim,
    CAST(NULL AS date) AS op,
    ExitDate AS [exit],
    CAST(0 AS bit) AS loopError,
    'exit' AS formName
  FROM dbo.stblExitForm
  WHERE ChildID = @ChildID

  UNION ALL

  SELECT
    ID AS id,
    FormDate AS date,
    FormType AS formType,
    CAST(NULL AS date) AS referral,
    CAST(NULL AS date) AS nopr,
    CAST(NULL AS date) AS interim,
    CAST(NULL AS date) AS op,
    CAST(NULL AS date) AS [exit],
    CAST(0 AS bit) AS loopError,
    'insurance' AS formName
  FROM dbo.stblInsuranceForm
  WHERE ChildID = @ChildID

  ORDER BY date DESC, formType;
`);

  return result.recordset;
}
