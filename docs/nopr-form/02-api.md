# 02 — API Specification: NOPR Form

> The machine-readable OpenAPI 3.0.3 contract is [09-openapi-nopr-form.yaml](09-openapi-nopr-form.yaml). This page is the readable companion. The same endpoints are also annotated with `@swagger` comments and appear in the running API's Swagger UI at `/api-docs` under **NOPR Forms**.

Base URL: `{API_HOST}/api/nopr-forms` (mounted in [app.ts:67](../../backend/src/app.ts#L67)).
Frontend client: [nopr-form.service.ts](../../frontend/src/services/nopr-form.service.ts).

---

## 1. Conventions

| Item | Value |
| ---- | ----- |
| Authentication | **None** (NOPR-GAP-03) |
| Body / response casing | **PascalCase DB column names** (`RefStatus`, `StatusDate`) |
| Dates in | `YYYY-MM-DD`; must be a real calendar date |
| Dates out | As the database driver returns them, e.g. `"2026-02-02 00:00:00"` |
| Write whitelist | 4 columns in [nopr-form.config.ts](../../backend/src/modules/nopr-form/nopr-form.config.ts) `COLUMNS`: `Region`, `RefStatus`, `InitialEvalDate`, `StatusDate`. Other keys, `ID`, `ChildID`, `FormType`, `FormDate` and the legacy `MonthReporting`, `Screening`, `ReferredBack` are ignored silently |
| `FormType` | Always saved as `'No One Plan'` |
| `FormDate` | Always saved as the `StatusDate` of the body (BR-NOPR-11) |
| Reasons | `RefStatus` 8 and 1–6 can be chosen; 7 is retired and accepted only on a form that already has it (BR-NOPR-32) |
| Errors | `{ "success": false, "message": "…" }`, **always HTTP 500**, even when the service intends 400 or 404 (NOPR-GAP-02) |

### Service error messages

| Message | Intended status | Cause |
| ------- | --------------- | ----- |
| `ChildID must be a positive integer` / `ID must be a positive integer` | 400 | Bad path parameter |
| `Client not found` | 404 | No `stblPeople` row |
| `NOPR Form not found` | 404 | No row for that `ChildID` + `ID` |
| `{Field} must use YYYY-MM-DD format` / `{Field} must be a valid date` | 400 | Bad date |
| `{Field} must be a whole number` | 400 | Bad `Region` / `RefStatus` |
| `RefStatus has an unknown value: {x}` | 400 | Not 1–8 |
| `"Turned 3 during evaluation process" is no longer used; choose another reason` | 400 | `RefStatus = 7` on a new form, or changing a form to 7 |
| `Region must be selected` | 400 | No `Region` (on create, or cleared on update) |
| `Select the reason a plan was not created` | 400 | No `RefStatus` |
| `Date above status was determined is required` | 400 | No `StatusDate` |
| `Date above status was determined cannot be before Date of Birth` | 400 | `StatusDate < DOB` |
| `Date above status was determined cannot be before the most recent referral date (MM/DD/YYYY)` | 400 | `StatusDate` before the latest Referral / Re-referral Date |
| `Date of Initial Evaluation cannot be before Date of Birth` | 400 | `InitialEvalDate < DOB` |
| `Date of Initial Evaluation cannot be after the date the status was determined` | 400 | `InitialEvalDate > StatusDate` |
| `NOPR Form could not be read back after saving` | 500 | Insert succeeded but the row wasn't found |

---

## 2. Endpoints

| # | Method | Path | Purpose | Used by UI |
| - | ------ | ---- | ------- | ---------- |
| 2.1 | GET | `/lookups/options` | Reasons and retired reasons | **Yes** |
| 2.2 | GET | `/{childId}` | Client header + all NOPR forms | **Yes** (open new/edit) |
| 2.3 | POST | `/{childId}` | Create | **Yes** |
| 2.4 | GET | `/{childId}/defaults` | Region and most recent referral date for a new form | **Yes** (open new/edit) |
| 2.5 | GET | `/{childId}/{id}` | One form | No |
| 2.6 | PUT | `/{childId}/{id}` | Partial update | **Yes** |
| 2.7 | DELETE | `/{childId}/{id}` | Delete | No — the grid deletes via `DELETE /api/input-forms/no-one-plan/{childId}/{id}` |

`/lookups/options` is declared before `/{childId}`, and `/{childId}/defaults` before `/{childId}/{id}`, so the words aren't read as IDs.

### 2.1 GET /lookups/options

**200**

```json
{
  "refStatus": [
    { "code": 8, "label": "Initial Contact Not Made" },
    { "code": 1, "label": "Initial visit made - Screening/evaluation declined" },
    { "code": 2, "label": "Screened - No further evaluation needed" },
    { "code": 3, "label": "Further Evaluation Declined by Family - Eligibility Not Determined" },
    { "code": 4, "label": "Evaluated - Not Eligible" },
    { "code": 5, "label": "Eligible - Services Declined by Family" },
    { "code": 6, "label": "Moved or Lost Contact" }
  ],
  "retiredRefStatus": [
    { "code": 7, "label": "Turned 3 during evaluation process" }
  ]
}
```

### 2.2 GET /{childId}

**200**

```json
{
  "client": { "ChildID": 1042, "Region": 3, "LastName": "Austin", "FirstName": "Jane", "SS": "123-45-6789", "DOB": "2024-03-10 00:00:00" },
  "forms": [
    {
      "ID": 12, "ChildID": 1042, "FormDate": "2026-02-02 00:00:00", "FormType": "No One Plan",
      "Region": 3, "MonthReporting": null, "RefStatus": 4, "Screening": null, "ReferredBack": false,
      "StatusDate": "2026-02-02 00:00:00", "InitialEvalDate": "2026-01-20 00:00:00",
      "InsertDate": "…", "InsertUser": "…", "LastUpdateDate": "…", "LastUpdateUser": "…"
    }
  ]
}
```

Forms are ordered `FormDate` (nulls last) descending, then `ID` descending.

### 2.3 POST /{childId}

Body: any subset of the whitelisted columns. Example as sent by the UI:

```json
{
  "Region": 3,
  "RefStatus": 4,
  "InitialEvalDate": "2026-01-20",
  "StatusDate": "2026-02-02"
}
```

Processing:

1. Validate `childId`; load the client (404 if missing).
2. Parse every known key by column type; drop unknown keys, `ID`, `ChildID`, `FormType`, `FormDate` and the legacy columns; check `RefStatus`.
3. Reject the retired reason (BR-NOPR-32).
4. Set `FormDate = StatusDate` (BR-NOPR-11).
5. Validate against the client's DOB and the most recent referral date.
6. `INSERT … (ChildID, FormType = 'No One Plan', …) OUTPUT INSERTED.ID`, then re-read.

**201** → the full new row (as in 2.2 `forms[]`), with `FormDate = "2026-02-02 00:00:00"`.

### 2.4 GET /{childId}/defaults

**200**

```json
{ "Region": 3, "MostRecentReferralDate": "2026-01-05" }
```

`Region`: latest Active form's region, else the latest Referral form's, else the client's (`null` if none). `MostRecentReferralDate`: the latest `ReferralDate` or `ReReferralDate` on the child's Referral forms, `YYYY-MM-DD`, or `null`.

### 2.5 GET /{childId}/{id}

**200** → one row. Errors: `Client not found`, `NOPR Form not found` (sent as 500).

### 2.6 PUT /{childId}/{id}

Body: the keys to change (partial update). The same parsing runs on the body; the retired-reason check compares with the saved reason; `FormDate` follows the body's `StatusDate` when one is sent; validation runs on the saved row merged with the body. `LastUpdateDate = GETDATE()`, `LastUpdateUser = SUSER_SNAME()`.

Example — change the reason, clear the initial evaluation and move the status date:

```json
{ "Region": 3, "RefStatus": 8, "InitialEvalDate": null, "StatusDate": "2026-02-10" }
```

is stored with `FormDate = 2026-02-10` and `InitialEvalDate = NULL`. `MonthReporting`, `Screening` and `ReferredBack` keep their values.

**200** → the updated row.

### 2.7 DELETE /{childId}/{id}

`DELETE … WHERE ChildID = @ChildID AND ID = @ID`. **200** → `{ "success": true }`; `NOPR Form not found` if no row was deleted. Not called by the UI.

---

## 3. Related endpoints used by the NOPR Form

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/api/common-info/regions` | Region dropdown |
| GET | `/api/input-forms/history/{childId}` | Input Forms grid the form is opened from (NOPR rows: `date` = `nopr` = `FormDate`, `formType` = `'No One Plan'`, `loopError` always 0 — NOPR-GAP-07) |
| DELETE | `/api/input-forms/no-one-plan/{childId}/{id}` | Grid delete (generic input-form module, table `stblNoOnePlanForm`) |
| POST / PUT | `/api/input-forms/no-one-plan/{childId}[/{id}]` | Generic create/update. **Not used by the UI, and it skips every NOPR Form rule** (NOPR-GAP-01) |
