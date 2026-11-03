# 04 — Data Dictionary: Exit Form

Source: `dbCDD` DDL (script dated 2026-09-09), checked against the local `dbCDD` database on 2026-11-02 (same 45 columns and types). Quoted text is the column's `MS_Description`; descriptions that only repeat the Access source name (`CISState_be_tables.[stblExitForm].[…]`) are replaced by a plain description.

**Used** says how the new Exit Form uses the column: ✅ written from the screen · ⚙ set by the backend · **API** accepted by `/api/exit-forms` but not on the screen · 👁 read only · DB set by a column default.

Access-style Yes/No `int` columns hold **`-1` = Yes, `0` = No, NULL = no data**; `bit` columns hold `1`/`0`.

---

## 1. stblExitForm

PK `ID` (clustered, `stblExitForm$PrimaryKey`). FK `ChildID` → `stblPeople.ChildID` `ON UPDATE CASCADE ON DELETE CASCADE` (`stblExitForm$stblPeoplestblExitForm`, created `WITH NOCHECK`). Check constraints: `CountyCode`, `SUName` and `Town` can't be empty strings (`len > 0`). No other FKs or indexes.

### 1.1 Header

| # | Column | Type | Null | Default | Constraint | Description | Used |
| - | ------ | ---- | ---- | ------- | ---------- | ----------- | ---- |
| 1 | `ID` | `int IDENTITY(1,1)` | NN | identity | PK | Exit Form ID | 👁 |
| 2 | `ChildID` | `int` | N | — | FK cascade | Client | ⚙ (from the URL) |
| 3 | `FormDate` | `datetime2(0)` | N | — | — | "Effective Date of Form (always last day of month, calculated from MonthReporting)" | ⚙ = `ExitDate` |
| 4 | `FormType` | `nvarchar(12)` | N | `'Exit'` | — | "Static field set to "Exit"" | ⚙ always `'Exit'` |
| 5 | `Region` | `int` | N | — | (logical → `stblReportingRegion.ID`) | "Enter Reporting Region" | ✅ |
| 6 | `MonthReporting` | `int` | N | — | — | "Month and Year being reported" | API |

### 1.2 Location, service coordinator, referral

**[Decision]** Supervisory Union, Town, County and Service Coordinator were removed from the Exit Form and aren't saved.

| # | Column | Type | Null | Default | Constraint | Description | Used |
| - | ------ | ---- | ---- | ------- | ---------- | ----------- | ---- |
| 7 | `SU_id` | `int` | N | — | (logical → `slstSU`) | "Enter Supervisory Union number." | API |
| 8 | `SUName` | `nvarchar(50)` | N | — | `CHECK len > 0` | "Enter or select name of Supervisory Union." | API |
| 9 | `CountyCode` | `nvarchar(12)` | N | — | `CHECK len > 0` | "Enter name of county where child resides." | API |
| 10 | `Town` | `nvarchar(3)` | N | — | `CHECK len > 0` | "Enter name of town where child resides." | API |
| 11 | `SvcCordFirstName` | `nvarchar(50)` | N | — | — | "Service Coordinator's First Name" | API |
| 12 | `SvcCordLastName` | `nvarchar(50)` | N | — | — | "Service Coordinator's Last Name" | API |
| 13 | `SvcCordType` | `int` | N | — | (logical → `slstSvcCordType`) | "1 = EI, 2= School, 4 = Other" | API |
| 14 | `SvcCordOtherDesc` | `nvarchar(255)` | N | — | — | "If CIS Service Coordinator is "Other" then fill in description here" | API |
| 15 | `CAPTA` | `int` | N | — | — | "Yes = CAPTA, No = No CAPTA, Null=No Data" (`-1`/`0`) | API |
| 16 | `ReferralDate` | `datetime2(0)` | N | — | — | Date of referral (prefilled from the latest Active / Referral form) | ✅ |
| 17 | `ReReferralDate` | `datetime2(0)` | N | — | — | Re-referral date | API |

### 1.3 Child Outcomes Summary (COSF) questions

Not on the new Exit Form (COS has its own form). All **API**. Meanings after "—" are read from the column names; the database only says "Yes/No/Null".

| # | Column | Type | Null | Description |
| - | ------ | ---- | ---- | ----------- |
| 18 | `COSFEnter30Months` | `int` | N | "Yes/No/Null" — entered before 30 months |
| 19 | `COSFEntryForm` | `int` | N | "Yes/No/Null" — COS entry form completed |
| 20 | `COSFEntryFormReason` | `nvarchar(max)` | N | Reason the entry form wasn't completed |
| 21 | `COSFGot6MonthsSvcs` | `int` | N | "Yes/No/Null" — received 6 months of services |
| 22 | `COSFExitForm` | `int` | N | "Yes/No/Null" — COS exit form completed |
| 23 | `COSFExitFormReason` | `nvarchar(max)` | N | Reason the exit form wasn't completed |

### 1.4 Exit date and transition

| # | Column | Type | Null | Default | Description | Used |
| - | ------ | ---- | ---- | ------- | ----------- | ---- |
| 24 | `ExitDate` | `datetime2(0)` | N | — | Date of exit — UI **Date of Exit** | ✅ required |
| 25 | `TransitionPlanCompleted` | `datetime2(0)` | N | — | Date the written transition plan was completed — UI **Date Written Transition Plan** | ✅ |
| 26 | `TransitionPlanReason` | `nvarchar(max)` | N | — | Reason the transition plan was late (legacy reports read the first word: family / provider) — UI **Transition Plan Delay Reason** | ✅ |
| 27 | `CLLEANotificationDate` | `datetime2(0)` | N | — | Date the LEA (local education agency) was notified of the child — UI **LEA Notification Date** | ✅ |
| 28 | `Notified90Days` | `int` | N | — | "Yes/No/Null - Notified within 6 months to 90 days of 3rd birthday" | API (EF-GAP-04) |
| 29 | `NotifiedReason` | `nvarchar(max)` | N | — | "If not notified within 6 months of 3rd birthday" | API (EF-GAP-04) |
| 30 | `NotifyStatePartC` | `int` | N | — | "Yes/No/Null - Notification sent to State Part C office" | API (EF-GAP-04) |
| 31 | `TransitionMeeting` | `datetime2(0)` | N | — | Date of the transition conference — UI **Date of Transition Conference** | ✅ |
| 32 | `TransitionMeeting90day` | `int` | N | — | "Yes/No/Null" — conference held within the 90-day timeline (meaning from the column name) | API (EF-GAP-04) |
| 33 | `NoTransitionMtgReason` | `nvarchar(max)` | N | — | Reason there was no timely transition conference | API (EF-GAP-04) |

### 1.5 Exit reason and referral

| # | Column | Type | Null | Default | Description | Used |
| - | ------ | ---- | ---- | ------- | ----------- | ---- |
| 34 | `ExitPriorToAge3` | `int` | N | — | "1=Development at appropriate leve, 2=Moved to other region, 3=Moved out of state, 4=Withdrawn by parent or guardian, 5=Unable to contact, 6=Deceased". **New:** 7 = Non-EI Client Exit, 8 = Referral to CIS-EI. **0** = the child exited at age 3 instead. | ✅ (0 set by ⚙) |
| 35 | `MovedOtherRegion` | `nvarchar(255)` | N | — | "Specify region" — only for `ExitPriorToAge3 = 2` — UI **Region Moved To** | ✅ |
| 36 | `ExitAtAge3` | `int` | N | — | "1=Child is potentially elible, 2=Child is potentially eligible - Family declined, 3=Child thought to be eligible - EEE not determined, 4=Child not eligible". **0** = the child exited prior to age 3 instead. | ✅ (0 set by ⚙) |
| 37 | `EXFNoPartB1` | `bit` | N | `0` | "Child's Development is at Appropriate level" — only for `ExitAtAge3 = 4` | ⚙ cleared otherwise |
| 38 | `EXFNoPartB2` | `bit` | N | `0` | "Child did not meet Part C's criteria for potential eligibility" | ⚙ cleared otherwise |
| 39 | `EXFNoPartB3` | `bit` | N | `0` | "Child did not meet Part B's eligibility at Transition Conference" | ⚙ cleared otherwise |
| 40 | `ReferredTo` | `int` | N | — | "1=Head Start, 2=Community-based Child Care Program or Preschool, 3=School based pre-school classroom, 4=Children's Integrated Services Coordinator, 99=Not eligible - exited with no referrals". **New:** 5 = Other. UI label for 99: "Exited with no referral". | ✅ |

### 1.6 Audit

| # | Column | Type | Null | Default | Description | Used |
| - | ------ | ---- | ---- | ------- | ----------- | ---- |
| 41 | `SSMA_TimeStamp` | `timestamp` (rowversion) | NN | auto | Row version from the Access migration | 👁 |
| 42 | `InsertDate` | `datetime` | NN | `getdate()` | "The time the record was added to the database" | DB |
| 43 | `InsertUser` | `varchar(50)` | NN | `suser_sname()` | "The user who added the record to the database" | DB |
| 44 | `LastUpdateDate` | `datetime` | NN | `getdate()` | "The time the record was last updated in the database" | ⚙ set on update |
| 45 | `LastUpdateUser` | `varchar(50)` | NN | `suser_sname()` | "The user who last modified the record in the database" | ⚙ set on update (API login) |

---

## 2. Code lists

There are no lookup tables for these codes in `dbCDD`; the lists are kept in [exit-form.config.ts](../../backend/src/modules/exit-form/exit-form.config.ts) and served by `GET /api/exit-forms/lookups/options`.

### 2.1 ExitPriorToAge3 — "Child Exited this region PRIOR TO AGE 3 OR NON-EI Client"

| Code | Label | In legacy description | Annual exit report order (`Choose`) |
| ---- | ----- | :-------------------: | ----------------------------------- |
| 7 | Non-EI Client Exit | ❌ new | **none — dropped (EF-GAP-02)** |
| 8 | Referral to CIS-EI | ❌ new | **none — dropped (EF-GAP-02)** |
| 1 | Development at appropriate level | ✅ | 1 |
| 2 | Moved to other region | ✅ | 11 |
| 3 | Moved out of state | ✅ | 8 |
| 4 | Withdrawn by parent or guardian | ✅ | 9 |
| 5 | Unable to contact | ✅ | 10 |
| 6 | Deceased | ✅ | 7 |
| 0 | *(exited at age 3 instead — set automatically)* | legacy convention | — |

### 2.2 ExitAtAge3 — "Child Exited AT AGE 3"

| Code | Label | Uses EXFNoPartB1-3 |
| ---- | ----- | :----------------: |
| 1 | Child is potentially eligible for Part B services | — |
| 2 | Child is potentially eligible for Part B services - child's family declined further service | — |
| 3 | Child is thought to be eligible but potential eligibility not determined | — |
| 4 | Child is NOT eligible for Part B | ✅ |
| 0 | *(exited prior to age 3 instead — set automatically)* | — |

### 2.3 ReferredTo

| Code | Label | In legacy description |
| ---- | ----- | :-------------------: |
| 1 | Head Start | ✅ |
| 2 | Community-based Child Care Program or Preschool | ✅ |
| 3 | School based Pre-School Classroom | ✅ |
| 4 | Children's Integrated Services Coordinator | ✅ |
| 5 | Other | ❌ new |
| 99 | Exited with no referral | ✅ ("Not eligible - exited with no referrals") |

---

## 3. Related tables

| Table | Columns used | Key | Used by | Notes |
| ----- | ------------ | --- | ------- | ----- |
| `stblPeople` | `ChildID`, `Region`, `LastName`, `FirstName`, `SS`, `SSTemp`, `DOB`, `Gender`, `Notes`, `NonEarlyIntervention` | PK `ChildID` | Client header; DOB checks | Parent of the FK |
| `stblActiveForm` | `Region`, `ReferralDate`, `FormDate` | PK `ID` | Prefill (latest by `FormDate`) | Read only |
| `stblReferralForm` | `Region`, `ReferralDate`, `ReReferralDate`, `FormDate` | PK `ID` | Prefill fallback | Read only |
| `stblReportingRegion` | `ID`, `RName`, `Inactive` | PK `ID` | Region dropdown (`/api/common-info/regions`) | No FK from the form |
| `slstFormNames` | `Sort`, `FormName` | PK `Sort` | Legacy form ordering / loop errors | Matches `FormType` text `Exit` |
| `slstAnnualExitReasons` | `ID`, `Reason` | PK `ID` | Annual exit reports | Ordered by the `Choose` mapping in 2.1 |
| `Loops` (warehouse) | `ExitPriortoAge3`, `ExitAtAge3`, `ReferredTo`, `EndDate`, transition columns | — | Indicator 8 views (`BaseResults0801`, `DCInd8*`, `DCNotPEReferred`) | Filled from `stblExitForm` by the warehouse process |

---

## 4. Application data elements

### 4.1 Form model `ExitFormValues` ([types/exit-form.ts](../../frontend/src/types/exit-form.ts))

| Property | Type | Default (new) | Saved as | Notes |
| -------- | ---- | ------------- | -------- | ----- |
| `Region` | number | prefill | `Region` | required > 0 |
| `ReferralDate` | `YYYY-MM-DD` | prefill | `ReferralDate` | required |
| `ExitDate` | `YYYY-MM-DD` | `''` | `ExitDate` (+ `FormDate` by the backend) | required |
| `TransitionPlanCompleted` | `YYYY-MM-DD` | `''` | same | required at age 3 |
| `TransitionPlanReason` | string | `''` | same | trimmed; blank → null |
| `CLLEANotificationDate` | `YYYY-MM-DD` | `''` | same | required at age 3 |
| `TransitionMeeting` | `YYYY-MM-DD` | `''` | same | required at age 3 |
| `exitPath` | `'' \| 'prior' \| 'atAge3'` | suggested from exit date | **not saved** | decides which code is sent |
| `ExitPriorToAge3` | string code | `''` | `ExitPriorToAge3` | sent only for `prior`, else null (backend stores 0) |
| `MovedOtherRegion` | string | `''` | `MovedOtherRegion` | sent only for `prior` |
| `ExitAtAge3` | string code | `''` | `ExitAtAge3` | sent only for `atAge3`, else null (backend stores 0) |
| `ReferredTo` | string code | `''` | `ReferredTo` | required at age 3 |

### 4.2 Derived (not stored) — `ExitFormCalculated`

| Element | Rule |
| ------- | ---- |
| `thirdBirthday` | DOB + 3 years |
| `daysReferralToTransitionPlan` | `TransitionPlanCompleted − ReferralDate` |
| `daysLEANotificationBeforeExit` | `ExitDate − CLLEANotificationDate` |
| `daysTransitionConferenceBeforeExit` | `ExitDate − TransitionMeeting` |
| `daysExitBeforeThirdBirthday` | `thirdBirthday − ExitDate` |
| Suggested `exitPath` | `atAge3` when `ExitDate ≥ thirdBirthday − 31 days`, else `prior` |

### 4.3 `ExitFormClient` (read-only header, from `stblPeople`)

`ChildID`, `Region`, `LastName`, `FirstName`, `SS`, `SSTemp`, `DOB`, `Gender`, `Notes`, `NonEarlyIntervention`. The screen shows LastName, FirstName, SS (unmasked) and DOB.
