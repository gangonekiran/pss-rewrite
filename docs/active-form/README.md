# Active Form — Technical Documentation

Documentation set for the **Active Form** of the PSS rewrite: the form that records a referred child becoming active (initial evaluation, initial One Plan, 45-day delay reasons, eligibility).

| Layer | Source |
| ----- | ------ |
| Frontend | [frontend/src/features/active-form](../../frontend/src/features/active-form), [services/active-form.service.ts](../../frontend/src/services/active-form.service.ts), [types/active-form.ts](../../frontend/src/types/active-form.ts) |
| Backend | [backend/src/modules/active-form](../../backend/src/modules/active-form) — `/api/active-forms` |
| Database | `dbCDD.dbo.stblActiveForm` + lookups (DDL 2026-09-09) |
| Entry point | Client screen → Input Forms tab ([client docs](../client/README.md)) |

## Work items → documents

| Work item | Deliverable |
| --------- | ----------- |
| Create Annotated Wireframe | [00-annotated-wireframe.md](00-annotated-wireframe.md) (+ [wireframe-active-form.svg](wireframe-active-form.svg)) |
| Create Business Rules Catalog Entries | [03-business-rules.md](03-business-rules.md) |
| Create Data Dictionary Entries | [04-data-dictionary.md](04-data-dictionary.md) |
| Create ERD | [07-erd.md](07-erd.md) |
| Create Field-Spec Table | [06-field-spec.md](06-field-spec.md) |
| Create Normalization Notes | [08-normalization-notes.md](08-normalization-notes.md) |
| Create OpenAPI Contract Entries | [09-openapi-active-form.yaml](09-openapi-active-form.yaml) (OpenAPI 3.0.3, validated); readable version [02-api.md](02-api.md) |
| *(supporting)* | [01-annotations.md](01-annotations.md) (code walkthrough), [05-table-mapping.md](05-table-mapping.md) (screen → API → DB, legacy report usage) |

Word versions are in [word/](word/).

## Scope

In scope: the Active Form screen, `/api/active-forms`, `stblActiveForm` and its lookups, and the legacy reports that read `stblActiveForm`.
Out of scope: the Input Forms grid and the client screen (see [client docs](../client/README.md)); other forms.

## Sources and confidence

| Source | Used for |
| ------ | -------- |
| Code (working tree, 2026-10-01, including uncommitted changes to `GeneralInformation.tsx`, `active-form.controller.ts`, `active-form.routes.ts`) | Current behaviour |
| `dbCDD` DDL — `stblActiveForm` columns, defaults, `MS_Description` | Types and the meaning of each column |
| Legacy views/procedures — `LoopAB`, `Base0701`, `GetIndicator1*_rpt`, `GetIndicator7_rpt`, `GetActiveForms_rpt`, `GetClientFormStats_rpt`, `sqryFormListA` | Legacy business rules the form must keep feeding |

## Most important findings

1. **Typed data is lost on save:** both "Other reasons – details" boxes and 9 eligibility conditions (AF-GAP-01, 02).
2. **Legacy reports break for new forms:** `FormType` is saved as `aop` instead of `Active` + `CAPTA`; the 45-day compliance fields are never set; the Referral Date isn't tied to the Referral form (AF-GAP-03, 04, 05).
3. **No authentication** on `/api/active-forms` (AF-GAP-06).

## Open questions

| # | Question |
| - | -------- |
| 1 | Should `FormType` stay `'Active'` with CAPTA in the `CAPTA` column (legacy), or are `aop`/`aop-capta` the new standard, in which case `slstFormNames` and the legacy views must change? |
| 2 | The 9 new eligibility conditions (Torticollis … Feeding): are they required? If so, the database needs columns or a condition table. |
| 3 | Should the Referral Date be copied from the Referral form (read-only), as the legacy loop logic requires? |
| 4 | Are Interim One Plan date, Consent date, Service Coordinator, Supervisory Union/Town, Ethnicity and Reporting Month still required on this form (no fields today)? |
| 5 | What does **NMNEI** mean for the business, and is it the same as `NonEarlyIntervention` on the client/referral? |
| 6 | Should the app calculate the 45-day compliance fields (`EvalWithin45Days`, `InitEval45*`, …) automatically? |
| 7 | Is there a requirements document or a screenshot of the old Access Active form to confirm the field list? |
