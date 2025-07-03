import { Request, Response } from 'express';
import { InteractionSchema, InteractionType } from '../types/interaction';
import { PrismaClient } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';

const prisma = new PrismaClient();

export const trackInteraction = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      throw new AppError(401, 'Not authenticated');
    }

    const validatedData = InteractionSchema.parse(req.body);

    const interaction = await prisma.interaction.create({
      data: {
        userId,
        type: validatedData.type,
        productId: validatedData.productId,
      },
    });

    return res.status(201).json({
      status: 'success',
      data: { interaction },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const getUserInteractions = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      throw new AppError(401, 'Not authenticated');
    }

    const rawInteractions = await prisma.interaction.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: { product: true },
    });

    return res.status(200).json({
      status: 'success',
      data: { 
        interactions: rawInteractions.map(interaction => ({
          ...interaction,
          product: interaction.product ? {
            id: interaction.product.id,
            createdAt: interaction.product.createdAt,
            updatedAt: interaction.product.updatedAt,
            description: interaction.product.description,
            productName: interaction.product.productName,
            productId: interaction.product.productId,
            category: interaction.product.category,
            subcategory: interaction.product.subcategory,
            price: interaction.product.price,
            quantityInStock: interaction.product.quantityInStock,
            manufacturer: interaction.product.manufacturer,
            rating: interaction.product.rating,
            isFeatured: interaction.product.isFeatured,
            isOnSale: interaction.product.isOnSale,
            salePrice: interaction.product.salePrice ?? undefined,
            features: interaction.product.features,
            similarityVector: interaction.product.similarityVector,
            weight: interaction.product.weight,
            dimensions: interaction.product.dimensions,
            releaseDate: new Date(interaction.product.releaseDate),
            imageUrl: interaction.product.imageUrl
          } : null
        })) 
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const getRecentlyViewed = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      throw new AppError(401, 'Not authenticated');
    }

    const rawRecentViews = await prisma.interaction.findMany({
      where: {
        userId,
        type: 'view' as InteractionType,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: { product: true },
    });

    return res.status(200).json({
      status: 'success',
      data: { 
        recentViews: rawRecentViews.map(view => ({
          ...view,
          product: view.product ? {
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
          } : null
        })) 
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};

export const getPersonalizedRecommendations = async (req: Request, res: Response) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      throw new AppError(401, 'Not authenticated');
    }

    const limit = Number(req.query.limit) || 10;
    const rawRecommendations = await prisma.product.findMany({
      take: limit,
      orderBy: {
        rating: 'desc',
      },
      where: {
        NOT: {
          interactions: {
            some: {
              userId,
            },
          },
        },
      },
    });

    return res.status(200).json({
      status: 'success',
      data: { 
        recommendations: rawRecommendations.map(product => ({
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
        })) 
      },
    });
  } catch (error) {
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({
        status: 'error',
        message: error.message,
      });
    }
    return res.status(500).json({
      status: 'error',
      message: 'Internal server error',
    });
  }
};