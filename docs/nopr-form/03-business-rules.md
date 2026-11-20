# 03 — Business Rules: NOPR Form

Rules as **implemented**, with the **legacy** behaviour (from `dbCDD` views and stored procedures) wherever the two differ. Enforced by: FE = frontend, BE = backend, DB = database.

Change requests are marked **[Request]**, team-lead decisions **[Decision]**, and choices made during the build that still need confirming **[Default]**. Known gaps are listed in [§7](#7-known-gaps).

---

## 1. Access and lifecycle

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-NOPR-01 | The NOPR Form is opened only from the Client screen → **Input Forms** tab: the **No One Plan** button (new form) or **View/Edit** on a No One Plan row (edit). It opens as a full-screen modal titled "New NOPR Form" / "Edit NOPR Form" with the Client ID. | FE | `InputForms.tsx` `NoprFormModal` |
| BR-NOPR-02 | A client must be selected; the form belongs to that client (`ChildID`). Deleting the client deletes its NOPR forms. | FE, BE, DB | FK `stblNoOnePlanForm$stblPeoplestblNoOnePlanForm` (cascade) |
| BR-NOPR-03 | The backend rejects a `ChildID`/`ID` that isn't a positive integer, a client that doesn't exist (*"Client not found"*), and a form that doesn't belong to the client (*"NOPR Form not found"*). | BE | `nopr-form.service.ts` |
| BR-NOPR-04 | A client can have any number of NOPR forms (one per referral that didn't lead to a plan). | — | — |
| BR-NOPR-05 | **Edit** loads all the client's NOPR forms and picks the one with the matching ID; if it's missing: *"NOPR Form record not found."* and the modal closes. | FE | `NoprFormPage` |
| BR-NOPR-06 | After a successful save the Input Forms history reloads and the modal closes. **Cancel** and **×** close without saving (no "unsaved changes" warning, NOPR-GAP-05). | FE | `onSaved` / `onClose` |
| BR-NOPR-07 | Deleting is done from the Input Forms grid (*"Delete No One Plan dated {date}?"*). It's a hard delete of the row. | FE, BE | `InputForms.handleDelete` → `DELETE /api/input-forms/no-one-plan/…` |

## 2. Form date and form type

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-NOPR-10 | `FormType` is always saved as `'No One Plan'`; a value in the request is ignored. Legacy views match this literal against `slstFormNames` (BR-NOPR-44). | BE, DB | `NOPR_FORM_TYPE`; column default `('No One Plan')` |
| BR-NOPR-11 | `FormDate` is **never taken from the request**. Every save that includes the status date sets `FormDate = StatusDate`. **[Decision]** The legacy form saved the last day of the reporting month (column description). | BE | `applyFormDate` |
| BR-NOPR-12 | `FormDate` is the date shown in the Input Forms history (Date and NOPR columns) and the date FITP uses as the exit date (BR-NOPR-40). | — | `input-form.history.repository.ts`; FITP |

## 3. General Information

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-NOPR-20 | **Region** is required: *"Region is required."* (screen) / *"Region must be selected"* (API). **[Default]** | FE, BE | schema; `validateRecord` |
| BR-NOPR-21 | A new form starts with the Region of the child's **latest Active form**, else the **latest Referral form**, else the client's region (`stblPeople.Region`). **[Default]** | BE, FE | `defaults`, `findLatestRegion`; `defaultsToValues` |
| BR-NOPR-22 | The Client Information header shows the name of the region chosen in the dropdown, and the **most recent referral date** as "Referral Date (From Referral Form)". | FE | `NoprFormPage` → `ClientInformation` |
| BR-NOPR-23 | **Month Reporting** (`MonthReporting`) is not on the screen and is **never written**, so values on older forms are kept. **[Request]** | BE | `COLUMNS` whitelist |

## 4. Status

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-NOPR-30 | **Reason** (`RefStatus`) is one choice and required: *"Select the reason a plan was not created."* (screen) / *"Select the reason a plan was not created"* (API). An unknown code is rejected: *"RefStatus has an unknown value: {x}"*. | FE, BE | schema; `normalizePayload`; `validateRecord` |
| BR-NOPR-31 | The reasons are shown in this order: **8 Initial Contact Not Made** (new, first) **[Request]**, then 1–6 in the legacy order. The list comes from the API (`GET /lookups/options`) so the screen and the API share one source. | FE, BE | `REF_STATUS` |
| BR-NOPR-32 | Reason **7 — Turned 3 during evaluation process** is retired. **[Request]** It is shown, marked *"(no longer used)"*, only on a form that already has it, and can be saved again unchanged. Choosing it on a new form, or changing another form to it, is rejected: *"\"Turned 3 during evaluation process\" is no longer used; choose another reason"*. | FE, BE | `NoprStatus`; `checkRetiredReason` |
| BR-NOPR-33 | **Date above status was determined** (`StatusDate`) is required and must be a real calendar date: *"Date above status was determined is required."* | FE, BE | schema; `validateRecord` |
| BR-NOPR-34 | The status date can't be before the child's **date of birth**: *"Date above status was determined cannot be before Date of Birth."* | FE, BE | schema; `validateRecord` |
| BR-NOPR-35 | The status date can't be before the child's **most recent referral date** — the latest `ReferralDate` or `ReReferralDate` on any of the child's Referral forms: *"Cannot be before the most recent referral date (MM/DD/YYYY)."* **[Decision]** The date picker starts at that date (or at the DOB when there is no referral) and a hint under the field shows it. | FE, BE | schema; `validateRecord`; `findMostRecentReferralDate` |
| BR-NOPR-36 | **Date of Initial Evaluation** (`InitialEvalDate`) is **new and optional**. **[Request] [Decision]** When given it must be a real date, not before the DOB (*"Date of Initial Evaluation cannot be before Date of Birth."*) and not after the status date (*"Cannot be after the date the status was determined."*) **[Default]**. Its picker runs from the DOB to the status date. | FE, BE | schema; `validateRecord` |
| BR-NOPR-37 | An invalid date shows only *"Enter a valid date."*; it isn't compared with the other dates. | FE | schema `isCalendarDate` |
| BR-NOPR-38 | **Periodic Screening** (`Screening`) and **Referred back to CIS Intake Team** (`ReferredBack`) are not on the screen and are **never written**, so values on older forms are kept. **[Request]** | BE | `COLUMNS` whitelist |
| BR-NOPR-39 | The screen explains that the status date is used by HP Enterprises (FITP) to turn off the Early Intervention voucher. | FE | `NoprStatus` |

## 5. FITP extract, loops and legacy reports

Found in `Get_CIS_FITP_Output` (the FITP SSIS output), `Get_FITP_Extract_rpt`, the `sqryFITPExtract*`, `sqryFormList*`, `sqryKeyForms*` and `LoopCa` views, and the report procedures.

| ID | Rule | Source |
| -- | ---- | ------ |
| BR-NOPR-40 | FITP builds an exit list from **Exit and NOPR forms** (`ChildID`, `FormDate`, `FormType`). For each of a child's last four referrals, the **first exit form dated after the referral** is that referral's exit date, sent as `yyyyMMdd`. A NOPR form therefore ends the referral period on its `FormDate`. | `Get_CIS_FITP_Output` `ExitC` / `Top4Exits`; `Get_FITP_Extract_rpt`; `sqryFITPExtractExitsA/B/C`, `sqryFITPExtractD` |
| BR-NOPR-41 | When a referral has no later Exit or NOPR form, FITP uses DOB + 3 years (EI) or referral + 5 years (non-EI) as the exit date. | `Get_CIS_FITP_Output` |
| BR-NOPR-42 | The NOPR Forms report lists forms in a `FormDate` range with the region, `MonthReporting`, `RefStatus` (code), `Screening`, `ReferredBack` and `StatusDate`. | `Get_NOPR_Forms_rpt` |
| BR-NOPR-43 | The client form list shows NOPR forms as `N` + `ID`, with `StatusDate` in the NOPR column. | `sqryFormListA` |
| BR-NOPR-44 | **Loop error (legacy):** a NOPR form whose previous key form (Referral, NOPR, Active, Exit — by `FormDate`, then `slstFormNames.Sort`) is not a **Referral**, or that has no previous key form, is flagged as a loop error. | `sqryFormListComplete`, `sqryLoopErrors` |
| BR-NOPR-45 | **Loop C:** a Loop A referral (no Active form) with a NOPR form dated after the referral start becomes Loop C, using the first such `FormDate` as the NOPR date. | `LoopCa` |
| BR-NOPR-46 | A client's status on a date is "No One Plan Resulting" when the latest key form on or before that date is a NOPR form; its status date is the NOPR date. | `GetClientFormStats_rpt`; new app `client.repository.ts` (`MAX(StatusDate)`) |
| BR-NOPR-47 | NOPR forms count as key forms in the point-in-time, service-location and Indicator 3 reports: a NOPR form after an Active form means the child is no longer active. | `GetPointInTimeActive*`, `GetServiceLocation*`, `GetIndicator3_rpt` |

## 6. Editing forms saved by the legacy application

| ID | Rule |
| -- | ---- |
| BR-NOPR-50 | A legacy form opens with its Region, Reason and Status date; Date of Initial Evaluation is empty (the column is new). |
| BR-NOPR-51 | A legacy form with reason 7 opens with *"Turned 3 during evaluation process (no longer used)"* chosen and can be saved without changing it (BR-NOPR-32). |
| BR-NOPR-52 | A legacy form with no reason or no status date can't be saved until both are given. |
| BR-NOPR-53 | Saving a legacy form sets its `FormDate` to the status date (BR-NOPR-11), which can change the exit date FITP sends for that referral (NOPR-GAP-08). `MonthReporting`, `Screening` and `ReferredBack` are kept. |

## 7. Known gaps

| ID | Gap | Impact | Recommendation |
| -- | --- | ------ | -------------- |
| NOPR-GAP-01 | `POST/PUT /api/input-forms/no-one-plan/{childId}[/{id}]` (generic Input Forms module) still write `stblNoOnePlanForm` without these rules, can write `FormDate`, `MonthReporting`, `Screening`, `ReferredBack`, and don't know `InitialEvalDate`. | A caller can save a form with a retired reason or a `FormDate` that differs from the status date. | Remove those routes for NOPR or send them through the NOPR Form service. |
| NOPR-GAP-02 | The shared error handler returns HTTP **500** for every error; the service's 400 / 404 are not used. | Clients can't tell a validation error from a server fault. | Use `err.status` in `error.middleware.ts` (affects all modules). |
| NOPR-GAP-03 | `/api/nopr-forms` has no authentication middleware (same as the Exit and Insurance forms). | Open API. | Add the auth middleware when the app's login is wired up. |
| NOPR-GAP-04 | The page heading repeats the modal title; the SSN is shown unmasked. | Cosmetic / privacy (same as the other forms). | Remove the inner heading; mask the SSN as `***-**-1234`. |
| NOPR-GAP-05 | No "unsaved changes" warning on Cancel / ×. | Typed data can be lost. | Confirm before closing when the form is dirty. |
| NOPR-GAP-06 | The status date has no upper limit (a future date is accepted). | The next FITP file would turn the voucher off on a future date. | Reject future dates, if the product owner agrees. |
| NOPR-GAP-07 | The legacy loop-error rule (BR-NOPR-44) isn't checked when saving, and the Input Forms history always shows no loop error. | A NOPR form can be saved after an Active form or with no referral; reports still flag it. | Warn on save, or compute `loopError` in the history query. |
| NOPR-GAP-08 | Saving a legacy form moves its `FormDate` from the month end to the status date (BR-NOPR-53). | FITP sends a different exit date for that referral after the edit. | Accept (it is the intended correction) and tell the FITP team, or leave `FormDate` unchanged when the status date isn't changed. |
| NOPR-GAP-09 | `Get_NOPR_Forms_rpt` doesn't return `InitialEvalDate`. | The new date isn't in the NOPR Forms report. | Add the column to the procedure. |
| NOPR-GAP-10 | The `RefStatus` column description lists codes 1–7 only; there is no lookup table. Code 8 exists only in the backend config. | Report readers can't decode 8. | Update `MS_Description` (script in [10-database-info.md §6](10-database-info.md#6-follow-up-scripts-for-the-dba)) or add a lookup table. |
| NOPR-GAP-11 | Dates of initial evaluation already typed into the client's Notes are not moved into the new column. | Older forms show no Date of Initial Evaluation. | Leave as is, or move them by hand if needed. |
| NOPR-GAP-12 | No index on `ChildID`; the FK was created `WITH NOCHECK` (not trusted). | Client look-ups, the FITP exit search and cascade deletes scan the table. | Add an index on `(ChildID, FormDate)`; re-enable the FK `WITH CHECK`. |
| NOPR-GAP-13 | The legacy **Lock** button is not on the new form. | — | Product owner to confirm whether locking is still needed. |
