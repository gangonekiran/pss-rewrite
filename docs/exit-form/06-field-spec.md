# 06 — Field Specification Table: Exit Form

Every field on the Exit Form screen. "Current" columns describe the code at commit `a7916f6`; **Recommended** lists changes suggested by this review (not implemented).

Legend — **Req**: Y required · A required only when the child exits **at age 3** · P required for its exit path · N optional · — n/a. **Edit**: A always editable · R read-only.

---

## 1. Header and Client Information (read-only)

| # | Label | Control | Data type | Source | Edit | Display | Recommended |
| - | ----- | ------- | --------- | ------ | ---- | ------- | ----------- |
| H1 | New Exit Form / Edit Exit Form · Client ID: {id} | Modal title | text | mode, `ChildID` | R | — | — |
| H2 | New Exit Form / Edit Exit Form | Page heading | text | mode | R | — | Remove (duplicates H1, EF-GAP-12) |
| C1 | Child Last Name | Label | `nvarchar(50)` | `stblPeople.LastName` | R | `—` if empty | — |
| C2 | Child First Name | Label | `nvarchar(50)` | `stblPeople.FirstName` | R | `—` if empty | — |
| C3 | SSN | Label | `nvarchar(15)` | `stblPeople.SS` | R | as stored | Mask `***-**-1234` (EF-GAP-13) |
| C4 | DOB | Label | `datetime2` | `stblPeople.DOB` | R | `MM/DD/YYYY` | — |
| C5 | Region | Label | text | name of the Region selected in G1 | R | live | — |
| C6 | Referral Date (From Referral Form) | Label | date | Date of Referral typed in G2 | R | live, `MM/DD/YYYY` | Rename to "Date of Referral" or read the Referral form (EF-GAP-11) |

## 2. General Information

| # | Label | Control | Data type | Max len | Req | Default (new) | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | ------- | --- | ------------- | --------- | -------------------- | ----------- |
| G1 | Region | Select (active regions); placeholder "Select region" = 0 | `int` | — | **Y** | latest Active / Referral form, else client's region | `Region` | FE: > 0 — "Region is required." · BE: "Region must be selected" | BE: check the region exists |
| G2 | Date of Referral | Date | `datetime2(0)` | 10 | **Y** | latest Active / Referral form | `ReferralDate` | "Date of Referral is required."; ≥ DOB | BE: require it (EF-GAP-06) |
| G3 | Date of Exit | Date | `datetime2(0)` | 10 | **Y** | empty | `ExitDate` (+ `FormDate`) | "Date of Exit is required."; ≥ DOB; "Date of Exit cannot be before Date of Referral." | — |

## 3. Transition Information

Section description: "Required when the child exits at age 3." + " 3rd birthday: MM/DD/YYYY." when the DOB is known.

| # | Label | Control | Data type | Req | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | --- | --------- | -------------------- | ----------- |
| T1 | Date Written Transition Plan | Date | `datetime2(0)` | **A** | `TransitionPlanCompleted` | "Date Written Transition Plan is required." (at age 3); ≥ DOB; "… cannot be before Date of Referral."; "Cannot be after Date of Exit." | BE: require at age 3 |
| T2 | Transition Plan Delay Reason | Textarea (3 rows), placeholder "Family circumstance or provider circumstance, and details" | `nvarchar(max)` | N | `TransitionPlanReason` | none | Family / Provider select + details, so reports can classify it (EF-GAP-05) |
| T3 | LEA Notification Date | Date | `datetime2(0)` | **A** | `CLLEANotificationDate` | "LEA Notification Date is required." (at age 3); ≥ DOB; ≥ Date of Referral; ≤ Date of Exit | BE: require at age 3 |
| T4 | Date of Transition Conference | Date | `datetime2(0)` | **A** | `TransitionMeeting` | "Date of Transition Conference is required." (at age 3); ≥ DOB; ≤ Date of Exit | BE: require at age 3 |
| T5 | Days Between Referral and Transition Plan (Read Only) | Read-only number + "days" | int | — | — | `T1 − G2` | — |
| T6 | Days Between LEA Notification and Exit (Read Only) | Read-only number | int | — | — | `G3 − T3` | Derive `Notified90Days` if Indicator 8 still needs it (EF-GAP-04) |
| T7 | Days Between Transition Conference and Exit (Read Only) | Read-only number | int | — | — | `G3 − T4` | Derive `TransitionMeeting90day` (EF-GAP-04) |
| T8 | Days Between Exit and 3rd Birthday (Read Only) | Read-only number | int | — | — | 3rd birthday − `G3` (negative after the birthday) | — |
| — | *(removed)* Compliance indicators, LEA / conference Yes-No questions and reasons | — | `int` / `nvarchar(max)` | — | `Notified90Days`, `NotifiedReason`, `NotifyStatePartC`, `TransitionMeeting90day`, `NoTransitionMtgReason` | — | **[Decision]** removed; see EF-GAP-04 |

## 4. Exit Details

Section description: "Select the reason the child exited and where they were referred."

| # | Label | Control | Data type | Req | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | --- | --------- | -------------------- | ----------- |
| X1 | When did the child exit? | Radio: Prior to age 3 · At age 3 | UI only | **Y** | — (decides X2 / X4) | "Choose when the child exited." New forms: suggested from G3 and the 3rd birthday (at age 3 from 31 days before) | — |
| X2 | Reason for Exit — under "Child Exited this region PRIOR TO AGE 3 OR NON-EI Client: Please check one" | Radio ×8 (3 columns) | `int` | **P** | `ExitPriorToAge3` | "Select the reason for exit."; BE: code in list | Update annual exit reports for codes 7, 8 (EF-GAP-02) |
| X3 | Region Moved To | Text (shown for "Moved to other region") | `nvarchar(255)` | N | `MovedOtherRegion` | "Use 255 characters or fewer." | Region dropdown (EF-GAP-15) |
| X4 | Child Exited at Age 3 — under "Child Exited AT AGE 3" | Radio ×4 (2 columns) | `int` | **P** | `ExitAtAge3` | "Select an option."; BE: code in list | Ask the EXFNoPartB reasons for code 4, if still needed (EF-GAP-07) |
| X5 | Referred To — under "Referred to" | Radio ×6 (3 columns); shown once X1 is chosen | `int` | **A** | `ReferredTo` | "Select where the child was referred." (at age 3); BE: required for `ExitAtAge3 = 4` | BE: require at age 3 (EF-GAP-06) |

Option lists (from `GET /api/exit-forms/lookups/options`):

| Field | Options (code) |
| ----- | -------------- |
| X2 Reason for Exit | Non-EI Client Exit (7) · Referral to CIS-EI (8) · Development at appropriate level (1) · Moved to other region (2) · Moved out of state (3) · Withdrawn by parent or guardian (4) · Unable to contact (5) · Deceased (6) |
| X4 Child Exited at Age 3 | Child is potentially eligible for Part B services (1) · Child is potentially eligible for Part B services - child's family declined further service (2) · Child is thought to be eligible but potential eligibility not determined (3) · Child is NOT eligible for Part B (4) |
| X5 Referred To | Head Start (1) · Community-based Child Care Program or Preschool (2) · School based Pre-School Classroom (3) · Children's Integrated Services Coordinator (4) · Other (5) · Exited with no referral (99) |

## 5. Actions

| # | Label | Enabled | Behaviour | Messages |
| - | ----- | ------- | --------- | -------- |
| A1 | Cancel | not saving | Closes; changes discarded | — |
| A2 | Save | not saving | Validates (schema), then POST (new) or PUT (edit); refreshes history and closes | "Exit Form saved successfully." / "Exit Form updated successfully." / "Please fix the highlighted fields." / server message or "Failed to save Exit Form." · label "Saving..." while busy |
| A3 | × (modal) | always | Same as Cancel | — |
