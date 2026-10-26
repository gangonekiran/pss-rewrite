import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';

import * as service from './exit-form.service.js';
import { create, defaults, get, getOne, options, remove, update } from './exit-form.controller.js';

vi.mock('./exit-form.service.js', () => ({
  get: vi.fn(),
  getOne: vi.fn(),
  defaults: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  lookups: { options: vi.fn() },
}));

const client = {
  ChildID: 123,
  Region: 1,
  LastName: 'Austin',
  FirstName: 'Jane',
  SS: null,
  SSTemp: false,
  DOB: '2023-04-10',
  Gender: 'F',
  Notes: null,
  NonEarlyIntervention: false,
};

const form = {
  ID: 10,
  ChildID: 123,
  ExitDate: '2026-04-01',
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Exit Form Controller - get', () => {
  it('should return the client and their Exit forms', async () => {
    const data = { client, forms: [form] };
    vi.mocked(service.get).mockResolvedValue(data);

    const req = createRequest({ method: 'GET', params: { childId: '123' } });
    const res = createResponse();

    await get(req, res);

    expect(service.get).toHaveBeenCalledWith('123');
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(data);
  });

  it('should pass service errors on', async () => {
    vi.mocked(service.get).mockRejectedValue(Object.assign(new Error('Client not found'), { status: 404 }));

    const req = createRequest({ method: 'GET', params: { childId: '999' } });

    await expect(get(req, createResponse())).rejects.toThrow('Client not found');
  });
});

describe('Exit Form Controller - getOne', () => {
  it('should return one Exit form', async () => {
    vi.mocked(service.getOne).mockResolvedValue(form);

    const req = createRequest({ method: 'GET', params: { childId: '123', id: '10' } });
    const res = createResponse();

    await getOne(req, res);

    expect(service.getOne).toHaveBeenCalledWith('123', '10');
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(form);
  });
});

describe('Exit Form Controller - defaults', () => {
  it('should return the prefill values', async () => {
    const data = { Region: 2, ReferralDate: '2025-02-15' };
    vi.mocked(service.defaults).mockResolvedValue(data);

    const req = createRequest({ method: 'GET', params: { childId: '123' } });
    const res = createResponse();

    await defaults(req, res);

    expect(service.defaults).toHaveBeenCalledWith('123');
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(data);
  });
});

describe('Exit Form Controller - create', () => {
  it('should create an Exit form and return 201', async () => {
    vi.mocked(service.create).mockResolvedValue(form);

    const body = { Region: 2, ExitDate: '2026-04-01' };
    const req = createRequest({ method: 'POST', params: { childId: '123' }, body });
    const res = createResponse();

    await create(req, res);

    expect(service.create).toHaveBeenCalledWith('123', body);
    expect(res.statusCode).toBe(201);
    expect(res._getJSONData()).toEqual(form);
  });

  it('should pass an empty object when there is no body', async () => {
    vi.mocked(service.create).mockResolvedValue(form);

    const req = createRequest({ method: 'POST', params: { childId: '123' } });
    req.body = undefined;

    await create(req, createResponse());

    expect(service.create).toHaveBeenCalledWith('123', {});
  });

  it('should pass validation errors on', async () => {
    vi.mocked(service.create).mockRejectedValue(
      Object.assign(new Error('Date of Exit is required'), { status: 400 }),
    );

    const req = createRequest({ method: 'POST', params: { childId: '123' }, body: {} });

    await expect(create(req, createResponse())).rejects.toMatchObject({
      message: 'Date of Exit is required',
      status: 400,
    });
  });
});

describe('Exit Form Controller - update', () => {
  it('should update an Exit form', async () => {
    vi.mocked(service.update).mockResolvedValue(form);

    const body = { ReferredTo: 99 };
    const req = createRequest({ method: 'PUT', params: { childId: '123', id: '10' }, body });
    const res = createResponse();

    await update(req, res);

    expect(service.update).toHaveBeenCalledWith('123', '10', body);
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(form);
  });

  it('should pass an empty object when there is no body', async () => {
    vi.mocked(service.update).mockResolvedValue(form);

    const req = createRequest({ method: 'PUT', params: { childId: '123', id: '10' } });
    req.body = undefined;

    await update(req, createResponse());

    expect(service.update).toHaveBeenCalledWith('123', '10', {});
  });
});

describe('Exit Form Controller - remove', () => {
  it('should delete an Exit form', async () => {
    vi.mocked(service.remove).mockResolvedValue({ success: true });

    const req = createRequest({ method: 'DELETE', params: { childId: '123', id: '10' } });
    const res = createResponse();

    await remove(req, res);

    expect(service.remove).toHaveBeenCalledWith('123', '10');
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual({ success: true });
  });
});

describe('Exit Form Controller - options', () => {
  it('should return the code lists', async () => {
    const data = {
      exitPriorToAge3: [{ code: 1, label: 'Development at appropriate level' }],
      exitAtAge3: [],
      referredTo: [],
    };
    vi.mocked(service.lookups.options).mockReturnValue(data as unknown as ReturnType<typeof service.lookups.options>);

    const req = createRequest({ method: 'GET' });
    const res = createResponse();

    await options(req, res);

    expect(service.lookups.options).toHaveBeenCalled();
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(data);
  });
});
