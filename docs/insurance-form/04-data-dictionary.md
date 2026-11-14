# 04 — Data Dictionary: Insurance Form

Source: the local `dbCDD` database (2026-11-14): `sys.columns`, defaults, keys and the views and procedures that read the table. `stblInsuranceForm` has **no `MS_Description`** in the database, so descriptions come from the legacy screen, the business notes and how the reports use each column.

**Used** says how the new Insurance Form uses the column: ✅ written from the screen · ⚙ set by the backend · 👁 read only · ⛔ not written (value kept) · DB set by a column default.

`bit` columns hold `1`/`0` (the API returns `true`/`false`). `nvarchar(255)` columns accept up to 255 characters.

---

## 1. stblInsuranceForm

PK `ID` (clustered, `stblInsuranceForm$PrimaryKey`). FK `ChildID` → `stblPeople.ChildID` `ON UPDATE CASCADE ON DELETE CASCADE` (`stblInsuranceForm$stblPeoplestblInsuranceForm`, created `WITH NOCHECK`, not trusted). No check constraints and no other indexes. 27 columns.

### 1.1 Header

| # | Column | Type | Null | Default | Constraint | Description | Used |
| - | ------ | ---- | ---- | ------- | ---------- | ----------- | ---- |
| 1 | `ID` | `int IDENTITY(1,1)` | NN | identity | PK | Insurance Form ID | 👁 |
| 2 | `ChildID` | `int` | N | — | FK cascade | Client | ⚙ (from the URL) |
| 3 | `FormDate` | `datetime2(0)` | N | — | — | **Date Completed**: when the form was completed. Shown in the Input Forms history; FITP uses the latest | ✅ required |
| 4 | `FormType` | `nvarchar(12)` | N | `'Insurance'` | — | Form type literal; reports filter on `'Insurance'` | ⚙ always `'Insurance'` |

### 1.2 Insurance information

| # | Column | Type | Null | Default | Constraint | Description | Used |
| - | ------ | ---- | ---- | ------- | ---------- | ----------- | ---- |
| 5 | `InsCoNumber` | `nvarchar(255)` | N | — | (logical → `slstInsuranceCodes.InsCode`) | Legacy **Ins. Co #** dropdown. No longer used; FITP still sends its first 3 characters | ⛔ |
| 6 | `InsuranceName` | `nvarchar(255)` | N | — | — | Legacy insurance name. Not used by staff | ⛔ |
| 7 | `BranchAddress` | `nvarchar(255)` | N | — | — | Legacy label "Branch Address (on back of ins. card)". Staff type the **Insurance Company Name** here **[Decision]** | ✅ required for consent 1 |
| 8 | `PolicyNumber` | `nvarchar(255)` | N | — | — | **Policy #**. FITP sends the first 20 characters | ✅ |
| 9 | `CoverageCode` | `nvarchar(5)` | N | — | (logical → `slstCoverageCodes.CoverageCode`) | Legacy **Coverage Code** dropdown. No longer used; FITP sends `00` when empty | ⛔ |
| 10 | `EffectiveDate` | `datetime2(0)` | N | — | — | **Effective Date of Policy**. Sent to FITP | ✅ |
| 11 | `EndDate` | `datetime2(0)` | N | — | — | **End Date of Policy**; not before `EffectiveDate`. Sent to FITP | ✅ |
| 12 | `PolicyHolder` | `nvarchar(255)` | N | — | — | **Individual Policy Holder** | ✅ |
| 13 | `GroupNumber` | `nvarchar(255)` | N | — | — | **Group # (Contract #)**. FITP sends the first 16 characters | ✅ |
| 14 | `GroupName` | `nvarchar(255)` | N | — | — | **Group/Employer Name** | ✅ |
| 15 | `Phone` | `nvarchar(255)` | N | — | — | Legacy phone. No longer used | ⛔ |

### 1.3 Consent to bill insurance

| # | Column | Type | Null | Default | Constraint | Description | Used |
| - | ------ | ---- | ---- | ------- | ---------- | ----------- | ---- |
| 16 | `BillingConsent` | `int` | N | — | — | Consent choice (legacy option group), see §2.1. FITP: 3 = Do Not Bill, anything else = Bill | ✅ required |
| 17 | `ParentSignatureDate` | `datetime2(0)` | N | — | — | Parent or Guardian Signature Date for consent 1 / 2 | ✅ |
| 18 | `DeclineReasonCap` | `bit` | N | `0` | — | "My available life-time cap would be affected" | ✅ (consent 3) |
| 19 | `DeclineReasonPremium` | `bit` | N | `0` | — | "My health insurance premiums would increase" | ✅ (consent 3) |
| 20 | `DeclineReasonBenefits` | `bit` | N | `0` | — | "My other health insurance benefits would decrease" | ✅ (consent 3) |
| 21 | `DeclineReasonEligibility` | `bit` | N | `0` | — | "I risk loss of eligibility for me/my child for home and community waivers" | ✅ (consent 3) |
| 22 | `ParentSignatureDate2` | `datetime2(0)` | N | — | — | Parent or Guardian Signature Date for consent 3 (decline) | ✅ |

### 1.4 Audit

| # | Column | Type | Null | Default | Description | Used |
| - | ------ | ---- | ---- | ------- | ----------- | ---- |
| 23 | `SSMA_TimeStamp` | `timestamp` | NN | auto | Row version (from the Access migration) | — |
| 24 | `InsertDate` | `datetime` | NN | `getdate()` | Created on | DB |
| 25 | `InsertUser` | `varchar(50)` | NN | `suser_sname()` | Created by (SQL login) | DB |
| 26 | `LastUpdateDate` | `datetime` | NN | `getdate()` | Last changed on | ⚙ on update |
| 27 | `LastUpdateUser` | `varchar(50)` | NN | `suser_sname()` | Last changed by | ⚙ on update |

N = nullable, NN = not null.

---

## 2. Code lists

There are no lookup tables for these codes in `dbCDD`; the lists are kept in [insurance-form.config.ts](../../backend/src/modules/insurance-form/insurance-form.config.ts) and served by `GET /api/insurance-forms/lookups/options`.

### 2.1 BillingConsent — "I give permission for Children's Integrated Services – Part C Early Intervention to bill:"

| Code | Meaning | Requires | FITP |
| ---- | ------- | -------- | ---- |
| 1 | My private insurance | `BranchAddress`, `ParentSignatureDate` | Bill |
| 2 | Medicaid | `ParentSignatureDate` | Bill |
| 3 | Decline billing my private insurance | one `DeclineReason*`, `ParentSignatureDate2` | **Do Not Bill** |
| NULL | *(legacy rows only; the new form requires an answer)* | — | Bill |

Only 3 is named in the database (FITP). 1 and 2 follow the order of the legacy options (IF-GAP-04).

### 2.2 Decline reasons — "I choose to deny permission for my private insurance to be billed because:"

| Column | Label |
| ------ | ----- |
| `DeclineReasonCap` | My available life-time cap would be affected |
| `DeclineReasonBenefits` | My other health insurance benefits would decrease |
| `DeclineReasonPremium` | My health insurance premiums would increase |
| `DeclineReasonEligibility` | I risk loss of eligibility for me/my child for home and community waivers |

Exactly one is `1` when `BillingConsent = 3`; all are `0` otherwise **[Decision]**.

---

## 3. Related tables

| Table | Columns used | How |
| ----- | ------------ | --- |
| `stblPeople` | `ChildID`, `LastName`, `FirstName`, `SS`, `DOB` | Client Information header; DOB for the date rules |
| `slstInsuranceCodes` | `ID` (PK), `InsCode`, `InsName`, `SortOrder`, `Inactive` | Legacy lookup for `InsCoNumber`. Not used by the new form |
| `slstCoverageCodes` | `ID` (PK), `CoverageCode`, `CoverageName`, `SortOrder`, `Inactive` | Legacy lookup for `CoverageCode`. Not used by the new form |

---

## 4. Application data elements

### 4.1 Form model `InsuranceFormValues` ([types/insurance-form.ts](../../frontend/src/types/insurance-form.ts))

| Field | Type | Maps to |
| ----- | ---- | ------- |
| `FormDate` | `string` (YYYY-MM-DD) | `FormDate` |
| `BranchAddress`, `PolicyNumber`, `GroupNumber`, `GroupName`, `PolicyHolder` | `string` | same columns (trimmed, blank → NULL) |
| `EffectiveDate`, `EndDate` | `string` | same columns |
| `BillingConsent` | `'' \| '1' \| '2' \| '3'` | `BillingConsent` (number) |
| `ParentSignatureDate` | `string` | `ParentSignatureDate` (consent 1/2 only) |
| `declineReason` | `'' \| 'DeclineReasonCap' \| …` | the four `DeclineReason*` bits (consent 3 only) |
| `ParentSignatureDate2` | `string` | `ParentSignatureDate2` (consent 3 only) |

### 4.2 `InsuranceFormClient` (read-only header, from `stblPeople`)

`ChildID`, `LastName`, `FirstName`, `SS`, `DOB`.
