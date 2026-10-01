# 08 — Normalization Notes

Normal-form review of the tables the Client module uses, based on the `dbCDD` DDL (2026-09-09). The schema was migrated from MS Access with SSMA, so it keeps Access-era patterns: text-matched lookups, `int` Yes/No columns, and a denormalised reporting warehouse sitting next to the operational tables.

---

## 1. Summary

| Table | 1NF | 2NF | 3NF | BCNF | Main issue |
| ----- | :-: | :-: | :-: | :--: | ---------- |
| `stblPeople` | ✅ | ✅ | ✅ | ⚠️ | No candidate key on real-world identity (SSN), so duplicates exist (the legacy app has views just to find them). `Region` has no FK. |
| `stblReportingRegion` | ✅ | ✅ | ✅ | ✅ | — |
| `slstServiceNames` | ✅ | ✅ | ✅ | ⚠️ | `SvcCode` is the business key but isn't unique |
| `slstFormNames` | ✅ | ✅ | ✅ | ✅ | Joined by **text** (`FormType = FormName`), not by key |
| `stblServices` | ✅ | ✅ | ✅* | ✅* | `SvcCode` is a text link without an FK |
| 7 × `stbl*Form` | ⚠️ | ✅ | ⚠️ | ⚠️ | Repeating groups (flag columns); lifecycle dates repeated across forms; `FormType` is redundant with the table |
| `Services` (warehouse) | ✅ | ✅ | ❌ | ❌ | Copy of `stblServices` plus derived columns; no keys to its sources |
| `Loops` (warehouse) | ❌ | ✅ | ❌ | ❌ | Copies person name, DOB, SSN, gender, region; repeating `Outcome1..3` groups |

\* within the visible columns.

The **operational core** (`stblPeople` + form tables + `stblServices`) is close to 3NF. Most normalisation problems are in the **warehouse** tables, and the rewrite currently reads one of them (`Services`).

---

## 2. stblPeople

**Functional dependencies:** `ChildID → Region, LastName, FirstName, SS, SSTemp, DOB, Gender, Notes, NonEarlyIntervention, audit columns`.

| Check | Result |
| ----- | ------ |
| 1NF | ✅ Name split into first/last; `Notes` is one free-text value (acceptable). |
| 2NF | ✅ Single-column PK. |
| 3NF | ✅ Region name isn't stored, only the region ID. Age isn't stored. |
| BCNF | ⚠️ `SS` (where `SSTemp = 0`) is a candidate key in practice but isn't declared. `DCFindDuplicateSSNs`, `AAFindDuplicateSSNs`, `FindDuplicateSSNs` and `FindDuplicatesInPeopleTable` exist because duplicates occur. |

| # | Observation | Recommendation |
| - | ----------- | -------------- |
| P1 | No uniqueness on real SSNs. | After cleaning duplicates: `CREATE UNIQUE INDEX UX_stblPeople_SS ON stblPeople(SS) WHERE SS IS NOT NULL AND SSTemp = 0`. |
| P2 | SSN format isn't normalised (`nvarchar(15)`, dashes optional). The FITP extract takes `LEFT(SS,9)`. | Store digits only; add `CHECK (SS NOT LIKE '%[^0-9]%' AND LEN(SS) = 9)` after migrating the data. |
| P3 | `Notes` is a single overwrite-in-place value: no history, author or date. | Confirm with the business. If notes are case notes, move them to `stblPeopleNote(NoteID, ChildID FK, NoteDate, NoteUser, NoteText)`. |
| P4 | `Gender` is unconstrained `nvarchar(1)`; the documented values are M/F/U. | `CHECK (Gender IN ('M','F','U'))`. |
| P5 | `Region` has no FK. | `FOREIGN KEY (Region) REFERENCES stblReportingRegion(ID)` after fixing orphans and `0` values. |
| P6 | `LastName`/`FirstName` are nullable, guarded only by `len > 0`. | Make them `NOT NULL` if the business requires names (the UI already does). |
| P7 | `SSMA_TimeStamp` (rowversion) exists. | Use it for optimistic concurrency in `PUT` (send it with the client, compare it in `WHERE`). |

---

## 3. Form tables

### 3.1 Generalisation without a supertype

All seven tables repeat the same header: `PK, ChildID, FormDate, FormType, [Region, MonthReporting], audit`. Each is a separate table with its own identity sequence, and the PK name varies (`ID`, `COSCoverID`, `ServiceGridID`).

The legacy system already compensates with views: `sqryFormListA` (`UNION` of all seven, with a synthetic `UniqueID` = letter + ID, e.g. `A123`, `S45`) and `sqryKeyFormsCombined` (four key forms). The rewrite rebuilds the same `UNION ALL` inline twice (`getClientStatus`, `getHistory`).

**Recommendation (non-breaking):** reuse or extend the existing view instead of re-writing the union. For example, a corrected `vwClientForm` built on `sqryFormListA` that exposes `FormName`, `FormID`, `UniqueID`, `ChildID`, `FormDate`, `FormType`, `Sort` (from `slstFormNames`), and the legacy milestone columns. Both the status and history queries would then read one object.

**Long term (breaking):** supertype/subtype design (`stblForm` header table plus 1:1 subtype tables), only if the Access front end is retired.

### 3.2 `FormType` is redundant

Each table's `FormType` has a static default naming the table (`'Active'`, `'Exit'`, …), so `FormType` depends on the table rather than on the row's key. Strictly that's redundant data. It's harmless while the value is constant, but:

- the new Active form writes `aop` / `aop-capta` into it (BR-GAP-23), turning it into a sub-type (CAPTA vs. non-CAPTA) that is also recorded in `stblActiveForm.CAPTA`, so the same fact is stored twice;
- legacy logic joins `FormType` to `slstFormNames.FormName` by text.

**Recommendation:** keep `FormType = 'Active'` (the table identity) and read CAPTA status from `stblActiveForm.CAPTA`. If a sub-type is needed, add it as its own column or lookup, not by overloading `FormType`.

### 3.3 Repeating groups stored as flag columns (1NF)

| Table | Repeating group |
| ----- | --------------- |
| `stblActiveForm` | `DDAll`, `DDAdaptive`, `DDCognitive`, `DDCommunication`, `DDMotor`, `DDSocial` (delays); `DCAttachment` … `DCOther` (13 diagnosed conditions) plus `AutismDate`, `SuspectedDate`, `BlindDate`, `DeafDate` |
| `stblReferralForm` | `RefSrc*` (7 referral sources); `RefCon*` (9 concerns) |
| `stblCOSCoverForm` | `Elig*` (7); `Svc*` (9); `Outcome1..3`, `Outcome1..3Support`, `NewSkills1..3`, `NewSkills1..3Explain` |
| `stblExitForm` | `EXFNoPartB1..3` |

These are fixed checklists from paper forms, so the denormalisation is deliberate and acceptable for data entry. It costs extra in reporting: every new option needs a schema change. Out of scope for the client module; note it for the form modules.

### 3.4 Lifecycle dates repeated across forms

| Date | Stored in | Legacy system of record for the client status screen |
| ---- | --------- | ---------------------------------------------------- |
| `ReferralDate` / `ReReferralDate` | Referral, Active, Exit, Service Grid | **Referral form** |
| `InterimDate` | Active | Active |
| One Plan date | Active `InitialMeetingDate`; COS `OnePlanDate` | **Active `InitialMeetingDate`** |
| `ExitDate` | Exit; COS | **Exit form** |
| NOPR date | No One Plan `StatusDate` | No One Plan |
| `ConsentDate` | Active; Service Grid; warehouse `Services` | Service Grid (service history) |

Each form keeps its own snapshot (an intentional historical record). The risk is an **update anomaly**: the copies can disagree, and the rewrite currently reads different copies than the legacy screen did (BR-GAP-21, BR-GAP-22). **Recommendation:** adopt the legacy "system of record" column above for every derived value, and document it in the API.

### 3.5 Access Yes/No stored as `int`

`CAPTA`, `EvalWithin45Days`, `MeetingWithin45Days`, `EntryOrExit`, `Notified90Days`, `TransitionMeeting90day`, `NewSkills1..3`, `COSF*` are `int` holding `-1`/`0`/NULL, while other flags are `bit`. Two encodings of the same domain is a consistency issue, not a normal-form violation. New code must test `= -1` (or `<> 0`) for these, not `= 1`.

---

## 4. Services: operational vs warehouse

| | `stblServices` (operational) | `Services` (warehouse) |
| - | --------------------------- | ---------------------- |
| PK | `ID` identity | `ServiceID` identity (`ID` is a nullable copy) |
| Parent | FK → `stblServiceGridForm` (cascade) | `ServiceGridId` with no FK; `LoopId` → `Loops` with no FK |
| Extra columns | — | `Frequency`, `ConsentDate`, `Classification`, `Region`, `PrimaryLocation`, `DaystoService` |
| 3NF | ✅ | ❌ `Region` and `ConsentDate` depend on the grid/loop, not the service line; `Classification` is derived |

The warehouse table is a **derived, denormalised copy** built for federal-indicator reporting. Reading it in a transactional screen gives stale data and duplicate sources of truth. **Recommendation:** service history should read `stblServices` (BR-GAP-20). If `Frequency` is a real requirement, it belongs in `stblServices` (or is `HowLong`; confirm).

`slstServiceNames.SvcCode` should get a unique index so the `SvcCode` join can't fan out.

---

## 5. Loops (warehouse)

`Loops` copies `ChildNameLast`, `ChildNameFirst`, `ChildDateofBirth`, `Gender`, `ChildSSN`, `Region` (as text) and `Ethnicity` (as text) from operational tables, and holds `Start/End/Initial/NewSkills Outcome1..3` groups. It violates 1NF (repeating groups) and 3NF (transitive dependencies on `ChildId`). That's normal for a reporting snapshot. The client module shouldn't read it, and deleting a client leaves its `Loops` rows orphaned (BR-DEL-03). Treat it as a rebuildable artefact.

---

## 6. Derived data — stored vs computed

| Value | Stored? | Correct? |
| ----- | ------- | -------- |
| Age | No (from DOB) | ✅ |
| Client status | No (from latest key form) | ✅ |
| Milestone dates | No (from form columns) | ✅ — but pick the right source column (§3.4) |
| Consent Yes/Pending | No | ✅ |
| Loop error | **Yes** — `stblLoopErrors` is a materialised result of `sqryLoopErrors` | ⚠️ Acceptable as a cache if refreshed; otherwise compute it on read |
| Warehouse `Loops` / `Services` | Yes | ⚠️ Reporting snapshot only; never the source for the app |

---

## 7. Prioritised recommendations

| Priority | Item | Effort | Breaking? |
| -------- | ---- | ------ | --------- |
| 1 | Point service history at `stblServices` instead of warehouse `Services` | Low | No (API shape can stay the same) |
| 2 | Use the legacy system-of-record columns for status and history dates (§3.4) | Low | Values change; shape stays |
| 3 | Keep `FormType = 'Active'`; stop writing `aop` codes, or add them to `slstFormNames` and update the legacy views | Low | Decision needed |
| 4 | Bind `stblPeople` columns with their real types (`NVarChar(50)`, `NVarChar(15)`, `NVarChar(1)`, `NVarChar(MAX)`, `Int`) in create and update | Low | No |
| 5 | Add non-clustered indexes: `stblPeople(LastName, FirstName)`, `(FirstName, LastName)`, `(SS)`; `ChildID` on each form table; `stblServices(ServiceGridID)` | Low | No |
| 6 | Re-validate FKs `WITH CHECK`; add `stblPeople.Region` FK; unique index on `slstServiceNames.SvcCode` | Medium | Data cleanup first |
| 7 | Normalise SSN to 9 digits; filtered unique index on real SSNs | Medium | Data migration |
| 8 | `CHECK` on `Gender`; `NOT NULL` names | Low | Data cleanup first |
| 9 | Optimistic concurrency via `SSMA_TimeStamp` | Medium | API adds a field |
| 10 | Notes history table (only if the business wants dated notes) | Medium | Yes (API) |
