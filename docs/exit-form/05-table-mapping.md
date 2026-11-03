# 05 — Table Mapping: Exit Form

How each piece of data moves: **screen label → form value → API payload → `stblExitForm` column**, and which legacy reports read it.

---

## 1. Operation × table matrix

| Operation | stblPeople | stblExitForm | stblActiveForm | stblReferralForm | Lookups |
| --------- | :--------: | :----------: | :------------: | :--------------: | ------- |
| `GET /api/exit-forms/{childId}` (open form) | R | R (all rows for client) | — | — | — |
| `GET /api/exit-forms/{childId}/defaults` (new form) | R (exists) | — | R (latest) | R (latest) | — |
| `GET /api/exit-forms/lookups/options` | — | — | — | — | config (no table) |
| `GET /api/common-info/regions` | — | — | — | — | R `stblReportingRegion` |
| `POST /api/exit-forms/{childId}` (save new) | R (exists + DOB) | C | — | — | — |
| `PUT /api/exit-forms/{childId}/{id}` (save edit) | R | R, U (partial) | — | — | — |
| `DELETE /api/input-forms/exit/{childId}/{id}` (grid delete) | — | D | — | — | — |
| `GET /api/input-forms/history/{childId}` (grid) | — | R | R | R | (other form tables) |

## 2. Screen → payload → column

| Section | Screen label | Form value | Payload key | DB column | Transform |
| ------- | ------------ | ---------- | ----------- | --------- | --------- |
| *(hidden)* | — | — | — | `ChildID` | from the URL |
| *(hidden)* | — | — | — | `FormType` | always `'Exit'` (backend) |
| *(hidden)* | — | — | — | `FormDate` | = `ExitDate` (backend) |
| General | Region * | `Region` | `Region` | `Region` | number |
| General | Date of Referral * | `ReferralDate` | `ReferralDate` | `ReferralDate` | `''` → null |
| General | Date of Exit * | `ExitDate` | `ExitDate` | `ExitDate` | `''` → null; required |
| Transition | Date Written Transition Plan | `TransitionPlanCompleted` | same | same | `''` → null |
| Transition | Transition Plan Delay Reason | `TransitionPlanReason` | same | same | trimmed; blank → null |
| Transition | LEA Notification Date | `CLLEANotificationDate` | same | same | `''` → null |
| Transition | Date of Transition Conference | `TransitionMeeting` | same | same | `''` → null |
| Transition | Days Between … (4) | (derived) | — | — | not saved |
| Exit Details | When did the child exit? * | `exitPath` | — | — | decides which code is sent |
| Exit Details | Reason for Exit * | `ExitPriorToAge3` | `ExitPriorToAge3` | `ExitPriorToAge3` | number when path = prior, else null → backend stores **0** |
| Exit Details | Region Moved To | `MovedOtherRegion` | `MovedOtherRegion` | `MovedOtherRegion` | sent only when path = prior; backend keeps it only for code 2 |
| Exit Details | Child Exited at Age 3 * | `ExitAtAge3` | `ExitAtAge3` | `ExitAtAge3` | number when path = at age 3, else null → backend stores **0** |
| *(hidden)* | — | — | — | `EXFNoPartB1-3` | set to false unless `ExitAtAge3 = 4` (backend) |
| Exit Details | Referred To | `ReferredTo` | `ReferredTo` | `ReferredTo` | number or null |
| *(audit)* | — | — | — | `LastUpdateDate`, `LastUpdateUser` | `GETDATE()`, `SUSER_SNAME()` on update |

## 3. Load (edit) mapping — column → form value

| DB column | Form value | Rule |
| --------- | ---------- | ---- |
| `Region` | `Region` | `Number(x ?? 0)` |
| `ReferralDate`, `ExitDate`, `TransitionPlanCompleted`, `CLLEANotificationDate`, `TransitionMeeting` | same | first 10 characters (`YYYY-MM-DD`) |
| `TransitionPlanReason`, `MovedOtherRegion` | same | null → `''` |
| `ExitPriorToAge3` | `ExitPriorToAge3` | `0` or null → `''` (not chosen) |
| `ExitAtAge3` | `ExitAtAge3` | `0` or null → `''` |
| `ExitPriorToAge3` / `ExitAtAge3` | `exitPath` | `prior` if the prior code is set, else `atAge3` if the at-age-3 code is set, else `''` |
| `ReferredTo` | `ReferredTo` | null → `''` |

## 4. New form prefill — `GET /{childId}/defaults`

| Form value | First choice | Fallback 1 | Fallback 2 |
| ---------- | ------------ | ---------- | ---------- |
| `Region` | latest `stblActiveForm.Region` (by `FormDate`) | latest `stblReferralForm.Region` (by `COALESCE(ReReferralDate, ReferralDate, FormDate)`) | `stblPeople.Region` |
| `ReferralDate` | latest `stblActiveForm.ReferralDate` | latest `stblReferralForm.ReferralDate` | empty |

## 5. Read-only Client Information

| Label | Source | Shown |
| ----- | ------ | ----- |
| Child Last Name / First Name | `stblPeople.LastName` / `FirstName` | ✅ |
| SSN | `stblPeople.SS` | ✅ (unmasked) |
| DOB | `stblPeople.DOB` | ✅ `MM/DD/YYYY` |
| Region | `stblReportingRegion.RName` of the Region selected on the form | ✅ (live) |
| Referral Date (From Referral Form) | the form's own Date of Referral | ✅ (live; EF-GAP-11) |
| County / Status | — | ❌ not shown on the Exit Form **[Decision]** |

## 6. Columns → legacy consumers

✔ = read by the object. A column the new form never writes (✗ in the last column) leaves that part of the report blank or "Cleaning".

| Column | Exits rpt | Ind. 8 rpt | Ind. 8 views (`Loops`) | Annual exit rpts | FITP extract | Form list / status | Written today |
| ------ | :-------: | :--------: | :--------------------: | :--------------: | :----------: | :----------------: | :-----------: |
| `ChildID` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `FormDate` | ✔ | | | | ✔ (as exit date) | ✔ | ✔ (= exit date) |
| `FormType` | ✔ | | | | ✔ | ✔ (`= 'Exit'`) | ✔ |
| `Region` | ✔ | ✔ | ✔ | | | | ✔ |
| `ReferralDate` | ✔ | | | ✔ (`< ExitDate`) | | | ✔ |
| `ExitDate` | ✔ | ✔ | ✔ (`EndDate`) | ✔ | | ✔ | ✔ |
| `TransitionPlanCompleted` / `TransitionPlanReason` | ✔ | ✔ | ✔ | | | | ✔ (reason free text) |
| `CLLEANotificationDate` | ✔ | ✔ | ✔ | | | | ✔ |
| `Notified90Days` / `NotifiedReason` | ✔ | ✔ | ✔ | | | | ✗ |
| `NotifyStatePartC` | ✔ | | | | | | ✗ |
| `TransitionMeeting` | ✔ | ✔ | ✔ | | | | ✔ |
| `TransitionMeeting90day` / `NoTransitionMtgReason` | ✔ | ✔ | ✔ | | | | ✗ |
| `ExitPriorToAge3` | ✔ | | ✔ (0 convention) | ✔ (codes 1–6) | | | ✔ (7, 8 not in annual rpts) |
| `MovedOtherRegion` | ✔ | | | | | | ✔ |
| `ExitAtAge3` | ✔ | | ✔ (0 convention) | ✔ (1–3) | | | ✔ |
| `EXFNoPartB1-3` | ✔ | | | | | | ✗ (cleared / defaults) |
| `ReferredTo` | ✔ | | ✔ (`DCNotPEReferred`) | ✔ (99 = none) | | | ✔ |
| `COSF*` | ✔ | | | | | | ✗ |
| SU / County / Town / SvcCord* / `CAPTA` / `MonthReporting` | ✔ | | | | | | ✗ **[Decision]** |
