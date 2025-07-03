import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AuthContext, AuthProvider } from '../../contexts/AuthContext';
import { mockUser } from '../utils/mockData';
import { server } from '../mocks/server';

const TestComponent = () => {
  const { user, isAuthenticated, login, logout, register, loading } = React.useContext(AuthContext);

  return (
    <div>
      {loading && <div data-testid="loading">Loading...</div>}
      {isAuthenticated ? (
        <>
          <div data-testid="user-email">{user?.email}</div>
          <button onClick={logout} data-testid="logout-button">
            Logout
          </button>
        </>
      ) : (
        <>
          <button
            onClick={() => login({ email: 'test@example.com', password: 'password123' })}
            data-testid="login-button"
          >
            Login
          </button>
          <button
            onClick={() =>
              register({
                email: 'new@example.com',
                password: 'password123',
                firstName: 'New',
                lastName: 'User',
              })
            }
            data-testid="register-button"
          >
            Register
          </button>
        </>
      )}
    </div>
  );
};

describe('AuthContext', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should provide initial unauthenticated state', () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.getByTestId('register-button')).toBeInTheDocument();
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
  });

  it('should handle successful login', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
    });
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('should handle successful registration', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByTestId('register-button'));

    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
    });
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('should handle logout', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Login first
    await userEvent.click(screen.getByTestId('login-button'));
    await waitFor(() => {
      expect(screen.getByTestId('user-email')).toBeInTheDocument();
    });

    // Then logout
    await userEvent.click(screen.getByTestId('logout-button'));

    expect(screen.getByTestId('login-button')).toBeInTheDocument();
    expect(screen.queryByTestId('user-email')).not.toBeInTheDocument();
  });

  it('should show loading state during authentication', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await userEvent.click(screen.getByTestId('login-button'));

    expect(screen.getByTestId('loading')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
  });

  it('should persist authentication state', () => {
    // Mock localStorage
    const mockToken = 'mock.jwt.token';
    const mockUserData = JSON.stringify(mockUser);
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === 'token') return mockToken;
      if (key === 'user') return mockUserData;
      return null;
    });

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    expect(screen.getByTestId('user-email')).toHaveTextContent(mockUser.email);
    expect(screen.getByTestId('logout-button')).toBeInTheDocument();
  });

  it('should handle authentication errors', async () => {
    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Mock failed login
    server.use(
      rest.post('/api/auth/login', (req, res, ctx) => {
        return res(ctx.status(401), ctx.json({ error: 'Invalid credentials' }));
      })
    );

    await userEvent.click(screen.getByTestId('login-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('loading')).not.toBeInTheDocument();
    });
    expect(screen.getByTestId('login-button')).toBeInTheDocument();
  });
}); 