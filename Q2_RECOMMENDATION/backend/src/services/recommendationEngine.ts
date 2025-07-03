import { PrismaClient } from '@prisma/client';
import { Product } from '../types/product';
import { InteractionType } from '../types/interaction';
import { CacheService } from './cacheService';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();
const cacheService = new CacheService();

// Helper function for SQLite compatibility
const parseVector = (vectorString: string): number[] => {
  try {
    return JSON.parse(vectorString);
  } catch {
    return [];
  }
};

const calculateCosineSimilarity = (vector1String: string, vector2String: string): number => {
  const vector1 = parseVector(vector1String);
  const vector2 = parseVector(vector2String);

  if (vector1.length !== vector2.length || vector1.length === 0) {
    return 0;
  }

  const dotProduct = vector1.reduce((sum, val, i) => sum + val * vector2[i], 0);
  const magnitude1 = Math.sqrt(vector1.reduce((sum, val) => sum + val * val, 0));
  const magnitude2 = Math.sqrt(vector2.reduce((sum, val) => sum + val * val, 0));

  if (magnitude1 === 0 || magnitude2 === 0) {
    return 0;
  }

  return dotProduct / (magnitude1 * magnitude2);
};

export class RecommendationEngine {
  private static COLLABORATIVE_WEIGHT = 0.7;
  private static CONTENT_WEIGHT = 0.3;

  private static async getUserItemMatrix(): Promise<{
    matrix: Record<string, Record<string, number>>;
    userIndices: string[];
    productIndices: string[];
  }> {
    const interactions = await prisma.interaction.findMany({
      include: { product: true },
    });

    const userIndices: string[] = [...new Set(interactions.map(i => i.userId))];
    const productIndices: string[] = [...new Set(interactions.map(i => i.productId))];
    
    const matrix: Record<string, Record<string, number>> = {};
    
    userIndices.forEach(userId => {
      matrix[userId] = {};
      productIndices.forEach(productId => {
        matrix[userId][productId] = 0;
      });
    });

    interactions.forEach(interaction => {
      const weight = this.getInteractionWeight(interaction.type as InteractionType);
      matrix[interaction.userId][interaction.productId] += weight;
    });

    return { matrix, userIndices, productIndices };
  }

  private static getInteractionWeight(type: InteractionType): number {
    switch (type) {
      case 'purchase': return 1.0;
      case 'like': return 0.5;
      case 'view': return 0.2;
      case 'search': return 0.1;
      case 'addToCart': return 0.4;
      case 'removeFromCart': return -0.2;
      default: return 0.1;
    }
  }

  private static async calculateUserSimilarity(
    userId1: string,
    userId2: string,
    matrix: Record<string, Record<string, number>>
  ): Promise<number> {
    const user1Vector = Object.values(matrix[userId1]);
    const user2Vector = Object.values(matrix[userId2]);
    return calculateCosineSimilarity(
      JSON.stringify(user1Vector),
      JSON.stringify(user2Vector)
    );
  }

  private static async getCollaborativeRecommendations(
    userId: string,
    limit: number
  ): Promise<Product[]> {
    const cached = await cacheService.getPersonalizedRecommendations(userId);
    if (cached) return cached;

    const { matrix, userIndices, productIndices } = await this.getUserItemMatrix();
    
    if (!matrix[userId]) {
      return [];
    }

    // Calculate user similarities
    const userSimilarities: { userId: string; similarity: number }[] = [];
    for (const otherUserId of userIndices) {
      if (otherUserId === userId) continue;
      const similarity = await this.calculateUserSimilarity(userId, otherUserId, matrix);
      userSimilarities.push({ userId: otherUserId, similarity });
    }

    // Get top similar users
    const topSimilarUsers = userSimilarities
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10);

    // Calculate predicted scores
    const predictions: { productId: string; score: number }[] = [];
    for (const productId of productIndices) {
      if (matrix[userId][productId] > 0) continue; // Skip products user has interacted with

      let weightedSum = 0;
      let similaritySum = 0;

      for (const { userId: similarUserId, similarity } of topSimilarUsers) {
        weightedSum += similarity * matrix[similarUserId][productId];
        similaritySum += similarity;
      }

      const predictedScore = similaritySum > 0 ? weightedSum / similaritySum : 0;
      predictions.push({ productId, score: predictedScore });
    }

    const topPredictions = predictions
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Fetch full product details
    const products = await prisma.product.findMany({
      where: {
        id: { in: topPredictions.map(p => p.productId) }
      }
    });

    const productsWithDetails = products.map(product => ({
      id: product.id,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      description: product.description,
      productName: product.productName,
      productId: product.productId,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      quantityInStock: product.quantityInStock,
      manufacturer: product.manufacturer,
      rating: product.rating,
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
      salePrice: product.salePrice ?? undefined,
      features: product.features,
      similarityVector: product.similarityVector,
      weight: product.weight,
      dimensions: product.dimensions,
      releaseDate: new Date(product.releaseDate),
      imageUrl: product.imageUrl
    }));

    await cacheService.setPersonalizedRecommendations(userId, productsWithDetails);
    return productsWithDetails;
  }

  private static async getContentBasedRecommendations(
    userId: string,
    limit: number
  ): Promise<Product[]> {
    const cached = await cacheService.getPersonalizedRecommendations(userId);
    if (cached) return cached;

    // Get user's interacted products
    const interactions = await prisma.interaction.findMany({
      where: { userId },
      include: { product: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    if (interactions.length === 0) {
      return [];
    }

    // Calculate user profile vector based on interacted products
    const userProfile = interactions.reduce((acc, interaction) => {
      const weight = this.getInteractionWeight(interaction.type as InteractionType);
      const vector = parseVector(interaction.product.similarityVector);
      return acc.map((val, idx) => val + (vector[idx] || 0) * weight);
    }, new Array(parseVector(interactions[0].product.similarityVector).length).fill(0));

    // Convert userProfile back to string format
    const userProfileString = JSON.stringify(userProfile);

    // Get all products
    const allProducts = await prisma.product.findMany({
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        productId: true,
        productName: true,
        category: true,
        subcategory: true,
        price: true,
        quantityInStock: true,
        manufacturer: true,
        description: true,
        weight: true,
        dimensions: true,
        releaseDate: true,
        rating: true,
        isFeatured: true,
        isOnSale: true,
        salePrice: true,
        imageUrl: true,
        features: true,
        similarityVector: true,
      },
    });
    
    // Calculate similarity scores
    const similarities = allProducts
      .filter(product => !interactions.some(i => i.productId === product.id))
      .map(product => ({
        productId: product.id,
        score: calculateCosineSimilarity(userProfileString, product.similarityVector)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    // Fetch full product details for top recommendations
    const recommendedProducts = await prisma.product.findMany({
      where: {
        id: { in: similarities.map(s => s.productId) }
      }
    });

    const productsWithDetails = recommendedProducts.map(product => ({
      id: product.id,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      description: product.description,
      productName: product.productName,
      productId: product.productId,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      quantityInStock: product.quantityInStock,
      manufacturer: product.manufacturer,
      rating: product.rating,
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
      salePrice: product.salePrice ?? undefined,
      features: product.features,
      similarityVector: product.similarityVector,
      weight: product.weight,
      dimensions: product.dimensions,
      releaseDate: new Date(product.releaseDate),
      imageUrl: product.imageUrl
    }));

    await cacheService.setPersonalizedRecommendations(userId, productsWithDetails);
    return productsWithDetails;
  }

  static async getHybridRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Product[]> {
    try {
      const cachedRecommendations = await cacheService.getPersonalizedRecommendations(userId);
      if (cachedRecommendations) {
        logger.debug(`Cache hit for user ${userId}'s personalized recommendations`);
        return cachedRecommendations;
      }

      const [collaborative, contentBased] = await Promise.all([
        this.getCollaborativeRecommendations(userId, limit * 2),
        this.getContentBasedRecommendations(userId, limit * 2),
      ]);

      // Combine and normalize scores
      const combinedScores = new Map<string, number>();

      collaborative.forEach((product) => {
        combinedScores.set(product.id, (product.rating / 5) * this.COLLABORATIVE_WEIGHT);
      });

      contentBased.forEach((product) => {
        const existingScore = combinedScores.get(product.id) || 0;
        combinedScores.set(
          product.id,
          existingScore + (product.rating / 5) * this.CONTENT_WEIGHT
        );
      });

      // Get product details and sort by score
      const products = await prisma.product.findMany({
        where: {
          id: { in: Array.from(combinedScores.keys()) },
        },
      });

      const result = products
        .map(product => ({
          id: product.id,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          description: product.description,
          productName: product.productName,
          productId: product.productId,
          category: product.category,
          subcategory: product.subcategory,
          price: product.price,
          quantityInStock: product.quantityInStock,
          manufacturer: product.manufacturer,
          rating: product.rating,
          isFeatured: product.isFeatured,
          isOnSale: product.isOnSale,
          salePrice: product.salePrice ?? undefined,
          features: product.features,
          similarityVector: product.similarityVector,
          weight: product.weight,
          dimensions: product.dimensions,
          releaseDate: new Date(product.releaseDate),
          imageUrl: product.imageUrl,
          score: combinedScores.get(product.id) || 0
        }))
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, limit);

      await cacheService.setPersonalizedRecommendations(userId, result);
      return result;
    } catch (error) {
      logger.error('Error in getHybridRecommendations:', error);
      throw error;
    }
  }

  static async getColdStartRecommendations(limit: number = 10): Promise<Product[]> {
    const cacheKey = `cold_start_${limit}`;
    const cached = await cacheService.getPersonalizedRecommendations(cacheKey);
    if (cached) return cached;

    const products = await prisma.product.findMany({
      where: {
        rating: { gte: 4 },
        isFeatured: true,
      },
      select: {
        id: true,
        createdAt: true,
        updatedAt: true,
        productId: true,
        productName: true,
        category: true,
        subcategory: true,
        price: true,
        quantityInStock: true,
        manufacturer: true,
        description: true,
        weight: true,
        dimensions: true,
        releaseDate: true,
        rating: true,
        isFeatured: true,
        isOnSale: true,
        salePrice: true,
        imageUrl: true,
        features: true,
        similarityVector: true,
      },
      orderBy: [
        { rating: 'desc' },
        { createdAt: 'desc' },
      ],
      take: limit,
    });

    const formattedProducts = products.map(product => ({
      id: product.id,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
      description: product.description,
      productName: product.productName,
      productId: product.productId,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      quantityInStock: product.quantityInStock,
      manufacturer: product.manufacturer,
      rating: product.rating,
      isFeatured: product.isFeatured,
      isOnSale: product.isOnSale,
      salePrice: product.salePrice ?? undefined,
      features: product.features,
      similarityVector: product.similarityVector,
      weight: product.weight,
      dimensions: product.dimensions,
      releaseDate: new Date(product.releaseDate),
      imageUrl: product.imageUrl
    })) as Product[];

    await cacheService.setPersonalizedRecommendations(cacheKey, formattedProducts);
    return formattedProducts;
  }

  static async getSimilarProducts(
    productId: string,
    limit: number = 5
  ): Promise<Product[]> {
    try {
      const cachedSimilarProducts = await cacheService.getSimilarProducts(productId);
      if (cachedSimilarProducts) {
        logger.debug(`Cache hit for product ${productId}'s similar products`);
        return cachedSimilarProducts;
      }

      const sourceProduct = await prisma.product.findUnique({
        where: { id: productId },
      });

      if (!sourceProduct) {
        throw new Error('Product not found');
      }

      const products = await prisma.product.findMany({
        where: {
          AND: [
            { id: { not: productId } },
            { category: sourceProduct.category },
          ],
        },
      });

      const result = products
        .map(product => ({
          id: product.id,
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
          description: product.description,
          productName: product.productName,
          productId: product.productId,
          category: product.category,
          subcategory: product.subcategory,
          price: product.price,
          quantityInStock: product.quantityInStock,
          manufacturer: product.manufacturer,
          rating: product.rating,
          isFeatured: product.isFeatured,
          isOnSale: product.isOnSale,
          salePrice: product.salePrice ?? undefined,
          features: product.features,
          similarityVector: product.similarityVector,
          weight: product.weight,
          dimensions: product.dimensions,
          releaseDate: new Date(product.releaseDate),
          imageUrl: product.imageUrl,
          similarity: calculateCosineSimilarity(
            sourceProduct.similarityVector,
            product.similarityVector
          )
        }))
        .sort((a, b) => (b.similarity || 0) - (a.similarity || 0))
        .slice(0, limit);

      await cacheService.setSimilarProducts(productId, result);
      return result;
    } catch (error) {
      logger.error('Error in getSimilarProducts:', error);
      throw error;
    }
  }

  static async getTrendingProducts(
    timeWindow: 'day' | 'week' | 'month' = 'week',
    limit: number = 10
  ): Promise<Product[]> {
    try {
      const cachedTrending = await cacheService.getTrendingProducts(timeWindow);
      if (cachedTrending) {
        logger.debug(`Cache hit for trending products (${timeWindow})`);
        return cachedTrending;
      }

      const timeFilter = new Date();
      switch (timeWindow) {
        case 'day':
          timeFilter.setDate(timeFilter.getDate() - 1);
          break;
        case 'week':
          timeFilter.setDate(timeFilter.getDate() - 7);
          break;
        case 'month':
          timeFilter.setMonth(timeFilter.getMonth() - 1);
          break;
      }

      const interactions = await prisma.interaction.findMany({
        where: {
          createdAt: { gte: timeFilter },
          type: { in: ['view', 'like', 'purchase'] },
        },
        include: { product: true },
      });

      const productCounts = new Map<string, number>();
      interactions.forEach(interaction => {
        const count = productCounts.get(interaction.productId) || 0;
        productCounts.set(
          interaction.productId,
          count + this.getInteractionWeight(interaction.type as InteractionType)
        );
      });

      const products = await prisma.product.findMany({
        where: {
          id: { in: Array.from(productCounts.keys()) },
        },
      });

      const result = products
        .map(product => ({
          ...product,
          interactionCount: productCounts.get(product.id) || 0,
          releaseDate: new Date(product.releaseDate),
          salePrice: product.salePrice ?? undefined,
        }))
        .sort((a, b) => (b.interactionCount || 0) - (a.interactionCount || 0))
        .slice(0, limit);

      await cacheService.setTrendingProducts(timeWindow, result);
      return result;
    } catch (error) {
      logger.error('Error in getTrendingProducts:', error);
      throw error;
    }
  }
}