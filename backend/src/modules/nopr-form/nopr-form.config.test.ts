import { describe, expect, it } from 'vitest';

import {
  ACTIVE_FORM_TABLE,
  COLUMNS,
  NOPR_FORM_TABLE,
  NOPR_FORM_TYPE,
  REF_STATUS,
  REFERRAL_FORM_TABLE,
  REGION_TABLE,
  RETIRED_REF_STATUS,
  SAVED_COLUMNS,
} from './nopr-form.config.js';

describe('NOPR Form config - tables and form type', () => {
  it('points at the dbCDD tables', () => {
    expect(NOPR_FORM_TABLE).toBe('dbo.stblNoOnePlanForm');
    expect(REFERRAL_FORM_TABLE).toBe('dbo.stblReferralForm');
    expect(ACTIVE_FORM_TABLE).toBe('dbo.stblActiveForm');
    expect(REGION_TABLE).toBe('dbo.stblReportingRegion');
  });

  it('uses the legacy FormType literal, which fits the nvarchar(12) column', () => {
    expect(NOPR_FORM_TYPE).toBe('No One Plan');
    expect(NOPR_FORM_TYPE.length).toBeLessThanOrEqual(12);
  });
});

describe('NOPR Form config - writable columns', () => {
  it('lets the request write only Region, RefStatus and the two dates', () => {
    expect(COLUMNS).toEqual({
      Region: { kind: 'int' },
      RefStatus: { kind: 'int' },
      InitialEvalDate: { kind: 'date' },
      StatusDate: { kind: 'date' },
    });
  });

  it('never writes the removed legacy columns, FormType or the audit columns', () => {
    for (const column of [
      'MonthReporting',
      'Screening',
      'ReferredBack',
      'FormType',
      'ChildID',
      'ID',
      'InsertDate',
      'InsertUser',
      'LastUpdateDate',
      'LastUpdateUser',
    ]) {
      expect(SAVED_COLUMNS).not.toHaveProperty(column);
    }
  });

  it('saves FormDate as well, but does not take it from the request', () => {
    expect(SAVED_COLUMNS).toEqual({ ...COLUMNS, FormDate: { kind: 'date' } });
    expect(COLUMNS).not.toHaveProperty('FormDate');
  });
});

describe('NOPR Form config - reasons', () => {
  it('lists Initial Contact Not Made (8) first, then 1–6 in the legacy order', () => {
    expect(REF_STATUS.map((o) => o.code)).toEqual([8, 1, 2, 3, 4, 5, 6]);
    expect(REF_STATUS[0].label).toBe('Initial Contact Not Made');
  });

  it('keeps the legacy labels for 1–6', () => {
    expect(Object.fromEntries(REF_STATUS.map((o) => [o.code, o.label]))).toMatchObject({
      1: 'Initial visit made - Screening/evaluation declined',
      2: 'Screened - No further evaluation needed',
      3: 'Further Evaluation Declined by Family - Eligibility Not Determined',
      4: 'Evaluated - Not Eligible',
      5: 'Eligible - Services Declined by Family',
      6: 'Moved or Lost Contact',
    });
  });

  it('retires only reason 7, Turned 3 during evaluation process', () => {
    expect(RETIRED_REF_STATUS).toEqual([{ code: 7, label: 'Turned 3 during evaluation process' }]);
  });

  it('has no code in both lists and no duplicate codes or labels', () => {
    const all = [...REF_STATUS, ...RETIRED_REF_STATUS];
    expect(new Set(all.map((o) => o.code)).size).toBe(all.length);
    expect(new Set(all.map((o) => o.label)).size).toBe(all.length);
    expect(all.map((o) => o.code).sort((a, b) => a - b)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
