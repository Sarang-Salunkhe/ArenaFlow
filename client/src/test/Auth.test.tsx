import { render, screen, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AuthProvider, useAuth } from '../context/AuthContext';
// A simple test harness component to expose useAuth hook states
function AuthTestConsumer() {
  const { user, loading, loginAsSpectator, updateUserRole, logout } = useAuth();
  
  if (loading) {
    return <div data-testid="loading">Loading...</div>;
  }
  
  if (!user) {
    return (
      <div>
        <div data-testid="unauthenticated">No User</div>
        <button data-testid="login-guest-fan" onClick={() => loginAsSpectator('FAN')}>
          Login Guest Fan
        </button>
        <button data-testid="login-guest-ops" onClick={() => loginAsSpectator('OPERATIONS')}>
          Login Guest Ops
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <div data-testid="uid">{user.uid}</div>
      <div data-testid="email">{user.email}</div>
      <div data-testid="role">{user.role}</div>
      <button data-testid="escalate-ops" onClick={() => updateUserRole('OPERATIONS')}>
        Escalate to Operations
      </button>
      <button data-testid="logout" onClick={() => logout()}>
        Logout
      </button>
    </div>
  );
}

describe('ArenaFlow Auth & Role Assignment', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initially defaults to unauthenticated state', async () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    // After state resolution (instant when firebase keys are absent), shows unauthenticated
    const unauthElement = await screen.findByTestId('unauthenticated');
    expect(unauthElement).toBeInTheDocument();
  });

  it('supports continuing as spectator with specific trial duty roles', async () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    const loginBtn = await screen.findByTestId('login-guest-ops');
    
    await act(async () => {
      loginBtn.click();
    });

    const roleElement = await screen.findByTestId('role');
    expect(roleElement.textContent).toBe('OPERATIONS');
    
    const uidElement = await screen.findByTestId('uid');
    expect(uidElement.textContent).toContain('spectator-');
  });

  it('supports dynamic privilege level switching for prototype evaluation', async () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    const loginBtn = await screen.findByTestId('login-guest-fan');
    
    await act(async () => {
      loginBtn.click();
    });

    const roleElement = await screen.findByTestId('role');
    expect(roleElement.textContent).toBe('FAN');

    // Escalate role on the fly
    const escalateBtn = screen.getByTestId('escalate-ops');
    await act(async () => {
      escalateBtn.click();
    });

    expect(roleElement.textContent).toBe('OPERATIONS');
  });

  it('correctly disposes session state upon logout request', async () => {
    render(
      <AuthProvider>
        <AuthTestConsumer />
      </AuthProvider>
    );

    const loginBtn = await screen.findByTestId('login-guest-fan');
    await act(async () => {
      loginBtn.click();
    });

    const uidElement = await screen.findByTestId('uid');
    expect(uidElement).toBeInTheDocument();

    // Sign out
    const logoutBtn = screen.getByTestId('logout');
    await act(async () => {
      logoutBtn.click();
    });

    const unauthElement = await screen.findByTestId('unauthenticated');
    expect(unauthElement).toBeInTheDocument();
  });
});
