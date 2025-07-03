import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { extractFeatures } from '../types/product';

const prisma = new PrismaClient();

interface RawProduct {
  product_id: number;
  product_name: string;
  category: string;
  subcategory: string;
  price: number;
  quantity_in_stock: number;
  manufacturer: string;
  description: string;
  weight: number;
  dimensions: string;
  release_date: string;
  rating: number;
  is_featured: boolean;
  is_on_sale: boolean;
  sale_price: number;
  image_url: string;
}

export const importProducts = async () => {
  try {
    // Fetch products from the provided URL
    const response = await axios.get<RawProduct[]>(
      'https://coding-platform.s3.amazonaws.com/dev/lms/tickets/5e1edafc-c15f-4276-ab27-611fb0a5cfb8/SL3IZLaDQwCLKWPC.json'
    );

    const products = response.data;
    const allFeatureKeys = new Set<string>();
    const processedProducts = products.map((product) => {
      const releaseDate = new Date(product.release_date + 'T00:00:00Z');
      const features = extractFeatures({
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

      // Collect all feature keys
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

    // Convert features to vectors
    const featureKeys = Array.from(allFeatureKeys).sort();
    const productsWithVectors = processedProducts.map((product) => {
      const features = JSON.parse(product.features as string);
      return {
        ...product,
        similarityVector: JSON.stringify(featureKeys.map(
          (key) => features[key] || 0
        )),
      };
    });

    // Import products in batches
    const batchSize = 50;
    for (let i = 0; i < productsWithVectors.length; i += batchSize) {
      const batch = productsWithVectors.slice(i, i + batchSize);
      // Create products one by one since SQLite doesn't support createMany
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
        } catch (error) {
          // Skip if product already exists (unique constraint violation)
          if (!(error instanceof Error && error.message.includes('Unique constraint'))) {
            throw error;
          }
        }
      }
    }

    console.log(`Imported ${productsWithVectors.length} products successfully`);
  } catch (error) {
    console.error('Error importing products:', error);
    throw error;
  }
};

// Function to run the import
if (require.main === module) {
  importProducts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}