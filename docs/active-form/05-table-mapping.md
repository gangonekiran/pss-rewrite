# 05 — Table Mapping: Active Form

How each piece of data moves: **screen label → form value → API payload → `stblActiveForm` column**, and which legacy reports read it.

---

## 1. Operation × table matrix

| Operation | stblPeople | stblActiveForm | Lookups |
| --------- | :--------: | :------------: | ------- |
| `GET /api/active-forms/{childId}` (open form) | R | R (all rows for client) | — |
| `GET /api/common-info/regions` | — | — | R `stblReportingRegion` |
| `GET /api/active-forms/lookups/delay-reasons` | — | — | R `slstActiveDelayFC`, `slstActiveDelayNFC` |
| `POST /api/active-forms/{childId}` (save new) | R (exists + DOB) | C | R `slstTownCodes`+`slstCounties` if `Town` sent |
| `PUT /api/active-forms/{childId}/{id}` (save edit) | R | R, U (partial) | same |
| `DELETE /api/input-forms/active/{childId}/{id}` (grid delete) | — | D | — |
| `GET /api/active-forms/lookups/supervisory-unions`, `/towns`, `/service-coordinator-types` | — | — | R (not called by UI) |

## 2. Screen → payload → column

| Section | Screen label | Form value | Payload key | DB column | Transform |
| ------- | ------------ | ---------- | ----------- | --------- | --------- |
| *(hidden)* | — | — | `FormDate` (new only) | `FormDate` | today, local `YYYY-MM-DD` |
| General | Region * | `Region` | `Region` | `Region` | number |
| General | Date of Referral * | `ReferralDate` | `ReferralDate` | `ReferralDate` | `''` → null |
| General | Status * | `status` | `status` | `FormType` | backend alias; `aop` / `aop-capta` |
| *(hidden)* | — | `SvcCordFirstName` | `SvcCordFirstName` | `SvcCordFirstName` | `''` on new forms |
| *(hidden)* | — | `SvcCordLastName` | `SvcCordLastName` | `SvcCordLastName` | `''` on new forms |
| Initial Evaluation | Date of Initial Evaluation / Assessment | `InitialEvalDate` | `InitialEvalDate` | `InitialEvalDate` | `''` → null |
| Initial Evaluation | Days Between Referral and Initial Evaluation | (derived) | — | — | not saved |
| Initial Evaluation | Reason for Delay | `DelayReason` | `DelayFC` / `DelayNotFC` | `DelayFC` / `DelayNotFC` | split on `family::` / `provider::`; other column → null |
| Initial Evaluation | Other reasons – details | `DelayDetails` | **—** | *(should be `DelayFCOther` / `DelayNotFCOther`)* | **dropped** |
| One Plan | Date of One Plan | `onePlanDate` | `InitialMeetingDate` | `InitialMeetingDate` | `''` → null |
| One Plan | Days Between Referral and One Plan | (derived) | — | — | not saved |
| One Plan | Reason for Delay | `MeetingDelayReason` | `MeetingDelayFC` / `MeetingDelayNC` | same | split as above |
| One Plan | Other reasons – details | `MeetingDelayDetails` | **—** | *(should be `MeetingDelayFCOther` / `MeetingDelayNCOther`)* | **dropped** |
| Eligibility | All developmental delays … Social/emotional | `DDAll` … `DDSocial` | same | same `bit` | boolean |
| Eligibility | Attachment disorder … Severe Complications at Birth | `DCAttachment` … `DCBirth` | same | same `bit` | boolean |
| Eligibility | Torticollis … Feeding (9) | `DCTorticollis` … `DCFeeding` | **—** | **none** | dropped |
| Eligibility | NMNEI | `NMNEI` | inside `DCOtherDesc` | `DCOtherDesc` | adds/removes a line `NMNEI` |
| Eligibility | ASD / Suspected ASD / Vision / Hearing Diagnosis Date | `AutismDate` … `DeafDate` | same | same `date` | `''` → null |
| Eligibility | Other | `DCOtherDesc` | `DCOtherDesc` | `DCOtherDesc` | as typed |

## 3. Load (edit) mapping — column → form value

| DB column | Form value | Rule |
| --------- | ---------- | ---- |
| `Region` | `Region` | `Number(x ?? 0)` |
| `ReferralDate`, `InitialEvalDate`, `AutismDate` … | same | first 10 chars (`YYYY-MM-DD`) |
| `FormType` | `status` | as stored |
| `InitialMeetingDate` | `onePlanDate` | first 10 chars |
| `DelayFC` / `DelayNotFC` | `DelayReason` | `family::x` if `DelayFC` set, else `provider::x` |
| `MeetingDelayFC` / `MeetingDelayNC` | `MeetingDelayReason` | same |
| *(none)* | `DelayDetails`, `MeetingDelayDetails` | always `''` |
| `DCOtherDesc` | `DCOtherDesc`, `NMNEI` | `NMNEI` = any line equals "NMNEI" |
| `DD*`, `DC*` | same | `Boolean(x)` |

## 4. Read-only Client Information

| Label | Source | Shown today |
| ----- | ------ | ----------- |
| Child Last Name / First Name | `stblPeople.LastName` / `FirstName` | ✅ |
| SSN | `stblPeople.SS` | ✅ (unmasked) |
| DOB | `stblPeople.DOB` | ✅ `MM/DD/YYYY` |
| County | *(intended: client/referral county)* | ❌ always "—" |
| Region | *(intended: `stblReportingRegion.RName` for client region)* | ❌ always "—" |
| Referral Date (From Referral Form) | *(intended: `stblReferralForm.ReferralDate` / `ReReferralDate`)* | ❌ always "—" |
| Status | *(intended: client status)* | ❌ always "—" |

## 5. Columns → legacy consumers

✔ = read by the object. A column the new form never writes (marked ✗ in the last column) leaves that report blank or "Cleaning".

| Column | LoopAB | Base0701 (Ind. 7) | Ind. 1 | Ind. 7 rpt | Actives rpt | Form list / status | Written today |
| ------ | :----: | :---------------: | :----: | :--------: | :---------: | :----------------: | :-----------: |
| `ChildID` | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ | ✔ |
| `FormDate` | | | ✔ | ✔ | ✔ | ✔ | ✔ (today) |
| `FormType` | | | | | | ✔ (`= 'Active'`) | ✗ (`aop`) |
| `Region` | | | ✔ | ✔ | | | ✔ |
| `ReferralDate` | ✔ (= Referral) | ✔ (= Loop start) | | | ✔ | | ✔ (free entry) |
| `InterimDate` | | | ✔ | | ✔ | ✔ | ✗ |
| `InitialEvalDate` | | ✔ | | ✔ | ✔ | | ✔ |
| `EvalWithin45Days` | | ✔ | | | ✔ | | ✗ |
| `DelayFC` / `DelayNotFC` | | ✔ | | | ✔ | | ✔ |
| `DelayFCOther` / `DelayNotFCOther` | | ✔ | | | ✔ | | ✗ |
| `InitialMeetingDate` | ✔ | | ✔ | ✔ | ✔ | ✔ | ✔ |
| `MeetingWithin45Days` | | ✔ | | | ✔ | | ✗ |
| `MeetingDelay*` | | ✔ | | | ✔ | | partial (no Other) |
| `InitEval45*`, `InitMeeting45*`, `Both*` | | | | | ✔ | | ✗ |
| `CAPTA` | | | | | ✔ | | ✗ |
| `DD*`, `DC*`, `DCOtherDesc` | | | | | ✔ | | ✔ |
| `ConsentDate` | | | | | ✔ | | ✗ |
| SU / County / Town / Ethnicity / SvcCord* | | | | | ✔ | | ✗ |
