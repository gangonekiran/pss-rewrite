# 10 — Database Info: Exit Form

Where the Exit Form's data lives, how the API connects to it, and the exact table definition. The full script is [database/stblExitForm.sql](database/stblExitForm.sql) (table, defaults, constraints and column descriptions).

---

## 1. Database and connection

| Item | Value |
| ---- | ----- |
| Database | `dbCDD` (SQL Server; migrated from the Access back end `CISState_be_tables` with SSMA) |
| Environments | State development server `AHSSQLD03D` · local development copy (`DB_SERVER` in `backend/.env`) |
| Connection (API) | `mssql/msnodesqlv8` with the ODBC driver **"SQL Server"**, Windows authentication (`trustedConnection`) — [config/database.ts](../../backend/src/config/database.ts) |
| Driver note | The legacy "SQL Server" ODBC driver rejects date parameters (HY004), so the repository sends dates as `nvarchar(10)` `YYYY-MM-DD` |
| Main table | `dbo.stblExitForm` |
| Also read | `dbo.stblPeople` (client header, DOB), `dbo.stblActiveForm` and `dbo.stblReferralForm` (prefill) |
| Writes | `INSERT` / `UPDATE` on `stblExitForm` only; `DELETE` through the generic input-form module |

## 2. Table summary — `dbo.stblExitForm`

| Item | Value |
| ---- | ----- |
| Columns | 45 (see [04-data-dictionary.md](04-data-dictionary.md)) |
| Primary key | `ID int IDENTITY(1,1)`, clustered (`stblExitForm$PrimaryKey`) |
| Foreign key | `ChildID` → `stblPeople.ChildID`, `ON UPDATE CASCADE ON DELETE CASCADE`, created `WITH NOCHECK` |
| Check constraints | `CountyCode`, `SUName`, `Town`: `len(...) > 0` (no empty strings) |
| Defaults | `FormType = 'Exit'`; `EXFNoPartB1-3 = 0`; `InsertDate`/`LastUpdateDate = getdate()`; `InsertUser`/`LastUpdateUser = suser_sname()` |
| Other indexes | None (no index on `ChildID`) |
| Row version | `SSMA_TimeStamp timestamp` |
| Nullability | Every business column is nullable; only `ID`, `SSMA_TimeStamp` and the four audit columns are `NOT NULL` |

## 3. Column groups

| Group | Columns | Written by the new form |
| ----- | ------- | ----------------------- |
| Header | `ID`, `ChildID`, `FormDate`, `FormType`, `Region`, `MonthReporting` | `ChildID`, `FormDate` (= exit date), `FormType` ('Exit'), `Region` |
| Location / coordinator / referral | `SU_id`, `SUName`, `CountyCode`, `Town`, `SvcCordFirstName`, `SvcCordLastName`, `SvcCordType`, `SvcCordOtherDesc`, `CAPTA`, `ReferralDate`, `ReReferralDate` | `ReferralDate` only **[Decision]** |
| COSF questions | `COSFEnter30Months`, `COSFEntryForm`, `COSFEntryFormReason`, `COSFGot6MonthsSvcs`, `COSFExitForm`, `COSFExitFormReason` | — |
| Exit date and transition | `ExitDate`, `TransitionPlanCompleted`, `TransitionPlanReason`, `CLLEANotificationDate`, `Notified90Days`, `NotifiedReason`, `NotifyStatePartC`, `TransitionMeeting`, `TransitionMeeting90day`, `NoTransitionMtgReason` | `ExitDate`, the three transition dates, `TransitionPlanReason` |
| Exit reason and referral | `ExitPriorToAge3`, `MovedOtherRegion`, `ExitAtAge3`, `EXFNoPartB1`, `EXFNoPartB2`, `EXFNoPartB3`, `ReferredTo` | all (`EXFNoPartB*` only cleared) |
| Audit | `SSMA_TimeStamp`, `InsertDate`, `InsertUser`, `LastUpdateDate`, `LastUpdateUser` | `LastUpdateDate`, `LastUpdateUser` on update |

## 4. Database objects that read `stblExitForm`

Found in the `dbCDD` script and confirmed in the local database (`sys.sql_modules`).

| Type | Objects |
| ---- | ------- |
| Views | `sqryFITPExtractExitsA`, `sqryFormListA`, `sqryKeyFormsCombined` |
| Reports (stored procedures) | `GetExitForms_rpt`, `GetIndicator8_rpt`, `GetIndicator3_rpt`, `GetAnnualExitGenderDetail_rpt`, `GetAnnualExitGenderSummary_rpt`, `GetAnnualExitEthnicityDetail_rpt`, `GetAnnualExitEthnicitySummary_rpt`, `GetClientFormStats_rpt`, `GetPointInTimeActiveDetail_rpt`, `GetPointInTimeActiveSummary_rpt`, `GetPointInTimeActiveSummaryRegion_rpt`, `GetServiceLocationDetail_rpt`, `GetServiceLocationSummary_rpt`, `GetReferralForms_rpt`, `GetServiceGridForms_rpt` |
| Extracts | `Get_FITP_Extract_rpt`, `Get_CIS_FITP_Output` |
| Through the warehouse `Loops` table | `BaseResults0801`, `DCInd8AReasonForDelay`, `DCInd8BReasonForDelay`, `DCInd8CReasonForDelay`, `DCNotPEReferred` |

What each one depends on is in [03-business-rules.md §8](03-business-rules.md#8-legacy-objects-that-read-stblexitform) and [05-table-mapping.md §6](05-table-mapping.md#6-columns--legacy-consumers).

## 5. Schema sources

| Source | Used for | Notes |
| ------ | -------- | ----- |
| `dbCDD` DDL script, 9/9/2026 | Column types, defaults, constraints, `MS_Description`, legacy views and procedures | The script behind [database/stblExitForm.sql](database/stblExitForm.sql) |
| Local `dbCDD` database (2026-11-02) | Cross-check of columns, FK, check constraints, referencing objects | Matches the 9/9 script |
| `CIS_Database_Schema.sql` in `Docs.zip` (8/30/2026) | — | **Not used.** A draft that types `ExitPriorToAge3`, `ExitAtAge3`, `TransitionPlanCompleted` as `bit` and `Region`, `ReferredTo` as `varchar`; it doesn't match the real table |
