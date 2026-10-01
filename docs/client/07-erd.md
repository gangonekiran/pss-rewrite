# 07 — Entity-Relationship Diagram

Built from the `dbCDD` DDL (2026-09-09). Solid relationship lines are **physical FKs** (all `ON UPDATE CASCADE ON DELETE CASCADE`, created `WITH NOCHECK`). Relationships marked *logical* exist only in queries; the DB doesn't enforce them.

Form tables show only the columns this module uses.

---

## 1. Client module ERD

```mermaid
erDiagram
  stblReportingRegion ||..o{ stblPeople : "Region (logical, no FK)"
  stblPeople ||--o{ stblReferralForm : "FK cascade"
  stblPeople ||--o{ stblActiveForm : "FK cascade"
  stblPeople ||--o{ stblNoOnePlanForm : "FK cascade"
  stblPeople ||--o{ stblExitForm : "FK cascade"
  stblPeople ||--o{ stblCOSCoverForm : "FK cascade"
  stblPeople ||--o{ stblServiceGridForm : "FK cascade"
  stblPeople ||--o{ stblInsuranceForm : "FK cascade"
  stblServiceGridForm ||--o{ stblServices : "FK cascade"
  stblCOSCoverForm ||--o{ stblCOSCoverSource : "FK cascade"
  stblCOSCoverForm ||--o{ stblCOSCoverTeam : "FK cascade"
  slstServiceNames ||..o{ stblServices : "SvcCode (logical)"
  stblPeople ||..o| stblLoopErrors : "ChildID (logical)"
  stblPeople ||..o{ stblAudit : "ChildID (logical)"
  slstFormNames ||..o{ stblActiveForm : "FormType = FormName (logical)"

  stblPeople {
    int ChildID PK "identity"
    int Region "no FK"
    nvarchar LastName "50, CHECK len>0"
    nvarchar FirstName "50, CHECK len>0"
    nvarchar SS "15, PII"
    bit SSTemp "default 0"
    datetime2 DOB
    nvarchar Gender "1: M F U"
    nvarchar Notes "max"
    timestamp SSMA_TimeStamp
    bit NonEarlyIntervention "NN default 0"
  }

  stblReportingRegion {
    int ID PK
    nvarchar RName "255"
    nvarchar Description "255"
    bit Inactive "default 0"
  }

  stblReferralForm {
    int ID PK
    int ChildID FK
    datetime2 FormDate
    nvarchar FormType "Referral"
    datetime2 ReferralDate
    datetime2 ReReferralDate
    bit NonEarlyIntervention
  }

  stblActiveForm {
    int ID PK
    int ChildID FK
    datetime2 FormDate
    nvarchar FormType "Active"
    datetime2 ReferralDate
    datetime2 InterimDate
    datetime2 InitialMeetingDate "OP date"
    datetime2 ConsentDate
  }

  stblNoOnePlanForm {
    int ID PK
    int ChildID FK
    datetime2 FormDate
    nvarchar FormType "No One Plan"
    datetime2 StatusDate "NOPR date"
    int RefStatus
  }

  stblExitForm {
    int ID PK
    int ChildID FK
    datetime2 FormDate
    nvarchar FormType "Exit"
    datetime2 ExitDate
    int ExitPriorToAge3
    int ExitAtAge3
  }

  stblCOSCoverForm {
    int COSCoverID PK
    int ChildID FK
    datetime2 FormDate
    nvarchar FormType "COS"
    datetime2 OnePlanDate
    datetime2 ExitDate
    int EntryOrExit "-1 entry, 0 exit"
  }

  stblServiceGridForm {
    int ServiceGridID PK
    int ChildID FK
    datetime2 FormDate
    nvarchar FormType "Service Grid"
    datetime2 ConsentDate
  }

  stblInsuranceForm {
    int ID PK
    int ChildID FK
    datetime2 FormDate
    nvarchar FormType "Insurance"
  }

  stblServices {
    int ID PK
    int ServiceGridID FK
    nvarchar SvcCode
    int OutcomeStatus
    nvarchar HowLong
    datetime2 ActualStartDate
    datetime2 EndDate
  }

  stblCOSCoverSource {
    int ID PK
    int COSCoverID FK
  }

  stblCOSCoverTeam {
    int ID PK
    int COSCoverID FK
  }

  slstServiceNames {
    int SvcNameID PK
    nvarchar SvcCode "not unique"
    nvarchar SvcName
    int SortOrder
  }

  slstFormNames {
    int Sort PK "sequence"
    nvarchar FormName
  }

  stblLoopErrors {
    int ChildID PK
    nvarchar CName
    datetime2 QDate
  }

  stblAudit {
    int ID PK
    int ChildID
    nvarchar SS "20"
  }
```

## 2. Warehouse tables touched by the rewrite

The current service-history query reads `Services`, which belongs to the reporting warehouse, not to the operational schema (BR-GAP-20).

```mermaid
erDiagram
  stblPeople ||..o{ Loops : "ChildId (logical)"
  Loops ||..o{ Services : "LoopId (logical)"
  stblServiceGridForm ||..o{ Services : "ServiceGridId (logical)"
  slstServiceNames ||..o{ Services : "SvcCode (logical)"

  Loops {
    int LoopId PK
    int ChildId
    nvarchar Loop "A B C D"
    datetime2 StartDate
    datetime2 InitialOPDate
    datetime2 NOPR
    datetime2 EndDate
    nvarchar ChildNameLast "copy"
    nvarchar ChildNameFirst "copy"
    nvarchar ChildSSN "copy"
  }

  Services {
    int ServiceID PK
    int ID "nullable copy of stblServices.ID"
    int ServiceGridId
    int LoopId
    nvarchar SvcCode
    nvarchar Frequency
    datetime2 ConsentDate
  }
```

## 3. Relationship catalogue

| # | Parent (1) | Child (many) | Join | Physical FK | On delete | Used in |
| - | ---------- | ------------ | ---- | ----------- | --------- | ------- |
| R1 | `stblReportingRegion` | `stblPeople` | `Region = ID` | **No** | — | Region dropdown |
| R2 | `stblPeople` | `stblReferralForm` | `ChildID` | `stblReferralForm$stblPeoplestblReferralForm` | Cascade | Status, history |
| R3 | `stblPeople` | `stblActiveForm` | `ChildID` | `stblActiveForm$stblPeoplestblActiveForm` | Cascade | Status, history |
| R4 | `stblPeople` | `stblNoOnePlanForm` | `ChildID` | `stblNoOnePlanForm$stblPeoplestblNoOnePlanForm` | Cascade | Status, history |
| R5 | `stblPeople` | `stblExitForm` | `ChildID` | `stblExitForm$stblPeoplestblExitForm` | Cascade | Status, history |
| R6 | `stblPeople` | `stblCOSCoverForm` | `ChildID` | `stblCOSCoverForm$stblPeoplestblCOSCoverForm` | Cascade | Status, history |
| R7 | `stblPeople` | `stblServiceGridForm` | `ChildID` | `stblServiceGridForm$stblPeoplestblServiceGridForm` | Cascade | Status, history, services |
| R8 | `stblPeople` | `stblInsuranceForm` | `ChildID` | `stblInsuranceForm$stblPeoplestblInsuranceForm` | Cascade | Status, history |
| R9 | `stblServiceGridForm` | `stblServices` | `ServiceGridID` | `stblServices$stblServiceGridFormstblServices` | Cascade | Legacy service history |
| R10 | `stblCOSCoverForm` | `stblCOSCoverSource` / `stblCOSCoverTeam` | `COSCoverID` | Yes (2) | Cascade | COS feature |
| R11 | `slstServiceNames` | `stblServices` / `Services` | `SvcCode` | **No** (and `SvcCode` not unique) | — | Service history |
| R12 | `stblPeople` | `stblLoopErrors`, `stblAudit`, `Loops`, diagnostics | `ChildID` | **No** | Orphaned on delete | Legacy reports |
| R13 | `slstFormNames` | all form tables | `FormType = FormName` | **No** (text match) | — | Legacy form ordering, loop errors |

### Cascade path when a client is deleted

```mermaid
flowchart LR
  P[DELETE stblPeople] --> RF[stblReferralForm]
  P --> AF[stblActiveForm]
  P --> NF[stblNoOnePlanForm]
  P --> EF[stblExitForm]
  P --> CF[stblCOSCoverForm]
  P --> SG[stblServiceGridForm]
  P --> IF[stblInsuranceForm]
  CF --> CS[stblCOSCoverSource]
  CF --> CT[stblCOSCoverTeam]
  SG --> SV[stblServices]
  P -. orphaned .-> L[Loops / Services / stblAudit / stblLoopErrors / diagnostics]
```

## 4. Notes for the DBA

1. Every FK was created `WITH NOCHECK`, so SQL Server marks it **untrusted** (`is_not_trusted = 1`). Run `ALTER TABLE … WITH CHECK CHECK CONSTRAINT …` after cleaning orphans, so the optimiser can rely on them.
2. No non-clustered indexes exist on `stblPeople(LastName)`, `(FirstName)`, `(SS)`, or on `ChildID` in any form table. The FK columns are unindexed too, which also makes the cascade delete scan each child table.
3. `stblPeople.Region` has no FK to `stblReportingRegion`; check for orphans (including `0`) before adding one.
