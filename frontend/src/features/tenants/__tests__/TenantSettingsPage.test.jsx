import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { TenantSettingsPage } from '../TenantSettingsPage';
import { AuthProvider } from '../../auth/AuthContext';
import { authService } from '../../auth/authService';

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('TenantSettingsPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('loads and renders organization profile and tier data', async () => {
    vi.spyOn(authService, 'getTenantProfile').mockResolvedValueOnce({
      status: 'success',
      data: {
        id: 'tenant-123',
        name: 'Acme Global',
        status: 'active',
        contactEmail: 'contact@acme.com',
        contactPhone: '+1 555 1234',
        package: {
          id: 'starter',
          name: 'Starter Team',
          limits: { max_sub_users: 5, max_data_sources: 10, max_file_size_mb: 25 },
        },
      },
    });

    renderWithProviders(<TenantSettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('business-name-setting-input')).toHaveValue('Acme Global');
    });

    expect(screen.getByTestId('package-tier-badge')).toHaveTextContent(/Starter Team/i);
  });

  it('submits updated organization details and displays success message', async () => {
    vi.spyOn(authService, 'getTenantProfile').mockResolvedValueOnce({
      status: 'success',
      data: {
        id: 'tenant-123',
        name: 'Acme Global',
        status: 'active',
        package: { id: 'starter', name: 'Starter Team' },
      },
    });

    vi.spyOn(authService, 'updateTenantProfile').mockResolvedValueOnce({
      status: 'success',
      data: {
        id: 'tenant-123',
        name: 'Acme Enterprise Inc',
        status: 'active',
        package: { id: 'starter', name: 'Starter Team' },
      },
    });

    renderWithProviders(<TenantSettingsPage />);

    await waitFor(() => {
      expect(screen.getByTestId('business-name-setting-input')).toHaveValue('Acme Global');
    });

    fireEvent.change(screen.getByTestId('business-name-setting-input'), { target: { value: 'Acme Enterprise Inc' } });
    fireEvent.click(screen.getByTestId('save-settings-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('settings-success-alert')).toHaveTextContent(/settings saved successfully/i);
    });
  });
});
