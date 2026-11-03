# 08 — Normalization Notes: Exit Form

Normal-form review of `stblExitForm` and the tables around it, based on the `dbCDD` DDL. Like the other input forms, the table was migrated from an Access form one-to-one: one wide row per paper form (45 columns). That suits data entry but contains the classic anomalies below.

---

## 1. Summary

| Table | 1NF | 2NF | 3NF | Main issue |
| ----- | :-: | :-: | :-: | ---------- |
| `stblExitForm` | ❌ | ✅ | ❌ | Two mutually exclusive exit-path columns; repeating flag group (`EXFNoPartB1-3`); stored derived compliance flags; transitive dependencies (SU name, county); COSF questions that belong to another form; data copied from other forms |
| Exit code lists | — | — | — | No tables at all: codes live in column descriptions and backend config |
| `slstAnnualExitReasons` | ✅ | ✅ | ✅ | Linked to exit codes only by hard-coded `Choose(...)` in the reports |

---

## 2. First normal form (atomic values, no repeating groups)

| # | Finding | Detail | Recommendation |
| - | ------- | ------ | -------------- |
| N1 | **One fact in two columns** | The exit reason is split by path: `ExitPriorToAge3` and `ExitAtAge3`, where the unused one must hold **0** (legacy convention the reports rely on). The pair can contradict itself (both set, both 0, both NULL). | One `ExitPath` (`PRIOR` / `AT_AGE_3`) + one `ExitReasonCode` FK to a reason table with a `Path` column. Keep a view that returns the legacy two columns for the reports. |
| N2 | **Repeating group of flags** | `EXFNoPartB1`, `EXFNoPartB2`, `EXFNoPartB3` — numbered columns for "why not eligible for Part B". Adding a reason means changing the schema. | `slstNoPartBReason` + `stblExitFormNoPartBReason(ExitFormID, ReasonID)`. |
| N3 | **Free text that reports parse** | `TransitionPlanReason`, `NotifiedReason`, `NoTransitionMtgReason` hold "family…" / "provider…" text, and reports classify by the first word (EF-GAP-05). One field carries a category **and** details. | `DelayCategory` (`FAMILY` / `PROVIDER`) column + a details column for each milestone. |

## 3. Second normal form

✅ The PK is the single column `ID`, so there are no partial dependencies.

## 4. Third normal form (no transitive dependencies, no stored derived data)

| # | Dependency | Problem | Recommendation |
| - | ---------- | ------- | -------------- |
| N4 | `SU_id → SUName` | `SUName` copied from `slstSU`; can disagree after a rename | Drop `SUName` (join to `slstSU`) or treat it as a deliberate snapshot. Not written by the new form. |
| N5 | `Town → CountyCode` (and `Town → SU_id`) | County and SU are derivable from `slstTownCodes` | Store `Town` only. Not written by the new form. |
| N6 | `CLLEANotificationDate, DOB → Notified90Days`; `TransitionMeeting, DOB → TransitionMeeting90day` | Derived Yes/No values stored; legacy entry kept them in sync by hand, and the new form doesn't set them (EF-GAP-04) | Compute in the reports (or derive in the backend on every save), never by hand |
| N7 | `ExitDate → FormDate` | The new backend sets `FormDate = ExitDate`, so the same fact is stored twice; the legacy meaning ("last day of the reporting month", from `MonthReporting`) is a third version | Choose one meaning. If reports need the exit date, read `ExitDate`; derive any reporting month |
| N8 | `ExitPriorToAge3 = 2 → MovedOtherRegion` | Only meaningful for one code; free text for what is a region | `MovedToRegionID` FK to `stblReportingRegion` |

## 5. Data that belongs elsewhere or is duplicated

| Column on `stblExitForm` | Also stored in | Risk | Recommendation |
| ------------------------ | -------------- | ---- | -------------- |
| `COSFEnter30Months`, `COSFEntryForm(+Reason)`, `COSFGot6MonthsSvcs`, `COSFExitForm(+Reason)` | `stblCOSCoverForm` (COS form) | COS answers on two forms can diverge | Keep COS data on the COS form only; leave these columns as legacy history |
| `ReferralDate`, `ReReferralDate` | `stblReferralForm`, `stblActiveForm` | The exit can point at a different referral than the Active form; the new form prefills but allows edits | Store `ReferralFormID` (FK) or keep the copy read-only |
| `Region` | `stblPeople.Region`, other forms | Region at exit vs current region | Keep as a snapshot (intended) |
| `SvcCord*`, `SU*`, `Town`, `CountyCode`, `CAPTA` | Referral / Active forms | Not written by the new form **[Decision]** | Leave nullable for legacy rows |

## 6. Keys and domains

| # | Finding | Recommendation |
| - | ------- | -------------- |
| N9 | The exit code lists have **no tables**; values exist only in column descriptions, backend config and report `Choose(...)` calls. New codes (7, 8, 5) had to be added in code, and the reports weren't updated (EF-GAP-02) | `slstExitReason(Code PK, Path, Label, AnnualReportOrder, Inactive)` and `slstReferredTo(Code PK, Label, Inactive)`; FKs from `stblExitForm` |
| N10 | Yes/No stored two ways: `int -1/0` (`Notified90Days`, `NotifyStatePartC`, `TransitionMeeting90day`, `COSF*`, `CAPTA`) and `bit` (`EXFNoPartB*`) | Use `bit` throughout (migrate `-1` → `1`) |
| N11 | `0` used as "not this path" in code columns, NULL as "unknown" | Replace with N1; until then document 0 as a reserved value |
| N12 | FK to `stblPeople` not trusted (`WITH NOCHECK`); no FKs to any lookup | Re-check the FK; add lookup FKs after cleaning orphans |

---

## 7. Prioritised recommendations

| Priority | Item | Effort | Breaking? |
| -------- | ---- | ------ | --------- |
| 1 | Map new codes 7 and 8 in the annual exit reports (`slstAnnualExitReasons` + `Choose`) (N9, EF-GAP-02) | Low | No |
| 2 | Calculate the Indicator 8 on-time flags in the reports from the dates (N6) | Low | No |
| 3 | Family / Provider category for the transition plan delay (N3) | Low | No (keep writing the legacy text prefix) |
| 4 | Lookup tables for the exit code lists, with FKs (N9) | Medium | No (same codes) |
| 5 | Region FK for "Region Moved To" (N8) | Low | Data fix for existing text |
| 6 | Single exit path + reason columns, legacy view for reports (N1) | Medium | Yes (API + reports) |
| 7 | Reason table for "not eligible for Part B" (N2) | Medium | Yes |
| 8 | Trusted FK and `ChildID` index (N12) | Low | Data cleanup first |
