import { describe, expect, it } from 'vitest';

import { defaultsToValues, recordToValues, valuesToPayload } from './nopr-form.mappers';

describe('recordToValues', () => {
  it('maps a saved record to the form model', () => {
    expect(
      recordToValues({
        ID: 7,
        Region: 3,
        RefStatus: 4,
        InitialEvalDate: '2026-01-20 00:00:00',
        StatusDate: '2026-02-02T00:00:00.000Z',
        Screening: 2,
      }),
    ).toEqual({
      Region: 3,
      RefStatus: '4',
      InitialEvalDate: '2026-01-20',
      StatusDate: '2026-02-02',
    });
  });

  it('keeps a retired reason', () => {
    expect(recordToValues({ RefStatus: 7 }).RefStatus).toBe('7');
  });

  it.each([null, undefined, 0])('leaves the reason unchosen for %j', (value) => {
    expect(recordToValues({ RefStatus: value }).RefStatus).toBe('');
  });

  it('turns empty values into blanks', () => {
    expect(recordToValues({})).toEqual({
      Region: 0,
      RefStatus: '',
      InitialEvalDate: '',
      StatusDate: '',
    });
  });
});

describe('defaultsToValues', () => {
  it('starts with the default region', () => {
    expect(defaultsToValues({ Region: 3, MostRecentReferralDate: '2026-01-05' }, 1)).toEqual({
      Region: 3,
      RefStatus: '',
      InitialEvalDate: '',
      StatusDate: '',
    });
  });

  it("falls back to the client's region", () => {
    expect(defaultsToValues({ Region: null, MostRecentReferralDate: null }, 1).Region).toBe(1);
    expect(defaultsToValues(null, null).Region).toBe(0);
  });
});

describe('valuesToPayload', () => {
  it('builds the API body', () => {
    expect(
      valuesToPayload({
        Region: 3,
        RefStatus: '8',
        InitialEvalDate: '2026-01-20',
        StatusDate: '2026-02-02',
      }),
    ).toEqual({ Region: 3, RefStatus: 8, InitialEvalDate: '2026-01-20', StatusDate: '2026-02-02' });
  });

  it('sends null for empty values', () => {
    expect(
      valuesToPayload({ Region: 3, RefStatus: '', InitialEvalDate: '', StatusDate: '' }),
    ).toEqual({
      Region: 3,
      RefStatus: null,
      InitialEvalDate: null,
      StatusDate: null,
    });
  });
});
