import { IUser } from '../../types/auth';
import { IProduct } from '../../types/product';
import { IInteraction } from '../../types/interaction';

export const mockUser: IUser = {
  id: '1',
  email: 'test@example.com',
  firstName: 'Test',
  lastName: 'User',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export const mockProducts: IProduct[] = [
  {
    id: '1',
    productName: 'Test Product 1',
    description: 'A test product description',
    price: 99.99,
    category: 'Electronics',
    subcategory: 'Smartphones',
    manufacturer: 'Test Brand',
    quantityInStock: 100,
    features: {
      color: 'Black',
      weight: '200g',
      dimensions: '15x7x0.8cm',
    },
    images: ['test-image-1.jpg'],
    rating: 4.5,
    reviewCount: 100,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    productName: 'Test Product 2',
    description: 'Another test product description',
    price: 149.99,
    category: 'Electronics',
    subcategory: 'Laptops',
    manufacturer: 'Test Brand',
    quantityInStock: 50,
    features: {
      color: 'Silver',
      weight: '2kg',
      dimensions: '35x24x2cm',
    },
    images: ['test-image-2.jpg'],
    rating: 4.8,
    reviewCount: 200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const mockInteractions: IInteraction[] = [
  {
    id: '1',
    userId: mockUser.id,
    productId: mockProducts[0].id,
    type: 'view',
    metadata: {
      source: 'recommendation',
      reason: 'personalized',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    userId: mockUser.id,
    productId: mockProducts[1].id,
    type: 'click',
    metadata: {
      source: 'search',
      query: 'electronics',
    },
    createdAt: new Date().toISOString(),
  },
];

export const createMockProduct = (overrides: Partial<IProduct> = {}): IProduct => ({
  id: Math.random().toString(36).substring(7),
  productName: `Test Product ${Math.random().toString(36).substring(7)}`,
  description: 'A test product description',
  price: 99.99,
  category: 'Electronics',
  subcategory: 'Smartphones',
  manufacturer: 'Test Brand',
  quantityInStock: 100,
  features: {
    color: 'Black',
    weight: '200g',
    dimensions: '15x7x0.8cm',
  },
  images: ['test-image.jpg'],
  rating: 4.5,
  reviewCount: 100,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

export const createMockInteraction = (overrides: Partial<IInteraction> = {}): IInteraction => ({
  id: Math.random().toString(36).substring(7),
  userId: mockUser.id,
  productId: mockProducts[0].id,
  type: 'view',
  metadata: {
    source: 'recommendation',
    reason: 'personalized',
  },
  createdAt: new Date().toISOString(),
  ...overrides,
}); 