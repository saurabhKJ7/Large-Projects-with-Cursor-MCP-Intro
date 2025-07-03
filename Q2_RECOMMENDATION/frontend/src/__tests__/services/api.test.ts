import axios from 'axios';
import {
  getPersonalizedRecommendations,
  getSimilarProducts,
  getTrendingProducts,
  trackInteraction,
} from '../../services/api';
import { createMockProduct } from '../utils/mockData';
import { api } from '../../services/api';
import { mockProducts, mockUser, mockInteractions } from '../utils/mockData';
import { server } from '../mocks/server';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('API Service', () => {
  beforeAll(() => server.listen());
  afterEach(() => server.resetHandlers());
  afterAll(() => server.close());

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Authentication', () => {
    it('should login user successfully', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const response = await api.auth.login(credentials);

      expect(response.user).toEqual(mockUser);
      expect(response.token).toBeDefined();
    });

    it('should register user successfully', async () => {
      const userData = {
        email: 'new@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
      };

      const response = await api.auth.register(userData);

      expect(response.user).toEqual(mockUser);
      expect(response.token).toBeDefined();
    });
  });

  describe('Products', () => {
    it('should fetch products', async () => {
      const response = await api.products.getAll();

      expect(response).toEqual(mockProducts);
    });

    it('should fetch single product', async () => {
      const productId = mockProducts[0].id;
      const response = await api.products.getById(productId);

      expect(response).toEqual(mockProducts[0]);
    });
  });

  describe('Recommendations', () => {
    it('should fetch personalized recommendations', async () => {
      const response = await api.recommendations.getPersonalized();

      expect(response).toEqual(mockProducts);
    });

    it('should fetch similar products', async () => {
      const productId = mockProducts[0].id;
      const response = await api.recommendations.getSimilar(productId);

      expect(response).toEqual(mockProducts.filter(p => p.id !== productId));
    });

    it('should fetch trending products', async () => {
      const response = await api.recommendations.getTrending();

      expect(response).toEqual(mockProducts);
    });
  });

  describe('Interactions', () => {
    it('should track user interaction', async () => {
      const interaction = {
        productId: mockProducts[0].id,
        type: 'view',
        metadata: {
          source: 'recommendation',
          reason: 'personalized',
        },
      };

      const response = await api.interactions.track(interaction);

      expect(response).toEqual(mockInteractions[0]);
    });

    it('should fetch user interactions', async () => {
      const response = await api.interactions.getAll();

      expect(response).toEqual(mockInteractions);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      server.close();

      await expect(api.products.getAll()).rejects.toThrow();

      server.listen();
    });

    it('should handle authentication errors', async () => {
      const invalidCredentials = {
        email: 'wrong@example.com',
        password: 'wrongpassword',
      };

      await expect(api.auth.login(invalidCredentials)).rejects.toThrow();
    });

    it('should handle not found errors', async () => {
      await expect(api.products.getById('non-existent-id')).rejects.toThrow();
    });

    it('should handle validation errors', async () => {
      const invalidUserData = {
        email: 'invalid-email',
        password: '123',
      };

      await expect(api.auth.register(invalidUserData)).rejects.toThrow();
    });
  });

  describe('getPersonalizedRecommendations', () => {
    it('fetches personalized recommendations successfully', async () => {
      const mockProducts = Array.from({ length: 4 }, () => createMockProduct());
      mockedAxios.get.mockResolvedValue({ data: mockProducts });

      const result = await getPersonalizedRecommendations(4);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/recommendations/personalized',
        expect.objectContaining({
          params: { limit: 4 },
        })
      );
      expect(result).toEqual(mockProducts);
    });

    it('handles API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(getPersonalizedRecommendations(4)).rejects.toThrow('Network error');
    });
  });

  describe('getSimilarProducts', () => {
    const productId = 'test-product-123';

    it('fetches similar products successfully', async () => {
      const mockProducts = Array.from({ length: 4 }, () => createMockProduct());
      mockedAxios.get.mockResolvedValue({ data: mockProducts });

      const result = await getSimilarProducts(productId, 4);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        `/api/recommendations/similar/${productId}`,
        expect.objectContaining({
          params: { limit: 4 },
        })
      );
      expect(result).toEqual(mockProducts);
    });

    it('handles API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(getSimilarProducts(productId, 4)).rejects.toThrow('Network error');
    });
  });

  describe('getTrendingProducts', () => {
    it('fetches trending products successfully', async () => {
      const mockProducts = Array.from({ length: 4 }, () => createMockProduct());
      mockedAxios.get.mockResolvedValue({ data: mockProducts });

      const result = await getTrendingProducts(4, 'week');

      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/recommendations/trending',
        expect.objectContaining({
          params: { limit: 4, timeWindow: 'week' },
        })
      );
      expect(result).toEqual(mockProducts);
    });

    it('handles different time windows', async () => {
      const mockProducts = Array.from({ length: 4 }, () => createMockProduct());
      mockedAxios.get.mockResolvedValue({ data: mockProducts });

      await getTrendingProducts(4, 'day');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/recommendations/trending',
        expect.objectContaining({
          params: { limit: 4, timeWindow: 'day' },
        })
      );

      await getTrendingProducts(4, 'month');
      expect(mockedAxios.get).toHaveBeenCalledWith(
        '/api/recommendations/trending',
        expect.objectContaining({
          params: { limit: 4, timeWindow: 'month' },
        })
      );
    });

    it('handles API errors', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));

      await expect(getTrendingProducts(4, 'week')).rejects.toThrow('Network error');
    });
  });

  describe('trackInteraction', () => {
    const mockInteraction = {
      productId: 'test-product-123',
      type: 'view',
      metadata: {
        source: 'recommendation',
      },
    };

    it('tracks interaction successfully', async () => {
      mockedAxios.post.mockResolvedValue({ data: mockInteraction });

      const result = await trackInteraction(mockInteraction);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/interactions',
        mockInteraction
      );
      expect(result).toEqual(mockInteraction);
    });

    it('handles API errors', async () => {
      mockedAxios.post.mockRejectedValue(new Error('Network error'));

      await expect(trackInteraction(mockInteraction)).rejects.toThrow('Network error');
    });

    it('includes authorization header when token is available', async () => {
      const token = 'test.jwt.token';
      localStorage.setItem('token', token);

      mockedAxios.post.mockResolvedValue({ data: mockInteraction });

      await trackInteraction(mockInteraction);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        '/api/interactions',
        mockInteraction,
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: `Bearer ${token}`,
          }),
        })
      );

      localStorage.removeItem('token');
    });
  });
}); 