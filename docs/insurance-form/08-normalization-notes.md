# 08 — Normalization Notes: Insurance Form

A review of `stblInsuranceForm` against the normal forms. Nothing here is implemented: the new form keeps the legacy table as it is, because the FITP extract and the legacy reports read it directly.

---

## 1. Summary

| Level | Met? | Main issue |
| ----- | :--: | ---------- |
| 1NF | Partly | The decline reasons are a repeating group of four flag columns (N1) |
| 2NF | Yes | Single-column key (`ID`) |
| 3NF | Partly | Two consent answers share the row with fields that only apply to one of them (N3); legacy free-text name in a misnamed column (N4) |

## 2. First normal form (atomic values, no repeating groups)

| # | Finding | Detail | Recommendation |
| - | ------- | ------ | -------------- |
| N1 | **Repeating group of flags** | `DeclineReasonCap`, `DeclineReasonPremium`, `DeclineReasonBenefits`, `DeclineReasonEligibility`: one column per reason. Adding a reason means changing the schema, and the columns can hold any combination (the new form allows only one). | `slstDeclineReason` + one `DeclineReasonID` column (one reason) or `stblInsuranceFormDeclineReason(InsuranceFormID, ReasonID)` (several). |
| N2 | **Numbered columns for the same fact** | `ParentSignatureDate` and `ParentSignatureDate2` are both "the date the parent signed", for different answers. Only one is ever meaningful. | One `ParentSignatureDate` column; the consent says what was signed. |

## 3. Second normal form

The key is the single column `ID`, so there are no partial dependencies. `ChildID` + `FormDate` is not unique (a client can have two forms on the same day; FITP breaks the tie by `ID`).

## 4. Third normal form (no transitive dependencies, no stored derived data)

| # | Dependency | Problem | Recommendation |
| - | ---------- | ------- | -------------- |
| N3 | `BillingConsent → {ParentSignatureDate}` or `{DeclineReason*, ParentSignatureDate2}` | Which columns are meaningful depends on another column. The database can't stop a row from holding both answers; the application clears them (BR-IF-35). | A check constraint per answer, or split the consent into its own table (`stblInsuranceConsent(InsuranceFormID, ConsentCode, SignedDate, DeclineReasonID)`). |
| N4 | `InsCoNumber → InsName` (in `slstInsuranceCodes`) vs `InsuranceName` / `BranchAddress` | The company is recorded three ways: a code, a name column and free text in `BranchAddress`. They can disagree. | One company reference (code to a maintained lookup) or one free-text name in a correctly named column (`InsuranceCompanyName`). |
| N5 | `CoverageCode → CoverageName` | Fine as a code, but the form column is `nvarchar(5)` while the lookup key is `nvarchar(255)` and there's no FK. | Match the types and add the FK if the field comes back. |

## 5. Other design notes

| # | Note | Recommendation |
| - | ---- | -------------- |
| N6 | `BillingConsent` is a bare `int` with no lookup or check constraint; NULL means "Bill" to FITP. | `CHECK (BillingConsent IN (1,2,3))` and NOT NULL once legacy rows are cleaned, plus a lookup table (see [07-erd.md](07-erd.md) §3). |
| N7 | `BranchAddress` holds the company name; the column name no longer describes its content. | Rename (or add a view) when the reports can be changed. |
| N8 | Text columns are `nvarchar(255)` but FITP sends 20 / 16 characters of Policy # / Group #. | Align the column sizes with what FITP accepts, or document the truncation (IF-GAP-07). |
| N9 | No index on `ChildID`; FK not trusted. | See [07-erd.md](07-erd.md) §3. |
