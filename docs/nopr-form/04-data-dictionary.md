# 04 — Data Dictionary: NOPR Form

Source: the local `dbCDD` database (2026-11-18) and the full schema script: columns, defaults, keys, column descriptions (`MS_Description`) and the views and procedures that read the table. Unlike most form tables, `stblNoOnePlanForm` **has** column descriptions; they are quoted below.

**Used** says how the new NOPR Form uses the column: ✅ written from the screen · ⚙ set by the backend · 👁 read only · ⛔ not written (value kept) · DB set by a column default · 🆕 added for this form.

---

## 1. stblNoOnePlanForm

PK `ID` (clustered, `stblNoOnePlanForm$PrimaryKey`). FK `ChildID` → `stblPeople.ChildID` `ON UPDATE CASCADE ON DELETE CASCADE` (`stblNoOnePlanForm$stblPeoplestblNoOnePlanForm`, created `WITH NOCHECK`, not trusted). No check constraints and no other indexes. **16 columns** (15 legacy + `InitialEvalDate`).

### 1.1 Header

| # | Column | Type | Null | Default | Constraint | Description (database / meaning) | Used |
| - | ------ | ---- | ---- | ------- | ---------- | -------------------------------- | ---- |
| 1 | `ID` | `int IDENTITY(1,1)` | NN | identity | PK | NOPR Form ID | 👁 |
| 2 | `ChildID` | `int` | N | — | FK cascade | Client | ⚙ (from the URL) |
| 3 | `FormDate` | `datetime2(0)` | N | — | — | DB: *"Effective Date of Form (always last day of month, calculated from MonthReporting)"*. **Now always the status date [Decision].** FITP reads it as the exit date | ⚙ = `StatusDate` |
| 4 | `FormType` | `nvarchar(12)` | N | `'No One Plan'` | — | DB: *"Static field set to 'No One Plan'"* | ⚙ always `'No One Plan'` |

### 1.2 General information

| # | Column | Type | Null | Default | Constraint | Description (database / meaning) | Used |
| - | ------ | ---- | ---- | ------- | ---------- | -------------------------------- | ---- |
| 5 | `Region` | `int` | N | — | (logical → `stblReportingRegion.ID`) | DB: *"Enter Reporting Region"* | ✅ required |
| 6 | `MonthReporting` | `int` | N | — | — | DB: *"Month and Year being reported"*. Removed from the screen **[Request]** | ⛔ |

### 1.3 Status

| # | Column | Type | Null | Default | Constraint | Description (database / meaning) | Used |
| - | ------ | ---- | ---- | ------- | ---------- | -------------------------------- | ---- |
| 7 | `RefStatus` | `int` | N | — | — | Reason no plan resulted, see §2.1. DB lists codes 1–7 | ✅ required |
| 8 | `Screening` | `int` | N | — | — | DB: *"1=Early Intervention, 2=Early Childhood & Family Mental Health, 3=Family Support, 4=Nursing"* (legacy **Periodic Screening**). Removed **[Request]** | ⛔ |
| 9 | `ReferredBack` | `bit` | N | `0` | — | Legacy **Referred back to CIS Intake Team**. Removed **[Request]** | ⛔ |
| 10 | `StatusDate` | `datetime2(0)` | N | — | — | DB: *"Date above status was determined"*. Not before DOB or the most recent referral date | ✅ required |
| 16 | `InitialEvalDate` | `datetime2(0)` | N | — | — | DB: *"Date of Initial Evaluation (optional). Not before Date of Birth; not after StatusDate."* Same type as `stblActiveForm.InitialEvalDate` | 🆕 ✅ optional |

### 1.4 Audit

| # | Column | Type | Null | Default | Description | Used |
| - | ------ | ---- | ---- | ------- | ----------- | ---- |
| 11 | `SSMA_TimeStamp` | `timestamp` | NN | auto | Row version (from the Access migration) | — |
| 12 | `InsertDate` | `datetime` | NN | `getdate()` | Created on | DB |
| 13 | `InsertUser` | `varchar(50)` | NN | `suser_sname()` | Created by (SQL login) | DB |
| 14 | `LastUpdateDate` | `datetime` | NN | `getdate()` | Last changed on | ⚙ on update |
| 15 | `LastUpdateUser` | `varchar(50)` | NN | `suser_sname()` | Last changed by | ⚙ on update |

N = nullable, NN = not null. `#` is the column order in the table; `InitialEvalDate` is added last.

---

## 2. Code lists

There is no lookup table for these codes in `dbCDD`; the reason list is kept in [nopr-form.config.ts](../../backend/src/modules/nopr-form/nopr-form.config.ts) and served by `GET /api/nopr-forms/lookups/options`.

### 2.1 RefStatus — "Status: Referred with No One Plan Resulting for Early Intervention Services"

Shown in this order:

| Order | Code | Label | Database description | Status |
| ----- | ---- | ----- | -------------------- | ------ |
| 1 | 8 | Initial Contact Not Made | *(not in the description, NOPR-GAP-10)* | **New [Request]** |
| 2 | 1 | Initial visit made - Screening/evaluation declined | Initial Visit Made-Screening declined | Active |
| 3 | 2 | Screened - No further evaluation needed | Screened-No further needed | Active |
| 4 | 3 | Further Evaluation Declined by Family - Eligibility Not Determined | Further eval declined | Active |
| 5 | 4 | Evaluated - Not Eligible | Evaluated-Not eligible | Active |
| 6 | 5 | Eligible - Services Declined by Family | Eligible-Family Declined | Active |
| 7 | 6 | Moved or Lost Contact | Moved or Lost Contact | Active |
| — | 7 | Turned 3 during evaluation process | Turned 3 | **Retired [Request]** — kept on older forms only |

### 2.2 Screening (legacy, not written)

| Code | Meaning |
| ---- | ------- |
| 1 | Early Intervention |
| 2 | Early Childhood & Family Mental Health |
| 3 | Family Support |
| 4 | Nursing |

---

## 3. Related tables

| Table | Columns used | How |
| ----- | ------------ | --- |
| `stblPeople` | `ChildID`, `Region`, `LastName`, `FirstName`, `SS`, `DOB` | Client Information header; DOB for the date rules; last fallback for the region |
| `stblReferralForm` | `ChildID`, `ReferralDate`, `ReReferralDate`, `Region`, `FormDate`, `ID` | Most recent referral date (`MAX` of both dates); region fallback |
| `stblActiveForm` | `ChildID`, `Region`, `FormDate`, `ID` | Region for a new form (latest Active form) |
| `stblReportingRegion` | `ID`, `RName` | Region dropdown and the region name in the header |
| `slstFormNames` | `FormName = 'No One Plan'`, `Sort` | Legacy form order for loop errors and key-form status |

---

## 4. Application data elements

### 4.1 Form model `NoprFormValues` ([types/nopr-form.ts](../../frontend/src/types/nopr-form.ts))

| Field | Type | Maps to |
| ----- | ---- | ------- |
| `Region` | `number` (0 = not chosen) | `Region` |
| `RefStatus` | `string` (`''` or a code) | `RefStatus` (number) |
| `InitialEvalDate` | `string` (YYYY-MM-DD or `''`) | `InitialEvalDate` (`''` → NULL) |
| `StatusDate` | `string` (YYYY-MM-DD) | `StatusDate`, and `FormDate` on the server |

### 4.2 `NoprFormClient` (read-only header, from `stblPeople`)

`ChildID`, `Region`, `LastName`, `FirstName`, `SS`, `DOB`.

### 4.3 `NoprFormDefaults` (from `GET /{childId}/defaults`)

| Field | Meaning |
| ----- | ------- |
| `Region` | Region to start a new form with (latest Active → latest Referral → client) |
| `MostRecentReferralDate` | Latest `ReferralDate` / `ReReferralDate`, YYYY-MM-DD, or `null`. Lower limit of the status date |

### 4.4 `NoprFormOptions` (from `GET /lookups/options`)

| Field | Meaning |
| ----- | ------- |
| `refStatus` | Reasons that can be chosen, in display order |
| `retiredRefStatus` | Reasons shown only on a form that already has one |
