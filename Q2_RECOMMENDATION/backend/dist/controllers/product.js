"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteProduct = exports.updateProduct = exports.createProduct = exports.getSimilarProducts = exports.getProductById = exports.getProducts = void 0;
const client_1 = require("@prisma/client");
const product_1 = require("../types/product");
const errorHandler_1 = require("../middleware/errorHandler");
const product_2 = require("../types/product");
const prisma = new client_1.PrismaClient();
const getProducts = async (req, res) => {
    try {
        const { query, page = 1, limit = 10, filter } = product_1.SearchRequestSchema.parse(req.query);
        const skip = (page - 1) * limit;
        const where = {};
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
            if (filter.category)
                where.category = filter.category;
            if (filter.subcategory)
                where.subcategory = filter.subcategory;
            if (filter.manufacturer)
                where.manufacturer = filter.manufacturer;
            if (filter.minPrice)
                where.price = { gte: filter.minPrice };
            if (filter.maxPrice)
                where.price = Object.assign(Object.assign({}, where.price), { lte: filter.maxPrice });
            if (filter.minRating)
                where.rating = { gte: filter.minRating };
            if (filter.isFeatured !== undefined)
                where.isFeatured = filter.isFeatured;
            if (filter.isOnSale !== undefined)
                where.isOnSale = filter.isOnSale;
        }
        const [products, total] = await Promise.all([
            prisma.product.findMany({
                where,
                skip,
                take: limit,
                orderBy: (filter === null || filter === void 0 ? void 0 : filter.sortBy)
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
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
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
exports.getProducts = getProducts;
const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw new errorHandler_1.AppError(404, 'Product not found');
        }
        return res.status(200).json({
            status: 'success',
            data: { product },
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
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
exports.getProductById = getProductById;
const getSimilarProducts = async (req, res) => {
    try {
        const { id } = req.params;
        const { limit = 5 } = req.query;
        const product = await prisma.product.findUnique({
            where: { id },
        });
        if (!product) {
            throw new errorHandler_1.AppError(404, 'Product not found');
        }
        const products = await prisma.product.findMany({
            where: {
                id: { not: id },
                category: product.category,
            },
        });
        const similarProducts = products
            .map(p => (Object.assign(Object.assign({}, p), { similarity: (0, product_2.calculateCosineSimilarity)((0, product_2.parseVector)(product.similarityVector), (0, product_2.parseVector)(p.similarityVector)) })))
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, Number(limit));
        return res.status(200).json({
            status: 'success',
            data: { products: similarProducts },
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
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
exports.getSimilarProducts = getSimilarProducts;
const createProduct = async (req, res) => {
    try {
        const productData = product_1.ProductSchema.parse(req.body);
        const product = await prisma.product.create({
            data: Object.assign(Object.assign({}, productData), { features: JSON.stringify(productData.features), weight: productData.weight, dimensions: productData.dimensions, releaseDate: productData.releaseDate, imageUrl: productData.imageUrl }),
        });
        return res.status(201).json({
            status: 'success',
            data: { product },
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
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
exports.createProduct = createProduct;
const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const productData = product_1.ProductSchema.parse(req.body);
        const product = await prisma.product.update({
            where: { id },
            data: Object.assign(Object.assign({}, productData), { features: JSON.stringify(productData.features), weight: productData.weight, dimensions: productData.dimensions, releaseDate: productData.releaseDate, imageUrl: productData.imageUrl }),
        });
        return res.status(200).json({
            status: 'success',
            data: { product },
        });
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
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
exports.updateProduct = updateProduct;
const deleteProduct = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.product.delete({
            where: { id },
        });
        return res.status(204).send();
    }
    catch (error) {
        if (error instanceof errorHandler_1.AppError) {
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
exports.deleteProduct = deleteProduct;
//# sourceMappingURL=product.js.map