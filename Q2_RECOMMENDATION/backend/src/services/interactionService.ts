import { PrismaClient } from '@prisma/client';
import {
  InteractionType,
  calculateCategoryPreference,
} from '../types/interaction';
import { Product } from '../types/product';

const prisma = new PrismaClient();

export class InteractionService {
  private static async getCategoryMap(): Promise<Record<string, string>> {
    const products = await prisma.product.findMany({
      select: { id: true, category: true, subcategory: true },
    });

    return products.reduce((map, product) => {
      map[product.id] = product.category;
      return map;
    }, {} as Record<string, string>);
  }

  static async trackInteraction(
    userId: string,
    productId: string,
    type: InteractionType
  ) {
    return prisma.interaction.create({
      data: {
        userId,
        productId,
        type: type as string
      },
    });
  }

  static async getUserInteractionStats(userId: string) {
    const [
      viewCount,
      likeCount,
      purchaseCount,
      recentViews,
      likes,
      purchases,
    ] = await Promise.all([
      prisma.interaction.count({
        where: { userId, type: 'view' },
      }),
      prisma.interaction.count({
        where: { userId, type: 'like' },
      }),
      prisma.interaction.count({
        where: { userId, type: 'purchase' },
      }),
      prisma.interaction.findMany({
        where: { userId, type: 'view' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { productId: true },
      }),
      prisma.interaction.findMany({
        where: { userId, type: 'like' },
        select: { productId: true },
      }),
      prisma.interaction.findMany({
        where: { userId, type: 'purchase' },
        select: { productId: true },
      }),
    ]);

    return {
      totalViews: viewCount,
      totalLikes: likeCount,
      totalPurchases: purchaseCount,
      recentlyViewed: recentViews.map((i) => i.productId),
      likedProducts: likes.map((i) => i.productId),
      purchasedProducts: purchases.map((i) => i.productId),
    };
  }

  static async updateUserPreferences(userId: string): Promise<Record<string, number>> {
    // Get user's interactions
    const interactions = await prisma.interaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 100, // Consider last 100 interactions
      select: {
        id: true,
        type: true,
        userId: true,
        productId: true,
        createdAt: true
      }
    }) as unknown as { type: InteractionType; id: string; createdAt: Date; userId: string; productId: string; }[];

    const categoryMap = await this.getCategoryMap();
    const preferences = calculateCategoryPreference(interactions, categoryMap);

    // Update preferences in database
    await Promise.all(
      Object.entries(preferences).map(([category, weight]) =>
        prisma.userPreference.upsert({
          where: {
            userId_category: {
              userId,
              category,
            },
          },
          update: { weight },
          create: {
            userId,
            category,
            weight,
          },
        } as any) // Type assertion needed due to Prisma client type limitations
      )
    );

    return preferences;
  }

  static async getPersonalizedRecommendations(
    userId: string,
    limit: number = 10
  ): Promise<Product[]> {
    // Get user preferences
    const preferences = await prisma.userPreference.findMany({
      where: { userId },
    });

    // Get all products
    const products = await prisma.product.findMany();

    // Calculate recommendation scores
    const scores = products.map((product) => {
      let score = 0;

      // Category preference score
      const categoryPreference = preferences.find(
        (p) => p.category === product.category
      );
      if (categoryPreference) {
        score += categoryPreference.weight * 0.4; // 40% weight to category preference
      }

      // Rating score (normalized to 0-1)
      score += (product.rating / 5) * 0.3; // 30% weight to rating

      // Popularity score (if product is featured)
      if (product.isFeatured) {
        score += 0.2; // 20% weight to featured status
      }

      // Sale score
      if (product.isOnSale) {
        score += 0.1; // 10% weight to sale status
      }

      return {
        product,
        score,
      };
    });

    // Sort by score and return top N products
    return scores
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map((item) => ({
        id: item.product.id,
        createdAt: item.product.createdAt,
        updatedAt: item.product.updatedAt,
        description: item.product.description,
        productName: item.product.productName,
        productId: item.product.productId,
        category: item.product.category,
        subcategory: item.product.subcategory,
        price: item.product.price,
        quantityInStock: item.product.quantityInStock,
        manufacturer: item.product.manufacturer,
        rating: item.product.rating,
        isFeatured: item.product.isFeatured,
        isOnSale: item.product.isOnSale,
        salePrice: item.product.salePrice ?? undefined,
        features: item.product.features,
        similarityVector: item.product.similarityVector,
        weight: item.product.weight,
        dimensions: item.product.dimensions,
        releaseDate: new Date(item.product.releaseDate),
        imageUrl: item.product.imageUrl
      }));
  }

  static async getRecentlyViewedProducts(userId: string, limit: number = 5) {
    const recentViews = await prisma.interaction.findMany({
      where: { userId, type: 'view' },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { product: true },
      distinct: ['productId'],
    });

    return recentViews.map((view) => ({
      id: view.product.id,
      createdAt: view.product.createdAt,
      updatedAt: view.product.updatedAt,
      description: view.product.description,
      productName: view.product.productName,
      productId: view.product.productId,
      category: view.product.category,
      subcategory: view.product.subcategory,
      price: view.product.price,
      quantityInStock: view.product.quantityInStock,
      manufacturer: view.product.manufacturer,
      rating: view.product.rating,
      isFeatured: view.product.isFeatured,
      isOnSale: view.product.isOnSale,
      salePrice: view.product.salePrice ?? undefined,
      features: view.product.features,
      similarityVector: view.product.similarityVector,
      weight: view.product.weight,
      dimensions: view.product.dimensions,
      releaseDate: new Date(view.product.releaseDate),
      imageUrl: view.product.imageUrl
    }));
  }
}