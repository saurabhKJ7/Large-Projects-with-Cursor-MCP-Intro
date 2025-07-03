import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PersonalizedRecommendations } from '../../components/PersonalizedRecommendations';
import { AuthContext } from '../../contexts/AuthContext';
import { mockProducts, mockUser } from '../utils/mockData';
import { server } from '../mocks/server';
import { rest } from 'msw';

const mockAuthContext = {
  user: mockUser,
  isAuthenticated: true,
  login: jest.fn(),
  logout: jest.fn(),
  register: jest.fn(),
  loading: false,
};

describe('PersonalizedRecommendations', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('renders personalized recommendations when authenticated', async () => {
    server.use(
      rest.get('/api/recommendations/personalized', (req, res, ctx) => {
        return res(ctx.json(mockProducts));
      })
    );

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <PersonalizedRecommendations />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Recommended for You')).toBeInTheDocument();
    });

    mockProducts.forEach(product => {
      expect(screen.getByText(product.productName)).toBeInTheDocument();
      expect(screen.getByText(`$${product.price}`)).toBeInTheDocument();
    });
  });

  it('handles loading state', async () => {
    server.use(
      rest.get('/api/recommendations/personalized', (req, res, ctx) => {
        return res(ctx.delay(100), ctx.json(mockProducts));
      })
    );

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <PersonalizedRecommendations />
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('handles error state', async () => {
    server.use(
      rest.get('/api/recommendations/personalized', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <PersonalizedRecommendations />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(/error loading recommendations/i)).toBeInTheDocument();
    });
  });

  it('redirects to login when not authenticated', () => {
    const unauthenticatedContext = {
      ...mockAuthContext,
      isAuthenticated: false,
      user: null,
    };

    render(
      <AuthContext.Provider value={unauthenticatedContext}>
        <PersonalizedRecommendations />
      </AuthContext.Provider>
    );

    expect(screen.getByText(/please log in to see personalized recommendations/i)).toBeInTheDocument();
  });

  it('tracks product interactions', async () => {
    let interactionCalled = false;
    server.use(
      rest.get('/api/recommendations/personalized', (req, res, ctx) => {
        return res(ctx.json(mockProducts));
      }),
      rest.post('/api/interactions', (req, res, ctx) => {
        interactionCalled = true;
        return res(ctx.status(201));
      })
    );

    render(
      <AuthContext.Provider value={mockAuthContext}>
        <PersonalizedRecommendations />
      </AuthContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText(mockProducts[0].productName)).toBeInTheDocument();
    });

    const productCard = screen.getByTestId(`product-card-${mockProducts[0].id}`);
    await userEvent.click(productCard);

    expect(interactionCalled).toBe(true);
  });
}); 