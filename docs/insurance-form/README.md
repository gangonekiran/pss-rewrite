# Insurance Form — Technical Documentation

Documentation set for the **Insurance Form** of the PSS rewrite: the form that records the family's insurance details and whether the parent gives permission to bill private insurance or Medicaid, or declines. The FITP billing extract reads the latest Insurance Form of each child to decide what to bill.

| Layer | Source |
| ----- | ------ |
| Frontend | [frontend/src/features/insurance-form](../../frontend/src/features/insurance-form), [services/insurance-form.service.ts](../../frontend/src/services/insurance-form.service.ts), [types/insurance-form.ts](../../frontend/src/types/insurance-form.ts), shared [common-info](../../frontend/src/features/common-info) and [utils](../../frontend/src/utils) |
| Backend | [backend/src/modules/insurance-form](../../backend/src/modules/insurance-form) — `/api/insurance-forms`; shared [utils/form-values.ts](../../backend/src/utils/form-values.ts) and [utils/sql-columns.ts](../../backend/src/utils/sql-columns.ts) |
| Database | `dbCDD.dbo.stblInsuranceForm` (checked against the local database) |
| Entry point | Client screen → Input Forms tab → **Insurance** ([client docs](../client/README.md)) |

## Work items → documents

| Work item | Deliverable | Word |
| --------- | ----------- | ---- |
| Annotated Wireframe | [00-annotated-wireframe.md](00-annotated-wireframe.md) (+ [images/](images/)) | `InsuranceForm-Annotated-Wireframe.docx` |
| Code Annotations *(supporting)* | [01-annotations.md](01-annotations.md) | `InsuranceForm-Supporting-Code-Annotations.docx` |
| API / OpenAPI Contract | [09-openapi-insurance-form.yaml](09-openapi-insurance-form.yaml) (OpenAPI 3.0.3, validated); readable version [02-api.md](02-api.md) | `InsuranceForm-OpenAPI-Contract.docx` |
| Business Rules Catalog | [03-business-rules.md](03-business-rules.md) | `InsuranceForm-Business-Rules-Catalog.docx` |
| Data Dictionary | [04-data-dictionary.md](04-data-dictionary.md) | `InsuranceForm-Data-Dictionary.docx` |
| Table Mapping *(supporting)* | [05-table-mapping.md](05-table-mapping.md) | `InsuranceForm-Supporting-Table-Mapping.docx` |
| Field-Spec Table | [06-field-spec.md](06-field-spec.md) | `InsuranceForm-Field-Spec-Table.docx` |
| ERD | [07-erd.md](07-erd.md) | `InsuranceForm-ERD.docx` |
| Normalization Notes | [08-normalization-notes.md](08-normalization-notes.md) | `InsuranceForm-Normalization-Notes.docx` |
| Database Info | [10-database-info.md](10-database-info.md) + [database/stblInsuranceForm.sql](database/stblInsuranceForm.sql) | `InsuranceForm-Database-Info.docx` |

Word versions are in [word/](word/). The earlier UI mock-ups are in [mock/](mock/).

## Scope

In scope: the Insurance Form screen, `/api/insurance-forms`, `stblInsuranceForm`, and the legacy reports and FITP extract that read it.
Out of scope: the Input Forms grid and the client screen (see [client docs](../client/README.md)); other forms.

## Sources and confidence

| Source | Used for |
| ------ | -------- |
| Insurance Form frontend and backend code | Current behaviour; screenshots were taken from the running application |
| Product-owner notes on the legacy screen and decisions during development | Fields no longer used, consent behaviour, where the company name is saved — marked **[Decision]** |
| Local `dbCDD` database | Types, defaults, keys, referencing objects |
| Legacy procedures and views — `Get_CIS_FITP_Output`, `Get_FITP_Extract_rpt`, `sqryFITPExtract*`, `GetInsuranceForms_rpt`, `sqryFormListA`, point-in-time and service-location reports | FITP billing logic and other legacy rules the form must keep feeding |

## Product-owner decisions reflected here

| # | Decision |
| - | -------- |
| 1 | Consent is **one choice**: bill private insurance (1), bill Medicaid (2) or decline (3). The database stores one number and FITP reads it. |
| 2 | When declining, the parent picks **one** reason. |
| 3 | The Insurance Company Name is saved in `BranchAddress`, where staff have always typed it. |
| 4 | Ins. Co #, Coverage Code and Phone are no longer on the screen; their stored values are kept. |
| 5 | Client Information shows only the child's name, SSN and DOB (no region or referral date). |

## Most important findings

1. **FITP billing logic (from the database):** FITP uses each child's latest form only; `BillingConsent = 3` is "Do Not Bill", anything else, **including empty**, is "Bill". The form therefore requires a consent answer (BR-IF-40, 41).
2. **FITP truncates** Policy # to 20 and Group # to 16 characters, while the screen accepts 255 (IF-GAP-07).
3. **A second write path skips the rules:** `POST/PUT /api/input-forms/insurance/…` writes `stblInsuranceForm` without the Insurance Form rules (IF-GAP-01).
4. **Errors return HTTP 500** and the API has **no authentication** (IF-GAP-02, 03), as for the Exit Form.

## Open questions

| # | Question |
| - | -------- |
| 1 | Are `BillingConsent` 1 = private insurance and 2 = Medicaid correct? Only 3 is named in the database (IF-GAP-04). |
| 2 | Is the legacy **Lock** button still needed (IF-GAP-05)? |
| 3 | Does FITP still need the insurance company code (`InsCoNumber`) and Coverage Code, which the new form no longer captures (IF-GAP-06)? |
| 4 | Should Policy # and Group # be limited to the 20 / 16 characters FITP sends (IF-GAP-07)? |
| 5 | Should Date Completed default to today, and should future dates be rejected (IF-GAP-14)? |
| 6 | Should the generic `/api/input-forms/insurance` create/update routes be removed or routed through the Insurance Form rules (IF-GAP-01)? |
