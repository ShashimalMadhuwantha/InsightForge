import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { TenantDetailsPage } from '../TenantDetailsPage';
import { adminService } from '../../../services/adminService';

vi.mock('../../../services/adminService', () => ({
  adminService: {
    getTenantDetails: vi.fn(),
    updateTenantStatus: vi.fn(),
    overrideTenantPackage: vi.fn(),
  },
}));

describe('TenantDetailsPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    adminService.getTenantDetails.mockReturnValue(new Promise(() => {}));

    render(
      <MemoryRouter initialEntries={['/admin/tenants/t-123']}>
        <Routes>
          <Route path="/admin/tenants/:id" element={<TenantDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText(/loading tenant details and telemetry/i)).toBeInTheDocument();
  });

  it('renders complete tenant profile, user list, and action buttons', async () => {
    adminService.getTenantDetails.mockResolvedValueOnce({
      status: 'success',
      data: {
        id: 't-123',
        name: 'Nexus Cloud Dynamics',
        status: 'active',
        packageName: 'Growth Business',
        packageId: 'growth',
        contactEmail: 'contact@nexus.com',
        contactPhone: '+1-555-0199',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        packageLimits: {
          max_sub_users: 25,
          max_data_sources: 50,
          max_file_size_mb: 100,
        },
        users: [
          {
            id: 'u-1',
            email: 'admin@nexus.com',
            firstName: 'Sarah',
            lastName: 'Connor',
            role: 'owner',
            status: 'active',
            lastLoginAt: new Date().toISOString(),
          },
        ],
        auditLogs: [
          {
            id: 'log-1',
            action: 'TENANT_PACKAGE_OVERRIDE',
            details: { newPackageId: 'growth' },
            created_at: new Date().toISOString(),
          },
        ],
      },
    });

    render(
      <MemoryRouter initialEntries={['/admin/tenants/t-123']}>
        <Routes>
          <Route path="/admin/tenants/:id" element={<TenantDetailsPage />} />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Nexus Cloud Dynamics')).toBeInTheDocument();
      expect(screen.getByText('contact@nexus.com')).toBeInTheDocument();
      expect(screen.getByText('Sarah Connor')).toBeInTheDocument();
    });

    expect(screen.getByTestId('override-package-btn')).toBeInTheDocument();
    expect(screen.getByTestId('moderate-status-btn')).toBeInTheDocument();
  });
});
