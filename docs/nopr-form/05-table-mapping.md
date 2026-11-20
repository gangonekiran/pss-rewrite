# 05 — Table Mapping: NOPR Form

How each part of the screen and the API reads and writes the database.

---

## 1. Operation × table matrix

| Operation | `stblNoOnePlanForm` | `stblPeople` | `stblReferralForm` | `stblActiveForm` | Notes |
| --------- | :-----------------: | :----------: | :----------------: | :--------------: | ----- |
| Open (new or edit) — `GET /{childId}` | R | R | — | — | All the client's forms + client header |
| Defaults — `GET /{childId}/defaults` | — | R | R | R | Region and most recent referral date |
| Options — `GET /lookups/options` | — | — | — | — | From `nopr-form.config.ts` |
| Save new — `POST /{childId}` | C, R | R | R | — | Referral date for validation; insert, then read back |
| Save edit — `PUT /{childId}/{id}` | R, U | R | R | — | Read saved row, merge, validate, update, read back |
| Delete (grid) — `DELETE /api/input-forms/no-one-plan/{childId}/{id}` | D | — | — | — | Generic input-form module |
| History (grid) — `GET /api/input-forms/history/{childId}` | R | — | — | — | `ID`, `FormDate`, `FormType` |

C = create, R = read, U = update, D = delete. The region dropdown reads `stblReportingRegion` through `/api/common-info/regions`.

## 2. Screen → payload → column

| Screen | Form value | Payload key | Column | Transform | Condition |
| ------ | ---------- | ----------- | ------ | --------- | --------- |
| Region | `Region` | `Region` | `Region` | number; 0 is rejected | always (required) |
| Reason | `RefStatus` `'1'`–`'8'` | `RefStatus` | `RefStatus` | string → number; `''` → NULL (rejected) | always (required) |
| Date of Initial Evaluation | `InitialEvalDate` | `InitialEvalDate` | `InitialEvalDate` 🆕 | `YYYY-MM-DD`; blank → NULL | always (optional) |
| Date above status was determined | `StatusDate` | `StatusDate` | `StatusDate` | `YYYY-MM-DD`; blank → NULL (rejected) | always (required) |
| *(none)* | — | — | `FormDate` | = `StatusDate` | whenever `StatusDate` is sent |
| *(none)* | — | — | `ChildID` | from the URL | insert only |
| *(none)* | — | — | `FormType` | `'No One Plan'` | insert only |
| *(none)* | — | — | `LastUpdateDate`, `LastUpdateUser` | `GETDATE()`, `SUSER_SNAME()` | update only |
| *(not on the screen)* | — | — | `MonthReporting`, `Screening`, `ReferredBack` | never written | kept as stored |

## 3. Load (edit) mapping — column → form value

| Column | Form value | Rule |
| ------ | ---------- | ---- |
| `Region` | `Region` | number; NULL → 0 (not chosen) |
| `RefStatus` | `RefStatus` | positive whole number → string; NULL / 0 → `''` (BR-NOPR-52) |
| `InitialEvalDate`, `StatusDate` | same | first 10 characters (`YYYY-MM-DD`); NULL → `''` |

A **new** form starts with `Region` = defaults (latest Active → latest Referral → client), everything else empty.

## 4. Read-only Client Information

| Label | Source | Shown |
| ----- | ------ | ----- |
| Child Last Name | `stblPeople.LastName` | ✅ (`—` if empty) |
| Child First Name | `stblPeople.FirstName` | ✅ |
| SSN | `stblPeople.SS` | ✅ (unmasked, NOPR-GAP-04) |
| DOB | `stblPeople.DOB` | ✅ `MM/DD/YYYY`; also the lower limit for both dates |
| Region | `stblReportingRegion.RName` of the region chosen in the dropdown | ✅ follows the dropdown |
| Referral Date (From Referral Form) | `MAX(stblReferralForm.ReferralDate, ReReferralDate)` | ✅ `MM/DD/YYYY` or `—`; also the lower limit of the status date |

## 5. Columns → legacy consumers

| Column | `Get_CIS_FITP_Output` / `Get_FITP_Extract_rpt` / `sqryFITPExtract*` | `Get_NOPR_Forms_rpt` | `sqryFormListA` → `…Complete`, `sqryLoopErrors` | `sqryKeyForms*`, point-in-time, service-location, Indicator 3 | `GetClientFormStats_rpt` | `LoopCa` |
| ------ | :-: | :-: | :-: | :-: | :-: | :-: |
| `ChildID` | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| `FormDate` | ✅ exit date | ✅ range | ✅ order | ✅ latest key form | ✅ `<=` status date | ✅ first after referral |
| `FormType` | ✅ exit type | — | ✅ `slstFormNames` | ✅ `slstFormNames` | ✅ | — |
| `ID` | — | — | ✅ `N` + ID | — | — | — |
| `Region` | — | ✅ original region | — | — | — | — |
| `MonthReporting`, `Screening`, `ReferredBack` | — | ✅ | — | — | — | — |
| `RefStatus` | — | ✅ code | — | — | — | — |
| `StatusDate` | — | ✅ | ✅ NOPR column | — | ✅ NOPR date | — |
| `InitialEvalDate` 🆕 | — | ❌ not yet (NOPR-GAP-09) | — | — | — | — |
