import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ProductSchema, SearchRequestSchema } from '../types/product';
import { AppError } from '../middleware/errorHandler';
import { calculateCosineSimilarity, parseVector } from '../types/product';

const prisma = new PrismaClient();

export const getProducts = async (req: Request, res: Response) => {
  try {
    const { query, page = 1, limit = 10, filter } = SearchRequestSchema.parse(req.query);

    const skip = (page - 1) * limit;
    const where: any = {};

    if (query) {
      where.OR = [
        { productName: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
        { category: { contains: query, mode: 'insensitive' } },
        { subcategory: { contains: query, mode: 'insensitive' } },
        { manufacturer: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (filter) {
      if (filter.category) where.category = filter.category;
      if (filter.subcategory) where.subcategory = filter.subcategory;
      if (filter.manufacturer) where.manufacturer = filter.manufacturer;
      if (filter.minPrice) where.price = { gte: filter.minPrice };
      if (filter.maxPrice) where.price = { ...where.price, lte: filter.maxPrice };
      if (filter.minRating) where.rating = { gte: filter.minRating };
      if (filter.isFeatured !== undefined) where.isFeatured = filter.isFeatured;
      if (filter.isOnSale !== undefined) where.isOnSale = filter.isOnSale;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: filter?.sortBy
          ? { [filter.sortBy]: filter.sortOrder || 'desc' }
          : { createdAt: 'desc' },
      }),
      prisma.product.count({ where }),
    ]);

    return res.status(200).json({
      status: 'success',
      data: {
        products,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
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

export const getProductById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    return res.status(200).json({
      status: 'success',
      data: { product },
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

export const getSimilarProducts = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { limit = 5 } = req.query;

    const product = await prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new AppError(404, 'Product not found');
    }

    const products = await prisma.product.findMany({
      where: {
        id: { not: id },
        category: product.category,
      },
    });

    const similarProducts = products
      .map(p => ({
        ...p,
        similarity: calculateCosineSimilarity(
          parseVector(product.similarityVector),
          parseVector(p.similarityVector)
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, Number(limit));

    return res.status(200).json({
      status: 'success',
      data: { products: similarProducts },
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

export const createProduct = async (req: Request, res: Response) => {
  try {
    const productData = ProductSchema.parse(req.body);

    const product = await prisma.product.create({
      data: {
        ...productData,
        features: JSON.stringify(productData.features),
        weight: productData.weight,
        dimensions: productData.dimensions,
        releaseDate: productData.releaseDate,
        imageUrl: productData.imageUrl,
      },
    });

    return res.status(201).json({
      status: 'success',
      data: { product },
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

export const updateProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const productData = ProductSchema.parse(req.body);

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...productData,
        features: JSON.stringify(productData.features),
        weight: productData.weight,
        dimensions: productData.dimensions,
        releaseDate: productData.releaseDate,
        imageUrl: productData.imageUrl,
      },
    });

    return res.status(200).json({
      status: 'success',
      data: { product },
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

export const deleteProduct = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await prisma.product.delete({
      where: { id },
    });

    return res.status(204).send();
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