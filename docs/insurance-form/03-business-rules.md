# 03 — Business Rules: Insurance Form

Rules as **implemented**, with the **legacy** behaviour (from `dbCDD` views and stored procedures) wherever the two differ. Enforced by: FE = frontend, BE = backend, DB = database constraint.

Product-owner decisions are marked **[Decision]**. Known gaps are listed in [§7](#7-known-gaps).

---

## 1. Access and lifecycle

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-IF-01 | The Insurance Form is opened only from the Client screen → **Input Forms** tab: the **Insurance** button (new form) or **View/Edit** on an Insurance row (edit). It opens as a full-screen modal titled "New Insurance Form" / "Edit Insurance Form" with the Client ID. | FE | `InputForms.tsx` `InsuranceFormModal` |
| BR-IF-02 | A client must be selected; the form belongs to that client (`ChildID`). Deleting the client deletes its Insurance Forms. | FE, BE, DB | FK `stblInsuranceForm$stblPeoplestblInsuranceForm` (cascade) |
| BR-IF-03 | The backend rejects a `ChildID`/`ID` that isn't a positive integer, a client that doesn't exist (*"Client not found"*), and a form that doesn't belong to the client (*"Insurance Form not found"*). | BE | `insurance-form.service.ts` |
| BR-IF-04 | A client can have any number of Insurance Forms. Only the latest one is used for billing (BR-IF-40). | — | — |
| BR-IF-05 | **Edit** loads all the client's Insurance Forms and picks the one with the matching ID; if it's missing: *"Insurance Form record not found."* and the modal closes. | FE | `InsuranceFormPage` |
| BR-IF-06 | After a successful save the Input Forms history reloads and the modal closes. **Cancel** and **×** close without saving (no "unsaved changes" warning, IF-GAP-11). | FE | `onSaved` / `onClose` |
| BR-IF-07 | Deleting is done from the Input Forms grid (*"Delete Insurance dated {Date Completed}?"*). It's a hard delete of the row. | FE, BE | `InputForms.handleDelete` → `DELETE /api/input-forms/insurance/…` |

## 2. Form date and form type

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-IF-10 | `FormType` is always saved as `'Insurance'`; a value in the request is ignored. Legacy reports filter on this literal (BR-IF-43). | BE, DB | `INSURANCE_FORM_TYPE`; column default `('Insurance')` |
| BR-IF-11 | **Date Completed** (`FormDate`) is required and must be a real calendar date: *"Date Completed is required."* It is the date shown in the Input Forms history, and the FITP extract uses it to pick the current form (BR-IF-40). | FE, BE | schema; `validateRecord` |
| BR-IF-12 | A new form starts with Date Completed empty (no default to today) (IF-GAP-14). | FE | `DEFAULT_INSURANCE_FORM_VALUES` |

## 3. Insurance Information

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-IF-20 | **Insurance Company Name** is saved in `BranchAddress`, where staff have always typed the company name. **[Decision]** It is required when consent = 1 (BR-IF-32). | FE, BE | `InsuranceInformation`; config |
| BR-IF-21 | Policy #, Group #, Group/Employer Name, Individual Policy Holder and Insurance Company Name are optional free text, up to **255 characters** (the column size). Text is trimmed; blank is saved as NULL. | FE, BE | `maxLength`; schema; `parseText` |
| BR-IF-22 | Effective and End Date of Policy are optional. **End Date can't be before Effective Date**: *"End Date of Policy cannot be before Effective Date of Policy."* The End Date picker starts at the Effective Date. | FE, BE | schema; `validateRecord` |
| BR-IF-23 | `InsCoNumber` (Ins. Co #), `CoverageCode`, `Phone` and `InsuranceName` are not on the screen and are **never written**, so values on older forms are kept. **[Decision]** | BE | `COLUMNS` whitelist |

## 4. Consent to bill insurance

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-IF-30 | The consent is **one choice**, saved in `BillingConsent`: **1** = bill my private insurance, **2** = bill Medicaid, **3** = decline billing my private insurance. **[Decision]** It is required: *"Choose whether we may bill insurance."* (screen) / *"Choose whether Children's Integrated Services may bill insurance"* (API). Any other value is rejected. | FE, BE | `BILLING_CONSENT`; `normalizePayload`; `validateRecord` |
| BR-IF-31 | Consent 1 or 2 requires **Parent or Guardian Signature Date** (`ParentSignatureDate`): *"Parent or Guardian Signature Date is required."* | FE, BE | schema; `validateRecord` |
| BR-IF-32 | Consent 1 also requires **Insurance Company Name**: *"Insurance Company Name is required for private insurance billing."* | FE, BE | schema; `validateRecord` |
| BR-IF-33 | Consent 3 requires **exactly one** reason for denying permission (`DeclineReasonCap`, `…Benefits`, `…Premium`, `…Eligibility`): *"Choose a reason."* The API rejects none or more than one. **[Decision]** | FE, BE | `ConsentToBill`; `validateRecord` |
| BR-IF-34 | Consent 3 requires its own **Parent or Guardian Signature Date** (`ParentSignatureDate2`). | FE, BE | schema; `validateRecord` |
| BR-IF-35 | On every save the fields of the answer **not** chosen are cleared: consent 1/2 sets all four reasons to 0 and `ParentSignatureDate2` to NULL; consent 3 sets `ParentSignatureDate` to NULL. On an update that doesn't change the consent, the saved consent decides what is cleared, so a partial update can't store fields of the other answer. | FE, BE | `valuesToPayload`; `clearDependentFields` |
| BR-IF-36 | Date Completed and both signature dates can't be before the child's date of birth: *"{Label} cannot be before Date of Birth."* Their date pickers start at the date of birth. | FE, BE | schema; `validateRecord` |
| BR-IF-37 | The consent options show the legacy consent wording, served by the API (`GET /lookups/options`) so the screen and the API share one source. | FE, BE | `BILLING_CONSENT` labels |
| BR-IF-38 | The screen shows only the chosen answer's fields: the signature date for 1/2, the **Decline** sub-section (reasons + signature date) for 3. Switching answer hides the other fields; their values are not sent. | FE | `ConsentToBill` |

## 5. FITP billing extract and legacy reports

Found in `Get_CIS_FITP_Output` (the FITP SSIS output), `Get_FITP_Extract_rpt` and the views `sqryFITPExtractA/B/D`.

| ID | Rule | Source |
| -- | ---- | ------ |
| BR-IF-40 | For each child FITP uses only the **latest** Insurance Form: highest `FormDate`, ties broken by the highest `ID`. | `Get_CIS_FITP_Output` `MaxInsuranceForm` / `MaxInsuranceInfo` |
| BR-IF-41 | `BillingConsent = 3` is sent as **"Do Not Bill"** with blank insurance fields. Any other value, **including NULL**, is sent as **"Bill"**. This is why the consent is required (BR-IF-30). | `Get_FITP_Extract_rpt`, `sqryFITPExtractD`, `Get_CIS_FITP_Output` |
| BR-IF-42 | Fields sent to FITP (fixed width): `InsCoNumber` (first 3 chars), `PolicyNumber` (first 20), `CoverageCode` (first 2, `00` when empty), `EffectiveDate` / `EndDate` (`yyyyMMdd`, `00000000` when empty), `GroupNumber` (first 16). | `Get_CIS_FITP_Output` |
| BR-IF-43 | Point-in-time and service-location reports leave Insurance Forms out by filtering `FormType <> 'Insurance'`. | `GetPointInTimeActive*`, `GetServiceLocation*` |
| BR-IF-44 | The Insurance Forms report lists forms in a `FormDate` range with all insurance and consent columns. | `GetInsuranceForms_rpt` |
| BR-IF-45 | Insurance Forms appear in the client's form list (`sqryFormListA`, prefix `I`) by `FormDate`. | `sqryFormListA` |

## 6. Editing forms saved by the legacy application

| ID | Rule |
| -- | ---- |
| BR-IF-50 | A legacy form with an empty `BillingConsent` opens with no answer chosen; a consent must be chosen before it can be saved again. |
| BR-IF-51 | The legacy screen allowed several decline reasons. Such a form opens with the first one set (order: life-time cap, premiums, benefits, eligibility); saving keeps only the chosen reason (IF-GAP-08). |
| BR-IF-52 | A legacy form that holds both signature dates keeps only the one that belongs to the chosen answer when saved (BR-IF-35). |

## 7. Known gaps

| ID | Gap | Impact | Recommendation |
| -- | --- | ------ | -------------- |
| IF-GAP-01 | `POST/PUT /api/input-forms/insurance/{childId}[/{id}]` (generic Input Forms module) still write `stblInsuranceForm` without these rules. | A caller can save a form with no consent or with both answers. | Remove those routes for Insurance or send them through the Insurance Form service. |
| IF-GAP-02 | The shared error handler returns HTTP **500** for every error; the service's 400 / 404 are not used. | Clients can't tell a validation error from a server fault. | Use `err.status` in `error.middleware.ts` (affects all modules). |
| IF-GAP-03 | `/api/insurance-forms` has no authentication middleware (same as the Exit Form). | Open API. | Add the auth middleware when the app's login is wired up. |
| IF-GAP-04 | Only `BillingConsent = 3` is named in `dbCDD`; 1 = private and 2 = Medicaid follow the legacy option order. | If reversed, reports would mislabel 1/2 (FITP is unaffected: both bill). | Confirm with the product owner. |
| IF-GAP-05 | The legacy **Lock** button is not on the new form. | — | Product owner to confirm whether locking is still needed. |
| IF-GAP-06 | FITP still sends `InsCoNumber` and `CoverageCode`, which the new form no longer captures [Decision]. New forms send blanks / `00`. | FITP receives no insurance company code for new forms. | Confirm with the FITP team that the code is not required. |
| IF-GAP-07 | FITP sends only the first **20** characters of Policy # and the first **16** of Group #; the screen accepts 255. | Long numbers are cut in the FITP file. | Limit the fields to 20 / 16 or warn on longer values. |
| IF-GAP-08 | Legacy forms with more than one decline reason lose the extra reasons when edited and saved [Decision: one reason]. | Data loss on legacy rows only. | Accept, or show a notice on load when more than one is set. |
| IF-GAP-09 | The page heading repeats the modal title ("New Insurance Form" twice). | Cosmetic (same as the Exit Form). | Remove the page heading inside the modal. |
| IF-GAP-10 | The SSN is shown unmasked in Client Information. | Privacy (same as the Exit Form). | Mask as `***-**-1234`. |
| IF-GAP-11 | No "unsaved changes" warning on Cancel / ×. | Typed data can be lost. | Confirm before closing when the form is dirty. |
| IF-GAP-12 | No index on `ChildID`; the FK was created `WITH NOCHECK` (not trusted). | Client look-ups and cascade deletes scan the table. | Add an index on `ChildID`; re-enable the FK `WITH CHECK`. |
| IF-GAP-13 | `frontend/src/features/insurance` is an unused placeholder page from before this work. | Confusing next to `insurance-form`. | Delete it. |
| IF-GAP-14 | Date Completed has no default and no upper limit (a future date is accepted). | A future date would make that form "latest" for FITP early. | Default to today and/or reject future dates, if the product owner agrees. |
