# 07 — Entity-Relationship Diagram: Exit Form

Built from the `dbCDD` DDL (2026-09-09), checked against the local database. Solid lines are **physical FKs**; dashed lines are **logical** relationships (used by queries, not enforced by the database).

`stblExitForm` has 45 columns. The diagrams show the key and referencing columns only; see [04-data-dictionary.md](04-data-dictionary.md) for every column, grouped as: header (6), location / coordinator / referral (11), COSF questions (6), exit date and transition (10), exit reason and referral (7), audit (5).

---

## 1a. Core: the form, its client and the forms it's prefilled from

```mermaid
erDiagram
  stblPeople ||--o{ stblExitForm : "FK ChildID (cascade)"
  stblPeople ||--o{ stblActiveForm : "FK ChildID (cascade)"
  stblPeople ||--o{ stblReferralForm : "FK ChildID (cascade)"
  stblActiveForm }o..o{ stblExitForm : "prefill Region, ReferralDate"
  stblReferralForm }o..o{ stblExitForm : "prefill fallback"

  stblPeople {
    int ChildID PK
    nvarchar LastName
    nvarchar FirstName
    nvarchar SS
    datetime2 DOB
    int Region
  }

  stblActiveForm {
    int ID PK
    int ChildID FK
    datetime2 FormDate
    int Region
    datetime2 ReferralDate
  }

  stblReferralForm {
    int ID PK
    int ChildID FK
    datetime2 FormDate
    int Region
    datetime2 ReferralDate
    datetime2 ReReferralDate
  }

  stblExitForm {
    int ID PK
    int ChildID FK
    datetime2 FormDate "= ExitDate"
    nvarchar FormType "12, always Exit"
    int Region
    datetime2 ReferralDate
    datetime2 ExitDate
    datetime2 TransitionPlanCompleted
    nvarchar TransitionPlanReason
    datetime2 CLLEANotificationDate
    datetime2 TransitionMeeting
    int ExitPriorToAge3 "0 = exited at age 3"
    nvarchar MovedOtherRegion
    int ExitAtAge3 "0 = exited prior to age 3"
    int ReferredTo
    nvarchar more_columns "30 more - see Data Dictionary"
  }
```

## 1b. Lookups and code lists referenced by the form

Only the referencing columns of `stblExitForm` are shown. The three exit code lists have **no table** in `dbCDD`; they live in the backend config.

```mermaid
erDiagram
  stblReportingRegion ||..o{ stblExitForm : "Region"
  slstSU ||..o{ stblExitForm : "SU_id"
  slstTownCodes ||..o{ stblExitForm : "Town"
  slstCounties ||..o{ stblExitForm : "CountyCode"
  slstSvcCordType ||..o{ stblExitForm : "SvcCordType"
  slstFormNames ||..o{ stblExitForm : "FormType"
  ExitCodeLists ||..o{ stblExitForm : "exit codes"
  slstAnnualExitReasons ||..o{ stblExitForm : "report order"
  slstSU ||--o{ slstTownCodes : "FK SU_id"

  stblExitForm {
    int ID PK
    nvarchar FormType
    int Region
    int SU_id
    nvarchar Town
    nvarchar CountyCode
    int SvcCordType
    int ExitPriorToAge3
    int ExitAtAge3
    int ReferredTo
  }

  stblReportingRegion {
    int ID PK
    nvarchar RName
    bit Inactive
  }

  slstSU {
    int SU_id PK
    nvarchar SUName
  }

  slstTownCodes {
    nvarchar Town PK "5"
    nvarchar TownName
    int SU_id FK
    nvarchar CountyCode
  }

  slstCounties {
    nvarchar CountyCode PK
    nvarchar CountyName
  }

  slstSvcCordType {
    int SvcCordType PK
    nvarchar SvcCordTypeDesc
  }

  slstFormNames {
    int Sort PK
    nvarchar FormName
  }

  ExitCodeLists {
    int code "exit-form.config.ts"
    string label
  }

  slstAnnualExitReasons {
    int ID PK
    nvarchar Reason
  }
```

## 2. Relationship catalogue

| # | Parent | Child | Join | Physical FK | On delete | Notes |
| - | ------ | ----- | ---- | ----------- | --------- | ----- |
| R1 | `stblPeople` | `stblExitForm` | `ChildID` | `stblExitForm$stblPeoplestblExitForm` (`WITH NOCHECK`) | **Cascade** | Deleting a client deletes its Exit Forms |
| R2 | `stblActiveForm` | `stblExitForm` | `ChildID`, latest by `FormDate` | No | — | Prefill of `Region` and `ReferralDate` for a new form |
| R3 | `stblReferralForm` | `stblExitForm` | `ChildID`, latest by re-referral / referral date | No | — | Prefill fallback |
| R4 | `stblReportingRegion` | `stblExitForm` | `Region = ID` | No | — | UI picks from active regions |
| R5 | `slstSU` | `stblExitForm` | `SU_id` | No | — | Not on the screen **[Decision]** |
| R6 | `slstTownCodes` | `stblExitForm` | `Town` | No | — | Form column `nvarchar(3)`, lookup key `nvarchar(5)` |
| R7 | `slstCounties` | `stblExitForm` | `CountyCode` | No | — | Not on the screen |
| R8 | `slstSvcCordType` | `stblExitForm` | `SvcCordType` | No | — | Not on the screen |
| R9 | `slstFormNames` | `stblExitForm` | `FormType = FormName` (text) | No | — | Always `'Exit'`, so it matches |
| R10 | *(config)* code lists | `stblExitForm` | `ExitPriorToAge3`, `ExitAtAge3`, `ReferredTo` | No | — | No table; values checked by the backend |
| R11 | `slstAnnualExitReasons` | `stblExitForm` | reports map codes to `ID` with `Choose(...)` | No | — | Codes 7 and 8 have no mapping (EF-GAP-02) |
| R12 | `slstSU` | `slstTownCodes` | `SU_id` | `slstTownCodes$slstSUslstTownCodes` | No action | Only FK among the lookups |

## 3. Notes for the DBA

1. The only enforced relationship is R1 (cascade), and it was created `WITH NOCHECK`, so SQL Server doesn't trust it for query plans. Re-enable it `WITH CHECK` after confirming there are no orphans.
2. No index on `stblExitForm.ChildID`; the client lookup (`WHERE ChildID = …`), the Input Forms history and the cascade delete scan the table.
3. The exit code lists exist only in code and in column descriptions. A lookup table (`slstExitReasonPriorToAge3`, `slstExitAtAge3`, `slstReferredTo`) would let reports join instead of hard-coding `Choose(...)` mappings.
