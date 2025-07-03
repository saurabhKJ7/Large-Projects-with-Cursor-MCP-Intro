import { z } from 'zod';

export interface Product {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  description: string;
  productName: string;
  productId: number;
  category: string;
  subcategory: string;
  price: number;
  quantityInStock: number;
  manufacturer: string;
  rating: number;
  isFeatured: boolean;
  isOnSale: boolean;
  salePrice?: number;
  features: string;
  similarityVector: string;
  weight: number;
  dimensions: string;
  releaseDate: Date;
  imageUrl: string;
}

export const ProductSchema = z.object({
  productName: z.string(),
  description: z.string(),
  productId: z.number(),
  category: z.string(),
  subcategory: z.string(),
  price: z.number(),
  quantityInStock: z.number(),
  manufacturer: z.string(),
  rating: z.number(),
  isFeatured: z.boolean(),
  isOnSale: z.boolean(),
  salePrice: z.number().optional(),
  features: z.string(),
  similarityVector: z.string(),
  weight: z.number(),
  dimensions: z.string(),
  releaseDate: z.date(),
  imageUrl: z.string(),
});

export const ProductFilterSchema = z.object({
  category: z.string().optional(),
  subcategory: z.string().optional(),
  manufacturer: z.string().optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  minRating: z.number().optional(),
  isFeatured: z.boolean().optional(),
  isOnSale: z.boolean().optional(),
  sortBy: z.enum(['price', 'rating', 'createdAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

export const SearchRequestSchema = z.object({
  query: z.string().optional(),
  page: z.number().optional(),
  limit: z.number().optional(),
  filter: ProductFilterSchema.optional(),
});

export function calculateCosineSimilarity(vec1: number[], vec2: number[]): number {
  if (vec1.length !== vec2.length) {
    throw new Error('Vectors must have the same length');
  }

  const dotProduct = vec1.reduce((acc, val, i) => acc + val * vec2[i], 0);
  const norm1 = Math.sqrt(vec1.reduce((acc, val) => acc + val * val, 0));
  const norm2 = Math.sqrt(vec2.reduce((acc, val) => acc + val * val, 0));

  if (norm1 === 0 || norm2 === 0) {
    return 0;
  }

  return dotProduct / (norm1 * norm2);
}

export function parseVector(vectorString: string): number[] {
  try {
    return JSON.parse(vectorString);
  } catch (error) {
    throw new Error('Invalid vector format');
  }
}

export function stringifyVector(vector: number[]): string {
  return JSON.stringify(vector);
}

export function extractFeatures(product: Partial<Product> & { productId: number; price: number; quantityInStock: number; weight: number; rating: number; isOnSale: boolean; description: string; releaseDate: Date; dimensions: string }): Record<string, number> {
  return {
    price: product.price,
    quantity: product.quantityInStock,
    weight: product.weight,
    rating: product.rating,
    isOnSale: product.isOnSale ? 1 : 0,
    descriptionLength: product.description.length,
    releaseDate: product.releaseDate.getTime(),
    dimensionsArray: product.dimensions.split('x').map(Number).reduce((a, b) => a + b, 0),
  };
}