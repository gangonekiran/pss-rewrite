# 03 — Business Rules: Exit Form

Rules as **implemented**, with the **legacy** rule (from `dbCDD` column descriptions, views and stored procedures) wherever the two differ. Enforced by: FE = frontend, BE = backend, DB = database constraint.

The Exit Form records that a child left Early Intervention (Part C): **when** they left (before age 3, or at age 3 at transition to Part B), **why**, **where they were referred**, and the **transition** milestones (written transition plan, LEA notification, transition conference). One row in `stblExitForm` per Exit Form.

Decisions confirmed by the product owner (Beth) during development are marked **[Decision]**.

---

## 1. Access and lifecycle

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-EF-01 | The Exit Form is opened only from the Client screen → **Input Forms** tab: the **Exit** button (new form) or **View/Edit** on an Exit row (edit). It opens as a full-screen modal titled "New Exit Form" / "Edit Exit Form" with the Client ID. | FE | `InputForms.tsx` `ExitFormModal` |
| BR-EF-02 | A client must be selected; the form belongs to that client (`ChildID`). | FE, BE, DB | FK `stblExitForm$stblPeoplestblExitForm` (cascade) |
| BR-EF-03 | The backend rejects a `ChildID`/`ID` that isn't a positive integer, a client that doesn't exist (*"Client not found"*), and a form that doesn't belong to the client (*"Exit Form not found"*). | BE | `exit-form.service.ts` |
| BR-EF-04 | A client can have any number of Exit Forms. Nothing checks that the child was Active first (EF-GAP-09). | — | — |
| BR-EF-05 | **Edit** loads all the client's Exit Forms and picks the one with the matching ID; if it's missing: *"Exit Form record not found."* and the modal closes. | FE | `ExitFormPage` |
| BR-EF-06 | After a successful save the Input Forms history reloads and the modal closes. **Cancel** and **×** close without saving (no "unsaved changes" warning). | FE | `onSaved` / `onClose` |
| BR-EF-07 | Deleting is done from the Input Forms grid (*"Delete Exit dated {FormDate}?"*). It's a hard delete of the row; nothing cascades from it. | FE, BE | `InputForms.handleDelete` → `/api/input-forms/exit/…` |

## 2. Form date and form type

| ID | Rule | Enforced | Source |
| -- | ---- | -------- | ------ |
| BR-EF-10 | **FormType** is always saved as `'Exit'`. A `FormType` sent in the body is ignored. Legacy views and reports find Exit rows by this literal (`slstFormNames`, `sqryFormListComplete`, FITP extract). | BE, DB default | `normalizePayload`, `insert` |
| BR-EF-11 | **FormDate** = **Date of Exit** on create (unless a `FormDate` is sent). On update, if the saved `FormDate` equalled the saved `ExitDate`, a new `ExitDate` moves `FormDate` too. There is no field for it. | BE | `create`, `update` |
| BR-EF-12 | *Legacy:* `FormDate` is "Effective Date of Form (always last day of month, calculated from MonthReporting)". However, the FITP extract (`Get_FITP_Extract_rpt`, `Get_CIS_FITP_Output`) and Indicator 3 read the Exit form's `FormDate` **as the exit date**, which is why BR-EF-11 sets it to the exit date. `MonthReporting` isn't captured (EF-GAP-17). | DB description | DDL, legacy procedures |

## 3. General Information

| ID | Rule | Enforced | Message |
| -- | ---- | -------- | ------- |
| BR-EF-20 | **Region** is required and must be a real region (value > 0). | FE, BE | FE *"Region is required."* · BE *"Region must be selected"* |
| BR-EF-21 | New forms are prefilled: **Region** and **Date of Referral** from the child's latest Active form (by `FormDate`); if there is none, from the latest Referral form (by re-referral, referral or form date); a missing Region falls back to the client's region. Both stay editable. | BE, FE | `GET /{childId}/defaults` |
| BR-EF-22 | **Date of Referral** is required and can't be before the DOB. | FE (BE: DOB only) | *"Date of Referral is required."* · *"Date of Referral cannot be before Date of Birth."* |
| BR-EF-23 | **Date of Exit** is required; it can't be before the DOB or the Date of Referral. | FE, BE | *"Date of Exit is required."* · *"Date of Exit cannot be before Date of Referral."* |
| BR-EF-24 | The read-only **Client Information** card shows Child Last/First Name, SSN, DOB, the **Region** name of the selected region and **Referral Date (From Referral Form)** = the Date of Referral typed on this form. County and Status are not shown. **[Decision]** Status, Supervisory Union, Town, County and Service Coordinator are removed from the Exit Form and aren't saved. | FE | `ClientAndGeneral` |

## 4. Transition Information

| ID | Rule | Enforced | Message |
| -- | ---- | -------- | ------- |
| BR-EF-30 | **Date Written Transition Plan**, **LEA Notification Date** and **Date of Transition Conference** are required **only when the child exits at age 3**; the `*` appears only then. | FE | *"Date Written Transition Plan is required."* · *"LEA Notification Date is required."* · *"Date of Transition Conference is required."* |
| BR-EF-31 | The Transition Plan and LEA Notification dates can't be before the Date of Referral. | FE, BE | *"{Label} cannot be before Date of Referral."* |
| BR-EF-32 | None of the three dates can be after the Date of Exit. | FE, BE | FE *"Cannot be after Date of Exit."* · BE *"{Label} cannot be after Date of Exit"* |
| BR-EF-33 | No form date can be before the child's DOB. | FE, BE | *"{Label} cannot be before Date of Birth."* |
| BR-EF-34 | **Transition Plan Delay Reason** is optional free text (`TransitionPlanReason`). The placeholder asks for "Family circumstance or provider circumstance, and details". *Legacy:* `BaseResults0801` and `DCInd8AReasonForDelay` classify the delay by the **first word** — text starting `fami…` is a family delay, `provi…` a provider delay, anything else is "Cleaning" (EF-GAP-05). | FE | — |
| BR-EF-35 | **Day counts** (display only, not saved), in calendar days: Referral → Transition Plan = Plan − Referral **[Decision: the counter runs from the referral date to the plan date]**; LEA Notification → Exit = Exit − LEA; Transition Conference → Exit = Exit − Conference; Exit → 3rd Birthday = 3rd birthday − Exit (negative when the exit is after the birthday). Blank when a date is missing. | FE | `calculateExit` |
| BR-EF-36 | **3rd birthday** = DOB + 3 years (29 February → 1 March). Shown in the section description. | FE | `thirdBirthday` |
| BR-EF-37 | *Legacy federal timeline (Indicator 8):* the transition plan, LEA notification and transition conference should fall **90–180 days before the exit** for children potentially eligible for Part B (`BaseResults0801` FedComplianceA/B/C). **[Decision]** Compliance indicators are removed from the screen, and the legacy flags `Notified90Days`, `TransitionMeeting90day`, `NotifyStatePartC` and the reasons `NotifiedReason`, `NoTransitionMtgReason` aren't captured (EF-GAP-04). | — | `BaseResults0801`, `GetIndicator8_rpt` |

## 5. Exit Details

| ID | Rule | Enforced | Message |
| -- | ---- | -------- | ------- |
| BR-EF-40 | **When did the child exit?** is required: *Prior to age 3* or *At age 3*. It isn't stored; it decides which code column is filled. New forms suggest it from the Date of Exit: **At age 3** when the exit is on or after the day 31 days before the 3rd birthday, otherwise **Prior to age 3**. The suggestion follows the exit date until the user picks a path. Edit mode reads it from the saved codes. | FE | *"Choose when the child exited."* |
| BR-EF-41 | **Prior to age 3:** exactly one **Reason for Exit** is required (radio): 7 Non-EI Client Exit · 8 Referral to CIS-EI · 1 Development at appropriate level · 2 Moved to other region · 3 Moved out of state · 4 Withdrawn by parent or guardian · 5 Unable to contact · 6 Deceased → `ExitPriorToAge3`. | FE (BE: code must be in the list) | *"Select the reason for exit."* |
| BR-EF-42 | Codes **7** and **8** are new (not in the legacy column description) and are listed first, as on the requirement. **[Decision]** The prior-to-age-3 reason is chosen from the list. Legacy annual exit reports don't know these codes (EF-GAP-02). | Config | `EXIT_PRIOR_TO_AGE_3` |
| BR-EF-43 | Reason **2 Moved to other region** shows **Region Moved To** (text, max 255) → `MovedOtherRegion`. For any other reason it's cleared (BE) and not sent (FE). | FE, BE | *"Use 255 characters or fewer."* |
| BR-EF-44 | **At age 3:** exactly one outcome is required (radio): 1 Potentially eligible for Part B · 2 Potentially eligible – family declined further service · 3 Thought to be eligible – potential eligibility not determined · 4 NOT eligible for Part B → `ExitAtAge3`. | FE (BE: code in list) | *"Select an option."* |
| BR-EF-45 | **One path only.** The column of the path not taken is stored as **0** (not NULL), as the legacy form did: `BaseResults0801` reads `ExitPriorToAge3 = 0` as "Exit at age 3" and `ExitAtAge3 = 0` as "Exit Prior to Age 3" / "Ignore"; `DCInd8*ReasonForDelay` filter on the same 0. A save with real codes in both columns is rejected. | BE | *"Choose either an exit reason prior to age 3 or an exit at age 3 outcome, not both"* |
| BR-EF-46 | `EXFNoPartB1-3` (reasons the child isn't eligible for Part B) are kept only when `ExitAtAge3 = 4` and set to false otherwise. They aren't on the screen (EF-GAP-07). | BE | `clearDependentFields` |
| BR-EF-47 | **Referred To** is one choice (radio): 1 Head Start · 2 Community-based Child Care Program or Preschool · 3 School based Pre-School Classroom · 4 Children's Integrated Services Coordinator · 5 Other · 99 Exited with no referral → `ReferredTo`. It appears once a path is chosen; **required for an exit at age 3**, optional prior to age 3. The backend requires it when `ExitAtAge3 = 4` (legacy data-cleaning check `DCNotPEReferred` lists NOT-eligible exits with no referral). | FE, BE | FE *"Select where the child was referred."* · BE *"Referred To is required when the child is NOT eligible for Part B (choose "Exited with no referral" if there was no referral)"* |
| BR-EF-48 | **[Decision]** "Other" (5) is a radio button only — no free-text box. **[Decision]** The wording for 99 is "Exited with no referral". Legacy annual exit reports count every code except 99 as "referred", so 5 is counted correctly. | Config | `REFERRED_TO` |

## 6. Saving (backend)

| ID | Rule | Source |
| -- | ---- | ------ |
| BR-EF-60 | Only whitelisted columns are written (38 in `COLUMNS`; `FormType` is then fixed to `'Exit'`). Unknown keys, `ID` and `ChildID` in the body are ignored. | `normalizePayload`, repository `clean` |
| BR-EF-61 | Values are parsed by column type: dates `YYYY-MM-DD` and real; `int` whole numbers; Yes/No (`int`) → `-1`/`0`; `bit` → true/false; text trimmed, blank → NULL, length checked against the column. | `exit-form.rules.ts` |
| BR-EF-62 | Code columns must hold a listed code (`ExitPriorToAge3`, `ExitAtAge3` also allow 0). | `checkCode` |
| BR-EF-63 | Cross-field rules (BR-EF-22, 23, 31–33, 45, 47) run on the **merged** record (saved row + changes), so a partial update can't break them. | `validateRecord` |
| BR-EF-64 | **Update is partial**: only the keys sent are changed; `LastUpdateDate = GETDATE()`, `LastUpdateUser = SUSER_SNAME()`. | repository `update` |
| BR-EF-65 | Audit: `InsertDate` / `InsertUser` come from the column defaults (`getdate()`, `suser_sname()` = the API's database login). | DDL defaults |
| BR-EF-66 | Dates are sent to SQL Server as `nvarchar(10)` `YYYY-MM-DD`; the legacy "SQL Server" ODBC driver rejects date parameters (HY004). | repository `bind` |

## 7. Messages

| When | Message |
| ---- | ------- |
| Loading | "Loading Exit Form..." |
| Load failed | Server message or "Failed to load Exit Form." (toast) · "Exit Form could not be loaded." (page) |
| Edit target missing | "Exit Form record not found." |
| Validation failed on Save | "Please fix the highlighted fields." (toast) + the field messages |
| Saved (new / edit) | "Exit Form saved successfully." / "Exit Form updated successfully." |
| Save failed | The server's `message`, else "Failed to save Exit Form." |
| Date format | "Enter a valid date." |
| Date before DOB | "{Label} cannot be before Date of Birth." |

## 8. Legacy objects that read `stblExitForm`

These existing reports keep working only if the new form writes data the way the legacy form did.

| Object | Uses | Depends on |
| ------ | ---- | ---------- |
| `GetExitForms_rpt` (Exits report) | Every exit column | All, including `COSF*`, `Notified90Days`, `EXFNoPartB1-3` |
| `GetIndicator8_rpt` (Indicator 8 — transition) | Age at exit, transition dates and on-time flags | `ExitDate`, `TransitionPlanCompleted`, `TransitionPlanReason`, `CLLEANotificationDate`, `Notified90Days` (-1/0 → Y/N), `NotifiedReason`, `TransitionMeeting`, `TransitionMeeting90day`, `NoTransitionMtgReason` |
| `BaseResults0801`, `DCInd8A/B/CReasonForDelay` (via warehouse `Loops`) | Indicator 8 compliance and data-cleaning lists | `ExitPriorToAge3 = 0` / `ExitAtAge3 = 0` path convention; reason text starting `fami` / `provi` |
| `DCNotPEReferred` (via `Loops`) | NOT-eligible exits without a referral | `ExitAtAge3 = 4`, `ReferredTo IS NULL` |
| `GetAnnualExitGender*` / `GetAnnualExitEthnicity*` (annual exit reports) | Exit counts by reason | `ExitDate` range; `ExitPriorToAge3` via `Choose(code, 1, 11, 8, 9, 10, 7)` (codes 1–6 only); `ExitAtAge3` 1–3; `ReferredTo` (99 = no referral); `ReferralDate < ExitDate` |
| `Get_FITP_Extract_rpt`, `Get_CIS_FITP_Output`, `sqryFITPExtractExitsA` (FITP extract) | Exit date per referral | `FormDate` (read as the exit date), `FormType` |
| `GetIndicator3_rpt` (child outcomes) | Exit date for COS | `MAX(FormDate)` as exit date |
| `sqryFormListA`, `sqryKeyFormsCombined`, `sqryFormListComplete`, point-in-time and service-location reports | Form history, loop errors, active counts | `FormType = 'Exit'` (via `slstFormNames`), `FormDate`, `ExitDate` |
| `GetClientFormStats_rpt` (client status) | Latest exit date | `ExitDate` (blank when before the referral date) |

---

## Known gaps and defects

| ID | Severity | Description | Where |
| -- | -------- | ----------- | ----- |
| EF-GAP-01 | **High** | The generic Input Forms API (`POST/PUT /api/input-forms/exit/…`) writes `stblExitForm` directly with its own whitelist. It **skips every Exit Form rule**: `FormType = 'Exit'`, the 0 for the unused path, code lists, date checks. It even accepts `FormType`, `InsertUser` and `LastUpdateUser` from the body. The UI doesn't call it, but it's reachable. | `input-form.config.ts` `exit` |
| EF-GAP-02 | **High** | New prior-to-age-3 codes **7** (Non-EI Client Exit) and **8** (Referral to CIS-EI) aren't known to the annual exit reports: `Choose([ExitPriorToAge3],1,11,8,9,10,7)` returns NULL for 7 and 8, so those exits drop out of the reason breakdown. `slstAnnualExitReasons` needs rows and the procedures need updating, or the codes need mapping. | `GetAnnualExit*_rpt` |
| EF-GAP-03 | **High** | `/api/exit-forms/*` has **no authentication** (client details incl. SSN are returned by `GET /{childId}`). | `app.ts` |
| EF-GAP-04 | Medium | **[Decision]** Compliance indicators were removed, so `Notified90Days`, `TransitionMeeting90day`, `NotifyStatePartC`, `NotifiedReason` and `NoTransitionMtgReason` are never set. Indicator 8 shows blank on-time flags and classifies late LEA notifications and conferences as "Cleaning". The reports need to calculate these from the dates, or the decision needs revisiting. | Reports |
| EF-GAP-05 | Medium | Transition Plan Delay Reason is free text. Legacy reports need it to **start with** "family" or "provider"; anything else is "Cleaning". Suggest a Family / Provider choice plus a details box. | `TransitionInformation.tsx` |
| EF-GAP-06 | Medium | Backend validation is weaker than the frontend's. It doesn't require an exit path, a reason for the path, Date of Referral, the three transition dates for an exit at age 3, or Referred To for at age 3 (only for code 4). Another API client can save incomplete exits. | `exit-form.service.ts` |
| EF-GAP-07 | Medium | `EXFNoPartB1-3` (why a child isn't eligible for Part B) aren't on the screen. New NOT-eligible exits record no reason, though `GetExitForms_rpt` reports them. Confirm whether they're still needed. | UI |
| EF-GAP-08 | Medium | Errors tagged 400/404 by the service are returned as **500** by the global error handler (the message still reaches the toast). | `error.middleware.ts` |
| EF-GAP-09 | Medium | Nothing checks the form sequence. The legacy loop-error logic (`sqryFormListComplete`) flags an Exit whose previous key form isn't an Active form; the Input Forms grid shows `loopError` as always false. | Input Forms |
| EF-GAP-10 | Medium | The FK to `stblPeople` was created `WITH NOCHECK` (not trusted by the optimizer), and there's no index on `ChildID`; client lookups and the cascade delete scan the table. | DDL |
| EF-GAP-11 | Low | "Referral Date (From Referral Form)" on the Client Information card shows this form's own Date of Referral, not a value read from the Referral form. | `ExitFormPage` |
| EF-GAP-12 | Low | The heading appears twice: the modal title and the page heading both say "New Exit Form" / "Edit Exit Form". | `InputForms.tsx`, `ExitFormPage.tsx` |
| EF-GAP-13 | Low | SSN is shown unmasked in Client Information. | `ClientInformation.tsx` |
| EF-GAP-14 | Low | `InsertUser` / `LastUpdateUser` are the API's database login, not the person. | DDL defaults, repository |
| EF-GAP-15 | Low | Region Moved To is free text; the column description says "Specify region", so a region dropdown would give consistent values. | `ExitDetails.tsx` |
| EF-GAP-16 | Low | Referred To is a single choice (the column is one `int`). The original feature notes (88822) said several referral destinations could be selected; confirm one is enough. | Requirements |
| EF-GAP-17 | Low | `FormDate` = exit date, while the legacy description says "last day of the reporting month"; `MonthReporting` isn't captured. Reports that group by `FormDate` month use the exit month. | `create` |
| EF-GAP-18 | Low | `stblExitForm.Town` is `nvarchar(3)` but `slstTownCodes.Town` is `nvarchar(5)`. Only reachable through the API (Town isn't on the screen). | DDL |
