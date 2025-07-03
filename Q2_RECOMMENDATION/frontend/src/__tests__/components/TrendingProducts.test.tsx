import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TrendingProducts } from '../../components/TrendingProducts';
import { mockProducts } from '../utils/mockData';
import { server } from '../mocks/server';
import { rest } from 'msw';

describe('TrendingProducts', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should render trending products', async () => {
    render(<TrendingProducts />);

    await waitFor(() => {
      expect(screen.getByText('Trending Now')).toBeInTheDocument();
    });

    mockProducts.forEach(product => {
      expect(screen.getByText(product.productName)).toBeInTheDocument();
      expect(screen.getByText(`$${product.price}`)).toBeInTheDocument();
    });
  });

  it('should handle loading state', async () => {
    server.use(
      rest.get('/api/recommendations/trending', (req, res, ctx) => {
        return res(ctx.delay(100), ctx.json(mockProducts));
      })
    );

    render(<TrendingProducts />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    server.use(
      rest.get('/api/recommendations/trending', (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<TrendingProducts />);

    await waitFor(() => {
      expect(screen.getByText(/error loading trending products/i)).toBeInTheDocument();
    });
  });

  it('should track product interactions', async () => {
    let interactionCalled = false;
    server.use(
      rest.get('/api/recommendations/trending', (req, res, ctx) => {
        return res(ctx.json(mockProducts));
      }),
      rest.post('/api/interactions', (req, res, ctx) => {
        interactionCalled = true;
        return res(ctx.status(201));
      })
    );

    render(<TrendingProducts />);

    await waitFor(() => {
      expect(screen.getByText(mockProducts[0].productName)).toBeInTheDocument();
    });

    const productCard = screen.getByTestId(`product-card-${mockProducts[0].id}`);
    await userEvent.click(productCard);

    expect(interactionCalled).toBe(true);
  });

  it('should handle different time windows', async () => {
    const timeWindows = ['day', 'week', 'month'];
    let currentTimeWindow = '';

    server.use(
      rest.get('/api/recommendations/trending', (req, res, ctx) => {
        currentTimeWindow = req.url.searchParams.get('timeWindow') || '';
        return res(ctx.json(mockProducts));
      })
    );

    render(<TrendingProducts />);

    for (const timeWindow of timeWindows) {
      const timeWindowButton = screen.getByRole('button', { name: new RegExp(timeWindow, 'i') });
      await userEvent.click(timeWindowButton);

      await waitFor(() => {
        expect(currentTimeWindow).toBe(timeWindow);
      });

      mockProducts.forEach(product => {
        expect(screen.getByText(product.productName)).toBeInTheDocument();
      });
    }
  });

  it('should handle empty trending products list', async () => {
    server.use(
      rest.get('/api/recommendations/trending', (req, res, ctx) => {
        return res(ctx.json([]));
      })
    );

    render(<TrendingProducts />);

    await waitFor(() => {
      expect(screen.getByText(/no trending products found/i)).toBeInTheDocument();
    });
  });

  it('should update trending products when time window changes', async () => {
    const mockDayProducts = mockProducts.slice(0, 2);
    const mockWeekProducts = mockProducts.slice(2, 4);

    server.use(
      rest.get('/api/recommendations/trending', (req, res, ctx) => {
        const timeWindow = req.url.searchParams.get('timeWindow');
        return res(ctx.json(timeWindow === 'day' ? mockDayProducts : mockWeekProducts));
      })
    );

    render(<TrendingProducts />);

    // Check day products
    const dayButton = screen.getByRole('button', { name: /day/i });
    await userEvent.click(dayButton);

    await waitFor(() => {
      mockDayProducts.forEach(product => {
        expect(screen.getByText(product.productName)).toBeInTheDocument();
      });
    });

    // Check week products
    const weekButton = screen.getByRole('button', { name: /week/i });
    await userEvent.click(weekButton);

    await waitFor(() => {
      mockWeekProducts.forEach(product => {
        expect(screen.getByText(product.productName)).toBeInTheDocument();
      });
    });
  });
}); 