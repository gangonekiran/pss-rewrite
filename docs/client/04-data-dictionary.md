# 04 — Data Dictionary

Every data element the Client module stores, reads or derives. Types, nullability, defaults and descriptions come from the **`dbCDD` DDL script (2026-09-09)**. Quoted descriptions are the column's `MS_Description` extended property.

Legend: **PK** primary key · **FK** foreign key (physical constraint) · **N** nullable · **NN** not null · **D** derived (not stored).

All migrated tables share the same **SSMA audit pattern**:

| Column           | Type        | Null | Default         | Meaning |
| ---------------- | ----------- | ---- | --------------- | ------- |
| `SSMA_TimeStamp` | `timestamp` (rowversion) | NN | auto | Row version added by the Access→SQL migration. Usable for optimistic concurrency. *(Not on every table.)* |
| `InsertDate`     | `datetime`  | NN   | `getdate()`     | "The time the record was added to the database" |
| `InsertUser`     | `varchar(50)` | NN | `suser_sname()` | "The user who added the record to the database" |
| `LastUpdateDate` | `datetime`  | NN   | `getdate()`     | "The time the record was last updated in the database" |
| `LastUpdateUser` | `varchar(50)` | NN | `suser_sname()` | "The user who last modified the record in the database" |

These are omitted from the per-table lists below unless they matter.

---

## 1. Domains (reusable value sets)

| Domain         | Physical type | Allowed values / format | Used by |
| -------------- | ------------- | ----------------------- | ------- |
| `D_ChildID`    | `int`         | Identity, positive | `stblPeople.ChildID`, every `*.ChildID` |
| `D_PersonName` | `nvarchar(50)` | Non-empty when present (`CHECK len > 0`); NULL allowed | `LastName`, `FirstName` |
| `D_SSN`        | `nvarchar(15)` | Not enforced. FITP extract expects 9 digits | `stblPeople.SS` |
| `D_Gender`     | `nvarchar(1)` | `F` Female · `M` Male · `U` Unknown · NULL no entry | `stblPeople.Gender` |
| `D_Flag`       | `bit`         | `0` / `1` | `SSTemp`, `NonEarlyIntervention`, `Inactive`, … |
| `D_AccessYesNo`| `int`         | Access Yes/No stored as int: `-1` Yes · `0` No · NULL no data | `CAPTA`, `EvalWithin45Days`, `EntryOrExit`, `Notified90Days`, `NewSkills*`, … |
| `D_Date`       | `datetime2(0)` | Date (time part unused) | `DOB`, all form dates |
| `D_FormType`   | `nvarchar(12)` | DB defaults: `Referral`, `Active`, `No One Plan`, `Exit`, `COS`, `Insurance`, `Service Grid`. The new Active form also writes `aop`, `aop-capta`. | All `stbl*Form.FormType` |
| `D_FormName`   | string (app)  | `active`, `cos-cover`, `exit`, `insurance`, `no-one-plan`, `referral`, `service-grid` | Input-form routes & history |
| `D_Status`     | string (D)    | Legacy: `Referred In Process`, `Active`, `Exited`, `No One Plan Resulting` | Client Status |
| `D_OutcomeStatus` | `int`      | `1` New Outcome · `2` New Frequency · `3` Outcome Cont. · `4` Service Ended | `stblServices.OutcomeStatus` |

> `D_AccessYesNo`: several "Yes/No" columns are `int` holding Access's `-1` for True. Code that tests `= 1` against them is wrong. `bit` columns hold `1` for True; the legacy views often mix the two (e.g. `BaseResult0201` multiplies `bit` sums by `-1`).

---

## 2. Tables

### 2.1 stblPeople (Client) — **owned by this module**

| # | Column | Type | Null | Key | Default | Constraint | Description |
| - | ------ | ---- | ---- | --- | ------- | ---------- | ----------- |
| 1 | `ChildID` | `int IDENTITY(1,1)` | NN | PK (clustered) | identity | — | "This number is automatically assigned." |
| 2 | `Region` | `int` | N | *(logical FK only)* → `stblReportingRegion.ID` | — | **none** | "Reporting Region ID" |
| 3 | `LastName` | `nvarchar(50)` | N | — | — | `CHECK (len(LastName) > 0)` | "Enter child's last name." |
| 4 | `FirstName` | `nvarchar(50)` | N | — | — | `CHECK (len(FirstName) > 0)` | "Enter child's first name" |
| 5 | `SS` | `nvarchar(15)` | N | — | — | — | "Social Security Number". **PII.** Not unique. |
| 6 | `SSTemp` | `bit` | N | — | `0` | — | "Yes = Temporary SS#, No = SS#" |
| 7 | `DOB` | `datetime2(0)` | N | — | — | — | "Enter the child's date of birth as MM/DD/YYYY." |
| 8 | `Gender` | `nvarchar(1)` | N | — | — | — | "F=Female, M=Male, U= Unknown Null=No entry" |
| 9 | `Notes` | `nvarchar(max)` | N | — | — | — | Free-text client notes (Status tab). |
| 10 | `SSMA_TimeStamp` | `timestamp` | NN | — | auto | — | Row version |
| 11–14 | `InsertDate`, `InsertUser`, `LastUpdateDate`, `LastUpdateUser` | see audit pattern | NN | — | see above | — | Audit |
| 15 | `NonEarlyIntervention` | `bit` | NN | — | `0` | `DF_stblPeople_EarlyIntegration` | "indicates whether the case is EI (0) or non-EI (1)" |

Indexes: clustered PK only. `People_DEV` is a structurally identical development copy.

### 2.2 stblReportingRegion (Region lookup) — read-only

| Column | Type | Null | Key | Default | Description |
| ------ | ---- | ---- | --- | ------- | ----------- |
| `ID` | `int IDENTITY(1,1)` | NN | PK | identity | Region identifier |
| `RName` | `nvarchar(255)` | N | — | — | "Brief Name of Reporting Region" |
| `Description` | `nvarchar(255)` | N | — | — | "Full Name or additional notes" |
| `Inactive` | `bit` | N | — | `0` | "Yes=Inactive, No=Active" |

### 2.3 Form tables (read by Client Status and Input Forms)

All have `ChildID int NULL` → **FK** `stblPeople.ChildID` `ON UPDATE CASCADE ON DELETE CASCADE`, `FormDate datetime2(0) NULL`, `FormType nvarchar(12) NULL` with a static default. Only the columns this module uses are listed; the full column lists are in the DDL.

| Table | PK | `FormType` default | `FormDate` meaning | Columns used here |
| ----- | -- | ------------------ | ------------------ | ----------------- |
| `stblReferralForm` | `ID` identity | `Referral` | Last day of reporting month | `ReferralDate`, `ReReferralDate`, `Region`, `Ethnicity`, `NonEarlyIntervention` (`bit NN`, default 0) |
| `stblActiveForm` | `ID` identity | `Active` | Last day of reporting month | `ReferralDate`, `ReReferralDate`, `InterimDate`, `InitialMeetingDate`, `ConsentDate`, `Region` |
| `stblNoOnePlanForm` | `ID` identity | `No One Plan` | Last day of reporting month | `StatusDate`, `RefStatus`, `Region` |
| `stblExitForm` | `ID` identity | `Exit` | Last day of reporting month | `ExitDate`, `ReferralDate`, `ExitPriorToAge3`, `ExitAtAge3`, `ReferredTo`, `Region` |
| `stblCOSCoverForm` | `COSCoverID` identity | `COS` | `OnePlanDate` if entry, `ExitDate` if exit | `OnePlanDate`, `ExitDate`, `EntryOrExit`, `Region` |
| `stblServiceGridForm` | `ServiceGridID` identity | `Service Grid` | Creation date | `ReferralDate`, `ConsentDate` |
| `stblInsuranceForm` | `ID` identity | `Insurance` | Date completed | — |

Key column meanings:

| Column | Table(s) | Type | Description |
| ------ | -------- | ---- | ----------- |
| `ReferralDate` | Referral, Active, Exit, Service Grid | `datetime2(0)` | Date the child was referred |
| `ReReferralDate` | Referral, Active, Exit | `datetime2(0)` | Date of re-referral; legacy prefers it over `ReferralDate` |
| `InterimDate` | Active | `datetime2(0)` | "Date of Interim One Plan" |
| `InitialMeetingDate` | Active | `datetime2(0)` | "Date of initial meeting to develop the initial One Plan" — legacy **One Plan Date / OP** |
| `ConsentDate` | Active | `datetime2(0)` | "Date of Written Parental Consent for One Plan Services" |
| `ConsentDate` | Service Grid | `datetime2(0)` | "Date of Signed Consent" — legacy service-history consent date |
| `StatusDate` | No One Plan | `datetime2(0)` | "Date above status was determined" — **NOPR date** |
| `RefStatus` | No One Plan | `int` | 1 Initial visit – screening declined · 2 Screened – no further needed · 3 Further eval declined · 4 Evaluated – not eligible · 5 Eligible – family declined · 6 Moved / lost contact · 7 Turned 3 |
| `OnePlanDate` | COS | `datetime2(0)` | One Plan date recorded on the COS entry form |
| `EntryOrExit` | COS | `int` | `-1` Entry · `0` Exit · NULL no entry |
| `ExitDate` | Exit, COS | `datetime2(0)` | Date of exit |
| `ExitPriorToAge3` | Exit | `int` | 1 Development at appropriate level · 2 Moved to other region · 3 Moved out of state · 4 Withdrawn by parent · 5 Unable to contact · 6 Deceased |
| `ExitAtAge3` | Exit | `int` | 1 Potentially eligible · 2 Potentially eligible – family declined · 3 Thought eligible – EEE not determined · 4 Not eligible |
| `ReferredTo` | Exit | `int` | 1 Head Start · 2 Community child care / preschool · 3 School-based preschool · 4 CIS Coordinator · 99 Not eligible – no referrals |
| `Region` | all except Service Grid / Insurance | `int` | Region on the form (may differ from the client's current region) |

### 2.4 stblServices — live service lines (legacy source of service history)

| Column | Type | Null | Key | Default | Description |
| ------ | ---- | ---- | --- | ------- | ----------- |
| `ID` | `int IDENTITY(1,1)` | NN | PK | identity | Service line ID |
| `ServiceGridID` | `int` | N | **FK** → `stblServiceGridForm` (cascade) | — | Owning Service Grid form |
| `SvcCode` | `nvarchar(255)` | N | logical → `slstServiceNames.SvcCode` | — | "Indexed to table slstServiceNames" |
| `OutcomeStatus` | `int` | N | — | — | `D_OutcomeStatus` |
| `ProvideAgency` | `nvarchar(255)` | N | — | — | Provider agency |
| `LocationHome` / `LocationCommunity` / `LocationSPL` / `LocationJustification` | `bit` | N | — | `0` | Service location flags |
| `LocationReason` | `nvarchar(255)` | N | — | — | "Location Justification on file" |
| `HowLong` | `nvarchar(255)` | N | — | — | Hours/frequency text; `x`/`s` are special codes excluded by reports |
| `PlannedStartDate` / `ActualStartDate` / `EndDate` | `datetime2(0)` | N | — | — | Service dates |
| `PayerPrivate` / `PayerMedicaid` / `PayerPOLR` | `bit` | N | — | `0` | Payer flags |
| `TimelineMet` / `TimelineNotMetFC` | `bit` | N | — | `0` | 30-day timeline compliance |
| `DaysPastConsent` | `int` | N | — | — | Days from consent to start |
| `TimelineNotMetExplain` | `nvarchar(255)` | N | — | — | Reason |

`stblServices_old` is an archived copy.

### 2.5 Services — **warehouse** copy (currently read by the rewrite)

`MS_Description`: "Warehouse.[Services]". Populated by the reporting/warehouse process; linked to `Loops` via `LoopId`. **No FKs.**

| Column | Type | Null | Key | Notes |
| ------ | ---- | ---- | --- | ----- |
| `ServiceID` | `int IDENTITY(1,1)` | NN | PK | Real key |
| `ID` | `int` | **N** | — | Copy of `stblServices.ID`; the rewrite uses it as the row key |
| `ServiceGridId` | `int` | N | — | No FK |
| `SvcCode` | `nvarchar(255)` | N | — | |
| `Frequency` | `nvarchar(255)` | N | — | Only in this table |
| `ConsentDate` | `datetime2(0)` | N | — | Only in this table |
| `LoopId` | `int` | N | — | → `Loops.LoopId` (no FK) |
| `Classification`, `Region`, `PrimaryLocation`, `DaystoService` | various | N | — | Warehouse-derived |
| + every `stblServices` column | | | | |

### 2.6 slstServiceNames

| Column | Type | Null | Key | Default | Description |
| ------ | ---- | ---- | --- | ------- | ----------- |
| `SvcNameID` | `int IDENTITY(1,1)` | NN | PK | identity | |
| `SvcCode` | `nvarchar(255)` | NN | **not unique** | — | "Short code using to identify service" |
| `SvcName` | `nvarchar(255)` | NN | — | — | "Full name of service" |
| `SortOrder` | `int` | N | — | — | "Used to keep Service Coordination at the top of Service Grids" |
| `Inactive` | `bit` | N | — | `0` | Retired services kept for history |

### 2.7 slstFormNames (form sequence)

| Column | Type | Null | Key | Description |
| ------ | ---- | ---- | --- | ----------- |
| `Sort` | `int IDENTITY(1,1)` | NN | PK | "Proper sequence order of Input forms for calculating loop errors" |
| `FormName` | `nvarchar(255)` | NN | — | Matches `FormType` text (e.g. `Referral`, `Active`) |

### 2.8 stblLoopErrors

| Column | Type | Null | Key | Description |
| ------ | ---- | ---- | --- | ----------- |
| `ChildID` | `int` | NN | PK (no FK) | Child with at least one loop error |
| `CName` | `nvarchar(255)` | N | — | `LastName, FirstName` |
| `QDate` | `datetime2(0)` | N | — | Date the check ran |

### 2.9 stblAudit

| Column | Type | Null | Key | Description |
| ------ | ---- | ---- | --- | ----------- |
| `ID` | `int IDENTITY(1,1)` | NN | PK | |
| `ChildID` | `int` | N | (no FK) | Client |
| `SS` | `nvarchar(20)` | N | — | SSN at the time |
| `User` | `nvarchar(50)` | N | — | Who |
| `Timestamp` | `datetime2(0)` | N | — | When |
| `Comment` | `nvarchar(255)` | N | — | What |

---

## 3. Application data elements

### 3.1 Frontend `Client` ([types/client.ts](../../frontend/src/types/client.ts))

| Property | TS type | Empty value | DB column | DB type |
| -------- | ------- | ----------- | --------- | ------- |
| `childId` | `number?` | `undefined` | `ChildID` | `int` identity |
| `region` | `number?` | `0` | `Region` | `int` NULL |
| `lastName` | `string` | `''` | `LastName` | `nvarchar(50)` |
| `firstName` | `string` | `''` | `FirstName` | `nvarchar(50)` |
| `ss` | `string?` | `''` | `SS` | `nvarchar(15)` |
| `ssTemp` | `boolean?` | `false` | `SSTemp` | `bit` default 0 |
| `dob` | `string?` (`YYYY-MM-DD`) | `''` | `DOB` | `datetime2(0)` |
| `gender` | `string?` | `''` | `Gender` | `nvarchar(1)` |
| `notes` | `string?` | `''` | `Notes` | `nvarchar(max)` |
| `nonEarlyIntervention` | `boolean?` | `false` | `NonEarlyIntervention` | `bit` NN default 0 |

### 3.2 `ClientStatusData` (API 2.10)

| Property | Type | Current source | Legacy source |
| -------- | ---- | -------------- | ------------- |
| `notes` | string | `stblPeople.Notes` | same |
| `status` | string \| null | Latest `FormType` of 7 tables | `D_Status` label of the latest of 4 key forms |
| `referralDate` | date \| null | `MAX(stblActiveForm.ReferralDate)` | `stblReferralForm` `ReReferralDate ?? ReferralDate` |
| `noOnePlanDate` | date \| null | `MAX(stblNoOnePlanForm.StatusDate)` | same column, latest by `FormDate` |
| `interimDate` | date \| null | `MAX(stblActiveForm.InterimDate)` | same column, latest by `FormDate` |
| `onePlanDate` | date \| null | `MAX(stblCOSCoverForm.OnePlanDate)` | `stblActiveForm.InitialMeetingDate` |
| `exitDate` | date \| null | `MAX(stblExitForm.ExitDate)` | same column, latest by `FormDate` |

### 3.3 `ServiceHistoryItem` ([ServiceHistoryItem.tsx](../../frontend/src/features/client/components/ServiceHistory/ServiceHistoryItem.tsx))

| Property | Type | Current source | Legacy equivalent |
| -------- | ---- | -------------- | ----------------- |
| `id` | number | `Services.ID` (nullable) | `stblServices.ID` |
| `date` | string | `stblServiceGridForm.FormDate` | `SDate` by `OutcomeStatus` (BR-SVC-04) |
| `serviceName` | string | `slstServiceNames.SvcName` | same |
| `frequency` | string | `Services.Frequency` | `stblServices.HowLong` (proposed) |
| `consent` | `Yes`/`Pending` (D) | from `Services.ConsentDate` | `stblServiceGridForm.ConsentDate` (a date) |
| `casePlan` | string | always `''` | not in legacy; proposed `OutcomeStatus` label — confirm |

### 3.4 `InputFormHistoryItem` ([types/input-form.ts](../../frontend/src/types/input-form.ts))

| Property | Type | Current meaning | Legacy (`sqryFormListA`) |
| -------- | ---- | --------------- | ------------------------ |
| `id` | number | PK of the row in its form table | same (legacy also has `UniqueID` = letter + ID, e.g. `A123`) |
| `date` | date \| null | `FormDate` | same |
| `formType` | string | `FormType` | same |
| `referral` | date \| null | `ReferralDate` (Active, Referral, Service Grid, Exit) | Referral form `FormDate` only |
| `nopr` | date \| null | No One Plan `FormDate` | No One Plan `StatusDate` |
| `interim` | date \| null | Active `InterimDate` | same |
| `op` | date \| null | COS `OnePlanDate` | Active `InitialMeetingDate` |
| `exit` | date \| null | `ExitDate` (COS, Exit) | Exit form `ExitDate` only |
| `loopError` | boolean | always `false` | BR-LOOP-01..07 |
| `formName` | `D_FormName` | Which table the row came from | — |

### 3.5 UI-only state

| Element | Type | Description |
| ------- | ---- | ----------- |
| `isLocked` | boolean | Screen read-only mode. Default `true`. |
| `isNewClient` | boolean | New-client flag. Not currently read. |
| `statusDate` | `YYYY-MM-DD` | "Client Status On" date. Default today (local). |
| `visibleForms` | `Record<D_FormName, boolean>` | History grid filter; all `true` by default. |
| Age | number \| `--` | D from `dob` (BR-DER-01). |
