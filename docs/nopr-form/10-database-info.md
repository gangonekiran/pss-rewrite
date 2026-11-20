# 10 — Database Info: NOPR Form

Where the NOPR Form's data lives, how the API connects to it, the one schema change it needs, and the exact table definition. The table script is [database/stblNoOnePlanForm.sql](database/stblNoOnePlanForm.sql); the change script is [database/add-InitialEvalDate.sql](database/add-InitialEvalDate.sql).

---

## 1. Database and connection

| Item | Value |
| ---- | ----- |
| Database | `dbCDD` (SQL Server; migrated from the Access back end with SSMA) |
| Environments | State development server `AHSSQLD03D` · local development copy (`DB_SERVER` in `backend/.env`) |
| Connection (API) | `mssql/msnodesqlv8` with the ODBC driver **"SQL Server"**, Windows authentication (`trustedConnection`) — [config/database.ts](../../backend/src/config/database.ts) |
| Driver note | The legacy "SQL Server" ODBC driver rejects date parameters (HY004), so the repository sends dates as `nvarchar(10)` `YYYY-MM-DD` ([utils/sql-columns.ts](../../backend/src/utils/sql-columns.ts)) |
| Main table | `dbo.stblNoOnePlanForm` |
| Also read | `dbo.stblPeople` (client header, DOB, region), `dbo.stblReferralForm` (most recent referral date, region), `dbo.stblActiveForm` (region) |
| Writes | `INSERT` / `UPDATE` on `stblNoOnePlanForm` only; `DELETE` through the generic input-form module |

## 2. Schema change: `InitialEvalDate`

| Item | Value |
| ---- | ----- |
| Why | New field **Date of Initial Evaluation** **[Request]**; the team lead decided on a new, optional column **[Decision, 2026-11-18]** |
| Column | `[InitialEvalDate] [datetime2](0) NULL`, added at the end of the table. Same type as `stblActiveForm.InitialEvalDate` |
| Description | `MS_Description` = *"Date of Initial Evaluation (optional). Not before Date of Birth; not after StatusDate."* |
| Script | [database/add-InitialEvalDate.sql](database/add-InitialEvalDate.sql) — safe to run more than once; existing rows get NULL; rollback included as a comment |
| Required before | Deploying the NOPR Form. Without the column every save from the screen fails, because the screen always sends `InitialEvalDate` |
| Applied | Local development copy (2026-11-18), checked with `sys.columns` and `sys.extended_properties`. **Dev server `AHSSQLD03D`: to be run by the DBA** |
| Audit trigger | `dbCDD` has the database DDL trigger `LogSchemaChange`, which logs every schema change to `dbGlobalAdmin`. On a copy without `dbGlobalAdmin` the `ALTER TABLE` fails with *Msg 911 "Database 'dbGlobalAdmin' does not exist"* and is rolled back. On the state servers the trigger logs the change normally. |

Check after running:

```sql
SELECT c.name, t.name AS type, c.is_nullable
FROM sys.columns c JOIN sys.types t ON t.user_type_id = c.user_type_id
WHERE c.object_id = OBJECT_ID('dbo.stblNoOnePlanForm') AND c.name = 'InitialEvalDate';
-- InitialEvalDate | datetime2 | 1
```

## 3. Table summary — `dbo.stblNoOnePlanForm`

| Item | Value |
| ---- | ----- |
| Columns | 16 (15 legacy + `InitialEvalDate`; see [04-data-dictionary.md](04-data-dictionary.md)) |
| Primary key | `ID int IDENTITY(1,1)`, clustered (`stblNoOnePlanForm$PrimaryKey`) |
| Foreign key | `ChildID` → `stblPeople.ChildID`, `ON UPDATE CASCADE ON DELETE CASCADE`, created `WITH NOCHECK` (not trusted) |
| Check constraints | None |
| Defaults | `FormType = 'No One Plan'`; `ReferredBack = 0`; `InsertDate`/`LastUpdateDate = getdate()`; `InsertUser`/`LastUpdateUser = suser_sname()` |
| Other indexes | None (no index on `ChildID`, NOPR-GAP-12) |
| Row version | `SSMA_TimeStamp timestamp` |
| Nullability | Every business column is nullable; only `ID`, `SSMA_TimeStamp` and the four audit columns are `NOT NULL` |
| Extended properties | `MS_Description` on every column (legacy text; `RefStatus` lists codes 1–7 only, NOPR-GAP-10) |

## 4. Column groups

| Group | Columns | Written by the new form |
| ----- | ------- | ----------------------- |
| Header | `ID`, `ChildID`, `FormDate`, `FormType` | `ChildID`, `FormDate` (= status date), `FormType` ('No One Plan') |
| General information | `Region`, `MonthReporting` | `Region`. Not written: `MonthReporting` **[Request]** |
| Status | `RefStatus`, `Screening`, `ReferredBack`, `StatusDate`, `InitialEvalDate` | `RefStatus`, `StatusDate`, `InitialEvalDate`. Not written: `Screening`, `ReferredBack` **[Request]** |
| Audit | `SSMA_TimeStamp`, `InsertDate`, `InsertUser`, `LastUpdateDate`, `LastUpdateUser` | `LastUpdateDate`, `LastUpdateUser` on update |

## 5. Database objects that read `stblNoOnePlanForm`

Found in the `dbCDD` schema script.

| Type | Objects | Use |
| ---- | ------- | --- |
| FITP extract (stored procedures) | `Get_CIS_FITP_Output`, `Get_FITP_Extract_rpt` | NOPR forms are exits: `FormDate` ends the referral period (BR-NOPR-40, 41) |
| FITP extract (views) | `sqryFITPExtractExitsB`, `sqryFITPExtractExitsC`, `sqryFITPExtractD`, `sqryFITPExtract` | Same logic, older version |
| Report | `Get_NOPR_Forms_rpt` | NOPR Forms report by `FormDate` range (BR-NOPR-42); doesn't return `InitialEvalDate` yet |
| Client status | `GetClientFormStats_rpt` | Latest NOPR form's `StatusDate`; "No One Plan Resulting" status (BR-NOPR-46) |
| Form list and loop errors | `sqryFormListA`, `sqryFormListTemp`, `sqryFormListComplete`, `sqryFormList`, `sqryLoopErrors` | `N` + `ID`, `StatusDate` as NOPR; loop error when the previous key form isn't a Referral (BR-NOPR-43, 44) |
| Key forms | `sqryKeyFormsCombined`, `sqryKeyFormsMaxType`, `GetIndicator3_rpt` | Most recent key form per child |
| Loops | `LoopCa` | Loop A → Loop C with the first NOPR date after the referral (BR-NOPR-45) |
| Point-in-time and service-location reports | `GetPointInTimeActiveDetail_rpt`, `…Summary_rpt`, `…SummaryRegion_rpt`, `GetServiceLocationDetail_rpt`, `…Summary_rpt` | NOPR is a key form: it ends "active" (BR-NOPR-47) |
| New application | `client.repository.ts` (client status), `input-form.history.repository.ts` (Input Forms grid), generic `input-form` module (delete) | — |

## 6. Follow-up scripts for the DBA

Not run; suggested by this review.

```sql
-- NOPR-GAP-10: describe the new reason 8 and the retired reason 7.
EXEC sys.sp_updateextendedproperty
    @name = N'MS_Description',
    @value = N'1=Initial Visit Made-Screening declined, 2=Screened-No further needed, 3=Further eval declined, 4=Evaluated-Not eligible, 5=Eligible-Family Declined, 6=Moved or Lost Contact, 7=Turned 3 (retired), 8=Initial Contact Not Made',
    @level0type = N'SCHEMA', @level0name = N'dbo',
    @level1type = N'TABLE',  @level1name = N'stblNoOnePlanForm',
    @level2type = N'COLUMN', @level2name = N'RefStatus';
GO

-- NOPR-GAP-12: index for the client look-ups, the FITP exit search and cascade deletes.
CREATE NONCLUSTERED INDEX IX_stblNoOnePlanForm_ChildID_FormDate
    ON dbo.stblNoOnePlanForm (ChildID, FormDate);
GO
```

## 7. Schema sources

| Source | Used for | Notes |
| ------ | -------- | ----- |
| `dbCDD` schema script (2026-09-09) | Table, defaults, FK, column descriptions, every view and procedure that reads the table | Basis of [database/stblNoOnePlanForm.sql](database/stblNoOnePlanForm.sql) |
| Local `dbCDD` database (2026-11-18) | Column count before and after the change, the new column and its description | Checked with `sys.columns` and `sys.extended_properties` |
| NOPR change requests and the team lead's answers | New column, removed fields, reasons, date rules | — |
