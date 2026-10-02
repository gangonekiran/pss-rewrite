# 06 — Field Specification Table

Per-field specification for every user-facing field in the Client feature. "Current" columns describe the code as it is; the **Recommended** column lists changes suggested by this review (not implemented).

Legend — **Req**: Y required · N optional · — n/a. **Edit**: L = editable only when unlocked · A = always editable · R = read-only.

---

## 1. Client Lookup panel (left)

| # | Label      | Control                    | Data type | Max len | Format / mask | Req | Edit | Default | Source / target | Behaviour | Recommended |
| - | ---------- | -------------------------- | --------- | ------- | ------------- | --- | ---- | ------- | --------------- | --------- | ----------- |
| L1 | First Name | Searchable select + → button | string  | 100 (bind) | — | N | A | empty | `GET /search/firstname` | Starts-with, top 20, label "First Last"; → loads client | Debounce ~300 ms; minimum 1–2 chars |
| L2 | Last Name  | Searchable select + → button | string  | 100 (bind) | — | N | A | empty | `GET /search/lastname`  | Starts-with, top 20 | Debounce |
| L3 | DOB        | Date input + disabled → | date    | 10 | `YYYY-MM-DD` (native picker) | N | **A** | client DOB | `client.dob` | Edits the loaded client's DOB even when locked; × clears | Make it a search-only field (own state) or disable when locked |
| L4 | SSN        | Searchable select + → button | string  | 20 (bind) | — | N | A | empty | `GET /search/ssn` | Contains, top 20, label = SSN | Mask in results (`***-**-1234`) |

## 2. Client details panel (right)

| # | Label      | Control            | Data type | Max len (UI / DB) | Format / allowed values | Req | Edit | Default (new) | DB column | Validation & messages | Recommended |
| - | ---------- | ------------------ | --------- | -------------------------- | ----------------------- | --- | ---- | ------------- | --------- | --------------------- | ----------- |
| D1 | Client ID | Label             | integer   | — / int | Shows `New` when empty | — | R | `New` | `ChildID` | — | Show new ID after create |
| D2 | Last Name | Text input        | string    | none / 50 | Trimmed | **Y** | L | `''` | `LastName` | FE: "Last Name is required." BE (update): "LastName is required" | Add `maxLength={50}`; BE check on create |
| D3 | Gender    | Select            | `nvarchar(1)` | — / 1 | UI: `''` Select · `M` Male · `F` Female. DB also documents `U` Unknown | N | L | `''` | `Gender` | — | Add `U` (Unknown) option |
| D4 | First Name | Text input       | string    | none / 50 | Trimmed | **Y** | L | `''` | `FirstName` | FE: "First Name is required." BE (update): "FirstName is required" | Add `maxLength={50}` |
| D5 | SS#       | Text input        | `nvarchar(15)` | **10** / 15 | Free text | N | L | `''` | `SS` | — | Store **9 digits** (FITP extract uses `LEFT(SS, 9)`); display/input mask `###-##-####` and strip dashes before saving; reject non-digits |
| D6 | Region    | Searchable select | `int`     | — / int | Active regions (`stblReportingRegion`, `Inactive = 0`); label `RName` | N | L | `0` (no selection) | `Region` | None (DB has no FK, accepts `0`) | Default `undefined` → NULL; validate the ID exists server-side; decide if required |
| D7 | Birth Date | Date input       | date      | 10 | `YYYY-MM-DD` | N | L | `''` | `DOB` | Create: invalid → NULL. Update: invalid → 500 | Disallow future dates; consistent conversion |
| D8 | Age       | Computed label    | integer   | — | Whole years; `--` if no DOB | — | R | `--` | — (from `DOB`) | — | Parse DOB as local date |
| D9 | Non-EI    | Checkbox          | boolean   | — / bit | Checked = not an Early Intervention client | N | L | unchecked | `NonEarlyIntervention` | — | — |
| D10 | *(hidden)* SS Temp | none   | `bit` default 0 | — / bit | "Yes = Temporary SS#, No = SS#" | N | — | `false` | `SSTemp` | — | Expose as a "Temporary SSN" checkbox next to SS# |

## 3. Action buttons

| # | Label          | Enabled when                 | Confirmation | Success | Failure |
| - | -------------- | ---------------------------- | ------------ | ------- | ------- |
| A1 | Unlock / Lock | Always                      | — | Toggles lock | — |
| A2 | Delete Client | Client loaded **and** unlocked | "Are you sure you want to delete this client?" | Toast "Client deleted successfully."; form reset; locked | Toast "Failed to delete client." |
| A3 | Add New Client | Always                     | — (no unsaved-changes warning) | Form reset; unlocked | — |
| A4 | Done          | Unlocked                     | — | Toast "Client created/updated successfully"; locked | Toast with validation message or "Failed to save client." |

## 4. Client Status tab

| # | Label            | Control      | Data type | Format | Edit | Default | Source | Notes |
| - | ---------------- | ------------ | --------- | ------ | ---- | ------- | ------ | ----- |
| S1 | Client Status On | Date input  | date      | `YYYY-MM-DD` | A | Today (local) | query `date` | Change triggers reload |
| S2 | Go              | Button       | — | — | enabled when client loaded and not loading | — | — | Label "Loading..." while busy |
| S3 | Today           | Button       | — | — | enabled when client loaded | — | — | Resets S1 to today |
| S4 | Status          | Label        | string    | Raw `FormType`; `—` if none | R | — | `status` | Green if `active`, red if `inactive` |
| S5 | Referral Date   | Label        | date      | `M/D/YYYY` (en-US); `—` if none | R | — | `referralDate` | |
| S6 | No One Plan Date | Label       | date      | same | R | — | `noOnePlanDate` | |
| S7 | Interim Date    | Label        | date      | same | R | — | `interimDate` | |
| S8 | One Plan Date   | Label        | date      | same | R | — | `onePlanDate` | |
| S9 | Exit Date       | Label        | date      | same | R | — | `exitDate` | |
| S10 | Notes          | Textarea (min 260 px) | `nvarchar(max)` | Placeholder "Enter notes here..." | L | `stblPeople.Notes` | `client.notes` | Saved only by **Done** with the rest of the client (`PUT` existing / `POST` new). Read-only when locked. No separate Save Notes button. |

### Service History table

| # | Column    | Data type | Format | Source | Display |
| - | --------- | --------- | ------ | ------ | ------- |
| H1 | Date     | date      | Raw ISO string | `FormDate` | Recommend `M/D/YYYY` to match status panel |
| H2 | Service  | string    | — | `SvcName` | |
| H3 | Freq.    | string    | — | `Frequency` | |
| H4 | Consent  | enum      | `Yes` / `Pending` | derived | Badge: Yes green, Pending yellow, other red |
| H5 | Case Plan | string   | — | placeholder | Badge: `Open` blue, other grey |

Empty state: "No service history available." Fixed height 250 px, scrolls.

Source should be `stblServices`, not the warehouse `Services` table; see [Table Mapping §5.1](05-table-mapping.md#51-service-history--legacy-mapping-getservicehistory_rpt) for the proposed column mapping (Freq. → `HowLong`, Consent → grid `ConsentDate`, Case Plan → `OutcomeStatus` label — to be confirmed).

## 5. Input Forms tab

### History grid

| # | Column     | Data type | Format | Notes |
| - | ---------- | --------- | ------ | ----- |
| F1 | Date      | date      | `M/D/YYYY`; `–` if null | |
| F2 | Form Type | string    | Coloured; Active codes shown as "Active" | |
| F3 | Referral  | date      | `M/D/YYYY` | |
| F4 | NOPR      | date      | `M/D/YYYY` | |
| F5 | interim   | date      | `M/D/YYYY` | Header is lower-case in UI |
| F6 | OP        | date      | `M/D/YYYY` | |
| F7 | Exit      | date      | `M/D/YYYY` | |
| F8 | Loop Error | boolean  | red `X` / `–` | Always `–` today |
| F9 | View/Edit | link      | — | Opens form editor |
| F10 | Delete   | link      | — | Confirm, then delete |

States: "Loading input forms...", "Unable to load input forms.", "No input forms available.", "Select a client to view input forms."

### Add New Form panel

| # | Control | Behaviour |
| - | ------- | --------- |
| P1 | Check-all checkbox | Shows/hides every form type |
| P2 | Form button × 7 (Active, COS, Exit, Insurance, No One Plan, Referral, Service Grid) | Opens the matching editor in "Add New" mode |
| P3 | Per-form checkbox × 7 | Shows/hides that form type in the grid |

### Generic form editor (Exit, Insurance, No One Plan, Referral, Service Grid)

| # | Label     | Control    | Data type | Req | Default | Payload key | Notes |
| - | --------- | ---------- | --------- | --- | ------- | ----------- | ----- |
| E1 | Form Date | Date input | date     | **Y** | existing date or empty | `FormDate` | "Form Date is required." |
| E2 | Form Type | Text input | `nvarchar(12)` | N | existing type or form label | `FormType` | Free text; anything over 12 characters fails on save. Should be read-only and fixed to the DB default for the form (`Referral`, `Exit`, …) |
| E3 | Region    | Text input | string   | N | empty (not loaded on edit) | `Region` | Recommend the same region select as D6 |
| — | *(hidden)* | — | — | — | `SYSTEM` | `InsertUser` | |

Buttons: Cancel, Save ("Saving..." while busy). Error: "Unable to save the form."
