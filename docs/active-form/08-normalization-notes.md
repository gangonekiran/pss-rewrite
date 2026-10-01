# 08 — Normalization Notes: Active Form

Normal-form review of `stblActiveForm` and its lookups, based on the `dbCDD` DDL. The table was migrated from an Access form one-to-one: one wide row per paper form (72 columns). That suits data entry but contains every classic anomaly below.

---

## 1. Summary

| Table | 1NF | 2NF | 3NF | Main issue |
| ----- | :-: | :-: | :-: | ---------- |
| `stblActiveForm` | ❌ | ✅ | ❌ | Repeating flag groups; multi-valued `DCOtherDesc`; stored derived values; transitive dependencies (SU name, county); data copied from other forms |
| `slstActiveDelayFC` / `NFC` | ✅ | ✅ | ✅ | Natural text key used as FK by value; two tables for one concept |
| `slstSU`, `slstTownCodes`, `slstCounties`, `slstSvcCordType`, `slstEthnicity` | ✅ | ✅ | ✅ | No FKs from the form |

---

## 2. First normal form (atomic values, no repeating groups)

| # | Finding | Detail | Recommendation |
| - | ------- | ------ | -------------- |
| N1 | **Repeating group of condition flags** | 6 `DD*` + 12 `DC*` bit columns, plus 9 more conditions in the new UI with **no columns at all** (AF-GAP-02). Adding a condition means changing the schema. | `slstEligibilityCondition(ConditionCode PK, Label, Category 'DD'/'DC', SortOrder, Inactive)` and `stblActiveFormCondition(ActiveFormID FK, ConditionCode FK, DiagnosisDate NULL)`. |
| N2 | **Diagnosis dates tied to 4 specific flags** | `AutismDate`, `SuspectedDate`, `BlindDate`, `DeafDate` each belong to one flag. | Becomes `DiagnosisDate` on the condition row (N1). |
| N3 | **Multi-valued text field** | `DCOtherDesc` holds free text **and** a marker line `NMNEI` (AF-GAP-10). | Store NMNEI as its own column or condition; keep `DCOtherDesc` for text only. |
| N4 | **Two delay milestones as column pairs** | `DelayFC/DelayNotFC/+Other` and `MeetingDelayFC/MeetingDelayNC/+Other`: the same structure twice, with a mutually-exclusive FC/NC pair. | `stblActiveFormDelay(ActiveFormID, Milestone 'EVAL'/'MEETING', ReasonID FK, Details)`; the reason's category (family vs provider) comes from the lookup. |

## 3. Second normal form

✅ The PK is the single column `ID`, so there are no partial dependencies.

## 4. Third normal form (no transitive dependencies, no stored derived data)

| # | Dependency | Problem | Recommendation |
| - | ---------- | ------- | -------------- |
| N5 | `SU_id → SUName` | `SUName` copied from `slstSU`; can disagree after a rename | Drop `SUName` (join to `slstSU`) or treat it as a deliberate historical snapshot |
| N6 | `Town → CountyCode` (and `Town → SU_id`) | County and SU are derivable from the town (`slstTownCodes`); the backend already derives them | Store `Town` only, or keep the copies as a snapshot and document it |
| N7 | `ReferralDate, InitialEvalDate → EvalWithin45Days → InitEval45Compliant/FC/NC` | Derived values stored; legacy entry had to keep them in sync by hand, and the new UI never sets them (AF-GAP-04) | Compute on read (view/report) **or** derive in the backend on every save, never by hand |
| N8 | `ReferralDate, InitialMeetingDate → MeetingWithin45Days → InitMeeting45*`; `Eval* + Meeting* → Both*` | Same as N7 | Same |
| N9 | `FormType` (`aop-capta`) ↔ `CAPTA` | The new UI puts CAPTA into `FormType` while the `CAPTA` column exists: the same fact in two places, and `FormType` no longer identifies the table (AF-GAP-03) | `FormType = 'Active'`, `CAPTA = -1/0` |
| N10 | `DDAll` vs the 5 individual `DD*` flags | Does "All" imply the five? Not defined; they can contradict | Define the rule: derive `DDAll`, or make it exclusive |

## 5. Data duplicated from other entities

| Column on `stblActiveForm` | Also stored in | Risk | Recommendation |
| -------------------------- | -------------- | ---- | -------------- |
| `ReferralDate`, `ReReferralDate` | `stblReferralForm` | Legacy loop logic needs an **exact match** (`LoopAB`); free entry breaks it (AF-GAP-05) | Copy from the Referral form (read-only), or store `ReferralFormID` as an FK |
| `Region` | `stblPeople.Region`, other forms | Region at time of form vs current region | Keep as a snapshot (intended) |
| `Ethnicity`, `SvcCord*`, `Address`, `ZipCode`, `Town` | `stblReferralForm` | Can diverge between forms | Keep as snapshots, or source from the Referral form |
| NMNEI marker | `stblPeople.NonEarlyIntervention`, `stblReferralForm.NonEarlyIntervention` | Three places for one fact | Pick one system of record |

## 6. Keys and domains

| # | Finding | Recommendation |
| - | ------- | -------------- |
| N11 | Delay reasons are stored as **text** matching a text PK (`Reason nvarchar(255)`) in a column of only `nvarchar(50)`; "Auto Eligible" isn't in the lookup | Surrogate `ReasonID int` + FK; one `slstActiveDelayReason` table with a `Category` column |
| N12 | Yes/No stored two ways: `int -1/0` (`CAPTA`, `EvalWithin45Days`, `MeetingWithin45Days`) and `bit` (flags) | Use `bit` throughout (migrate `-1` → `1`) |
| N13 | `FormDate` meaning ("last day of the reporting month") overlaps with `MonthReporting` | Store `MonthReporting` (or a `date` for the first of the month) and derive `FormDate` |
| N14 | No FKs to any lookup (Region, SU, Town, County, SvcCordType, Ethnicity) | Add FKs after cleaning orphans |

---

## 7. Prioritised recommendations

| Priority | Item | Effort | Breaking? |
| -------- | ---- | ------ | --------- |
| 1 | Save `FormType = 'Active'` + `CAPTA` (N9) | Low | No |
| 2 | Derive and save the 45-day flags in the backend (N7, N8) | Low | No |
| 3 | Source `ReferralDate` from the Referral form (§5) | Low | No |
| 4 | Map "Other reasons – details" to the existing `*Other` columns | Low | No |
| 5 | Separate NMNEI from `DCOtherDesc` (N3) | Low | Data fix for existing rows |
| 6 | Condition table for eligibility (N1, N2), including the 9 new conditions | Medium | Yes (API + reports) |
| 7 | Delay table and single reason lookup with IDs (N4, N11) | Medium | Yes |
| 8 | FKs and indexes (`ChildID`, lookups) (N14) | Medium | Data cleanup first |
