# 02 — API Specification

> The machine-readable OpenAPI 3.0.3 contract for these endpoints is [09-openapi-client.yaml](09-openapi-client.yaml). This page is the readable companion.

Base URL: `{API_HOST}/api/clients` (mounted in [app.ts](../../backend/src/app.ts#L54)).
Swagger UI: `{API_HOST}/api-docs` · JSON: `{API_HOST}/api-docs/swagger.json`.
Frontend client: [client.service.ts](../../frontend/src/services/client.service.ts) (Axios instance `api`, base `/api`).

---

## 1. Conventions

| Item             | Value |
| ---------------- | ----- |
| Content type     | `application/json` |
| Authentication   | **None** on these routes today (see [BR-SEC-01](03-business-rules.md#9-security-and-privacy)). |
| Request casing   | camelCase (`lastName`, `firstName`, …) |
| Response casing  | Client rows: **PascalCase** DB column names (`ChildID`, `LastName`, …). Status and service history: camelCase. |
| Dates in         | `YYYY-MM-DD` strings |
| Dates out        | ISO-8601 strings from `mssql` (e.g. `2020-01-15T00:00:00.000Z`) |
| IDs              | `ChildID` — integer |

### Error envelope

All unhandled errors go through [error.middleware.ts](../../backend/src/middleware/error.middleware.ts):

```json
{ "success": false, "message": "<error message>" }
```

**Status code is always `500`**, including validation errors thrown with `status: 400` by `updateClient`. The only true `400` is the explicit `Invalid ChildID` check in `GET /:id/status`, which returns `{ "message": "Invalid ChildID" }` (no `success` field).

---

## 2. Endpoints

### Summary

| #    | Method | Path                                   | Purpose                              | Used by frontend |
| ---- | ------ | -------------------------------------- | ------------------------------------ | ---------------- |
| 2.1  | GET    | `/api/clients`                         | List all clients                     | `getAll` (not used by the feature UI) |
| 2.2  | GET    | `/api/clients/search/lastname`         | Prefix search by last name           | ClientLookup |
| 2.3  | GET    | `/api/clients/search/firstname`        | Prefix search by first name          | ClientLookup |
| 2.4  | GET    | `/api/clients/search/ssn`              | Contains search by SSN               | ClientLookup |
| 2.5  | GET    | `/api/clients/regions`                 | Active reporting regions             | Not used (UI uses `/api/common-info/regions`) |
| 2.6  | GET    | `/api/clients/{id}`                    | Get one client                       | ClientLookup |
| 2.7  | POST   | `/api/clients`                         | Create client                        | ClientActions |
| 2.8  | PUT    | `/api/clients/{id}`                    | Update client                        | ClientActions |
| 2.9  | DELETE | `/api/clients/{id}`                    | Delete client                        | ClientActions |
| 2.10 | GET    | `/api/clients/{id}/status`             | Status + milestone dates as of date  | ClientStatus |
| 2.11 | GET    | `/api/clients/{id}/service-history`    | Services from Service Grid forms     | ClientStatus |

---

### 2.1 GET /api/clients

Returns every row of `stblPeople`, ordered by `LastName, FirstName`.

**Response 200** — array of [ClientRow](#3-schemas).

```sql
SELECT * FROM stblPeople ORDER BY LastName, FirstName
```

> No paging or row limit. Returns SSNs in bulk.

---

### 2.2 GET /api/clients/search/lastname

| Param    | In    | Type   | Required | Notes |
| -------- | ----- | ------ | -------- | ----- |
| `search` | query | string | Yes (empty → matches all) | Prefix; SQL wildcards `%` `_` in input are honoured |

**Response 200**

```json
[ { "ChildID": 101, "LastName": "Smith", "FirstName": "Anna" } ]
```

```sql
SELECT TOP 20 ChildID, LastName, FirstName
FROM stblPeople
WHERE LastName LIKE @search      -- @search = '<input>%'
ORDER BY LastName, FirstName
```

---

### 2.3 GET /api/clients/search/firstname

Same as 2.2 on `FirstName`; ordered `FirstName, LastName`.

```json
[ { "ChildID": 101, "FirstName": "Anna", "LastName": "Smith" } ]
```

---

### 2.4 GET /api/clients/search/ssn

| Param    | In    | Type   | Required | Notes |
| -------- | ----- | ------ | -------- | ----- |
| `search` | query | string | Yes | **Contains** match: `@search = '%<input>%'`, bound as `VarChar(20)` |

```json
[ { "ChildID": 101, "SS": "123-45-6789", "FirstName": "Anna", "LastName": "Smith" } ]
```

---

### 2.5 GET /api/clients/regions

```json
[ { "ID": 1, "RName": "Burlington", "Description": "Chittenden", "Inactive": false } ]
```

```sql
SELECT ID, RName, Description, Inactive
FROM stblReportingRegion WHERE Inactive = 0 ORDER BY RName
```

---

### 2.6 GET /api/clients/{id}

| Param | In   | Type    | Required |
| ----- | ---- | ------- | -------- |
| `id`  | path | integer | Yes |

**Response 200** — one [ClientRow](#3-schemas).

**Not found:** returns `200` with an **empty body** (repository returns `undefined`). Swagger documents `404`, which is not implemented.

---

### 2.7 POST /api/clients

**Request body** — [ClientRequest](#3-schemas). `lastName` and `firstName` are expected but **not validated** server-side.

```json
{
  "region": 3,
  "lastName": "Smith",
  "firstName": "Anna",
  "ss": "123-45-6789",
  "ssTemp": false,
  "dob": "2023-04-12",
  "gender": "F",
  "notes": "",
  "nonEarlyIntervention": false
}
```

**Server-side transformation**

| Field                 | Transformation |
| --------------------- | -------------- |
| `region`              | `undefined` / `null` / `""` → `NULL`; else `Number(region)` |
| `lastName`, `firstName`, `ss` | trimmed; empty → `NULL` |
| `ssTemp`, `nonEarlyIntervention` | `=== true` → `1`, anything else → `0` |
| `dob`                 | trimmed; `TRY_CONVERT(datetime2(0), @DOB, 23)` — invalid → `NULL` silently |
| `gender`              | trimmed, first character only |
| `notes`               | trimmed; empty → `NULL` |
| `insertUser`          | default `'SYSTEM'` |

**Response 201**

```json
{ "message": "Client created" }
```

> The repository returns the inserted row (`OUTPUT INSERTED.*`) but the controller discards it, so the caller never learns the new `ChildID`.

---

### 2.8 PUT /api/clients/{id}

**Request body** — [ClientRequest](#3-schemas).

**Validation**

| Rule | Error |
| ---- | ----- |
| `lastName` blank | `"LastName is required"` (tagged 400, **returned as 500**) |
| `firstName` blank | `"FirstName is required"` (tagged 400, **returned as 500**) |
| `dob` not `YYYY-MM-DD` | SQL conversion error → `500` |

**Behaviour:** full replace of all editable columns (`Region, LastName, FirstName, SS, SSTemp, DOB, Gender, Notes, NonEarlyIntervention`), plus `LastUpdateDate = GETDATE()`, `LastUpdateUser = lastUpdateUser ?? 'SYSTEM'`. Omitted optional fields become `NULL` / `0`.

Updating a non-existent id affects 0 rows and still returns success.

**Response 200**

```json
{ "message": "Client updated" }
```

---

### 2.9 DELETE /api/clients/{id}

Hard delete: `DELETE FROM stblPeople WHERE ChildID = @ChildID`.

**Response 200** `{ "message": "Client deleted" }` — also returned when the id does not exist.

> **Cascade (confirmed from DDL):** the database deletes every row for this child in `stblReferralForm`, `stblActiveForm`, `stblNoOnePlanForm`, `stblExitForm`, `stblCOSCoverForm` (→ `stblCOSCoverSource`, `stblCOSCoverTeam`), `stblServiceGridForm` (→ `stblServices`) and `stblInsuranceForm`. Rows in `Loops`, `Services`, `stblAudit`, `stblLoopErrors` and the diagnostics tables are left orphaned. This endpoint is unauthenticated (BR-SEC-01).

---

### 2.10 GET /api/clients/{id}/status

| Param  | In    | Type          | Required | Default |
| ------ | ----- | ------------- | -------- | ------- |
| `id`   | path  | integer       | Yes      | — |
| `date` | query | `YYYY-MM-DD`  | No       | Server's current **UTC** date |

**Response 200**

```json
{
  "notes": "Family prefers morning visits",
  "status": "aop",
  "referralDate": "2025-02-03T00:00:00.000Z",
  "noOnePlanDate": null,
  "interimDate": "2025-02-20T00:00:00.000Z",
  "onePlanDate": "2025-03-10T00:00:00.000Z",
  "exitDate": null
}
```

**Response 400** `{ "message": "Invalid ChildID" }` when `id` is `0`, non-numeric or missing.

**Derivation** (all filtered by `ChildID = @id` and `<= @date`):

| Output          | Source |
| --------------- | ------ |
| `notes`         | `stblPeople.Notes` (not date-filtered) |
| `status`        | `FormType` of the most recent row across `stblActiveForm`, `stblNoOnePlanForm`, `stblCOSCoverForm`, `stblExitForm`, `stblReferralForm`, `stblServiceGridForm`, `stblInsuranceForm` by `FormDate DESC, RecordID DESC` |
| `referralDate`  | `MAX(stblActiveForm.ReferralDate)` |
| `noOnePlanDate` | `MAX(stblNoOnePlanForm.StatusDate)` |
| `interimDate`   | `MAX(stblActiveForm.InterimDate)` |
| `onePlanDate`   | `MAX(stblCOSCoverForm.OnePlanDate)` |
| `exitDate`      | `MAX(stblExitForm.ExitDate)` |

A non-existent client returns all-null fields with `notes: ""` (not 404).

> **Legacy difference:** the Access-era procedure `GetClientFormStats_rpt` used only the Referral, Active, Exit and No One Plan forms (filtered on `FormDate`) and returned labels (`Referred In Process`, `Active`, `Exited`, `No One Plan Resulting`). It also took the Referral Date from the Referral form and the One Plan Date from `stblActiveForm.InitialMeetingDate`. See [Business Rules §5.2](03-business-rules.md#52-legacy-rule-getclientformstats_rpt-parameters-txtchildid-txtstatusdate) and BR-GAP-21.

---

### 2.11 GET /api/clients/{id}/service-history

| Param  | In    | Type         | Required |
| ------ | ----- | ------------ | -------- |
| `id`   | path  | integer      | Yes |
| `date` | query | `YYYY-MM-DD` | No — when present, `FormDate <= date` |

**Response 200**

```json
[
  {
    "id": 5521,
    "date": "2025-03-10T00:00:00.000Z",
    "serviceName": "Speech Therapy",
    "frequency": "1x/week",
    "consent": "Yes",
    "casePlan": ""
  }
]
```

```sql
SELECT s.ID, sgf.FormDate, sn.SvcName, s.Frequency,
       CASE WHEN s.ConsentDate IS NOT NULL THEN 'Yes' ELSE 'Pending' END,
       CAST(NULL AS varchar(50))                       -- CasePlan placeholder
FROM stblServiceGridForm sgf
JOIN Services s           ON s.ServiceGridID = sgf.ServiceGridID
LEFT JOIN slstServiceNames sn ON sn.SvcCode = s.SvcCode
WHERE sgf.ChildID = @ChildID [AND sgf.FormDate <= @StatusDate]
ORDER BY sgf.FormDate DESC, s.ID DESC
```

> No validation of `id`; `NaN` reaches SQL as `NULL` and returns `[]`.
>
> **Source table:** `Services` is the reporting-warehouse copy (no FKs, nullable `ID`). The live table is `stblServices`, which has no `Frequency` or `ConsentDate`. The legacy procedure `GetServiceHistory_rpt` read `stblServices`, excluded `OutcomeStatus = 3`, filtered on `stblServiceGridForm.ConsentDate ≤ date`, and sorted by `slstServiceNames.SortOrder`. See BR-GAP-20 and [Business Rules §5.3](03-business-rules.md#53-service-history).

---

## 3. Schemas

### ClientRequest (camelCase — POST/PUT body)

Defined in [client.types.ts](../../backend/src/modules/client/client.types.ts) and [types/client.ts](../../frontend/src/types/client.ts).

| Property               | Type              | Required | Notes |
| ---------------------- | ----------------- | -------- | ----- |
| `childId`              | integer           | No       | Ignored by the server (id comes from the URL) |
| `region`               | integer \| string | No       | Region ID |
| `lastName`             | string            | Yes      | |
| `firstName`            | string            | Yes      | |
| `ss`                   | string            | No       | |
| `ssTemp`               | boolean           | No       | |
| `dob`                  | `YYYY-MM-DD`      | No       | |
| `gender`               | `"M"` \| `"F"`    | No       | First char kept |
| `notes`                | string            | No       | |
| `nonEarlyIntervention` | boolean           | No       | |
| `insertUser`           | string            | No       | POST only; default `SYSTEM` |
| `lastUpdateUser`       | string            | No       | PUT only; default `SYSTEM` |

### ClientRow (PascalCase — GET responses)

`SELECT *` of `stblPeople`. See [Data Dictionary §2.1](04-data-dictionary.md#21-stblpeople-client--owned-by-this-module). The frontend maps it to `Client` in `ClientService.mapClient`.

### ClientStatus, ServiceHistoryItem, Region

As shown in 2.10, 2.11 and 2.5.

---

## 4. Related endpoints called by the client feature

| Method | Path | Caller | Module |
| ------ | ---- | ------ | ------ |
| GET    | `/api/common-info/regions`                    | ClientPage, ClientLookup | common-info |
| GET    | `/api/input-forms/history/{childId}`          | InputForms               | input-form |
| POST   | `/api/input-forms/{form}/{childId}`           | InputFormEditor          | input-form |
| PUT    | `/api/input-forms/{form}/{childId}/{id}`      | InputFormEditor          | input-form |
| DELETE | `/api/input-forms/{form}/{childId}/{id}`      | InputForms               | input-form |

`{form}` ∈ `active`, `cos-cover`, `exit`, `insurance`, `no-one-plan`, `referral`, `service-grid`.

---

## 5. Swagger vs implementation differences

| Item | Swagger says | Code does |
| ---- | ------------ | --------- |
| `Client.Region` | `string` (`"Region 1"`) | Integer region ID |
| `Client.SSTemp` | `string` | `bit` / boolean |
| `GET /{id}` not found | `404` | `200`, empty body |
| `POST` response | `Client` schema | `{ message }` |
| `PUT` response | `Client` schema | `{ message }` |
| `PUT` `400` | documented | returned as `500` |
| `DELETE` / `PUT` `404` | documented | never returned |
| `Client.Gender` | `"M"` example | DB also allows `U` (Unknown) |
| `Client.SS` example | `123-45-6789` | FITP extract expects 9 digits without dashes |

## 6. Proposed endpoint (not needed)

| Method | Path | Body | Purpose |
| ------ | ---- | ---- | ------- |
| ~~PATCH~~ | ~~`/api/clients/{id}/notes`~~ | — | **Not implemented by decision:** notes are saved only by Done through `PUT /api/clients/{id}` / `POST /api/clients`. Original proposal: |
| PATCH | `/api/clients/{id}/notes` | `{ "notes": string }` | Save Client Status notes to `stblPeople.Notes` (`nvarchar(max)`, bind as `NVarChar(MAX)`) without overwriting other columns. Sets `LastUpdateDate`/`LastUpdateUser`. Returns the updated `notes`. |
