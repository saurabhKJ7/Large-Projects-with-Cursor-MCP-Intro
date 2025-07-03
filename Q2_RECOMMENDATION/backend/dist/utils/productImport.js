"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.importProducts = void 0;
const client_1 = require("@prisma/client");
const axios_1 = __importDefault(require("axios"));
const product_1 = require("../types/product");
const prisma = new client_1.PrismaClient();
const importProducts = async () => {
    try {
        const response = await axios_1.default.get('https://coding-platform.s3.amazonaws.com/dev/lms/tickets/5e1edafc-c15f-4276-ab27-611fb0a5cfb8/SL3IZLaDQwCLKWPC.json');
        const products = response.data;
        const allFeatureKeys = new Set();
        const processedProducts = products.map((product) => {
            const releaseDate = new Date(product.release_date + 'T00:00:00Z');
            const features = (0, product_1.extractFeatures)({
                productId: product.product_id,
                productName: product.product_name,
                category: product.category,
                subcategory: product.subcategory,
                price: product.price,
                quantityInStock: product.quantity_in_stock,
                manufacturer: product.manufacturer,
                description: product.description,
                weight: product.weight,
                dimensions: product.dimensions,
                releaseDate: releaseDate,
                rating: product.rating,
                isFeatured: product.is_featured,
                isOnSale: product.is_on_sale,
                salePrice: product.sale_price,
                imageUrl: product.image_url,
            });
            Object.keys(features).forEach((key) => allFeatureKeys.add(key));
            return {
                productId: product.product_id,
                productName: product.product_name,
                category: product.category,
                subcategory: product.subcategory,
                price: product.price,
                quantityInStock: product.quantity_in_stock,
                manufacturer: product.manufacturer,
                description: product.description,
                weight: product.weight,
                dimensions: product.dimensions,
                releaseDate: new Date(product.release_date + 'T00:00:00Z'),
                rating: product.rating,
                isFeatured: product.is_featured,
                isOnSale: product.is_on_sale,
                salePrice: product.sale_price,
                imageUrl: product.image_url,
                features: JSON.stringify(features),
                similarityVector: JSON.stringify([]),
            };
        });
        const featureKeys = Array.from(allFeatureKeys).sort();
        const productsWithVectors = processedProducts.map((product) => {
            const features = JSON.parse(product.features);
            return Object.assign(Object.assign({}, product), { similarityVector: JSON.stringify(featureKeys.map((key) => features[key] || 0)) });
        });
        const batchSize = 50;
        for (let i = 0; i < productsWithVectors.length; i += batchSize) {
            const batch = productsWithVectors.slice(i, i + batchSize);
            for (const product of batch) {
                try {
                    await prisma.product.create({
                        data: {
                            productId: product.productId,
                            productName: product.productName,
                            category: product.category,
                            subcategory: product.subcategory,
                            price: product.price,
                            quantityInStock: product.quantityInStock,
                            manufacturer: product.manufacturer,
                            description: product.description,
                            weight: product.weight,
                            dimensions: product.dimensions,
                            releaseDate: product.releaseDate,
                            rating: product.rating,
                            isFeatured: product.isFeatured,
                            isOnSale: product.isOnSale,
                            salePrice: product.salePrice,
                            imageUrl: product.imageUrl,
                            features: product.features,
                            similarityVector: product.similarityVector
                        }
                    });
                }
                catch (error) {
                    if (!(error instanceof Error && error.message.includes('Unique constraint'))) {
                        throw error;
                    }
                }
            }
        }
        console.log(`Imported ${productsWithVectors.length} products successfully`);
    }
    catch (error) {
        console.error('Error importing products:', error);
        throw error;
    }
};
exports.importProducts = importProducts;
if (require.main === module) {
    (0, exports.importProducts)()
        .then(() => process.exit(0))
        .catch((error) => {
        console.error(error);
        process.exit(1);
    });
}
//# sourceMappingURL=productImport.js.map