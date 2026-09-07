import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AdminRoute } from '../AdminRoute';
import * as AuthContextModule from '../../features/auth/AuthContext';

describe('AdminRoute Component', () => {
  it('redirects to login when user is not authenticated', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: null,
      isAuthenticated: false,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/login" element={<div>Login Page Mock</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Secret Portal</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page Mock')).toBeInTheDocument();
  });

  it('redirects to home when user role is not super_admin', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { role: 'owner', email: 'owner@tenant.com' },
      isAuthenticated: true,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route path="/" element={<div>Tenant Dashboard Home</div>} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Secret Portal</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Tenant Dashboard Home')).toBeInTheDocument();
  });

  it('renders child admin view when user is super_admin', () => {
    vi.spyOn(AuthContextModule, 'useAuth').mockReturnValue({
      user: { role: 'super_admin', email: 'admin@insightforge.internal' },
      isAuthenticated: true,
      loading: false,
    });

    render(
      <MemoryRouter initialEntries={['/admin']}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <div>Admin Secret Portal</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Admin Secret Portal')).toBeInTheDocument();
  });
});
