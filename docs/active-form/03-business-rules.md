# 03 — Business Rules: Active Form

Rules as **implemented** today, with the **legacy** rule (from `dbCDD` column descriptions, views and stored procedures) wherever the two differ. Enforced by: FE = frontend, BE = backend, DB = database constraint.

The Active Form records that a referred child became **active**: their initial evaluation, the initial **One Plan** (Vermont's IFSP) meeting, delay reasons against the federal **45-day timeline**, and their eligibility conditions. One row in `stblActiveForm` per Active Form.

---

## 1. Access and lifecycle

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-AF-01 | The Active Form is opened only from the Client screen → **Input Forms** tab: the **Active** button (new form) or **View/Edit** on an Active row (edit). It opens as a full-screen modal titled "Active Form" with the Client ID. | FE | `InputForms.tsx` `ActiveFormModal` |
| BR-AF-02 | A client must be selected; the form belongs to that client (`ChildID`). | FE, BE, DB | FK `stblActiveForm$stblPeoplestblActiveForm` (cascade) |
| BR-AF-03 | The backend rejects a `ChildID`/`ID` that isn't a positive integer (*"ChildID must be a positive integer"*), a client that doesn't exist (*"Client not found"*), and a form that doesn't belong to the client (*"Active Form not found"*). | BE | `active-form.service.ts` |
| BR-AF-04 | A client can have any number of Active Forms; nothing prevents two for the same referral. | — | — |
| BR-AF-05 | **Edit** loads all the client's Active Forms and picks the one with the matching ID; if it's missing: *"Active Form record not found."* and the modal closes. | FE | `ActiveFormPage` |
| BR-AF-06 | After a successful save the Input Forms history reloads and the modal closes. **Cancel** closes without saving (no "unsaved changes" warning). | FE | `onSaved` / `onClose` |
| BR-AF-07 | Deleting an Active Form is done from the Input Forms grid (*"Delete Active Form dated {date}?"*). It's a hard delete of the row; nothing cascades from it. | FE, BE | `InputForms.handleDelete` → `/api/input-forms/active/…` |

## 2. Form date and form type

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-AF-10 | **FormDate** is set to **today's local date** when the form is created and isn't changed on edit. There is no field for it. | FE | `toPayload` |
| BR-AF-11 | *Legacy:* FormDate is "Effective Date of Form (always last day of month, calculated from MonthReporting)". `MonthReporting` is "Month and Year being reported". Neither is captured today (AF-GAP-08). | DB description | DDL |
| BR-AF-12 | **Status** is required: `aop` = *Active One Plan*, `aop-capta` = *Active One Plan – CAPTA*. Stored in `FormType`. | FE | `GeneralInformation.tsx` |
| BR-AF-13 | *Legacy:* `FormType` is a static `'Active'` (DB default) and CAPTA is recorded separately in `CAPTA` (`-1` Yes, `0` No, NULL no data). Legacy views join `FormType` to `slstFormNames.FormName`, so `aop` rows are invisible to them (AF-GAP-03). | DB | DDL default, `MS_Description` |

## 3. General Information

| ID | Rule | Enforced | Message |
| -- | ---- | -------- | ------- |
| BR-AF-20 | **Region** is required and must be a real region (value > 0). New forms default to the client's region. | FE | *"Region is required."* |
| BR-AF-21 | The backend rejects Region only when it's an empty string (create only); `0` and unknown IDs are accepted. No FK. | BE | *"Region must be selected"* |
| BR-AF-22 | **Date of Referral** is required. | FE | *"Referral date is required."* |
| BR-AF-23 | *Legacy:* the Active Form's `ReferralDate` must **equal the `ReferralDate` of the child's Referral form**. `LoopAB` joins them on `ChildID` and `ReferralDate` to decide that a referral became active ("Loop B"); `Base0701` (Indicator 7) joins on the same date. A typed date that doesn't match puts the child in "Loop A" (referred, never active). The Client Information panel has a "Referral Date (From Referral Form)" item for this, but it's never filled (AF-GAP-05). | Legacy views | `LoopAB`, `Base0701` |

## 4. Initial Evaluation / Assessment

| ID | Rule | Enforced | Message |
| -- | ---- | -------- | ------- |
| BR-AF-30 | **Date of Initial Evaluation / Assessment** is required by the form schema (the label has no `*`). | FE | *"Initial evaluation date is required."* |
| BR-AF-31 | It can't be before the **Referral Date** or the child's **DOB**. The date picker's minimum is the later of the two. | FE (BE checks DOB only) | *"Initial evaluation cannot be before referral date."* / *"Initial Evaluation Date cannot be before Date of Birth."* / BE *"InitialEvalDate cannot be before child DOB"* |
| BR-AF-32 | **Days Between Referral and Initial Evaluation** = calendar days from Referral Date to Initial Evaluation Date. Display only; not saved. | FE | — |
| BR-AF-33 | *Legacy:* `EvalWithin45Days` records whether the evaluation was within **45 days** of referral (`-1` Yes, `0` No). The flags `InitEval45Compliant`, `InitEval45FC` (delayed by family circumstances) and `InitEval45NC` (non-compliant) classify the result. **None are set today** (AF-GAP-04). | DB | `MS_Description`; `Base0701`, `GetActiveForms_rpt` |

## 5. One Plan

| ID | Rule | Enforced | Message |
| -- | ---- | -------- | ------- |
| BR-AF-40 | **Date of One Plan** is required by the schema (no `*` on the label) and saved to `InitialMeetingDate` ("Date of initial meeting to develop the initial One Plan"). | FE, BE alias | *"One Plan date is required."* |
| BR-AF-41 | It can't be before the Referral Date or the DOB (picker minimum = the later of the two). | FE (BE: DOB only) | *"One Plan date cannot be before referral date."* / *"One Plan Date cannot be before Date of Birth."* / BE *"OnePlanDate cannot be before child DOB"* |
| BR-AF-42 | **Days Between Referral and One Plan** — display only. | FE | — |
| BR-AF-43 | There's no rule that the One Plan date is on or after the evaluation date. | — | — |
| BR-AF-44 | *Legacy:* `MeetingWithin45Days` (`-1`/`0`) and `InitMeeting45Compliant/FC/NC`, plus the combined `BothCompliant/FC/NC`, classify the 45-day meeting timeline. **Not set today** (AF-GAP-04). | DB | `MS_Description` |
| BR-AF-45 | *Legacy:* the Interim One Plan date (`InterimDate`) and parental consent date (`ConsentDate`) belong to this form. **No fields for them today** (AF-GAP-09), so the Client Status "Interim Date" is never set for new forms. | DB | `MS_Description` |

## 6. Delay reasons (Initial Evaluation and One Plan)

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-AF-50 | Each milestone has **one optional** reason for delay, chosen from two groups: **1. Due to family and/or child circumstances** (`slstActiveDelayFC`) or **2. NOT due to family and/or child circumstances (non-compliant)** (`slstActiveDelayNFC`). | FE | `DelayReasons.tsx`, `/lookups/delay-reasons` |
| BR-AF-51 | A family reason is stored in `DelayFC` / `MeetingDelayFC`; a provider reason in `DelayNotFC` / `MeetingDelayNC`. The other column of the pair is set to NULL, so at most one is filled. | FE | `toPayload` |
| BR-AF-52 | **"Auto Eligible"** is added to the family list for the **Initial Evaluation only**, even though it isn't in `slstActiveDelayFC`. | FE | `DelayReasons.tsx` |
| BR-AF-53 | **"Other reasons – details"** text is shown under each reason. It **isn't saved** (AF-GAP-01). The DB columns are `DelayFCOther`, `DelayNotFCOther`, `MeetingDelayFCOther`, `MeetingDelayNCOther` (`nvarchar(max)`). | FE | `toPayload` omits it |
| BR-AF-54 | *Legacy classification (`Base0701`):* a delay is **Provider** if the not-FC reason is set, or either "Other" text starts with `provider`. It's **Family** if the FC reason is set, or the "Other" text starts with `family`. Otherwise it's **Cleaning** (needs data clean-up). | Legacy view | `Base0701` |

## 7. Eligibility

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-AF-60 | "Select all that apply" — any combination of conditions; none are required. | FE | `Eligibility.tsx` |
| BR-AF-61 | **Developmental delays** (saved): All, Adaptive, Cognitive, Communication (speech/lang), Motor, Social/emotional → `DDAll` … `DDSocial` (`bit`). "All developmental delays" doesn't tick or untick the others. | FE | — |
| BR-AF-62 | **Diagnosed conditions** (saved): Attachment disorder, Autism/PDD, Suspected Autism, Blind/Visually Impaired, Deaf/Hard of Hearing, Down Syndrome, Cerebral Palsy, Craniofacial Disorder, Medically Fragile, Oral Motor/Swallowing, Severe Complications at Birth → `DCAttachment` … `DCBirth` (`bit`). | FE | — |
| BR-AF-63 | **UI-only conditions** (not saved): Torticollis, Plagiocephaly, Prematurity, Behavior, Nutrition, Neonatal Abstinence Syndrome (NAS), Cystic Fibrosis, Hypoxic-Ischemic Encephalopathy (HIE), Feeding. No DB column; the backend whitelist drops them silently (AF-GAP-02). | FE | `toPayload`, `WRITABLE_COLUMNS` |
| BR-AF-64 | **NMNEI** checkbox: when ticked, a line `NMNEI` is added to the **Other** text; when unticked it's removed. On load, the box is ticked if any line of Other equals `NMNEI` (case-insensitive). | FE | `Eligibility.tsx`, `toValues` |
| BR-AF-65 | **Diagnosis dates** (ASD, Suspected ASD, Vision, Hearing) are always editable. They don't depend on the matching checkbox, and can't be before DOB. | FE | *"{label} cannot be before Date of Birth."* |
| BR-AF-66 | **Other** free text → `DCOtherDesc`. The UI says "No character limit", but the column is `nvarchar(255)` (AF-GAP-12). `DCOther` (bit) is never set. | FE, DB | DDL |

## 8. Saving (backend)

| ID | Rule | Source |
| -- | ---- | ------ |
| BR-AF-70 | Only whitelisted columns are written (65 columns in `WRITABLE_COLUMNS`). Unknown keys, `ID` and `ChildID` in the body are ignored. | `active-form.repository.ts` `clean` |
| BR-AF-71 | Aliases: `status` → `FormType`, `onePlanDate` → `InitialMeetingDate`. | `aliases` |
| BR-AF-72 | **Update is partial**: only the keys sent are changed; `LastUpdateDate = GETDATE()`. | `update` |
| BR-AF-73 | Dates must be `YYYY-MM-DD` and real dates (BE checks Referral, Initial Evaluation and One Plan only). | `date()` |
| BR-AF-74 | If `Town` is sent, it must exist in `slstTownCodes` (by code or name). The backend then fills `Town`, `CountyCode` and, if not sent, `SU_id`. *(The UI doesn't send Town today.)* | `townMapping` |
| BR-AF-75 | Audit: `InsertUser` / `LastUpdateUser` default to `SUSER_SNAME()` (the API's database login). `LastUpdateUser` isn't changed on update. | DDL defaults; repository |
| BR-AF-76 | Values are typed by JavaScript type: boolean → `bit`, integer → `int`, everything else → `nvarchar` (SQL Server converts implicitly, e.g. dates). | `bind` |

## 9. Messages

| When | Message |
| ---- | ------- |
| Loading | "Loading Active Form..." |
| Load failed | "Failed to load Active Form." / "Client information could not be loaded." |
| Edit target missing | "Active Form record not found." |
| Saved (new / edit) | "Active Form saved successfully." / "Active Form updated successfully." |
| Save failed | The server's `message`, else "Failed to save Active Form." |
| Date before DOB | "{Field} cannot be before Date of Birth." |

## 10. Legacy objects that read `stblActiveForm`

These existing reports keep working only if the new form writes data the way the legacy form did.

| Object | Uses | Depends on |
| ------ | ---- | ---------- |
| `LoopAB` (loops A/B) | Active form matched to Referral form | `ChildID`, `ReferralDate` = Referral form's `ReferralDate`; `InitialMeetingDate` as initial OP date |
| `Base0701` (Indicator 7 — 45-day timeline) | Eval/meeting timeliness and delay designation | `ReferralDate`, `InitialEvalDate`, `EvalWithin45Days`, `DelayFC/NotFC(+Other)`, `MeetingWithin45Days`, `MeetingDelay*` |
| `GetIndicator1Detail_rpt` / `Summary` | Newly active children, timely services | `FormDate`, `Region`, `InterimDate`, `InitialMeetingDate` |
| `GetIndicator7_rpt` | Days referral → eval and → One Plan | `FormDate`, `InitialEvalDate`, `InitialMeetingDate`, `Region` |
| `GetActiveForms_rpt` (Actives report) | Every column | All, incl. `CAPTA`, `EvalWithin45Days` (`-1` = YES) |
| `sqryFormListA` / `sqryFormListComplete` / point-in-time reports | Form history, loop errors, active counts | `FormType = 'Active'` (via `slstFormNames`), `InterimDate`, `InitialMeetingDate` |
| `GetClientFormStats_rpt` (client status) | Status "Active", Interim and One Plan dates | `FormDate`, `InterimDate`, `InitialMeetingDate` |

---

## Known gaps and defects

| ID | Severity | Description | Where |
| -- | -------- | ----------- | ----- |
| AF-GAP-01 | **High** | "Other reasons – details" (both delays) is typed but **never saved**: the UI fields `DelayDetails`/`MeetingDelayDetails` aren't mapped to `DelayFCOther`/`DelayNotFCOther`/`MeetingDelayFCOther`/`MeetingDelayNCOther`. Reopening the form shows them blank. | `ActiveFormPage.toPayload` / `toValues` |
| AF-GAP-02 | **High** | 9 eligibility conditions (Torticollis … Feeding) have no DB column and are silently discarded on save. | `Eligibility.tsx`; `WRITABLE_COLUMNS` |
| AF-GAP-03 | **High** | `FormType` is saved as `aop`/`aop-capta` instead of `'Active'`, and the `CAPTA` column is never set. Legacy views and reports that join on `slstFormNames` drop these forms, and CAPTA reporting is empty. | `GeneralInformation.tsx` |
| AF-GAP-04 | **High** | 45-day compliance fields are never set (`EvalWithin45Days`, `MeetingWithin45Days`, `InitEval45*`, `InitMeeting45*`, `Both*`). Indicator 7 reports show "Cleaning"/blank for every new form. The UI already calculates the day counts. | `toPayload` |
| AF-GAP-05 | **High** | Referral Date is free entry. Legacy logic needs it to equal the Referral form's date (BR-AF-23); a mismatch drops the child out of the "active" loop. | `GeneralInformation.tsx` |
| AF-GAP-06 | **High** | `/api/active-forms/*` has **no authentication** (client details incl. SSN are returned by `GET /{childId}`). | `app.ts`, `active-form.routes.ts` |
| AF-GAP-07 | Medium | Client Information shows **County, Region, Referral Date (From Referral Form) and Status** as "—" always; the page never passes them. | `ActiveFormPage` → `ClientInformation` |
| AF-GAP-08 | Medium | `FormDate` = today; legacy = last day of the reporting month (`MonthReporting`, not captured). Reports that select by `FormDate` period will place forms in the wrong month. | `toPayload` |
| AF-GAP-09 | Medium | Legacy fields with **no UI**: `InterimDate`, `ConsentDate`, Service Coordinator (first/last name exist in the schema but have no inputs, so new forms save `''`), `SvcCordType`/`SvcCordOtherDesc`, `FamilyIsSvcCord`, `SU_id`/`SUName`, `Town`/`CountyCode`, `Address`, `ZipCode`, `Ethnicity`, `ReReferralDate`, `MonthReporting`, `DCOther`. The lookups for SU, towns and coordinator types exist in the API but are unused. | UI |
| AF-GAP-10 | Medium | NMNEI is stored as a text line inside `DCOtherDesc` rather than a field. It can be broken by editing the text, and it duplicates the `NonEarlyIntervention` flag on `stblPeople`/`stblReferralForm`. | `Eligibility.tsx` |
| AF-GAP-11 | Medium | Backend validation is weaker than the frontend's. The Referral-ordering checks are commented out. Region `0`, missing required fields, diagnosis dates before DOB, and over-long text are not checked. Over-long text (e.g. Service Coordinator names > 50, `DelayFC` > 50) fails with a SQL truncation error. | `active-form.service.ts` |
| AF-GAP-12 | Medium | "Other" says "No character limit", but `DCOtherDesc` is `nvarchar(255)`; longer text fails to save. | `Eligibility.tsx` |
| AF-GAP-13 | Medium | Errors tagged 400/404 by the service are returned as **500** by the global error handler (the message still reaches the toast). | `error.middleware.ts` |
| AF-GAP-14 | Medium | "Auto Eligible" is injected in the UI but isn't in `slstActiveDelayFC`, so reports that join to the lookup won't recognise it. | `DelayReasons.tsx` |
| AF-GAP-15 | Low | Initial Evaluation and One Plan dates are required by validation but not marked with `*`. | `InitialEvaluation.tsx`, `OnePlan.tsx` |
| AF-GAP-16 | Low | `LastUpdateUser` isn't updated; `InsertUser` is the API's DB login, not the person. | repository |
| AF-GAP-17 | Low | SSN is shown unmasked in Client Information. | `ClientInformation.tsx` |
| AF-GAP-18 | Low | No Swagger annotations: `/api/active-forms` is missing from `/api-docs`. | `active-form.routes.ts` |
| AF-GAP-19 | Low | `ActiveFormAddPage`/`ActiveFormEditPage` are unused re-exports; `getOne` isn't used by the UI. | `pages/` |
| AF-GAP-20 | Low | `stblActiveForm.Town` is `nvarchar(3)` but `slstTownCodes.Town` is `nvarchar(5)`; a 4–5 character town code from the lookup can't be stored. | DDL |
