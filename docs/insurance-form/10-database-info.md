# 10 — Database Info: Insurance Form

Where the Insurance Form's data lives, how the API connects to it, and the exact table definition. The full script is [database/stblInsuranceForm.sql](database/stblInsuranceForm.sql) (table, defaults and foreign key).

---

## 1. Database and connection

| Item | Value |
| ---- | ----- |
| Database | `dbCDD` (SQL Server; migrated from the Access back end with SSMA) |
| Environments | State development server `AHSSQLD03D` · local development copy (`DB_SERVER` in `backend/.env`) |
| Connection (API) | `mssql/msnodesqlv8` with the ODBC driver **"SQL Server"**, Windows authentication (`trustedConnection`) — [config/database.ts](../../backend/src/config/database.ts) |
| Driver note | The legacy "SQL Server" ODBC driver rejects date parameters (HY004), so the repository sends dates as `nvarchar(10)` `YYYY-MM-DD` ([utils/sql-columns.ts](../../backend/src/utils/sql-columns.ts)) |
| Main table | `dbo.stblInsuranceForm` |
| Also read | `dbo.stblPeople` (client header, DOB) |
| Writes | `INSERT` / `UPDATE` on `stblInsuranceForm` only; `DELETE` through the generic input-form module |

## 2. Table summary — `dbo.stblInsuranceForm`

| Item | Value |
| ---- | ----- |
| Columns | 27 (see [04-data-dictionary.md](04-data-dictionary.md)) |
| Primary key | `ID int IDENTITY(1,1)`, clustered (`stblInsuranceForm$PrimaryKey`) |
| Foreign key | `ChildID` → `stblPeople.ChildID`, `ON UPDATE CASCADE ON DELETE CASCADE`, created `WITH NOCHECK` (not trusted) |
| Check constraints | None |
| Defaults | `FormType = 'Insurance'`; `DeclineReasonCap/Premium/Benefits/Eligibility = 0`; `InsertDate`/`LastUpdateDate = getdate()`; `InsertUser`/`LastUpdateUser = suser_sname()` |
| Other indexes | None (no index on `ChildID`, IF-GAP-12) |
| Row version | `SSMA_TimeStamp timestamp` |
| Nullability | Every business column is nullable; only `ID`, `SSMA_TimeStamp` and the four audit columns are `NOT NULL` |
| Extended properties | None (`MS_Description` not set on this table) |

## 3. Column groups

| Group | Columns | Written by the new form |
| ----- | ------- | ----------------------- |
| Header | `ID`, `ChildID`, `FormDate`, `FormType` | `ChildID`, `FormDate` (Date Completed), `FormType` ('Insurance') |
| Insurance information | `InsCoNumber`, `InsuranceName`, `BranchAddress`, `PolicyNumber`, `CoverageCode`, `EffectiveDate`, `EndDate`, `PolicyHolder`, `GroupNumber`, `GroupName`, `Phone` | `BranchAddress` (company name), `PolicyNumber`, `GroupNumber`, `GroupName`, `EffectiveDate`, `EndDate`, `PolicyHolder`. Not written: `InsCoNumber`, `InsuranceName`, `CoverageCode`, `Phone` **[Decision]** |
| Consent | `BillingConsent`, `ParentSignatureDate`, `DeclineReasonCap`, `DeclineReasonPremium`, `DeclineReasonBenefits`, `DeclineReasonEligibility`, `ParentSignatureDate2` | all |
| Audit | `SSMA_TimeStamp`, `InsertDate`, `InsertUser`, `LastUpdateDate`, `LastUpdateUser` | `LastUpdateDate`, `LastUpdateUser` on update |

## 4. Database objects that read `stblInsuranceForm`

Found in the local `dbCDD` database (`sys.sql_modules`).

| Type | Objects | Use |
| ---- | ------- | --- |
| FITP extract (stored procedures) | `Get_CIS_FITP_Output`, `Get_FITP_Extract_rpt` | Latest form per child; `BillingConsent = 3` → Do Not Bill (BR-IF-40 – 42) |
| FITP extract (views) | `sqryFITPExtractA`, `sqryFITPExtractB` (and `sqryFITPExtractD`, `sqryFITPExtract` on top of them) | Same logic, older version |
| Report | `GetInsuranceForms_rpt` | Insurance Forms report by `FormDate` range (BR-IF-44) |
| Form list | `sqryFormListA` | Client form list, `I` + `ID` (BR-IF-45) |
| Reports that exclude Insurance | `GetPointInTimeActiveDetail_rpt`, `GetPointInTimeActiveSummary_rpt`, `GetPointInTimeActiveSummaryRegion_rpt`, `GetServiceLocationDetail_rpt`, `GetServiceLocationSummary_rpt` | `FormType <> 'Insurance'` (BR-IF-43) |
| Legacy lookups (not used by the new form) | `slstInsuranceCodes`, `slstCoverageCodes` | Ins. Co # and Coverage Code dropdowns |

What each one depends on is in [03-business-rules.md §5](03-business-rules.md#5-fitp-billing-extract-and-legacy-reports) and [05-table-mapping.md §5](05-table-mapping.md#5-columns--legacy-consumers).

## 5. Schema sources

| Source | Used for | Notes |
| ------ | -------- | ----- |
| Local `dbCDD` database (2026-11-14) | Column types, defaults, keys, referencing objects, the FITP and report logic | The script behind [database/stblInsuranceForm.sql](database/stblInsuranceForm.sql) |
| Legacy Insurance Form screen and business notes | Field meaning, which fields are no longer used, the consent wording | The database has no column descriptions for this table |
