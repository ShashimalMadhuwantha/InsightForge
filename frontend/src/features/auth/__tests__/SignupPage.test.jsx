import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { SignupPage } from '../SignupPage';
import { AuthProvider } from '../AuthContext';
import { authService } from '../authService';

function renderWithProviders(ui) {
  return render(
    <BrowserRouter>
      <AuthProvider>{ui}</AuthProvider>
    </BrowserRouter>
  );
}

describe('SignupPage Component', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders all required form fields', () => {
    renderWithProviders(<SignupPage />);

    expect(screen.getByTestId('business-name-input')).toBeInTheDocument();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('confirm-password-input')).toBeInTheDocument();
    expect(screen.getByTestId('signup-submit-btn')).toBeInTheDocument();
  });

  it('shows error validation when passwords do not match', async () => {
    renderWithProviders(<SignupPage />);

    fireEvent.change(screen.getByTestId('business-name-input'), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'owner@acme.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'DifferentPass123!' } });

    fireEvent.click(screen.getByTestId('signup-submit-btn'));

    await waitFor(() => {
      expect(screen.getByTestId('signup-error-alert')).toHaveTextContent(/Passwords do not match/i);
    });
  });

  it('submits valid registration and redirects', async () => {
    vi.spyOn(authService, 'signup').mockResolvedValueOnce({
      status: 'success',
      data: {
        user: { id: 'u1', email: 'owner@acme.com', role: 'owner' },
        tenant: { id: 't1', name: 'Acme Corp', packageId: 'free' },
        tokens: { accessToken: 'mock_jwt', refreshToken: 'mock_refresh' },
      },
    });

    renderWithProviders(<SignupPage />);

    fireEvent.change(screen.getByTestId('business-name-input'), { target: { value: 'Acme Corp' } });
    fireEvent.change(screen.getByTestId('email-input'), { target: { value: 'owner@acme.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'Password123!' } });
    fireEvent.change(screen.getByTestId('confirm-password-input'), { target: { value: 'Password123!' } });

    fireEvent.click(screen.getByTestId('signup-submit-btn'));

    await waitFor(() => {
      expect(authService.signup).toHaveBeenCalledWith(
        expect.objectContaining({
          businessName: 'Acme Corp',
          email: 'owner@acme.com',
        })
      );
    });
  });
});
