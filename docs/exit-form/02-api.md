# 02 — API Specification: Exit Form

> The machine-readable OpenAPI 3.0.3 contract is [09-openapi-exit-form.yaml](09-openapi-exit-form.yaml). This page is the readable companion. The same endpoints are also annotated with `@swagger` comments and appear in the running API's Swagger UI at `/api-docs`.

Base URL: `{API_HOST}/api/exit-forms` (mounted in [app.ts:61](../../backend/src/app.ts#L61)).
Frontend client: [exit-form.service.ts](../../frontend/src/services/exit-form.service.ts).

---

## 1. Conventions

| Item | Value |
| ---- | ----- |
| Authentication | **None** (EF-GAP-03) |
| Body / response casing | **PascalCase DB column names** (`ExitDate`, `ExitPriorToAge3`) |
| Dates in | `YYYY-MM-DD`; must be a real calendar date |
| Dates out | ISO-8601 (`2026-04-01T00:00:00.000Z`) |
| Yes/No columns in | `true`/`false`, `"yes"`/`"no"`, `-1`/`0`/`1` — stored as `-1` (Yes) / `0` (No) |
| Write whitelist | 38 columns in [exit-form.config.ts](../../backend/src/modules/exit-form/exit-form.config.ts) `COLUMNS`; other keys, `ID`, `ChildID` and `FormType` are ignored silently |
| `FormType` | Always saved as `'Exit'` |
| `FormDate` | Set to `ExitDate` on create when not sent; follows `ExitDate` on update while the two were equal |
| Exit path | Sending a real code for one path stores **0** in the other path's column |
| Errors | `{ "success": false, "message": "…" }`, **always HTTP 500**, even when the service intends 400 or 404 (EF-GAP-08) |

### Service error messages

| Message | Intended status | Cause |
| ------- | --------------- | ----- |
| `ChildID must be a positive integer` / `ID must be a positive integer` | 400 | Bad path parameter |
| `Client not found` | 404 | No `stblPeople` row |
| `Exit Form not found` | 404 | No row for that `ChildID` + `ID` |
| `Region must be selected` | 400 | `Region` missing on create, or cleared on update |
| `Date of Exit is required` | 400 | `ExitDate` missing on create, or cleared on update |
| `{Field} must use YYYY-MM-DD format` / `{Field} must be a valid date` | 400 | Bad date |
| `{Field} must be a whole number` / `{Field} must be Yes or No` / `{Field} must be true or false` | 400 | Bad value for the column type |
| `{Field} must be {n} characters or fewer` | 400 | Text longer than the column (e.g. `MovedOtherRegion` 255) |
| `{Field} has an unknown value: {x}` | 400 | Code not in its list (`ExitPriorToAge3`, `ExitAtAge3`, `ReferredTo`) |
| `{Label} cannot be before Date of Birth` | 400 | Any form date before the child's DOB |
| `Date of Exit cannot be before Date of Referral` | 400 | Exit before referral |
| `Date Written Transition Plan cannot be before Date of Referral` / `LEA Notification Date cannot be before Date of Referral` | 400 | Transition dates before referral |
| `{Label} cannot be after Date of Exit` | 400 | Transition Plan, LEA Notification or Transition Conference after the exit |
| `Choose either an exit reason prior to age 3 or an exit at age 3 outcome, not both` | 400 | Both path columns hold a real code |
| `Referred To is required when the child is NOT eligible for Part B (choose "Exited with no referral" if there was no referral)` | 400 | `ExitAtAge3 = 4` with no `ReferredTo` |
| `Exit Form could not be read back after saving` | 500 | Insert succeeded but the row wasn't found |

---

## 2. Endpoints

| # | Method | Path | Purpose | Used by UI |
| - | ------ | ---- | ------- | ---------- |
| 2.1 | GET | `/lookups/options` | Code lists for the three radio groups | **Yes** |
| 2.2 | GET | `/{childId}` | Client header + all Exit Forms | **Yes** (open new/edit) |
| 2.3 | GET | `/{childId}/defaults` | Prefill for a new form | **Yes** (new only) |
| 2.4 | POST | `/{childId}` | Create | **Yes** |
| 2.5 | GET | `/{childId}/{id}` | One form | No |
| 2.6 | PUT | `/{childId}/{id}` | Partial update | **Yes** |
| 2.7 | DELETE | `/{childId}/{id}` | Delete | No — the grid deletes via `DELETE /api/input-forms/exit/{childId}/{id}` |

`/lookups/options` is declared before `/{childId}`, and `/{childId}/defaults` before `/{childId}/{id}`, so neither word is read as an ID.

### 2.1 GET /lookups/options

The lists come from the backend config (there are no lookup tables for them in `dbCDD`). Codes 7, 8 and 5 are new and not in the legacy column descriptions.

```json
{
  "exitPriorToAge3": [
    { "code": 7, "label": "Non-EI Client Exit" },
    { "code": 8, "label": "Referral to CIS-EI" },
    { "code": 1, "label": "Development at appropriate level" },
    { "code": 2, "label": "Moved to other region" },
    { "code": 3, "label": "Moved out of state" },
    { "code": 4, "label": "Withdrawn by parent or guardian" },
    { "code": 5, "label": "Unable to contact" },
    { "code": 6, "label": "Deceased" }
  ],
  "exitAtAge3": [
    { "code": 1, "label": "Child is potentially eligible for Part B services" },
    { "code": 2, "label": "Child is potentially eligible for Part B services - child's family declined further service" },
    { "code": 3, "label": "Child is thought to be eligible but potential eligibility not determined" },
    { "code": 4, "label": "Child is NOT eligible for Part B" }
  ],
  "referredTo": [
    { "code": 1, "label": "Head Start" },
    { "code": 2, "label": "Community-based Child Care Program or Preschool" },
    { "code": 3, "label": "School based Pre-School Classroom" },
    { "code": 4, "label": "Children's Integrated Services Coordinator" },
    { "code": 5, "label": "Other" },
    { "code": 99, "label": "Exited with no referral" }
  ]
}
```

### 2.2 GET /{childId}

Returns the client header and every Exit Form for that client, newest exit first (`ExitDate` nulls last, then `ID DESC`).

```json
{
  "client": {
    "ChildID": 1042, "Region": 2, "LastName": "Austin", "FirstName": "Jane",
    "SS": "123-45-6789", "SSTemp": false, "DOB": "2023-04-10T00:00:00.000Z",
    "Gender": "F", "Notes": null, "NonEarlyIntervention": false
  },
  "forms": [
    {
      "ID": 55, "ChildID": 1042, "FormDate": "2026-04-01T00:00:00.000Z", "FormType": "Exit",
      "Region": 2, "ReferralDate": "2025-02-15T00:00:00.000Z", "ExitDate": "2026-04-01T00:00:00.000Z",
      "TransitionPlanCompleted": "2025-10-01T00:00:00.000Z", "TransitionPlanReason": null,
      "CLLEANotificationDate": "2025-11-01T00:00:00.000Z", "TransitionMeeting": "2025-12-15T00:00:00.000Z",
      "ExitPriorToAge3": 0, "MovedOtherRegion": null, "ExitAtAge3": 1,
      "EXFNoPartB1": false, "EXFNoPartB2": false, "EXFNoPartB3": false, "ReferredTo": 3,
      "…": "all other stblExitForm columns"
    }
  ]
}
```

### 2.3 GET /{childId}/defaults

Values to start a new form with. `Region` and `ReferralDate` come from the latest **Active** form (by `FormDate`); if there is none, from the latest **Referral** form (by `COALESCE(ReReferralDate, ReferralDate, FormDate)`). A missing Region falls back to the Referral form's, then the client's.

```json
{ "Region": 2, "ReferralDate": "2025-02-15" }
```

### 2.4 POST /{childId}

Body: any subset of the whitelisted columns. Example as sent by the UI for an exit **prior to age 3**:

```json
{
  "Region": 2,
  "ReferralDate": "2025-02-15",
  "ExitDate": "2025-06-01",
  "TransitionPlanCompleted": "2025-04-20",
  "TransitionPlanReason": "Family circumstance: parent unavailable until April",
  "CLLEANotificationDate": null,
  "TransitionMeeting": null,
  "ExitPriorToAge3": 2,
  "MovedOtherRegion": "Rutland",
  "ExitAtAge3": null,
  "ReferredTo": 5
}
```

Processing:

1. Validate `childId`; load the client (404 if missing).
2. Parse every known key by column type; drop unknown keys, `ID`, `ChildID` and `FormType`; check codes.
3. Exit path: `ExitPriorToAge3 = 2` is a real code, so `ExitAtAge3` is stored as **0**.
4. Clear dependent fields: `EXFNoPartB1-3` → false (because `ExitAtAge3 ≠ 4`); `MovedOtherRegion` is kept (code 2).
5. Require `Region` and `ExitDate`; set `FormDate = ExitDate`.
6. Validate dates and cross-field rules against the client's DOB.
7. `INSERT … (ChildID, FormType = 'Exit', …) OUTPUT INSERTED.ID`, then re-read.

**201** → the full new row (as in 2.2 `forms[]`).

### 2.5 GET /{childId}/{id}

**200** → one row. Errors: `Client not found`, `Exit Form not found` (sent as 500).

### 2.6 PUT /{childId}/{id}

Body: the keys to change (partial update). The same parsing, exit-path and clearing steps run on the body; validation runs on the existing row merged with the body. `Region` and `ExitDate` can't be set to blank. `LastUpdateDate = GETDATE()`, `LastUpdateUser = SUSER_SNAME()`. An empty body changes nothing and returns the row.

Example: switching a form to **at age 3** —

```json
{ "ExitPriorToAge3": null, "MovedOtherRegion": null, "ExitAtAge3": 4, "ReferredTo": 99 }
```

is stored as `ExitPriorToAge3 = 0`, `ExitAtAge3 = 4`, `ReferredTo = 99`, and `EXFNoPartB1-3` keep their values (code 4 uses them).

**200** → the updated row.

### 2.7 DELETE /{childId}/{id}

`DELETE … WHERE ChildID = @ChildID AND ID = @ID`. **200** → `{ "success": true }`; `Exit Form not found` if no row was deleted. Not called by the UI.

---

## 3. Related endpoints used by the Exit Form

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/api/common-info/regions` | Region dropdown |
| GET | `/api/input-forms/history/{childId}` | Input Forms grid the form is opened from (Exit rows: `date` = `FormDate`, `exit` = `ExitDate`) |
| DELETE | `/api/input-forms/exit/{childId}/{id}` | Grid delete (generic input-form module, table `stblExitForm`) |
| POST / PUT | `/api/input-forms/exit/{childId}[/{id}]` | Generic create/update. **Not used by the UI, and it skips every Exit Form rule** (EF-GAP-01) |
