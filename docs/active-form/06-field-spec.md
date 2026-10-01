# 06 — Field Specification Table: Active Form

Every field on the Active Form screen. "Current" columns describe the code today; **Recommended** lists changes suggested by this review (not implemented).

Legend — **Req**: Y required · N optional · — n/a. **Edit**: A always editable · R read-only.

---

## 1. Header and Client Information (read-only)

| # | Label | Control | Data type | Source | Edit | Display | Recommended |
| - | ----- | ------- | --------- | ------ | ---- | ------- | ----------- |
| H1 | Active Form / Client ID: {id} | Modal title | text | `ChildID` | R | — | — |
| H2 | New Active Form / Edit Active Form | Heading | text | mode | R | — | — |
| C1 | Child Last Name | Label | `nvarchar(50)` | `stblPeople.LastName` | R | `—` if empty | — |
| C2 | Child First Name | Label | `nvarchar(50)` | `stblPeople.FirstName` | R | `—` if empty | — |
| C3 | SSN | Label | `nvarchar(15)` | `stblPeople.SS` | R | as stored | Mask `***-**-1234` |
| C4 | DOB | Label | `datetime2` | `stblPeople.DOB` | R | `MM/DD/YYYY` | — |
| C5 | County | Label | text | not supplied | R | always `—` | Show the client's county |
| C6 | Region | Label | text | not supplied | R | always `—` | Show `RName` of client region |
| C7 | Referral Date (From Referral Form) | Label | date | not supplied | R | always `—` | Load from latest `stblReferralForm` |
| C8 | Status | Label | text | not supplied | R | always `—` | Show client status |

## 2. General Information

| # | Label | Control | Data type | Max len | Req | Default (new) | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | ------- | --- | ------------- | --------- | -------------------- | ----------- |
| G1 | Region | Select (active regions) | `int` | — | **Y** | client's region | `Region` | FE: > 0 — "Region is required." BE: only rejects `''` | BE: require and validate the ID |
| G2 | Date of Referral | Date | `datetime2(0)` | 10 | **Y** | empty | `ReferralDate` | "Referral date is required."; ≥ DOB ("Referral Date cannot be before Date of Birth.") | Default from the Referral form; read-only or warn on mismatch (AF-GAP-05) |
| G3 | Status | Select: Active One Plan (`aop`), Active One Plan – CAPTA (`aop-capta`) | `nvarchar(12)` | 12 | **Y** | empty | `FormType` | "Status is required." | Save `FormType = 'Active'` and `CAPTA = -1/0` (AF-GAP-03) |

## 3. Initial Evaluation / Assessment

| # | Label | Control | Data type | Req | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | --- | --------- | -------------------- | ----------- |
| E1 | Date of Initial Evaluation / Assessment | Date (min = later of Referral, DOB) | `datetime2(0)` | **Y** (schema) | `InitialEvalDate` | "Initial evaluation date is required."; "Initial evaluation cannot be before referral date."; ≥ DOB | Show `*`; BE: check ≥ referral |
| E2 | Days Between Referral and Initial Evaluation (Read Only) | Read-only number + "days" | int | — | — | `E1 − G2` in days | Store `EvalWithin45Days = -1` if ≤ 45 else `0`; set `InitEval45*` |
| E3 | Reason for Delay | Select with groups "1. Due to family and/or child circumstances" / "2. NOT due to family and/or child circumstances (non-compliant)"; placeholder "Select one reason (optional)" | `nvarchar(50)` | N | `DelayFC` or `DelayNotFC` | — | Require a reason when E2 > 45 |
| E4 | Other reasons – details | Textarea (3 rows), hint "No character limit." | `nvarchar(max)` | N | **not saved** (should be `DelayFCOther` / `DelayNotFCOther`) | — | Map and save (AF-GAP-01); require when the reason is "Other reasons" |

Family list = `slstActiveDelayFC` + **"Auto Eligible"** (initial evaluation only). Provider list = `slstActiveDelayNFC`.

## 4. One Plan

| # | Label | Control | Data type | Req | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | --- | --------- | -------------------- | ----------- |
| P1 | Date of One Plan | Date (min = later of Referral, DOB) | `datetime2(0)` | **Y** (schema) | `InitialMeetingDate` | "One Plan date is required."; "One Plan date cannot be before referral date."; ≥ DOB | Show `*`; also ≥ E1 |
| P2 | Days Between Referral and One Plan (Read Only) | Read-only number | int | — | — | `P1 − G2` | Store `MeetingWithin45Days`, `InitMeeting45*`, `Both*` |
| P3 | Reason for Delay | Select (same groups, no "Auto Eligible") | `nvarchar(50)` | N | `MeetingDelayFC` or `MeetingDelayNC` | — | Require when P2 > 45 |
| P4 | Other reasons – details | Textarea | `nvarchar(max)` | N | **not saved** (should be `MeetingDelayFCOther` / `MeetingDelayNCOther`) | — | Map and save |
| — | *(missing)* Interim One Plan date | — | `datetime2(0)` | — | `InterimDate` | — | Add field (AF-GAP-09) |
| — | *(missing)* Parental consent date | — | `datetime2(0)` | — | `ConsentDate` | — | Add field |

## 5. Eligibility ("Select all that apply.")

| # | Label | Control | DB column | Saved? |
| - | ----- | ------- | --------- | ------ |
| L1 | All developmental delays | Checkbox | `DDAll` | ✅ |
| L2 | Adaptive | Checkbox | `DDAdaptive` | ✅ |
| L3 | Cognitive | Checkbox | `DDCognitive` | ✅ |
| L4 | Communication (speech/lang) | Checkbox | `DDCommunication` | ✅ |
| L5 | Motor | Checkbox | `DDMotor` | ✅ |
| L6 | Social/emotional | Checkbox | `DDSocial` | ✅ |
| L7 | Attachment disorder | Checkbox | `DCAttachment` | ✅ |
| L8 | Autism/PDD | Checkbox | `DCAutism` | ✅ |
| L9 | Suspected Autism | Checkbox | `DCSuspected` | ✅ |
| L10 | Blind/Visually Impaired | Checkbox | `DCBlind` | ✅ |
| L11 | Deaf/Hard of Hearing | Checkbox | `DCDeaf` | ✅ |
| L12 | Down Syndrome | Checkbox | `DCDown` | ✅ |
| L13 | Cerebral Palsy | Checkbox | `DCCerebral` | ✅ |
| L14 | Craniofacial Disorder | Checkbox | `DCCraniofacial` | ✅ |
| L15 | Medically Fragile | Checkbox | `DCFragile` | ✅ |
| L16 | Oral Motor/Swallowing | Checkbox | `DCOral` | ✅ |
| L17 | Severe Complications at Birth | Checkbox | `DCBirth` | ✅ |
| L18–L26 | Torticollis · Plagiocephaly · Prematurity · Behavior · Nutrition · Neonatal Abstinence Syndrome (NAS) · Cystic Fibrosis · Hypoxic-Ischemic Encephalopathy (HIE) · Feeding | Checkbox | **none** | ❌ dropped (AF-GAP-02) — add columns or a condition table |
| L27 | NMNEI | Checkbox | line in `DCOtherDesc` | ⚠ as text (AF-GAP-10) |

| # | Label | Control | Data type | Req | DB column | Validation | Recommended |
| - | ----- | ------- | --------- | --- | --------- | ---------- | ----------- |
| L28 | ASD Diagnosis Date | Date (min DOB) | `date` | N | `AutismDate` | ≥ DOB (FE) | Enable only when Autism/PDD is ticked |
| L29 | Suspected ASD Diagnosis Date | Date | `date` | N | `SuspectedDate` | ≥ DOB | Tie to Suspected Autism |
| L30 | Vision Diagnosis Date | Date | `date` | N | `BlindDate` | ≥ DOB | Tie to Blind/VI |
| L31 | Hearing Diagnosis Date | Date | `date` | N | `DeafDate` | ≥ DOB | Tie to Deaf/HoH |
| L32 | Other | Textarea (4 rows), placeholder "Enter specific diagnosis or other details...", hint "No character limit." | `nvarchar(255)` | N | `DCOtherDesc` | none | `maxLength=255` and fix the hint (AF-GAP-12); set `DCOther` when filled |

## 6. Actions

| # | Label | Enabled | Behaviour | Messages |
| - | ----- | ------- | --------- | -------- |
| A1 | Cancel | not saving | Closes; changes discarded | — |
| A2 | Save | not saving | Validates (schema + DOB/referral rules), then POST (new) or PUT (edit); refreshes history and closes | "Active Form saved successfully." / "Active Form updated successfully." / server message or "Failed to save Active Form." · label "Saving..." while busy |
| A3 | × (modal) | always | Same as Cancel | — |
