import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';

import * as service from './insurance-form.service.js';
import { create, get, getOne, options, remove, update } from './insurance-form.controller.js';

vi.mock('./insurance-form.service.js', () => ({
  get: vi.fn(),
  getOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
  lookups: { options: vi.fn() },
}));

const form = { ID: 10, ChildID: 123, BillingConsent: 1 };

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Insurance Form Controller', () => {
  it('get returns the client and their forms', async () => {
    const data = { client: { ChildID: 123, LastName: null, FirstName: null, SS: null, DOB: null }, forms: [form] };
    vi.mocked(service.get).mockResolvedValue(data);
    const res = createResponse();

    await get(createRequest({ params: { childId: '123' } }), res);

    expect(service.get).toHaveBeenCalledWith('123');
    expect(res._getJSONData()).toEqual(data);
  });

  it('getOne returns the form', async () => {
    vi.mocked(service.getOne).mockResolvedValue(form);
    const res = createResponse();

    await getOne(createRequest({ params: { childId: '123', id: '10' } }), res);

    expect(service.getOne).toHaveBeenCalledWith('123', '10');
    expect(res._getJSONData()).toEqual(form);
  });

  it('create returns 201 with the new form', async () => {
    vi.mocked(service.create).mockResolvedValue(form);
    const res = createResponse();

    await create(createRequest({ params: { childId: '123' }, body: { BillingConsent: 1 } }), res);

    expect(service.create).toHaveBeenCalledWith('123', { BillingConsent: 1 });
    expect(res.statusCode).toBe(201);
    expect(res._getJSONData()).toEqual(form);
  });

  it('create sends an empty body when none was posted', async () => {
    vi.mocked(service.create).mockResolvedValue(form);
    const req = createRequest({ params: { childId: '123' } });
    req.body = undefined;

    await create(req, createResponse());

    expect(service.create).toHaveBeenCalledWith('123', {});
  });

  it('update returns the updated form', async () => {
    vi.mocked(service.update).mockResolvedValue(form);
    const res = createResponse();

    await update(createRequest({ params: { childId: '123', id: '10' }, body: { PolicyNumber: 'P' } }), res);

    expect(service.update).toHaveBeenCalledWith('123', '10', { PolicyNumber: 'P' });
    expect(res._getJSONData()).toEqual(form);
  });

  it('update sends an empty body when none was posted', async () => {
    vi.mocked(service.update).mockResolvedValue(form);
    const req = createRequest({ params: { childId: '123', id: '10' } });
    req.body = undefined;

    await update(req, createResponse());

    expect(service.update).toHaveBeenCalledWith('123', '10', {});
  });

  it('remove returns success', async () => {
    vi.mocked(service.remove).mockResolvedValue({ success: true });
    const res = createResponse();

    await remove(createRequest({ params: { childId: '123', id: '10' } }), res);

    expect(service.remove).toHaveBeenCalledWith('123', '10');
    expect(res._getJSONData()).toEqual({ success: true });
  });

  it('options returns the code lists', async () => {
    const data = { billingConsent: [], declineReasons: [] };
    vi.mocked(service.lookups.options).mockReturnValue(data as never);
    const res = createResponse();

    await options(createRequest(), res);

    expect(res._getJSONData()).toEqual(data);
  });

  it('passes service errors on', async () => {
    vi.mocked(service.get).mockRejectedValue(Object.assign(new Error('Client not found'), { status: 404 }));

    await expect(get(createRequest({ params: { childId: '999' } }), createResponse())).rejects.toThrow(
      'Client not found',
    );
  });
});
