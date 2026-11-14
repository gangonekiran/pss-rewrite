# 05 — Table Mapping: Insurance Form

How each part of the screen and the API reads and writes the database.

---

## 1. Operation × table matrix

| Operation | `stblInsuranceForm` | `stblPeople` | Notes |
| --------- | :-----------------: | :----------: | ----- |
| Open (new or edit) — `GET /{childId}` | R | R | All the client's forms + client header |
| Options — `GET /lookups/options` | — | — | From `insurance-form.config.ts` |
| Save new — `POST /{childId}` | C, R | R | Insert, then read back |
| Save edit — `PUT /{childId}/{id}` | R, U | R | Read saved row, merge, update, read back |
| Delete (grid) — `DELETE /api/input-forms/insurance/{childId}/{id}` | D | — | Generic input-form module |
| History (grid) — `GET /api/input-forms/history/{childId}` | R | — | `ID`, `FormDate`, `FormType` |

C = create, R = read, U = update, D = delete.

## 2. Screen → payload → column

| Screen | Form value | Payload key | Column | Transform | Condition |
| ------ | ---------- | ----------- | ------ | --------- | --------- |
| Date Completed | `FormDate` | `FormDate` | `FormDate` | `YYYY-MM-DD`; blank → NULL (rejected) | always |
| Insurance Company Name | `BranchAddress` | `BranchAddress` | `BranchAddress` | trim; blank → NULL | always (required for consent 1) |
| Policy # | `PolicyNumber` | `PolicyNumber` | `PolicyNumber` | trim; blank → NULL | always |
| Group # (Contract #) | `GroupNumber` | `GroupNumber` | `GroupNumber` | trim; blank → NULL | always |
| Group/Employer Name | `GroupName` | `GroupName` | `GroupName` | trim; blank → NULL | always |
| Effective Date of Policy | `EffectiveDate` | `EffectiveDate` | `EffectiveDate` | `YYYY-MM-DD`; blank → NULL | always |
| End Date of Policy | `EndDate` | `EndDate` | `EndDate` | `YYYY-MM-DD`; blank → NULL | always |
| Individual Policy Holder | `PolicyHolder` | `PolicyHolder` | `PolicyHolder` | trim; blank → NULL | always |
| Consent option | `BillingConsent` `'1'`–`'3'` | `BillingConsent` | `BillingConsent` | string → number | always (required) |
| Signature date (bill) | `ParentSignatureDate` | `ParentSignatureDate` | `ParentSignatureDate` | value for 1/2, NULL for 3 | — |
| Decline reason | `declineReason` | `DeclineReasonCap`, `…Premium`, `…Benefits`, `…Eligibility` | same | chosen one → `true`, others `false`; all `false` unless consent 3 | — |
| Signature date (decline) | `ParentSignatureDate2` | `ParentSignatureDate2` | `ParentSignatureDate2` | value for 3, NULL for 1/2 | — |
| *(none)* | — | — | `ChildID` | from the URL | insert only |
| *(none)* | — | — | `FormType` | `'Insurance'` | insert only |
| *(none)* | — | — | `LastUpdateDate`, `LastUpdateUser` | `GETDATE()`, `SUSER_SNAME()` | update only |
| *(not on the screen)* | — | — | `InsCoNumber`, `InsuranceName`, `CoverageCode`, `Phone` | never written | kept as stored |

The backend applies the same clearing again (BR-IF-35), so the result is the same when another caller sends the API directly.

## 3. Load (edit) mapping — column → form value

| Column | Form value | Rule |
| ------ | ---------- | ---- |
| `FormDate`, `EffectiveDate`, `EndDate`, `ParentSignatureDate`, `ParentSignatureDate2` | same | first 10 characters (`YYYY-MM-DD`); NULL → `''` |
| `BranchAddress`, `PolicyNumber`, `GroupNumber`, `GroupName`, `PolicyHolder` | same | NULL → `''` |
| `BillingConsent` | `BillingConsent` | 1–3 → `'1'`–`'3'`; NULL or anything else → `''` (BR-IF-50) |
| `DeclineReason*` | `declineReason` | first one that is `true` (Cap, Premium, Benefits, Eligibility); none → `''` (BR-IF-51) |

## 4. Read-only Client Information

| Label | Column | Shown |
| ----- | ------ | ----- |
| Child Last Name | `stblPeople.LastName` | ✅ (`—` if empty) |
| Child First Name | `stblPeople.FirstName` | ✅ |
| SSN | `stblPeople.SS` | ✅ (unmasked, IF-GAP-10) |
| DOB | `stblPeople.DOB` | ✅ `MM/DD/YYYY`; also the lower limit for the form's dates |

Region and Referral Date are not shown (`childOnly`): this form records neither.

## 5. Columns → legacy consumers

| Column | `Get_CIS_FITP_Output` | `Get_FITP_Extract_rpt` / `sqryFITPExtract*` | `GetInsuranceForms_rpt` | `sqryFormListA`, point-in-time, service-location |
| ------ | :-: | :-: | :-: | :-: |
| `ChildID` | ✅ | ✅ | ✅ | ✅ |
| `FormDate` | ✅ latest | ✅ latest | ✅ range | ✅ |
| `FormType` | — | — | — | ✅ (`<> 'Insurance'` filter) |
| `ID` | ✅ tie-break | — | — | ✅ |
| `InsCoNumber` | ✅ first 3 | ✅ | ✅ | — |
| `InsuranceName`, `BranchAddress`, `PolicyHolder`, `GroupName`, `Phone` | — | — | ✅ | — |
| `PolicyNumber` | ✅ first 20 | ✅ | ✅ | — |
| `CoverageCode` | ✅ first 2 | ✅ | — | — |
| `EffectiveDate` | ✅ `yyyyMMdd` | ✅ | ✅ | — |
| `EndDate` | ✅ `yyyyMMdd` | ✅ | — | — |
| `GroupNumber` | ✅ first 16 | ✅ | ✅ | — |
| `BillingConsent` | ✅ 3 = blank fields | ✅ "Bill" / "Do Not Bill" | ✅ | — |
| `ParentSignatureDate`, `DeclineReason*`, `ParentSignatureDate2` | — | — | ✅ | — |
