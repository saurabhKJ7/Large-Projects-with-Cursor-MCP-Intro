import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SimilarProducts } from '../../components/SimilarProducts';
import { mockProducts } from '../utils/mockData';
import { server } from '../mocks/server';
import { rest } from 'msw';

describe('SimilarProducts', () => {
  const productId = mockProducts[0].id;

  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  it('should render similar products', async () => {
    render(<SimilarProducts productId={productId} />);

    await waitFor(() => {
      expect(screen.getByText('Similar Products')).toBeInTheDocument();
    });

    const similarProducts = mockProducts.filter(p => p.id !== productId);
    similarProducts.forEach(product => {
      expect(screen.getByText(product.productName)).toBeInTheDocument();
      expect(screen.getByText(`$${product.price}`)).toBeInTheDocument();
    });
  });

  it('should handle loading state', async () => {
    server.use(
      rest.get(`/api/recommendations/similar/${productId}`, (req, res, ctx) => {
        return res(ctx.delay(100), ctx.json(mockProducts));
      })
    );

    render(<SimilarProducts productId={productId} />);

    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
    });
  });

  it('should handle error state', async () => {
    server.use(
      rest.get(`/api/recommendations/similar/${productId}`, (req, res, ctx) => {
        return res(ctx.status(500));
      })
    );

    render(<SimilarProducts productId={productId} />);

    await waitFor(() => {
      expect(screen.getByText(/error loading similar products/i)).toBeInTheDocument();
    });
  });

  it('should track product interactions', async () => {
    let interactionCalled = false;
    server.use(
      rest.get(`/api/recommendations/similar/${productId}`, (req, res, ctx) => {
        return res(ctx.json(mockProducts));
      }),
      rest.post('/api/interactions', (req, res, ctx) => {
        interactionCalled = true;
        return res(ctx.status(201));
      })
    );

    render(<SimilarProducts productId={productId} />);

    await waitFor(() => {
      expect(screen.getByText(mockProducts[1].productName)).toBeInTheDocument();
    });

    const productCard = screen.getByTestId(`product-card-${mockProducts[1].id}`);
    await userEvent.click(productCard);

    expect(interactionCalled).toBe(true);
  });

  it('should handle empty similar products list', async () => {
    server.use(
      rest.get(`/api/recommendations/similar/${productId}`, (req, res, ctx) => {
        return res(ctx.json([]));
      })
    );

    render(<SimilarProducts productId={productId} />);

    await waitFor(() => {
      expect(screen.getByText(/no similar products found/i)).toBeInTheDocument();
    });
  });

  it('should handle non-existent product', async () => {
    server.use(
      rest.get('/api/recommendations/similar/non-existent-id', (req, res, ctx) => {
        return res(ctx.status(404));
      })
    );

    render(<SimilarProducts productId="non-existent-id" />);

    await waitFor(() => {
      expect(screen.getByText(/product not found/i)).toBeInTheDocument();
    });
  });
}); 