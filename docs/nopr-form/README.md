# NOPR Form — Technical Documentation

Documentation set for the **No One Plan Resulting (NOPR) Form** of the PSS rewrite: the form that records why a referred child did not get a One Plan, and the date that status was determined. The FITP billing extract treats a NOPR form as an **exit**: its date is the date the Early Intervention voucher is turned off.

| Layer | Source |
| ----- | ------ |
| Frontend | [frontend/src/features/nopr-form](../../frontend/src/features/nopr-form), [services/nopr-form.service.ts](../../frontend/src/services/nopr-form.service.ts), [types/nopr-form.ts](../../frontend/src/types/nopr-form.ts), shared [common-info](../../frontend/src/features/common-info) and [utils/date.ts](../../frontend/src/utils/date.ts) |
| Backend | [backend/src/modules/nopr-form](../../backend/src/modules/nopr-form) — `/api/nopr-forms`; shared [utils/form-values.ts](../../backend/src/utils/form-values.ts) and [utils/sql-columns.ts](../../backend/src/utils/sql-columns.ts) |
| Database | `dbCDD.dbo.stblNoOnePlanForm` (+ new column `InitialEvalDate`, [database/add-InitialEvalDate.sql](database/add-InitialEvalDate.sql)) |
| Entry point | Client screen → Input Forms tab → **No One Plan** ([client docs](../client/README.md)) |

## Work items → documents

| Work item | Deliverable | Word |
| --------- | ----------- | ---- |
| Annotated Wireframe | [00-annotated-wireframe.md](00-annotated-wireframe.md) (+ [images/](images/)) | `NoprForm-Annotated-Wireframe.docx` |
| Code Annotations *(supporting)* | [01-annotations.md](01-annotations.md) | `NoprForm-Supporting-Code-Annotations.docx` |
| API / OpenAPI Contract | [09-openapi-nopr-form.yaml](09-openapi-nopr-form.yaml) (OpenAPI 3.0.3, validated); readable version [02-api.md](02-api.md) | `NoprForm-OpenAPI-Contract.docx` |
| Business Rules Catalog | [03-business-rules.md](03-business-rules.md) | `NoprForm-Business-Rules-Catalog.docx` |
| Data Dictionary | [04-data-dictionary.md](04-data-dictionary.md) | `NoprForm-Data-Dictionary.docx` |
| Table Mapping *(supporting)* | [05-table-mapping.md](05-table-mapping.md) | `NoprForm-Supporting-Table-Mapping.docx` |
| Field-Spec Table | [06-field-spec.md](06-field-spec.md) | `NoprForm-Field-Spec-Table.docx` |
| ERD | [07-erd.md](07-erd.md) | `NoprForm-ERD.docx` |
| Normalization Notes | [08-normalization-notes.md](08-normalization-notes.md) | `NoprForm-Normalization-Notes.docx` |
| Database Info | [10-database-info.md](10-database-info.md) + [database/stblNoOnePlanForm.sql](database/stblNoOnePlanForm.sql) + [database/add-InitialEvalDate.sql](database/add-InitialEvalDate.sql) | `NoprForm-Database-Info.docx` |

Word versions are in [word/](word/). The UI mock-up made before the build is in [mock/](mock/).

## Scope

In scope: the NOPR Form screen, `/api/nopr-forms`, `stblNoOnePlanForm`, the new `InitialEvalDate` column, and the legacy reports, loops and FITP extract that read the table.
Out of scope: the Input Forms grid and the client screen (see [client docs](../client/README.md)); other forms.

## Sources and confidence

| Source | Used for |
| ------ | -------- |
| NOPR Form frontend and backend code | Current behaviour; screenshots were taken from the running application |
| NOPR change requests and the team lead's answers (2026-11-18) | New field, removed fields, new and retired reasons, date rules — marked **[Request]** / **[Decision]** |
| Local `dbCDD` database and the full schema script | Types, defaults, keys, column descriptions (`MS_Description`), referencing objects |
| Legacy procedures and views — `Get_CIS_FITP_Output`, `Get_FITP_Extract_rpt`, `sqryFITPExtract*`, `Get_NOPR_Forms_rpt`, `GetClientFormStats_rpt`, `sqryFormList*`, `sqryKeyForms*`, `LoopCa` | FITP exit logic, loop errors and other legacy rules the form must keep feeding |

## Changes from the legacy screen

| # | Change | Source |
| - | ------ | ------ |
| 1 | New field **Date of Initial Evaluation** (optional), saved in a new column `InitialEvalDate`. Staff used to type it into the client's Notes. | [Request], [Decision] |
| 2 | **Date above status was determined** can't be before the child's **most recent referral date** (latest Referral Date or Re-referral Date). | [Decision] |
| 3 | `FormDate` is always saved as the **status date**, because FITP reads it as the exit (voucher turned off) date. The legacy form saved the last day of the reporting month. | [Decision] |
| 4 | New reason **8 — Initial Contact Not Made**, listed first. | [Request] |
| 5 | Reason **7 — Turned 3 during evaluation process** is retired: it can't be chosen, but forms that already have it keep it. | [Request] |
| 6 | **Month Reporting**, **Periodic Screening** and **Referred back to CIS Intake Team** are removed from the screen. Their columns are kept and never written. | [Request] |
| 7 | **Region** stays, required, prefilled from the latest Active or Referral form. | Default — to confirm |
| 8 | Date of Initial Evaluation can't be after the status date. | Default — to confirm |
| 9 | No **Lock** button; the Notes text is not migrated into the new column. | Default — to confirm |

## Most important findings

1. **NOPR is an exit for FITP (from the database):** `Get_CIS_FITP_Output` unions Exit and NOPR forms and takes the first one dated after each referral as that referral's exit date. A wrong `FormDate` turns the voucher off on the wrong day — hence change 3 (BR-NOPR-11, 40).
2. **Editing a legacy NOPR form moves its exit date:** saving sets `FormDate` to the status date, so a legacy row whose `FormDate` was the month end gets a new date in the next FITP file (NOPR-GAP-08).
3. **Legacy loop errors:** `sqryFormListComplete` flags a NOPR form whose previous key form is not a Referral. The new form does not check this (NOPR-GAP-07).
4. **Reports don't know the changes:** `Get_NOPR_Forms_rpt` doesn't return `InitialEvalDate`, and the `RefStatus` column description lists codes 1–7 only (NOPR-GAP-09, 10).
5. **A second write path skips the rules:** `POST/PUT /api/input-forms/no-one-plan/…` writes the table without these rules (NOPR-GAP-01). Errors return HTTP 500 and the API has no authentication (NOPR-GAP-02, 03), as for the Exit and Insurance forms.

## Open questions

| # | Question |
| - | -------- |
| 1 | Should Date of Initial Evaluation be limited to on or before the status date (built that way)? |
| 2 | Is Region still needed on the form, and is prefilling it from the latest Active / Referral form right? |
| 3 | Should the status date reject future dates (it would turn the voucher off early) (NOPR-GAP-06)? |
| 4 | Should a NOPR form be blocked when the previous key form isn't a Referral (legacy loop error) (NOPR-GAP-07)? |
| 5 | Is the legacy **Lock** button still needed? Should the dates typed into Notes be moved into the new column (NOPR-GAP-11)? |
| 6 | Who updates `Get_NOPR_Forms_rpt` and the `RefStatus` description for the new column and code 8 (NOPR-GAP-09, 10)? |
