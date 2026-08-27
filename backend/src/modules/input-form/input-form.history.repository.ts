import { getPool, sql } from "../../config/database";
import type { InputFormHistoryRow } from "./input-form.types";

/**
 * Builds the Input Form History grid for a single client.
 *
 * The history is collected from all supported input-form tables
 * and combined into a single result set using UNION ALL.
 *
 * Only columns confirmed in the existing CorNet schema are queried.
 * Fields that are not available in the supplied schema are returned
 * as NULL values so that every form produces the same result shape.
 *
 * Loop Error is currently returned as false because the required
 * stblLoopErrors column details were not included in the supplied schema.
 */
export async function getHistory(
  childId: number,
): Promise<InputFormHistoryRow[]> {
  // Get the shared SQL Server connection pool.
  const pool = await getPool();

  // Use a parameterized query to safely pass the ChildID.
  const result = await pool
    .request()
    .input("ChildID", sql.Int, childId)
    .query(`
      /*
       * Active Form
       */
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

      /*
       * No One Plan Form
       */
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

      /*
       * Referral Form
       */
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

      /*
       * Service Grid Form
       */
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

      /*
       * COS Cover Form
       */
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

      /*
       * Exit Form
       */
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

      /*
       * Insurance Form
       */
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

      /*
       * Display the most recent forms first.
       */
      ORDER BY date DESC, formType;
    `);

  // Return the combined history records to the service/controller.
  return result.recordset;
}