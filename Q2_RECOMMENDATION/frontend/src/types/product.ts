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