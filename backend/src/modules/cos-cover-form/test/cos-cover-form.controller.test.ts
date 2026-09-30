import { describe, expect, it, vi } from 'vitest';
import { createRequest, createResponse } from 'node-mocks-http';
import type { IRecordSet } from 'mssql';

import * as service from '../cos-cover-form.service';
import {
  create,
  get,
  getOne,
  remove,
  update,
} from '../cos-cover-form.controller';

vi.mock('../cos-cover-form.service', () => ({
  get: vi.fn(),
  getOne: vi.fn(),
  create: vi.fn(),
  update: vi.fn(),
  remove: vi.fn(),
}));

describe('COS Cover Form Controller - get', () => {
  it('should return COS forms for the child', async () => {
    const forms = [] as unknown as IRecordSet<unknown>;

    const mockData = {
      client: {
        ChildID: 123,
        Region: '1',
        LastName: 'Doe',
        FirstName: 'John',
        SS: null,
        SSTemp: false,
        DOB: '2020-01-15',
        Gender: 'M',
        Notes: null,
        NonEarlyIntervention: false,
      },
      forms,
    };

    vi.mocked(service.get).mockResolvedValue(
      mockData as Awaited<ReturnType<typeof service.get>>,
    );

    const req = createRequest({
      method: 'GET',
      params: {
        childId: '123',
      },
    });

    const res = createResponse();

    await get(req, res);

    expect(service.get).toHaveBeenCalledWith('123');
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(mockData);
  });
});

describe('COS Cover Form Controller - getOne', () => {
  it('should return a COS form by child ID and form ID', async () => {
    const forms = [] as unknown as IRecordSet<unknown>;

    const mockData = {
      client: {
        ChildID: 123,
        Region: '1',
        LastName: 'Doe',
        FirstName: 'John',
        SS: null,
        SSTemp: false,
        DOB: '2020-01-15',
        Gender: 'M',
        Notes: null,
        NonEarlyIntervention: false,
      },
      forms,
    };

    vi.mocked(service.getOne).mockResolvedValue(
      mockData as Awaited<ReturnType<typeof service.getOne>>,
    );

    const req = createRequest({
      method: 'GET',
      params: {
        childId: '123',
        id: '10',
      },
    });

    const res = createResponse();

    await getOne(req, res);

    expect(service.getOne).toHaveBeenCalledWith('123', '10');
    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(mockData);
  });
});

describe('COS Cover Form Controller - create', () => {
  it('should create a COS form and return 201', async () => {
    const requestBody = {
      FormDate: '2026-09-26',
      FormType: 'COS',
      Region: '1',
      OnePlanDate: '2026-09-26',
      EntryOrExit: -1,
      ExitDate: undefined,
      Outcome1: 1,
      Outcome1Support: 1,
      Outcome2: 1,
      Outcome2Support: 1,
      Outcome3: 1,
      Outcome3Support: 1,
    };

    const mockResult = {
      id: 10,
      ...requestBody,
    };

    vi.mocked(service.create).mockResolvedValue(mockResult);

    const req = createRequest({
      method: 'POST',
      params: {
        childId: '123',
      },
      body: requestBody,
    });

    const res = createResponse();

    await create(req, res);

    expect(service.create).toHaveBeenCalledWith(
      '123',
      requestBody,
    );

    expect(res.statusCode).toBe(201);
    expect(res._getJSONData()).toEqual(mockResult);
  });

  it('should pass an empty object when request body is undefined', async () => {
    const mockResult = {
      id: 10,
    };

    vi.mocked(service.create).mockResolvedValue(mockResult);

    const req = createRequest({
      method: 'POST',
      params: {
        childId: '123',
      },
    });

    const res = createResponse();

    await create(req, res);

    expect(service.create).toHaveBeenCalledWith(
      '123',
      {},
    );

    expect(res.statusCode).toBe(201);
    expect(res._getJSONData()).toEqual(mockResult);
  });
});

describe('COS Cover Form Controller - update', () => {
  it('should update a COS form and return the result', async () => {
    const requestBody = {
      FormDate: '2026-09-26',
      FormType: 'COS',
      Region: '1',
      OnePlanDate: '2026-09-26',
      EntryOrExit: 0,
      ExitDate: '2026-09-30',
      Outcome1: 2,
      Outcome1Support: 1,
      Outcome2: 2,
      Outcome2Support: 1,
      Outcome3: 2,
      Outcome3Support: 1,
    };

    const mockResult = {
      id: 10,
      ...requestBody,
    };

    vi.mocked(service.update).mockResolvedValue(mockResult);

    const req = createRequest({
      method: 'PUT',
      params: {
        childId: '123',
        id: '10',
      },
      body: requestBody,
    });

    const res = createResponse();

    await update(req, res);

    expect(service.update).toHaveBeenCalledWith(
      '123',
      '10',
      requestBody,
    );

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(mockResult);
  });

  it('should pass an empty object when request body is undefined', async () => {
    const mockResult = {
      id: 10,
    };

    vi.mocked(service.update).mockResolvedValue(mockResult);

    const req = createRequest({
      method: 'PUT',
      params: {
        childId: '123',
        id: '10',
      },
    });

    const res = createResponse();

    await update(req, res);

    expect(service.update).toHaveBeenCalledWith(
      '123',
      '10',
      {},
    );

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(mockResult);
  });
});

describe('COS Cover Form Controller - remove', () => {
  it('should remove a COS form and return the result', async () => {
    const mockResult = {
      success: true,
    };

    vi.mocked(service.remove).mockResolvedValue(mockResult);

    const req = createRequest({
      method: 'DELETE',
      params: {
        childId: '123',
        id: '10',
      },
    });

    const res = createResponse();

    await remove(req, res);

    expect(service.remove).toHaveBeenCalledWith(
      '123',
      '10',
    );

    expect(res.statusCode).toBe(200);
    expect(res._getJSONData()).toEqual(mockResult);
  });
});