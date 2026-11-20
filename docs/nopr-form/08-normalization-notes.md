# 08 — Normalization Notes: NOPR Form

A review of `stblNoOnePlanForm` against the normal forms. Apart from the new `InitialEvalDate` column, nothing here is implemented: the new form keeps the legacy table as it is, because the FITP extract, the loop views and the legacy reports read it directly.

---

## 1. Summary

| Level | Met? | Main issue |
| ----- | :--: | ---------- |
| 1NF | Yes | Every column holds one value; no repeating groups |
| 2NF | Yes | Single-column key (`ID`) |
| 3NF | Partly | `FormDate` is now a copy of `StatusDate` (N1); dead legacy columns (N3) |

## 2. First normal form (atomic values, no repeating groups)

Met. `RefStatus` is one code and `Screening` one code; there are no numbered or flag-per-option columns. The new `InitialEvalDate` is a single date.

## 3. Second normal form

The key is the single column `ID`, so there are no partial dependencies. `ChildID` + `FormDate` is not unique (a client can have two NOPR forms on the same day).

## 4. Third normal form (no transitive dependencies, no stored derived data)

| # | Dependency | Problem | Recommendation |
| - | ---------- | ------- | -------------- |
| N1 | `StatusDate → FormDate` | `FormDate` is now always equal to `StatusDate` **[Decision]**: stored derived data. The database can't stop them from drifting (the generic Input Forms route can still write `FormDate`, NOPR-GAP-01). It is kept because every legacy view and FITP read `FormDate`. | Keep the copy while the legacy views exist; later make `FormDate` a computed column or point the views at `StatusDate`. |
| N2 | `ChildID → DOB`, `ChildID → latest referral date` | Not stored on the row (good): the rules read them from `stblPeople` and `stblReferralForm` when saving. | — |

## 5. Other design notes

| # | Note | Recommendation |
| - | ---- | -------------- |
| N3 | `MonthReporting`, `Screening` and `ReferredBack` are no longer written **[Request]**, but `Get_NOPR_Forms_rpt` still returns them. New rows hold NULL / `0`. | Drop them from the report, then from the table once no report needs them. |
| N4 | `RefStatus` is a bare `int` with no lookup or check constraint; code 8 is only in code, code 7 is retired. | `slstNoprReason (Code, Label, Inactive, SortOrder)` and an FK; or at least `CHECK (RefStatus BETWEEN 1 AND 8)` and an updated description (NOPR-GAP-10). |
| N5 | `Region` has no FK to `stblReportingRegion`. | Add the FK (`WITH CHECK`) after cleaning orphans. |
| N6 | The Date of Initial Evaluation is also recorded on the Active form (`stblActiveForm.InitialEvalDate`) for children who got a plan. The two forms are exclusive per referral, so it is the same fact stored in two tables depending on the outcome. | Acceptable for the legacy design; a shared referral/episode table would hold it once. |
| N7 | No index on `ChildID`; FK not trusted. | See [07-erd.md](07-erd.md) §3. |
