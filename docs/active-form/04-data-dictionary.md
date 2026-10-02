# 04 — Data Dictionary: Active Form

Source: `dbCDD` DDL (2026-09-09). Quoted text is the column's `MS_Description`. **Used** says whether the new Active Form reads/writes the column: ✅ written by the UI · ⚙ written by the backend only · 👁 read only · ❌ not used.

Access-style Yes/No `int` columns hold **`-1` = Yes, `0` = No, NULL = no data**; `bit` columns hold `1`/`0`.

---

## 1. stblActiveForm

PK `ID` (clustered). FK `ChildID` → `stblPeople.ChildID` `ON UPDATE CASCADE ON DELETE CASCADE` (created `WITH NOCHECK`). No other FKs.

### 1.1 Header

| # | Column | Type | Null | Default | Constraint | Description | Used |
| - | ------ | ---- | ---- | ------- | ---------- | ----------- | ---- |
| 1 | `ID` | `int IDENTITY(1,1)` | NN | identity | PK | Active Form ID | 👁 |
| 2 | `ChildID` | `int` | N | — | FK cascade | Client | ⚙ (from URL) |
| 3 | `FormDate` | `datetime2(0)` | N | — | — | "Effective Date of Form (always last day of month, calculated from MonthReporting)" | ✅ today's date on create |
| 4 | `FormType` | `nvarchar(12)` | N | `'Active'` | — | "Static field set to "Active"" | ✅ `aop` / `aop-capta` |
| 5 | `Region` | `int` | N | — | (logical → `stblReportingRegion.ID`) | "Enter Reporting Region" | ✅ |
| 6 | `MonthReporting` | `int` | N | — | — | "Month and Year being reported" | ❌ |

### 1.2 Location and service coordinator

| # | Column | Type | Null | Default | Constraint | Description | Used |
| - | ------ | ---- | ---- | ------- | ---------- | ----------- | ---- |
| 7 | `SU_id` | `int` | N | — | (logical → `slstSU`) | "Enter Supervisory Union number." | ⚙ via town mapping only |
| 8 | `SUName` | `nvarchar(50)` | N | — | `CHECK len > 0` | "Enter or select name of Supervisory Union." | ❌ |
| 9 | `CountyCode` | `nvarchar(12)` | N | — | `CHECK len > 0` | "Enter name of county where child resides." | ⚙ via town mapping only |
| 10 | `Town` | `nvarchar(3)` | N | — | `CHECK len > 0` | "Enter name of town where child resides." | ⚙ via town mapping only |
| 11 | `FamilyIsSvcCord` | `bit` | N | `0` | — | "Yes = Family is Service Coordinator, No = Family is not Service Coordinator" | ❌ |
| 12 | `SvcCordFirstName` | `nvarchar(50)` | N | — | — | "Service Coordinator's First Name" | ✅ (no input; sends `''` on new) |
| 13 | `SvcCordLastName` | `nvarchar(50)` | N | — | — | "Service Coordinator's Last Name" | ✅ (no input; sends `''` on new) |
| 14 | `SvcCordType` | `int` | N | — | (logical → `slstSvcCordType`) | "1 = EI, 2 = School, 3 = CSHN, 4 = Other" | ❌ |
| 15 | `SvcCordOtherDesc` | `nvarchar(255)` | N | — | — | "If CIS Service Coordinator is "Other" then fill in description here" | ❌ |
| 16 | `CAPTA` | `int` | N | — | — | "Yes = CAPTA, No = No CAPTA, Null = No Data" (`-1`/`0`) | ❌ (encoded in `FormType` instead) |
| 17 | `ReferralDate` | `datetime2(0)` | N | — | — | Date of referral | ✅ |
| 18 | `ReReferralDate` | `datetime2(0)` | N | — | — | Re-referral date | ❌ |
| 19 | `Address` | `nvarchar(255)` | N | — | — | Address | ❌ |
| 20 | `ZipCode` | `nvarchar(255)` | N | — | — | ZIP code | ❌ |
| 21 | `Ethnicity` | `int` | N | — | (logical → `slstEthnicity.ID`) | "1 = Hispanic or Latino, 2 = American Indian or Alaska Native, 3 = Asian, 4 = Black or African American, 5 = Native Hawaiian or Other Pacific Islander, 6 = White, 99 = Two or More races" | ❌ |

### 1.3 Initial evaluation and One Plan

| # | Column | Type | Null | Default | Description | Used |
| - | ------ | ---- | ---- | ------- | ----------- | ---- |
| 22 | `InterimDate` | `datetime2(0)` | N | — | "Date of Interim One Plan" | ❌ |
| 23 | `InitialEvalDate` | `datetime2(0)` | N | — | "Date of Initial Evaluation/Assessment" | ✅ |
| 24 | `EvalWithin45Days` | `int` | N | — | "Was this date within 45 days of referral (Yes, No, Null)" | ❌ |
| 25 | `DelayFC` | `nvarchar(50)` | N | — | "Reasons for delay due to family and/or child circumstances" | ✅ |
| 26 | `DelayFCOther` | `nvarchar(max)` | N | — | Other family-reason details | ❌ (UI field not mapped) |
| 27 | `DelayNotFC` | `nvarchar(50)` | N | — | "Reasons for delay not due to family and/or child circumstances (non-compliant)" | ✅ |
| 28 | `DelayNotFCOther` | `nvarchar(max)` | N | — | Other provider-reason details | ❌ (UI field not mapped) |
| 29 | `InitEval45Compliant` | `bit` | N | `0` | "Initial evaluation - Compliant" | ❌ |
| 30 | `InitEval45FC` | `bit` | N | `0` | "Initial evaluation - Delayed due to Family Circumstances" | ❌ |
| 31 | `InitEval45NC` | `bit` | N | `0` | "Initial evaluation - Non-Compliant" | ❌ |
| 32 | `InitialMeetingDate` | `datetime2(0)` | N | — | "Date of initial meeting to develop the initial One Plan" — UI **Date of One Plan** | ✅ |
| 33 | `MeetingWithin45Days` | `int` | N | — | "Was this meeting within 45 days of referral (Yes, No, Null)" | ❌ |
| 34 | `MeetingDelayFC` | `nvarchar(50)` | N | — | Meeting delay — family reason | ✅ |
| 35 | `MeetingDelayFCOther` | `nvarchar(max)` | N | — | Details | ❌ (UI field not mapped) |
| 36 | `MeetingDelayNC` | `nvarchar(50)` | N | — | Meeting delay — provider reason | ✅ |
| 37 | `MeetingDelayNCOther` | `nvarchar(max)` | N | — | Details | ❌ (UI field not mapped) |
| 38 | `InitMeeting45Compliant` | `bit` | N | `0` | "Initial One Plan meeting with 45 days - Compliant" | ❌ |
| 39 | `InitMeeting45FC` | `bit` | N | `0` | "… - Family Circumstances" | ❌ |
| 40 | `InitMeeting45NC` | `bit` | N | `0` | "… - Non-Compliant" | ❌ |
| 41 | `BothCompliant` | `bit` | N | `0` | "Both Eval/Initial meetings - Compliant" | ❌ |
| 42 | `BothFC` | `bit` | N | `0` | "Both Eval/Initial meetings - Family Circumstances" | ❌ |
| 43 | `BothNC` | `bit` | N | `0` | "Both Eval/Initial meetings - Non-Compliant" | ❌ |
| 44 | `ConsentDate` | `datetime2(0)` | N | — | "Date of Written Parental Consent for One Plan Services" | ❌ |

### 1.4 Eligibility

All `bit NULL DEFAULT 0` unless stated.

| # | Column | Description (UI label) | Used |
| - | ------ | ---------------------- | ---- |
| 45 | `DDAll` | "All Developmental Delays" | ✅ |
| 46 | `DDAdaptive` | Adaptive | ✅ |
| 47 | `DDCognitive` | Cognitive | ✅ |
| 48 | `DDCommunication` | "Communication (Speech/Lang)" | ✅ |
| 49 | `DDMotor` | Motor | ✅ |
| 50 | `DDSocial` | "Social/Emotional" | ✅ |
| 51 | `DCAttachment` | "Attachment Disorder" | ✅ |
| 52 | `DCAutism` | "Autism/PDD" | ✅ |
| 53 | `DCSuspected` | "Suspected Autism" | ✅ |
| 54 | `DCBlind` | "Blind/Visually Impaired" | ✅ |
| 55 | `DCDeaf` | "Deaf/Hard of Hearing" | ✅ |
| 56 | `DCDown` | "Down Syndrome" | ✅ |
| 57 | `DCCerebral` | "Cerebral Palsy" | ✅ |
| 58 | `DCCraniofacial` | "Craniofacial Disorder" | ✅ |
| 59 | `DCFragile` | "Medically Fragile" | ✅ |
| 60 | `DCOral` | "Oral Motor/Swallowing" | ✅ |
| 61 | `DCBirth` | "Severe Complications at Birth" | ✅ |
| 62 | `DCOther` | Other condition flag | ❌ |
| 63 | `DCOtherDesc` | `nvarchar(255)` — "Other Condition Description" (also carries the `NMNEI` marker) | ✅ |
| 64 | `AutismDate` | `date` — ASD diagnosis date | ✅ |
| 65 | `SuspectedDate` | `date` — Suspected ASD diagnosis date | ✅ |
| 66 | `BlindDate` | `date` — Vision diagnosis date | ✅ |
| 67 | `DeafDate` | `date` — Hearing diagnosis date | ✅ |

### 1.5 Audit

| # | Column | Type | Null | Default | Used |
| - | ------ | ---- | ---- | ------- | ---- |
| 68 | `SSMA_TimeStamp` | `timestamp` (rowversion) | NN | auto | 👁 |
| 69 | `InsertDate` | `datetime` | NN | `getdate()` | DB |
| 70 | `InsertUser` | `varchar(50)` | NN | `suser_sname()` | DB |
| 71 | `LastUpdateDate` / `LastUpdateUser` | `datetime` / `varchar(50)` | NN | `getdate()` / `suser_sname()` | ⚙ date set on update; user not changed |

---

## 2. Lookup tables

| Table | Columns (type) | Key | Used by | Notes |
| ----- | -------------- | --- | ------- | ----- |
| `slstActiveDelayFC` | `Reason nvarchar(255) NN` | PK `Reason` | Delay lists (family) | Values not in script; `DelayFC` is only `nvarchar(50)` |
| `slstActiveDelayNFC` | `Reason nvarchar(255) NN` | PK `Reason` | Delay lists (provider) | Same |
| `stblReportingRegion` | `ID int`, `RName nvarchar(255)`, `Description`, `Inactive bit` | PK `ID` | Region dropdown (via `/api/common-info/regions`) | |
| `slstSU` | `SU_id int`, `SUName nvarchar(50) NN`, `SortOrder int`, `Inactive bit` (default 0) | PK `SU_id` | `/lookups/supervisory-unions` (unused by UI) | "number assigned … by the Vermont Department of Education" |
| `slstTownCodes` | `Town nvarchar(5)`, `TownName nvarchar(25)`, `VDHTownCodes nvarchar(5)`, `SU_id int`, `CountyCode nvarchar(255) NN` | PK `Town`; FK `SU_id → slstSU` | `/api/common-info/towns`, town mapping | |
| `slstCounties` | `CountyCode nvarchar(255)`, `CountyName nvarchar(50) NN` | PK `CountyCode` | Joined to towns | |
| `slstSvcCordType` | `SvcCordType int IDENTITY`, `SvcCordTypeDesc nvarchar(255)` | PK | `/lookups/service-coordinator-types` (unused by UI) | |
| `slstEthnicity` | `ID int`, `Ethnicity nvarchar(50) NN` | PK `ID` | — (not used) | |
| `slstFormNames` | `Sort int IDENTITY`, `FormName nvarchar(255)` | PK `Sort` | Legacy form ordering / loop errors | Matches `FormType` text, e.g. `Active` |

---

## 3. Application data elements

### 3.1 Form model `ActiveFormValues` ([types/active-form.ts](../../frontend/src/types/active-form.ts))

| Property | Type | Default (new) | Saved as | Notes |
| -------- | ---- | ------------- | -------- | ----- |
| `Region` | number | client's region | `Region` | required > 0 |
| `SvcCordFirstName` / `SvcCordLastName` | string | `''` | same columns | no inputs on screen |
| `ReferralDate` | `YYYY-MM-DD` | `''` | `ReferralDate` | required |
| `status` | `'aop' \| 'aop-capta'` | `''` | `FormType` (alias) | required |
| `InitialEvalDate` | `YYYY-MM-DD` | `''` | `InitialEvalDate` | required by schema |
| `DelayReason` | `family::<reason>` \| `provider::<reason>` \| `''` | `''` | `DelayFC` or `DelayNotFC` | |
| `DelayDetails` | string | `''` | **not saved** | AF-GAP-01 |
| `onePlanDate` | `YYYY-MM-DD` | `''` | `InitialMeetingDate` | required by schema |
| `MeetingDelayReason` | as `DelayReason` | `''` | `MeetingDelayFC` or `MeetingDelayNC` | |
| `MeetingDelayDetails` | string | `''` | **not saved** | AF-GAP-01 |
| `DDAll` … `DCBirth` (17) | boolean | `false` | same-name `bit` columns | |
| `DCTorticollis`, `DCPlagiocephaly`, `DCPrematurity`, `DCBehavior`, `DCNutrition`, `DCNAS`, `DCCysticFibrosis`, `DCHIE`, `DCFeeding` | boolean | `false` | **not saved** | AF-GAP-02 |
| `NMNEI` | boolean | `false` | `NMNEI` line in `DCOtherDesc` | AF-GAP-10 |
| `DCOtherDesc` | string | `''` | `DCOtherDesc` | max 255 in DB |
| `AutismDate`, `SuspectedDate`, `BlindDate`, `DeafDate` | `YYYY-MM-DD` | `''` | same-name `date` columns | ≥ DOB |

### 3.2 Derived (not stored)

| Element | Rule |
| ------- | ---- |
| Days Between Referral and Initial Evaluation | `InitialEvalDate − ReferralDate` (calendar days) |
| Days Between Referral and One Plan | `onePlanDate − ReferralDate` |
| Picker minimum for eval / One Plan dates | later of `ReferralDate` and DOB |

### 3.3 `ActiveFormClient` (read-only header, from `stblPeople`)

`ChildID`, `Region`, `LastName`, `FirstName`, `SS`, `SSTemp`, `DOB`, `Gender`, `Notes`, `NonEarlyIntervention`. The screen shows LastName, FirstName, SS (unmasked), DOB.
