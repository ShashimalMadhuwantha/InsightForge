import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { AuthProvider } from '../AuthContext';
import { authService } from '../authService';

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('LoginPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders login form inputs', () => {
    renderWithProviders(<LoginPage />);

    expect(screen.getByTestId('login-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('login-submit-btn')).toBeInTheDocument();
  });

  it('submits valid credentials and persists tokens', async () => {
    vi.spyOn(authService, 'login').mockResolvedValueOnce({
      status: 'success',
      data: {
        user: { id: 'u1', email: 'owner@acme.com', role: 'owner' },
        tenant: { id: 't1', name: 'Acme Corp', packageId: 'free' },
        tokens: { accessToken: 'access_123', refreshToken: 'refresh_123' },
      },
    });

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'owner@acme.com' } });
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'Password123!' } });
    fireEvent.click(screen.getByTestId('login-submit-btn'));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'owner@acme.com',
        password: 'Password123!',
      });
      expect(localStorage.getItem('insightforge_access_token')).toBe('access_123');
    });
  });

  it('displays error message on invalid credentials', async () => {
    vi.spyOn(authService, 'login').mockRejectedValueOnce(new Error('Invalid email or password'));

    renderWithProviders(<LoginPage />);

    fireEvent.change(screen.getByTestId('login-email-input'), { target: { value: 'bad@acme.com' } });
    fireEvent.change(screen.getByTestId('login-password-input'), { target: { value: 'wrongpass' } });
    fireEvent.click(screen.getByTestId('login-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('login-error-alert')).toHaveTextContent(/Invalid email or password/i);
    });
  });
});
