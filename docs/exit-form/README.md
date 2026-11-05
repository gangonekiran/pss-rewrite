# Exit Form — Technical Documentation

Documentation set for the **Exit Form** of the PSS rewrite: the form that records a child leaving Early Intervention — the exit date, the transition milestones (written transition plan, LEA notification, transition conference), whether the child exited **prior to age 3** or **at age 3**, the reason, and where they were referred.

| Layer | Source |
| ----- | ------ |
| Frontend | [frontend/src/features/exit-form](../../frontend/src/features/exit-form), [services/exit-form.service.ts](../../frontend/src/services/exit-form.service.ts), [types/exit-form.ts](../../frontend/src/types/exit-form.ts), shared [common-info](../../frontend/src/features/common-info) and [utils/date.ts](../../frontend/src/utils/date.ts) |
| Backend | [backend/src/modules/exit-form](../../backend/src/modules/exit-form) — `/api/exit-forms` |
| Database | `dbCDD.dbo.stblExitForm` (DDL 2026-09-09, checked against the local database) |
| Entry point | Client screen → Input Forms tab → **Exit** ([client docs](../client/README.md)) |

## Work items → documents

| Work item | Deliverable | Word |
| --------- | ----------- | ---- |
| Annotated Wireframe | [00-annotated-wireframe.md](00-annotated-wireframe.md) (+ [images/](images/)) | `ExitForm-Annotated-Wireframe.docx` |
| Code Annotations *(supporting)* | [01-annotations.md](01-annotations.md) | `ExitForm-Supporting-Code-Annotations.docx` |
| API / OpenAPI Contract | [09-openapi-exit-form.yaml](09-openapi-exit-form.yaml) (OpenAPI 3.0.3, validated); readable version [02-api.md](02-api.md) | `ExitForm-OpenAPI-Contract.docx` |
| Business Rules Catalog | [03-business-rules.md](03-business-rules.md) | `ExitForm-Business-Rules-Catalog.docx` |
| Data Dictionary | [04-data-dictionary.md](04-data-dictionary.md) | `ExitForm-Data-Dictionary.docx` |
| Table Mapping *(supporting)* | [05-table-mapping.md](05-table-mapping.md) | `ExitForm-Supporting-Table-Mapping.docx` |
| Field-Spec Table | [06-field-spec.md](06-field-spec.md) | `ExitForm-Field-Spec-Table.docx` |
| ERD | [07-erd.md](07-erd.md) | `ExitForm-ERD.docx` |
| Normalization Notes | [08-normalization-notes.md](08-normalization-notes.md) | `ExitForm-Normalization-Notes.docx` |
| Database Info | [10-database-info.md](10-database-info.md) + [database/stblExitForm.sql](database/stblExitForm.sql) | `ExitForm-Database-Info.docx` |

Word versions are in [word/](word/).

## Scope

In scope: the Exit Form screen, `/api/exit-forms`, `stblExitForm`, the tables it reads for prefill, and the legacy reports that read `stblExitForm`.
Out of scope: the Input Forms grid and the client screen (see [client docs](../client/README.md)); the COS form (it has its own exit questions); other forms.

## Sources and confidence

| Source | Used for |
| ------ | -------- |
| Exit Form frontend and backend code | Current behaviour; screenshots were taken from the running components |
| Product-owner decisions (Beth) during development | Fields removed, counter direction, code lists, wording — marked **[Decision]** |
| `dbCDD` DDL (9/9/2026) and the local `dbCDD` database | Types, defaults, constraints, `MS_Description`, referencing objects |
| Legacy views/procedures — `GetExitForms_rpt`, `GetIndicator8_rpt`, `BaseResults0801`, `DCInd8*`, `DCNotPEReferred`, `GetAnnualExit*`, `Get_FITP_Extract_rpt`, `sqryFormListA` | Legacy business rules the form must keep feeding |
| Feature 88822 notes | Original requirement (four-step wizard; replaced by a single page) |

## Product-owner decisions reflected here

| # | Decision |
| - | -------- |
| 1 | General Information has only Region, Date of Referral and Date of Exit. Status, Supervisory Union, Town, County and Service Coordinator are removed and aren't saved. |
| 2 | The transition-plan counter runs from the **referral date** to the **plan date**. |
| 3 | The prior-to-age-3 reason is chosen from the list (with the new codes Non-EI Client Exit and Referral to CIS-EI). |
| 4 | Referred To "Other" is a radio button only (no text). The no-referral option reads "Exited with no referral". |
| 5 | Compliance indicators and the loop warning banner are removed. |

## Most important findings

1. **A second write path skips the rules:** `POST/PUT /api/input-forms/exit/…` writes `stblExitForm` without any Exit Form validation or legacy conventions (EF-GAP-01).
2. **New codes break the annual exit reports:** prior-to-age-3 codes 7 and 8 have no mapping in `GetAnnualExit*` (EF-GAP-02).
3. **No authentication** on `/api/exit-forms` (EF-GAP-03).
4. **Indicator 8 on-time flags aren't captured** after the compliance indicators were removed (EF-GAP-04); the delay reason is free text the reports can't always classify (EF-GAP-05).

## Open questions

| # | Question |
| - | -------- |
| 1 | Should the annual exit reports count codes 7 (Non-EI Client Exit) and 8 (Referral to CIS-EI), and under which reason rows? |
| 2 | With compliance indicators removed, should Indicator 8 calculate `Notified90Days` / `TransitionMeeting90day` from the dates, or are those reports retired? |
| 3 | Are the "not eligible for Part B" reasons (`EXFNoPartB1-3`) still needed for code 4? |
| 4 | Should the Transition Plan Delay Reason become a Family / Provider choice plus details, so the reports can classify it? |
| 5 | Should Referred To allow more than one destination (the Feature 88822 notes say "one or more")? |
| 6 | Should the generic `/api/input-forms/exit` create/update routes be removed or routed through the Exit Form rules? |
