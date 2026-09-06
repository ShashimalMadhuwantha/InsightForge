const { tenantScope, scopedQuery } = require('../tenantScope');

describe('Tenant Scoping & Multi-Tenancy Isolation Middleware Suite', () => {
  it('assigns req.tenantId when valid user tenant_id is present', () => {
    const req = {
      user: { id: 'u1', tenant_id: 'tenant_alpha' },
    };
    const res = {};
    const next = jest.fn();

    tenantScope(req, res, next);
    expect(req.tenantId).toBe('tenant_alpha');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rejects cross-tenant access when user attempts to access another tenant context', () => {
    const req = {
      user: { id: 'u1', tenant_id: 'tenant_alpha' },
      params: { tenantId: 'tenant_beta' },
    };
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    const next = jest.fn();

    tenantScope(req, res, next);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'error',
        message: expect.stringContaining('Cross-tenant access forbidden'),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('scopedQuery constructs knex query strictly filtered by tenant_id', () => {
    const mockWhere = jest.fn().mockReturnValue('query_result');
    const mockKnex = jest.fn().mockReturnValue({ where: mockWhere });

    const result = scopedQuery(mockKnex, 'data_sources', 'tenant_123');
    expect(mockKnex).toHaveBeenCalledWith('data_sources');
    expect(mockWhere).toHaveBeenCalledWith({ tenant_id: 'tenant_123' });
    expect(result).toBe('query_result');
  });

  it('scopedQuery throws an error if tenantId is omitted', () => {
    const mockKnex = jest.fn();
    expect(() => scopedQuery(mockKnex, 'data_sources', null)).toThrow('Tenant ID is required');
  });
});
