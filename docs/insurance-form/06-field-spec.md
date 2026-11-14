# 06 — Field Specification Table: Insurance Form

Every field on the Insurance Form screen. "Current" columns describe the form as built; **Recommended** lists changes suggested by this review (not implemented).

Edit: R = read only, E = editable. Req: Y = always, C = conditional (see Validation), N = optional.

---

## 1. Header and Client Information (read-only)

| # | Label | Control | Data type | Source | Edit | Display | Recommended |
| - | ----- | ------- | --------- | ------ | ---- | ------- | ----------- |
| H1 | New Insurance Form / Edit Insurance Form · Client ID: {id} | Modal title | text | mode, `ChildID` | R | — | — |
| H2 | New Insurance Form / Edit Insurance Form | Page heading | text | mode | R | — | Remove (duplicates H1, IF-GAP-09) |
| C1 | Child Last Name | Label | `nvarchar(50)` | `stblPeople.LastName` | R | `—` if empty | — |
| C2 | Child First Name | Label | `nvarchar(50)` | `stblPeople.FirstName` | R | `—` if empty | — |
| C3 | SSN | Label | text | `stblPeople.SS` | R | as stored | Mask `***-**-1234` (IF-GAP-10) |
| C4 | DOB | Label | date | `stblPeople.DOB` | R | `MM/DD/YYYY` | — |

## 2. Insurance Information

| # | Label | Control | Data type | Max len | Req | Default (new) | DB column | Validation & message | Recommended |
| - | ----- | ------- | --------- | ------- | --- | ------------- | --------- | -------------------- | ----------- |
| I1 | Date Completed | Date picker (min = DOB) | date | — | Y | empty | `FormDate` | Required: *"Date Completed is required."* Real date: *"Enter a valid date."* Not before DOB: *"Date Completed cannot be before Date of Birth."* | Default to today; reject future dates (IF-GAP-14) |
| I2 | Insurance Company Name | Text | text | 255 | C | empty | `BranchAddress` | Required for consent 1: *"Insurance Company Name is required for private insurance billing."* | — |
| I3 | Policy # | Text | text | 255 | N | empty | `PolicyNumber` | *"Use 255 characters or fewer."* | Limit to 20 (FITP width, IF-GAP-07) |
| I4 | Group # (Contract #) | Text | text | 255 | N | empty | `GroupNumber` | as I3 | Limit to 16 (FITP width, IF-GAP-07) |
| I5 | Group/Employer Name | Text | text | 255 | N | empty | `GroupName` | as I3 | — |
| I6 | Effective Date of Policy | Date picker | date | — | N | empty | `EffectiveDate` | *"Enter a valid date."* | — |
| I7 | End Date of Policy | Date picker (min = I6) | date | — | N | empty | `EndDate` | Not before I6: *"End Date of Policy cannot be before Effective Date of Policy."* | — |
| I8 | Individual Policy Holder | Text | text | 255 | N | empty | `PolicyHolder` | as I3 | — |

Layout: 3 columns on desktop (I2 spans two), 1 column on narrow screens.

## 3. Consent to Bill Insurance

| # | Label | Control | Data type | Req | Default (new) | DB column | Shown when | Validation & message | Recommended |
| - | ----- | ------- | --------- | --- | ------------- | --------- | ---------- | -------------------- | ----------- |
| B1 | I give permission for Children's Integrated Services – Part C Early Intervention to bill: | 3 option cards (radio) | int 1–3 | Y | none chosen | `BillingConsent` | always | *"Choose whether we may bill insurance."* | Confirm codes 1/2 (IF-GAP-04) |
| B2 | Parent or Guardian Signature Date | Date picker (min = DOB) | date | C | empty | `ParentSignatureDate` | B1 = 1 or 2 | *"Parent or Guardian Signature Date is required."*; not before DOB | — |
| B3 | I choose to deny permission for my private insurance to be billed because: | 4 option cards (radio), in the **Decline** sub-section | one of 4 bits | C | none chosen | `DeclineReasonCap` / `…Benefits` / `…Premium` / `…Eligibility` | B1 = 3 | *"Choose a reason."* | — |
| B4 | Parent or Guardian Signature Date | Date picker (min = DOB) | date | C | empty | `ParentSignatureDate2` | B1 = 3 | *"Parent or Guardian Signature Date is required."*; not before DOB | — |

Option wording (B1), from the API:

| Code | Wording |
| ---- | ------- |
| 1 | My private insurance for services provided to my child for Part C Early Intervention. I understand that information about my child's early intervention services may be shared in that process. |
| 2 | For services billed to Medicaid, I understand that information about my child's early intervention services may be shared in that process. |
| 3 | I decline permission for Children's Integrated Services – Part C Early Intervention to bill my private insurance for services provided to my child for Part C Early Intervention. |

## 4. Actions

| # | Label | Control | Behaviour |
| - | ----- | ------- | --------- |
| A1 | × | Icon button | Close without saving |
| A2 | Cancel | Button | Close without saving (no warning, IF-GAP-11) |
| A3 | Save | Button (green) | Validate → create / update → toast → reload history → close; *"Saving..."* while saving; disabled while saving |

## 5. Legacy fields not on the new screen

| Legacy label | Column | Why | Value on edit |
| ------------ | ------ | --- | ------------- |
| Ins. Co # (dropdown) | `InsCoNumber` | No longer used **[Decision]** | Kept |
| Coverage Code (dropdown) | `CoverageCode` | No longer used **[Decision]** | Kept |
| Phone | `Phone` | No longer used **[Decision]** | Kept |
| Name of Insurance Company (label only) | `InsuranceName` | Staff type the name into Branch Address | Kept |
| Lock (button) | — | Not built; to confirm (IF-GAP-05) | — |
