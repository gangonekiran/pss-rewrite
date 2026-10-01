# 02 — API Specification: Active Form

> The machine-readable OpenAPI 3.0.3 contract is [09-openapi-active-form.yaml](09-openapi-active-form.yaml). This page is the readable companion.

Base URL: `{API_HOST}/api/active-forms` (mounted in [app.ts](../../backend/src/app.ts#L58)).
Frontend client: [active-form.service.ts](../../frontend/src/services/active-form.service.ts).
Not in Swagger UI today (no `@swagger` annotations — AF-GAP-18).

---

## 1. Conventions

| Item | Value |
| ---- | ----- |
| Authentication | **None** (AF-GAP-06) |
| Body / response casing | **PascalCase DB column names** (`ReferralDate`), plus two camelCase aliases accepted on write: `status` → `FormType`, `onePlanDate` → `InitialMeetingDate` |
| Dates in | `YYYY-MM-DD` (checked for `ReferralDate`, `InitialEvalDate`, `InitialMeetingDate`) |
| Dates out | ISO-8601 (`2025-02-03T00:00:00.000Z`) |
| Write whitelist | 65 columns in [active-form.config.ts](../../backend/src/modules/active-form/active-form.config.ts); others ignored silently |
| Errors | `{ "success": false, "message": "…" }`, **always HTTP 500**, even when the service intends 400 or 404 (AF-GAP-13) |

### Service error messages

| Message | Intended status | Cause |
| ------- | --------------- | ----- |
| `ChildID must be a positive integer` / `ID must be a positive integer` | 400 | Bad path parameter |
| `Client not found` | 404 | No `stblPeople` row |
| `Active Form not found` | 404 | No row for that `ChildID` + `ID` |
| `Region must be selected` | 400 | `Region: ""` on create |
| `{Field} must use YYYY-MM-DD format` / `{Field} must be a valid date` | 400 | Bad date |
| `ReferralDate cannot be before child DOB` (also `InitialEvalDate`, `OnePlanDate`) | 400 | Date before DOB |
| `Town was not found in slstTownCodes` | 400 | Unknown `Town` |

---

## 2. Endpoints

| # | Method | Path | Purpose | Used by UI |
| - | ------ | ---- | ------- | ---------- |
| 2.1 | GET | `/lookups/supervisory-unions` | Active supervisory unions | No |
| 2.2 | GET | `/lookups/towns?search=` | Towns with county | No |
| 2.3 | GET | `/lookups/service-coordinator-types` | Coordinator types | No |
| 2.4 | GET | `/lookups/delay-reasons` | Family and provider delay reasons | **Yes** |
| 2.5 | GET | `/{childId}` | Client header + all Active Forms | **Yes** (open new/edit) |
| 2.6 | POST | `/{childId}` | Create | **Yes** |
| 2.7 | GET | `/{childId}/{id}` | One form | No |
| 2.8 | PUT | `/{childId}/{id}` | Partial update | **Yes** |
| 2.9 | DELETE | `/{childId}/{id}` | Delete | No — the grid deletes via `DELETE /api/input-forms/active/{childId}/{id}` |

The `/lookups/*` routes are declared before `/{childId}` so `lookups` isn't parsed as an ID.

### 2.1 GET /lookups/supervisory-unions

```sql
SELECT SU_id, SUName, SortOrder FROM dbo.slstSU WHERE Inactive = 0
ORDER BY CASE WHEN SortOrder IS NULL THEN 1 ELSE 0 END, SortOrder, SUName
```

```json
[ { "SU_id": 12, "SUName": "Chittenden South", "SortOrder": 1 } ]
```

### 2.2 GET /lookups/towns

| Param | In | Required | Notes |
| ----- | -- | -------- | ----- |
| `search` | query | No | Contains-match on `TownName` or `Town` |

```json
[ { "Town": "BUR", "TownName": "Burlington", "SU_id": 17, "CountyCode": "CH", "CountyName": "Chittenden" } ]
```

### 2.3 GET /lookups/service-coordinator-types

```json
[ { "SvcCordType": 1, "SvcCordTypeDesc": "EI" } ]
```

### 2.4 GET /lookups/delay-reasons

```json
{
  "family":   [ { "Reason": "Family scheduling" } ],
  "provider": [ { "Reason": "Staff availability" } ]
}
```

Values come from `slstActiveDelayFC` / `slstActiveDelayNFC` ordered by `Reason` (examples are illustrative). The UI adds "Auto Eligible" to `family` for the Initial Evaluation.

### 2.5 GET /{childId}

Returns the client header and every Active Form for that client, newest referral first (`ORDER BY ReferralDate IS NULL, ReferralDate DESC, ID DESC`).

```json
{
  "client": {
    "ChildID": 1042, "Region": 3, "LastName": "Smith", "FirstName": "Anna",
    "SS": "123456789", "SSTemp": false, "DOB": "2024-04-12T00:00:00.000Z",
    "Gender": "F", "Notes": null, "NonEarlyIntervention": false
  },
  "forms": [
    {
      "ID": 881, "ChildID": 1042, "FormDate": "2025-03-31T00:00:00.000Z", "FormType": "aop",
      "Region": 3, "ReferralDate": "2025-02-03T00:00:00.000Z",
      "InitialEvalDate": "2025-02-20T00:00:00.000Z", "DelayFC": null, "DelayNotFC": null,
      "InitialMeetingDate": "2025-03-10T00:00:00.000Z",
      "DDCommunication": true, "DCAutism": true, "AutismDate": "2025-01-15T00:00:00.000Z",
      "DCOtherDesc": "NMNEI", "…": "all other stblActiveForm columns"
    }
  ]
}
```

### 2.6 POST /{childId}

Body: any subset of the whitelisted columns (plus aliases). Example as sent by the UI:

```json
{
  "FormDate": "2026-10-01",
  "Region": 3,
  "SvcCordFirstName": "",
  "SvcCordLastName": "",
  "ReferralDate": "2025-02-03",
  "status": "aop",
  "InitialEvalDate": "2025-02-20",
  "DelayFC": null, "DelayNotFC": null,
  "MeetingDelayFC": null, "MeetingDelayNC": null,
  "InitialMeetingDate": "2025-03-10",
  "DDAll": false, "DDAdaptive": false, "DDCognitive": false, "DDCommunication": true,
  "DDMotor": false, "DDSocial": false, "DCAttachment": false, "DCAutism": true,
  "DCSuspected": false, "DCBlind": false, "DCDeaf": false, "DCDown": false,
  "DCCerebral": false, "DCCraniofacial": false, "DCFragile": false, "DCOral": false,
  "DCBirth": false, "DCOtherDesc": "NMNEI",
  "AutismDate": "2025-01-15", "SuspectedDate": null, "BlindDate": null, "DeafDate": null
}
```

Processing:

1. Validate `childId`; load the client (404 if missing).
2. Apply aliases (`status`, `onePlanDate`).
3. Reject `Region: ""`; validate the three main dates (format, and not before DOB).
4. If `Town` is present, resolve it in `slstTownCodes` and set `Town`, `CountyCode` and `SU_id` (when not supplied).
5. Drop non-whitelisted keys, `ID` and `ChildID`; `INSERT … OUTPUT INSERTED.ID`.

**201** → the full new row (as in 2.5 `forms[]`).

### 2.7 GET /{childId}/{id}

**200** → one row. Errors: `Client not found`, `Active Form not found` (sent as 500).

### 2.8 PUT /{childId}/{id}

Body: the keys to change (partial update). Date checks run on the existing row merged with the body. `LastUpdateDate = GETDATE()`. An empty body (after whitelisting) changes nothing.

**200** → the updated row.

### 2.9 DELETE /{childId}/{id}

`DELETE … WHERE ChildID = @ChildID AND ID = @ID`. **200** → `{ "success": true }`; `Active Form not found` if no row was deleted.

---

## 3. Related endpoints used by the Active Form

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/api/common-info/regions` | Region dropdown |
| GET | `/api/input-forms/history/{childId}` | Grid the form is opened from |
| DELETE | `/api/input-forms/active/{childId}/{id}` | Grid delete (generic input-form module, table `stblActiveForm`) |
