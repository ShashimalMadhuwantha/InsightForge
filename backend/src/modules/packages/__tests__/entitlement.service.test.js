const entitlementService = require('../entitlement.service');

describe('EntitlementService Unit & Logic Tests', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('parseLimits', () => {
    it('returns default limits when null/undefined is provided', () => {
      const limits = entitlementService.parseLimits(null);
      expect(limits.max_sub_users).toBe(1);
      expect(limits.max_data_sources).toBe(2);
      expect(limits.insight_depth).toBe('basic');
    });

    it('parses valid JSON string properly', () => {
      const limits = entitlementService.parseLimits('{"max_sub_users":10,"max_data_sources":25,"insight_depth":"advanced"}');
      expect(limits.max_sub_users).toBe(10);
      expect(limits.max_data_sources).toBe(25);
      expect(limits.insight_depth).toBe('advanced');
    });
  });

  describe('checkLimit', () => {
    it('allows adding sub-user when quota is not reached', async () => {
      jest.spyOn(entitlementService, 'getTenantPackage').mockResolvedValueOnce({
        tenantId: 'tenant-123',
        packageName: 'Starter Team',
        limits: { max_sub_users: 5, max_data_sources: 10, max_file_size_mb: 25 },
      });
      jest.spyOn(entitlementService, 'getTenantUsage').mockResolvedValueOnce({
        users: 3,
        subUsers: 2,
        dataSources: 4,
      });

      const result = await entitlementService.checkLimit('tenant-123', 'sub_users', 1);
      expect(result.allowed).toBe(true);
      expect(result.current).toBe(2);
      expect(result.limit).toBe(5);
    });

    it('blocks adding sub-user when quota is exceeded', async () => {
      jest.spyOn(entitlementService, 'getTenantPackage').mockResolvedValueOnce({
        tenantId: 'tenant-123',
        packageName: 'Free Explorer',
        limits: { max_sub_users: 1, max_data_sources: 2, max_file_size_mb: 5 },
      });
      jest.spyOn(entitlementService, 'getTenantUsage').mockResolvedValueOnce({
        users: 2,
        subUsers: 1,
        dataSources: 1,
      });

      const result = await entitlementService.checkLimit('tenant-123', 'sub_users', 1);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('quota exceeded');
    });

    it('enforces max_data_sources limit', async () => {
      jest.spyOn(entitlementService, 'getTenantPackage').mockResolvedValueOnce({
        tenantId: 'tenant-123',
        packageName: 'Free Explorer',
        limits: { max_sub_users: 1, max_data_sources: 2, max_file_size_mb: 5 },
      });
      jest.spyOn(entitlementService, 'getTenantUsage').mockResolvedValueOnce({
        users: 1,
        subUsers: 0,
        dataSources: 2,
      });

      const result = await entitlementService.checkLimit('tenant-123', 'data_sources', 1);
      expect(result.allowed).toBe(false);
      expect(result.message).toContain('Data sources limit exceeded');
    });

    it('enforces max_file_size_mb limit', async () => {
      jest.spyOn(entitlementService, 'getTenantPackage').mockResolvedValue({
        tenantId: 'tenant-123',
        packageName: 'Free Explorer',
        limits: { max_sub_users: 1, max_data_sources: 2, max_file_size_mb: 5 },
      });

      const allowedRes = await entitlementService.checkLimit('tenant-123', 'file_size_mb', 4);
      expect(allowedRes.allowed).toBe(true);

      const rejectedRes = await entitlementService.checkLimit('tenant-123', 'file_size_mb', 12);
      expect(rejectedRes.allowed).toBe(false);
    });
  });

  describe('checkFeature', () => {
    it('checks allowed_cleansing_ops correctly', async () => {
      jest.spyOn(entitlementService, 'getTenantPackage').mockResolvedValue({
        tenantId: 'tenant-123',
        packageName: 'Starter Team',
        limits: { allowed_cleansing_ops: ['trim_whitespace', 'remove_duplicates'] },
      });

      const allowed = await entitlementService.checkFeature('tenant-123', 'cleansing_op', 'trim_whitespace');
      expect(allowed.allowed).toBe(true);

      const rejected = await entitlementService.checkFeature('tenant-123', 'cleansing_op', 'remove_outliers');
      expect(rejected.allowed).toBe(false);
    });

    it('supports wildcard * for enterprise cleansing operations and widgets', async () => {
      jest.spyOn(entitlementService, 'getTenantPackage').mockResolvedValue({
        tenantId: 'tenant-enterprise',
        packageName: 'Enterprise Pro',
        limits: { allowed_cleansing_ops: ['*'], allowed_widget_types: ['*'] },
      });

      const cleansingRes = await entitlementService.checkFeature('tenant-enterprise', 'cleansing_op', 'custom_ai_cleanse');
      expect(cleansingRes.allowed).toBe(true);

      const widgetRes = await entitlementService.checkFeature('tenant-enterprise', 'widget_type', '3d_surface_map');
      expect(widgetRes.allowed).toBe(true);
    });

    it('checks insight_depth ranking hierarchy', async () => {
      jest.spyOn(entitlementService, 'getTenantPackage').mockResolvedValue({
        tenantId: 'tenant-starter',
        packageName: 'Starter Team',
        limits: { insight_depth: 'standard' },
      });

      const basicRes = await entitlementService.checkFeature('tenant-starter', 'insight_depth', 'basic');
      expect(basicRes.allowed).toBe(true);

      const standardRes = await entitlementService.checkFeature('tenant-starter', 'insight_depth', 'standard');
      expect(standardRes.allowed).toBe(true);

      const deepRes = await entitlementService.checkFeature('tenant-starter', 'insight_depth', 'deep');
      expect(deepRes.allowed).toBe(false);
    });
  });

  describe('assertLimit and assertFeature', () => {
    it('throws 403 QUOTA_EXCEEDED when assertLimit fails', async () => {
      jest.spyOn(entitlementService, 'checkLimit').mockResolvedValueOnce({
        allowed: false,
        message: 'Quota exceeded',
      });

      await expect(entitlementService.assertLimit('t1', 'sub_users', 1)).rejects.toMatchObject({
        statusCode: 403,
        code: 'QUOTA_EXCEEDED',
      });
    });

    it('throws 403 FEATURE_NOT_INCLUDED when assertFeature fails', async () => {
      jest.spyOn(entitlementService, 'checkFeature').mockResolvedValueOnce({
        allowed: false,
        message: 'Feature not included',
      });

      await expect(entitlementService.assertFeature('t1', 'cleansing_op', 'ai_cleanse')).rejects.toMatchObject({
        statusCode: 403,
        code: 'FEATURE_NOT_INCLUDED',
      });
    });
  });
});
