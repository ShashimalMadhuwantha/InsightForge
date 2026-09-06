import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { TenantDirectoryPage } from '../TenantDirectoryPage';
import { adminService } from '../../../services/adminService';

vi.mock('../../../services/adminService', () => ({
  adminService: {
    getTenants: vi.fn(),
    updateTenantStatus: vi.fn(),
    overrideTenantPackage: vi.fn(),
  },
}));

describe('TenantDirectoryPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders tenant directory table with fetched workspaces', async () => {
    adminService.getTenants.mockResolvedValueOnce({
      status: 'success',
      data: [
        {
          id: 'tenant-101',
          name: 'Apex Analytics Corp',
          packageName: 'Enterprise Pro',
          packageId: 'enterprise',
          status: 'active',
          userCount: 4,
          contactEmail: 'contact@apex.com',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'tenant-102',
          name: 'Beta Biotech',
          packageName: 'Starter Team',
          packageId: 'starter',
          status: 'suspended',
          userCount: 2,
          contactEmail: 'admin@beta.com',
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, limit: 10, total: 2, totalPages: 1 },
    });

    render(
      <BrowserRouter>
        <TenantDirectoryPage />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Apex Analytics Corp')).toBeInTheDocument();
      expect(screen.getByText('Beta Biotech')).toBeInTheDocument();
    });

    expect(screen.getByTestId('status-badge-active')).toBeInTheDocument();
    expect(screen.getByTestId('status-badge-suspended')).toBeInTheDocument();
  });

  it('filters tenant directory on search query input', async () => {
    adminService.getTenants.mockResolvedValue({
      status: 'success',
      data: [
        {
          id: 'tenant-101',
          name: 'Apex Analytics Corp',
          packageName: 'Enterprise Pro',
          packageId: 'enterprise',
          status: 'active',
          userCount: 4,
          contactEmail: 'contact@apex.com',
          createdAt: new Date().toISOString(),
        },
      ],
      pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
    });

    render(
      <BrowserRouter>
        <TenantDirectoryPage />
      </BrowserRouter>
    );

    const searchInput = screen.getByTestId('search-tenant-input');
    await waitFor(() => {
      expect(screen.getByText('Apex Analytics Corp')).toBeInTheDocument();
    });

    fireEvent.change(searchInput, { target: { value: 'Apex' } });
    expect(searchInput.value).toBe('Apex');
  });
});
