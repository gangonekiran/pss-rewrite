# Client Module — Technical Documentation

Documentation set for the **Client** feature of the PSS rewrite.

| Layer    | Source folder                                                                  |
| -------- | ------------------------------------------------------------------------------ |
| Frontend | [frontend/src/features/client](../../frontend/src/features/client)             |
| Backend  | [backend/src/modules/client](../../backend/src/modules/client)                 |
| Shared   | [frontend/src/services/client.service.ts](../../frontend/src/services/client.service.ts), [frontend/src/types/client.ts](../../frontend/src/types/client.ts) |
| Database | `dbCDD` (SQL Server, migrated from MS Access with SSMA) — DDL script dated 2026-09-09 |

## Work items → documents

| Work item | Deliverable |
| --------- | ----------- |
| 94268 Create Annotated Wireframe | [00-annotated-wireframe.md](00-annotated-wireframe.md) (+ [wireframe-client-status.svg](wireframe-client-status.svg), [wireframe-client-input-forms.svg](wireframe-client-input-forms.svg)) |
| 94269 Create Business Rules Catalog Entries | [03-business-rules.md](03-business-rules.md) |
| 94270 Create Data Dictionary Entries | [04-data-dictionary.md](04-data-dictionary.md) |
| 94271 Create ERD | [07-erd.md](07-erd.md) |
| 94272 Create Field-Spec Table | [06-field-spec.md](06-field-spec.md) |
| 94273 Create Normalization Notes | [08-normalization-notes.md](08-normalization-notes.md) |
| 94274 Create OpenAPI Contract Entries | [09-openapi-client.yaml](09-openapi-client.yaml) (OpenAPI 3.0.3, validated); readable version in [02-api.md](02-api.md) |
| *(supporting)* | [01-annotations.md](01-annotations.md) (code walkthrough), [05-table-mapping.md](05-table-mapping.md) (UI → API → DB mapping) |

## Documents

| #  | Document                                              | What it answers                                                         |
| -- | ----------------------------------------------------- | ----------------------------------------------------------------------- |
| 00 | [Annotated Wireframe](00-annotated-wireframe.md)      | What is on the screen, numbered, with behaviour, data and rules per element |
| 01 | [Code Annotations](01-annotations.md)                 | What each file / component / function does, its props, state and calls |
| 02 | [API Specification](02-api.md)                        | Every `/api/clients` endpoint: request, response, SQL, errors           |
| 03 | [Business Rules](03-business-rules.md)                | Validation, lock/edit workflow, search, status, loop errors, delete, known gaps |
| 04 | [Data Dictionary](04-data-dictionary.md)              | Meaning, type, nullability, default and allowed values of every data element |
| 05 | [Table Mapping](05-table-mapping.md)                  | UI field → TS property → API property → DB column; current vs legacy queries |
| 06 | [Field Specification](06-field-spec.md)               | Per-UI-field control type, length, format, required, editability        |
| 07 | [ERD](07-erd.md)                                       | Entity-relationship diagram with the physical FKs from the DDL          |
| 08 | [Normalization Notes](08-normalization-notes.md)      | Normal-form assessment, anomalies, and recommendations                  |
| 09 | [OpenAPI Contract](09-openapi-client.yaml)            | Machine-readable contract for `/api/clients` (import into Swagger UI / Postman) |

## Scope

In scope:

- Client lookup (first name, last name, SSN), client demographics create / update / delete.
- Lock / Unlock / Add New / Done workflow.
- **Client Status** tab: status-as-of-date, milestone dates, notes, service history.
- **Input Forms** tab *as hosted by the client feature* (history grid, show/hide filter, generic form shell).
  The individual Active and COS forms are separate features and are only referenced here.

Out of scope: authentication, the `input-form`, `active-form`, `cos` and `common-info` modules except where the client feature calls them; the warehouse/reporting objects (`Loops`, `Seasons`, `Base*`, `Active618*`, `DC*` views) except where they constrain this module.

## Sources and confidence

| Source | Used for |
| ------ | -------- |
| Application code (working tree, 2026-10-01) | Current behaviour |
| `dbCDD` DDL script (2026-09-09) | Column types, nullability, defaults, CHECK and FK constraints, column descriptions (`MS_Description`) |
| Legacy stored procedures and views in the same script — `GetClientFormStats_rpt`, `GetServiceHistory_rpt`, `sqryFormListA`, `sqryFormListComplete`, `Get_CIS_FITP_Output` | The legacy (Access-era) business logic the rewrite should reproduce |

Everything about the database is now **confirmed from the DDL** unless marked otherwise. Where the legacy logic and the new code disagree, both are documented and the difference is listed as a gap in [Business Rules](03-business-rules.md#known-gaps-and-defects).

## Open questions — status after DDL review

| # | Question | Status | Answer / what is still needed |
| - | -------- | ------ | ----------------------------- |
| 1 | DDL for the client tables | ✅ Answered | Received. Still useful: the **rows** of `slstFormNames` (form sequence used by loop-error logic) and the distinct `FormType` values in production. |
| 2 | Hard delete and child records | ⚠️ Technical answer known; business decision open | DDL: all 7 form tables have `FK … ON DELETE CASCADE` to `stblPeople`, and cascades continue to `stblCOSCoverSource`, `stblCOSCoverTeam` and `stblServices`. Deleting a client permanently deletes **all** its forms and services. Tables without FKs (`Loops`, `Services`, `stblAudit`, `stblLoopErrors`, diagnostics) are left orphaned. **Business must confirm hard delete is acceptable** (vs. soft delete / admin-only). |
| 3 | SSN format | ⚠️ Strong evidence; confirm | `Get_CIS_FITP_Output` sends `LEFT(SS + '000000000', 9)` to the FITP extract — it assumes **9 digits, no dashes**. A dashed value would be sent as `123-45-67`. Recommend: store 9 digits, display as `###-##-####`. Column is `nvarchar(15)`. |
| 4 | Should Status-tab notes save? | ✅ Answered | **Yes.** Saves to `stblPeople.Notes` (`nvarchar(max)`). Not yet implemented — BR-GAP-10. |
| 5 | FormType values / Active–Inactive mapping | ⚠️ Partly answered | DDL defaults: `Referral`, `Active`, `No One Plan`, `Exit`, `COS`, `Insurance`, `Service Grid` (`nvarchar(12)`). Legacy status labels come from `GetClientFormStats_rpt` (BR-DER-02). **Decision needed:** the new Active form saves `aop` / `aop-capta`, which legacy views and reports do not recognise (BR-GAP-23). |
| 6 | Authentication on `/api/clients` | ❌ Open | Backend/security team to confirm. |
| 7 | *(new)* Service-history source | ❌ Open | The rewrite reads the warehouse table `Services`; the legacy screen read `stblServices`. Which UI columns (Freq., Consent, Case Plan) map to which fields? See BR-GAP-20. |

_Generated from the code on branch `main` (commit `782e4e8` + working tree) and the `dbCDD` DDL, 2026-10-01._
