# 05 — Table Mapping

How each piece of data travels: **UI label → frontend property → API property → DB table.column**, plus which operation touches which table.

---

## 1. Operation × table matrix

C = insert · R = select · U = update · D = delete

`DELETE /:id` also deletes, by DB cascade, every row in the 7 form tables plus `stblServices`, `stblCOSCoverSource` and `stblCOSCoverTeam` (marked D* below).

| Operation / endpoint                 | stblPeople | stblReportingRegion | stblActiveForm | stblNoOnePlanForm | stblCOSCoverForm | stblExitForm | stblReferralForm | stblServiceGridForm | stblInsuranceForm | Services (warehouse) | slstServiceNames |
| ------------------------------------ | :--------: | :-----------------: | :------------: | :---------------: | :--------------: | :----------: | :--------------: | :-----------------: | :---------------: | :------: | :--------------: |
| GET `/api/clients`                   | R | | | | | | | | | | |
| GET `/search/{lastname, firstname, ssn}` | R | | | | | | | | | | |
| GET `/regions`                       | | R | | | | | | | | | |
| GET `/:id`                           | R | | | | | | | | | | |
| POST `/`                             | C | | | | | | | | | | |
| PUT `/:id`                           | U, R | | | | | | | | | | |
| DELETE `/:id`                        | D | | D* | D* | D* | D* | D* | D* | D* | | |
| GET `/:id/status`                    | R | | R | R | R | R | R | R | R | | |
| GET `/:id/service-history`           | | | | | | | | R | | R | R |
| GET `/api/input-forms/history/:id` *(input-form module)* | | | R | R | R | R | R | R | R | | |

---

## 2. Client demographics (ClientLookup right panel ⇄ stblPeople)

| UI label       | Control            | FE `Client` prop       | Request body (POST/PUT) | Response (GET) | DB column (`stblPeople`) | Transform on write | Transform on read (`mapClient`) |
| -------------- | ------------------ | ---------------------- | ----------------------- | -------------- | ------------------------ | ------------------ | ------------------------------- |
| Client ID      | label              | `childId`              | URL `:id`               | `ChildID`      | `ChildID`                | — (identity)        | as is |
| Last Name      | text input         | `lastName`             | `lastName`              | `LastName`     | `LastName`               | trim               | `?? ''` |
| First Name     | text input         | `firstName`            | `firstName`             | `FirstName`    | `FirstName`              | trim               | `?? ''` |
| Gender         | select M/F         | `gender`               | `gender`                | `Gender`       | `Gender`                 | trim, 1st char     | trim, `?? ''` |
| SS#            | text input (10)    | `ss`                   | `ss`                    | `SS`           | `SS`                     | trim (create), as is (update) | as is |
| —              | *(no control)*     | `ssTemp`               | `ssTemp`                | `SSTemp`       | `SSTemp`                 | `=== true`         | as is |
| Region         | searchable select  | `region`               | `region`                | `Region`       | `Region`                 | `Number()` (create) / `String()` (update) | as is |
| Birth Date     | date input         | `dob`                  | `dob`                   | `DOB`          | `DOB`                    | style 23 convert   | `substring(0,10)` |
| Age            | computed label     | *(from `dob`)*         | —                       | —              | —                        | —                  | — |
| Non-EI         | checkbox           | `nonEarlyIntervention` | `nonEarlyIntervention`  | `NonEarlyIntervention` | `NonEarlyIntervention` | `=== true`   | as is |
| Notes *(Status tab)* | textarea     | `notes`                | `notes`                 | `Notes`        | `Notes`                  | trim (create)      | `?? ''` |
| —              | —                  | —                      | `insertUser`            | `InsertUser`   | `InsertUser`             | default `SYSTEM`   | not mapped |
| —              | —                  | —                      | —                       | `InsertDate`   | `InsertDate`             | DB default         | not mapped |
| —              | —                  | —                      | `lastUpdateUser`        | `LastUpdateUser` | `LastUpdateUser`       | default `SYSTEM`   | not mapped |
| —              | —                  | —                      | —                       | `LastUpdateDate` | `LastUpdateDate`       | `GETDATE()`        | not mapped |

`ssTemp` has no UI control; it round-trips from the loaded record and is `false` for new clients.

---

## 3. Client lookup (left panel ⇄ search endpoints)

| UI row     | Calls                                  | Search column | Match       | Option `value` | Option `label`              |
| ---------- | -------------------------------------- | ------------- | ----------- | -------------- | --------------------------- |
| First Name | `GET /search/firstname?search=`        | `FirstName`   | `x%`        | `ChildID`      | `FirstName + ' ' + LastName` |
| Last Name  | `GET /search/lastname?search=`         | `LastName`    | `x%`        | `ChildID`      | `FirstName + ' ' + LastName` |
| SSN        | `GET /search/ssn?search=`              | `SS`          | `%x%`       | `ChildID`      | `SS` |
| DOB        | *(none — bound to `client.dob`)*       | —             | —           | —              | — |
| → button   | `GET /:id`                             | `ChildID`     | `=`         | —              | — |

Region dropdown: `GET /api/common-info/regions` → `stblReportingRegion` (`ID` → value, `RName` → label, `Inactive = 0`).

---

## 4. Client Status tab ⇄ status query

| UI label          | FE prop (`ClientStatusData`) | SQL alias      | Source table.column                          | Aggregation |
| ----------------- | ---------------------------- | -------------- | -------------------------------------------- | ----------- |
| Client Status On  | `statusDate` (query `date`)  | `@StatusDate`  | —                                            | filter |
| Status            | `status`                     | `Status`       | `FormType` from the 7 form tables (UNION ALL) | TOP 1 by `FormDate DESC, RecordID DESC` |
| Referral Date     | `referralDate`               | `ReferralDate` | `stblActiveForm.ReferralDate`                 | MAX ≤ date |
| No One Plan Date  | `noOnePlanDate`              | `NoOnePlanDate`| `stblNoOnePlanForm.StatusDate`                | MAX ≤ date |
| Interim Date      | `interimDate`                | `InterimDate`  | `stblActiveForm.InterimDate`                  | MAX ≤ date |
| One Plan Date     | `onePlanDate`                | `OnePlanDate`  | `stblCOSCoverForm.OnePlanDate`                | MAX ≤ date |
| Exit Date         | `exitDate`                   | `ExitDate`     | `stblExitForm.ExitDate`                       | MAX ≤ date |
| Notes             | `notes`                      | `Notes`        | `stblPeople.Notes`                            | TOP 1 |

### Status UNION — per-table column mapping

| Branch | Table                 | `FormDate` | `FormType` | `RecordID` ← |
| ------ | --------------------- | ---------- | ---------- | ------------ |
| 1      | `stblActiveForm`      | FormDate   | FormType   | `ID` |
| 2      | `stblNoOnePlanForm`   | FormDate   | FormType   | `ID` |
| 3      | `stblCOSCoverForm`    | FormDate   | FormType   | `COSCoverID` |
| 4      | `stblExitForm`        | FormDate   | FormType   | `ID` |
| 5      | `stblReferralForm`    | FormDate   | FormType   | `ID` |
| 6      | `stblServiceGridForm` | FormDate   | FormType   | `ServiceGridID` |
| 7      | `stblInsuranceForm`   | FormDate   | FormType   | `ID` |

---

### 4.1 Status — legacy mapping (`GetClientFormStats_rpt`)

| UI label | Legacy table.column | Selection |
| -------- | ------------------- | --------- |
| Status | Table of the latest form among Referral / Active / Exit / No One Plan → `Referred In Process` / `Active` / `Exited` / `No One Plan Resulting` | Latest `FormDate ≤ D` |
| Referral Date | `stblReferralForm.ReReferralDate`, else `ReferralDate` | Latest Referral form with `FormDate ≤ D` |
| No One Plan Date | `stblNoOnePlanForm.StatusDate` | Latest NOPR form with `FormDate ≤ D`; blank if before Referral Date |
| Interim Date | `stblActiveForm.InterimDate` | Latest Active form with `FormDate ≤ D`; blank if before Referral Date |
| One Plan Date | `stblActiveForm.InitialMeetingDate` | same Active form; blank if before Referral Date |
| Exit Date | `stblExitForm.ExitDate` | Latest Exit form with `FormDate ≤ D`; blank if before Referral Date |

## 5. Service History ⇄ service-history query

| UI column | FE prop       | SQL alias     | Source                                   | Join |
| --------- | ------------- | ------------- | ---------------------------------------- | ---- |
| Date      | `date`        | `ServiceDate` | `stblServiceGridForm.FormDate`           | — |
| Service   | `serviceName` | `ServiceName` | `slstServiceNames.SvcName`               | `Services.SvcCode = slstServiceNames.SvcCode` (LEFT) |
| Freq.     | `frequency`   | `Frequency`   | `Services.Frequency`                     | `Services.ServiceGridID = stblServiceGridForm.ServiceGridID` (INNER) |
| Consent   | `consent`     | `Consent`     | `CASE WHEN Services.ConsentDate IS NOT NULL THEN 'Yes' ELSE 'Pending' END` | — |
| Case Plan | `casePlan`    | `CasePlan`    | `NULL` (placeholder)                     | — |
| *(key)*   | `id`          | `ServiceID`   | `Services.ID`                            | — |

Filter: `stblServiceGridForm.ChildID = :id`.

> `Services` is the **warehouse** table. The live data is in `stblServices` (BR-GAP-20).

### 5.1 Service History — legacy mapping (`GetServiceHistory_rpt`)

| UI column | Legacy source | Proposed mapping for the rewrite |
| --------- | ------------- | -------------------------------- |
| Date | `CHOOSE(OutcomeStatus, stblServices.ActualStartDate, stblServiceGridForm.ConsentDate, '', stblServices.EndDate)` | same |
| Service | `slstServiceNames.SvcName` (INNER join on `SvcCode`) | same |
| Freq. | — (legacy returns `stblServices.HowLong`) | `stblServices.HowLong` — confirm |
| Consent | `stblServiceGridForm.ConsentDate` | Show the date, or `Yes` when set — confirm |
| Case Plan | — (legacy returns `OutcomeStatus`) | `OutcomeStatus` label (New Outcome / New Frequency / Service Ended) — confirm |
| *(key)* | `stblServices.ID` | same (non-null PK) |

Filters: `sgf.ChildID = :id AND OutcomeStatus <> 3 AND sgf.ConsentDate <= :statusDate`. Order: `slstServiceNames.SortOrder, sgf.ConsentDate`.

---

## 6. Input Forms history grid ⇄ history query (input-form module)

| UI column  | FE prop     | Active | No One Plan | Referral | Service Grid | COS Cover | Exit | Insurance |
| ---------- | ----------- | ------ | ----------- | -------- | ------------ | --------- | ---- | --------- |
| *(key)*    | `id`        | `ID` | `ID` | `ID` | `ServiceGridID` | `COSCoverID` | `ID` | `ID` |
| Date       | `date`      | `FormDate` | `FormDate` | `FormDate` | `FormDate` | `FormDate` | `FormDate` | `FormDate` |
| Form Type  | `formType`  | `FormType` | `FormType` | `FormType` | `FormType` | `FormType` | `FormType` | `FormType` |
| Referral   | `referral`  | `ReferralDate` | — | `ReferralDate` | `ReferralDate` | — | `ReferralDate` | — |
| NOPR       | `nopr`      | — | `FormDate` | — | — | — | — | — |
| interim    | `interim`   | `InterimDate` | — | — | — | — | — | — |
| OP         | `op`        | — | — | — | — | `OnePlanDate` | — | — |
| Exit       | `exit`      | — | — | — | — | `ExitDate` | `ExitDate` | — |
| Loop Error | `loopError` | `0` | `0` | `0` | `0` | `0` | `0` | `0` |
| *(route)*  | `formName`  | `active` | `no-one-plan` | `referral` | `service-grid` | `cos-cover` | `exit` | `insurance` |

`—` = returned as `NULL`.

### 6.1 Legacy history mapping (`sqryFormListA`) — differences highlighted

| UI column | Active | No One Plan | Referral | Service Grid | COS Cover | Exit | Insurance |
| --------- | ------ | ----------- | -------- | ------------ | --------- | ---- | --------- |
| Referral  | **—** | — | **`FormDate`** | **—** | — | **—** | — |
| NOPR      | — | **`StatusDate`** | — | — | — | — | — |
| interim   | `InterimDate` | — | — | — | — | — | — |
| OP        | **`InitialMeetingDate`** | — | — | — | **—** | — | — |
| Exit      | — | — | — | — | **—** | `ExitDate` | — |
| Loop Error | rules BR-LOOP-01..07 (all forms) | | | | | | |

**Bold** = differs from the current implementation (table above).

---

## 7. Naming-convention mapping

| Layer               | Convention   | Example |
| ------------------- | ------------ | ------- |
| DB column           | PascalCase   | `NonEarlyIntervention` |
| GET response (client rows) | PascalCase (raw) | `NonEarlyIntervention` |
| POST/PUT body       | camelCase    | `nonEarlyIntervention` |
| Frontend model      | camelCase    | `nonEarlyIntervention` |
| Status / service-history responses | camelCase (mapped in repository) | `referralDate` |
| Input-form payloads | PascalCase   | `FormDate` |

The case conversion for client rows happens **only on the frontend** (`ClientService.mapClient`); for status and service history it happens **only on the backend**.
