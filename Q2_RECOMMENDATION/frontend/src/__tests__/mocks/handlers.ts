import { rest } from 'msw';
import { mockProducts, mockUser, mockInteractions } from '../utils/mockData';

export const handlers = [
  // Auth endpoints
  rest.post('/api/auth/login', (req, res, ctx) => {
    return res(
      ctx.json({
        user: mockUser,
        token: 'mock.jwt.token',
      })
    );
  }),

  rest.post('/api/auth/register', (req, res, ctx) => {
    return res(
      ctx.json({
        user: mockUser,
        token: 'mock.jwt.token',
      })
    );
  }),

  // Product endpoints
  rest.get('/api/products', (req, res, ctx) => {
    return res(ctx.json(mockProducts));
  }),

  rest.get('/api/products/:id', (req, res, ctx) => {
    const { id } = req.params;
    const product = mockProducts.find(p => p.id === id);
    if (!product) {
      return res(ctx.status(404));
    }
    return res(ctx.json(product));
  }),

  // Recommendation endpoints
  rest.get('/api/recommendations/personalized', (req, res, ctx) => {
    return res(ctx.json(mockProducts));
  }),

  rest.get('/api/recommendations/similar/:productId', (req, res, ctx) => {
    return res(ctx.json(mockProducts.filter(p => p.id !== req.params.productId)));
  }),

  rest.get('/api/recommendations/trending', (req, res, ctx) => {
    return res(ctx.json(mockProducts));
  }),

  // Interaction endpoints
  rest.post('/api/interactions', (req, res, ctx) => {
    return res(ctx.status(201), ctx.json(mockInteractions[0]));
  }),

  rest.get('/api/interactions', (req, res, ctx) => {
    return res(ctx.json(mockInteractions));
  }),
]; 