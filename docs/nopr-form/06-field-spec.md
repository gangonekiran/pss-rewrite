# 06 — Field Specification Table: NOPR Form

Every field on the NOPR Form screen. "Current" columns describe the form as built; **Recommended** lists changes suggested by this review (not implemented).

Edit: R = read only, E = editable. Req: Y = always, N = optional.

---

## 1. Header and Client Information (read-only)

| # | Label | Control | Data type | Source | Edit | Display | Recommended |
| - | ----- | ------- | --------- | ------ | ---- | ------- | ----------- |
| H1 | New NOPR Form / Edit NOPR Form · Client ID: {id} | Modal title | text | mode, `ChildID` | R | — | — |
| H2 | New / Edit No One Plan Resulting Form | Page heading | text | mode | R | — | Remove (duplicates H1, NOPR-GAP-04) |
| C1 | Child Last Name | Label | `nvarchar(50)` | `stblPeople.LastName` | R | `—` if empty | — |
| C2 | Child First Name | Label | `nvarchar(50)` | `stblPeople.FirstName` | R | `—` if empty | — |
| C3 | SSN | Label | text | `stblPeople.SS` | R | as stored | Mask `***-**-1234` (NOPR-GAP-04) |
| C4 | DOB | Label | date | `stblPeople.DOB` | R | `MM/DD/YYYY` | — |
| C5 | Region | Label | text | region chosen in G1 | R | region name, `—` if none | — |
| C6 | Referral Date (From Referral Form) | Label | date | latest `ReferralDate` / `ReReferralDate` | R | `MM/DD/YYYY`, `—` if none | — |

## 2. General Information

| # | Label | Control | Data type | Req | Default (new) | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | --- | ------------- | --------- | -------------------- | ----------- |
| G1 | Region | Dropdown (regions) | int | Y | latest Active form → latest Referral form → client | `Region` | *"Region is required."* | Confirm the field is still needed (open question 2) |

## 3. Status: Referred with No One Plan Resulting for Early Intervention Services

| # | Label | Control | Data type | Req | Default (new) | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | --- | ------------- | --------- | -------------------- | ----------- |
| S1 | Reason | 7 option cards (radio), 2 columns | int (8, 1–6; 7 on older forms) | Y | none chosen | `RefStatus` | *"Select the reason a plan was not created."* | Add a lookup table / update the column description for code 8 (NOPR-GAP-10) |
| S2 | Date of Initial Evaluation | Date picker (min = DOB, max = S3) | date | N | empty | `InitialEvalDate` 🆕 | Real date: *"Enter a valid date."* Not before DOB: *"Date of Initial Evaluation cannot be before Date of Birth."* Not after S3: *"Cannot be after the date the status was determined."* | — |
| S3 | Date above status was determined | Date picker (min = most recent referral date, else DOB) | date | Y | empty | `StatusDate` (+ `FormDate`) | Required: *"Date above status was determined is required."* Real date. Not before DOB: *"… cannot be before Date of Birth."* Not before the most recent referral: *"Cannot be before the most recent referral date (MM/DD/YYYY)."* | Reject future dates (NOPR-GAP-06) |
| S4 | *(note)* The date above status was determined is used by HP Enterprises (FITP) to turn off the Early Intervention voucher. | Text | — | — | — | — | — | — |

Hints under the dates (shown when there is no error): S2 *"Optional. Cannot be after the date the status was determined."*; S3 *"Cannot be before the most recent referral date (MM/DD/YYYY)."* (only when the child has a referral).

Reason labels (S1), in display order:

| Order | Code | Label |
| ----- | ---- | ----- |
| 1 | 8 | Initial Contact Not Made |
| 2 | 1 | Initial visit made - Screening/evaluation declined |
| 3 | 2 | Screened - No further evaluation needed |
| 4 | 3 | Further Evaluation Declined by Family - Eligibility Not Determined |
| 5 | 4 | Evaluated - Not Eligible |
| 6 | 5 | Eligible - Services Declined by Family |
| 7 | 6 | Moved or Lost Contact |
| (8) | 7 | Turned 3 during evaluation process (no longer used) — only on a form that already has it |

Layout: dates 3 per row on desktop, 1 on narrow screens; reasons 2 per row on desktop.

## 4. Actions

| # | Label | Control | Behaviour |
| - | ----- | ------- | --------- |
| A1 | × | Icon button | Close without saving |
| A2 | Cancel | Button | Close without saving (no warning, NOPR-GAP-05); disabled while saving |
| A3 | Save | Button (green) | Validate → create / update → toast → reload history → close; *"Saving..."* and disabled while saving |

## 5. Legacy fields not on the new screen

| Legacy label | Column | Why | Value on edit |
| ------------ | ------ | --- | ------------- |
| Month Reporting | `MonthReporting` | Removed **[Request]** (as on the Exit Form) | Kept |
| Periodic Screening | `Screening` | Removed **[Request]** | Kept |
| Referred back to CIS Intake Team | `ReferredBack` | Removed **[Request]** | Kept |
| Turned 3 during evaluation process (reason 7) | `RefStatus = 7` | Retired **[Request]** | Kept and shown on forms that have it |
| Lock (button) | — | Not built; to confirm (NOPR-GAP-13) | — |
