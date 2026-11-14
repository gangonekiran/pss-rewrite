# 02 — API Specification: Insurance Form

> The machine-readable OpenAPI 3.0.3 contract is [09-openapi-insurance-form.yaml](09-openapi-insurance-form.yaml). This page is the readable companion. The same endpoints are also annotated with `@swagger` comments and appear in the running API's Swagger UI at `/api-docs` under **Insurance Forms**.

Base URL: `{API_HOST}/api/insurance-forms` (mounted in [app.ts:64](../../backend/src/app.ts#L64)).
Frontend client: [insurance-form.service.ts](../../frontend/src/services/insurance-form.service.ts).

---

## 1. Conventions

| Item | Value |
| ---- | ----- |
| Authentication | **None** (IF-GAP-03) |
| Body / response casing | **PascalCase DB column names** (`FormDate`, `BillingConsent`) |
| Dates in | `YYYY-MM-DD`; must be a real calendar date |
| Dates out | As the database driver returns them, e.g. `"2026-01-15 00:00:00"` |
| Bit columns in | `true`/`false`, `1`/`0`/`-1`, `"true"`/`"false"`/`"yes"`/`"no"`; blank = false |
| Write whitelist | 15 columns in [insurance-form.config.ts](../../backend/src/modules/insurance-form/insurance-form.config.ts) `COLUMNS`; other keys, `ID`, `ChildID`, `FormType` and the legacy `InsCoNumber`, `InsuranceName`, `CoverageCode`, `Phone` are ignored silently |
| `FormType` | Always saved as `'Insurance'` |
| Consent | `BillingConsent` 1 = private insurance, 2 = Medicaid, 3 = decline. Every save clears the fields of the answer not chosen (BR-IF-35) |
| Errors | `{ "success": false, "message": "…" }`, **always HTTP 500**, even when the service intends 400 or 404 (IF-GAP-02) |

### Service error messages

| Message | Intended status | Cause |
| ------- | --------------- | ----- |
| `ChildID must be a positive integer` / `ID must be a positive integer` | 400 | Bad path parameter |
| `Client not found` | 404 | No `stblPeople` row |
| `Insurance Form not found` | 404 | No row for that `ChildID` + `ID` |
| `{Field} must use YYYY-MM-DD format` / `{Field} must be a valid date` | 400 | Bad date |
| `{Field} must be a whole number` / `{Field} must be true or false` | 400 | Bad value for the column type |
| `{Field} must be 255 characters or fewer` | 400 | Text longer than the column |
| `BillingConsent has an unknown value: {x}` | 400 | Not 1, 2 or 3 |
| `Date Completed is required` | 400 | No `FormDate` (on create, or cleared on update) |
| `Date Completed cannot be before Date of Birth` / `Parent or Guardian Signature Date cannot be before Date of Birth` | 400 | Date before the child's DOB |
| `End Date of Policy cannot be before Effective Date of Policy` | 400 | `EndDate < EffectiveDate` |
| `Choose whether Children's Integrated Services may bill insurance` | 400 | No `BillingConsent` |
| `Parent or Guardian Signature Date is required when billing is allowed` | 400 | Consent 1/2 without `ParentSignatureDate` |
| `Insurance Company Name is required when private insurance billing is allowed` | 400 | Consent 1 without `BranchAddress` |
| `Choose one reason for denying permission to bill private insurance` | 400 | Consent 3 with no reason or more than one |
| `Parent or Guardian Signature Date is required when billing is declined` | 400 | Consent 3 without `ParentSignatureDate2` |
| `Insurance Form could not be read back after saving` | 500 | Insert succeeded but the row wasn't found |

---

## 2. Endpoints

| # | Method | Path | Purpose | Used by UI |
| - | ------ | ---- | ------- | ---------- |
| 2.1 | GET | `/lookups/options` | Consent choices and decline reasons | **Yes** |
| 2.2 | GET | `/{childId}` | Client header + all Insurance Forms | **Yes** (open new/edit) |
| 2.3 | POST | `/{childId}` | Create | **Yes** |
| 2.4 | GET | `/{childId}/{id}` | One form | No |
| 2.5 | PUT | `/{childId}/{id}` | Partial update | **Yes** |
| 2.6 | DELETE | `/{childId}/{id}` | Delete | No — the grid deletes via `DELETE /api/input-forms/insurance/{childId}/{id}` |

`/lookups/options` is declared before `/{childId}` so the word isn't read as an ID.

### 2.1 GET /lookups/options

**200**

```json
{
  "billingConsent": [
    { "code": 1, "label": "My private insurance for services provided to my child for Part C Early Intervention. I understand that information about my child's early intervention services may be shared in that process." },
    { "code": 2, "label": "For services billed to Medicaid, I understand that information about my child's early intervention services may be shared in that process." },
    { "code": 3, "label": "I decline permission for Children's Integrated Services – Part C Early Intervention to bill my private insurance for services provided to my child for Part C Early Intervention." }
  ],
  "declineReasons": [
    { "field": "DeclineReasonCap", "label": "My available life-time cap would be affected" },
    { "field": "DeclineReasonBenefits", "label": "My other health insurance benefits would decrease" },
    { "field": "DeclineReasonPremium", "label": "My health insurance premiums would increase" },
    { "field": "DeclineReasonEligibility", "label": "I risk loss of eligibility for me/my child for home and community waivers" }
  ]
}
```

### 2.2 GET /{childId}

**200**

```json
{
  "client": { "ChildID": 1042, "LastName": "Austin", "FirstName": "Jane", "SS": "123-45-6789", "DOB": "2024-03-10 00:00:00" },
  "forms": [
    {
      "ID": 12, "ChildID": 1042, "FormDate": "2026-01-15 00:00:00", "FormType": "Insurance",
      "InsCoNumber": null, "InsuranceName": null, "BranchAddress": "Blue Cross Blue Shield of Vermont",
      "PolicyNumber": "P-123456", "CoverageCode": null, "EffectiveDate": "2026-01-01 00:00:00",
      "EndDate": "2026-12-31 00:00:00", "PolicyHolder": "John Austin", "GroupNumber": "G-7890",
      "GroupName": "Acme Manufacturing", "Phone": null, "BillingConsent": 1,
      "ParentSignatureDate": "2026-01-15 00:00:00", "DeclineReasonCap": false, "DeclineReasonPremium": false,
      "DeclineReasonBenefits": false, "DeclineReasonEligibility": false, "ParentSignatureDate2": null,
      "InsertDate": "…", "InsertUser": "…", "LastUpdateDate": "…", "LastUpdateUser": "…"
    }
  ]
}
```

Forms are ordered `FormDate` (nulls last) descending, then `ID` descending: the same order FITP uses to pick the current form.

### 2.3 POST /{childId}

Body: any subset of the whitelisted columns. Example as sent by the UI for **private insurance**:

```json
{
  "FormDate": "2026-01-15",
  "BranchAddress": "Blue Cross Blue Shield of Vermont",
  "PolicyNumber": "P-123456",
  "GroupNumber": "G-7890",
  "GroupName": "Acme Manufacturing",
  "EffectiveDate": "2026-01-01",
  "EndDate": "2026-12-31",
  "PolicyHolder": "John Austin",
  "BillingConsent": 1,
  "ParentSignatureDate": "2026-01-15",
  "DeclineReasonCap": false,
  "DeclineReasonPremium": false,
  "DeclineReasonBenefits": false,
  "DeclineReasonEligibility": false,
  "ParentSignatureDate2": null
}
```

Example for a **decline**:

```json
{
  "FormDate": "2026-01-15",
  "BillingConsent": 3,
  "ParentSignatureDate": null,
  "DeclineReasonCap": false,
  "DeclineReasonPremium": true,
  "DeclineReasonBenefits": false,
  "DeclineReasonEligibility": false,
  "ParentSignatureDate2": "2026-01-15"
}
```

Processing:

1. Validate `childId`; load the client (404 if missing).
2. Parse every known key by column type; drop unknown keys, `ID`, `ChildID`, `FormType` and the legacy columns; check `BillingConsent`.
3. Clear the other answer's fields (BR-IF-35).
4. Validate dates and the consent rules against the client's DOB.
5. `INSERT … (ChildID, FormType = 'Insurance', …) OUTPUT INSERTED.ID`, then re-read.

**201** → the full new row (as in 2.2 `forms[]`).

### 2.4 GET /{childId}/{id}

**200** → one row. Errors: `Client not found`, `Insurance Form not found` (sent as 500).

### 2.5 PUT /{childId}/{id}

Body: the keys to change (partial update). The same parsing runs on the body; clearing uses the body's `BillingConsent`, or the saved one when the body doesn't change it; validation runs on the saved row merged with the body. `LastUpdateDate = GETDATE()`, `LastUpdateUser = SUSER_SNAME()`.

Example: switching a private-insurance form to a **decline** —

```json
{ "BillingConsent": 3, "DeclineReasonPremium": true, "ParentSignatureDate2": "2026-02-01" }
```

is stored with `ParentSignatureDate = NULL` and the premium reason set. Sending `{ "DeclineReasonCap": true }` alone to a private-insurance form stores the reason as 0 (the saved consent is 1).

**200** → the updated row.

### 2.6 DELETE /{childId}/{id}

`DELETE … WHERE ChildID = @ChildID AND ID = @ID`. **200** → `{ "success": true }`; `Insurance Form not found` if no row was deleted. Not called by the UI.

---

## 3. Related endpoints used by the Insurance Form

| Method | Path | Purpose |
| ------ | ---- | ------- |
| GET | `/api/input-forms/history/{childId}` | Input Forms grid the form is opened from (Insurance rows: `date` = `FormDate`, `formType` = `'Insurance'`) |
| DELETE | `/api/input-forms/insurance/{childId}/{id}` | Grid delete (generic input-form module, table `stblInsuranceForm`) |
| POST / PUT | `/api/input-forms/insurance/{childId}[/{id}]` | Generic create/update. **Not used by the UI, and it skips every Insurance Form rule** (IF-GAP-01) |
