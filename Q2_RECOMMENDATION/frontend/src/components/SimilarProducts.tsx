import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Alert,
} from '@mui/material';
import { Product } from '../../../backend/src/types/product';
import { RecommendationCard } from './RecommendationCard';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

interface SimilarProductsProps {
  productId: string;
  currentCategory?: string;
  limit?: number;
  showTitle?: boolean;
  onProductClick?: (product: Product) => void;
}

export const SimilarProducts: React.FC<SimilarProductsProps> = ({
  productId,
  currentCategory,
  limit = 4,
  showTitle = true,
  onProductClick,
}) => {
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSimilarProducts = async () => {
      try {
        const response = await api.get(`/recommendations/similar/${productId}?limit=${limit}`);
        setSimilarProducts(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching similar products:', error);
        setError('Failed to load similar products');
      } finally {
        setIsLoading(false);
      }
    };

    if (productId) {
      setIsLoading(true);
      fetchSimilarProducts();
    }
  }, [productId, limit]);

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate(`/products/${product.id}`);
    }
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const getRecommendationReason = (product: Product) => {
    const reasons = [
      `Similar features to the current product`,
      `Also in the ${currentCategory || product.category} category`,
      `Customers also viewed this product`,
      `Similar price range and features`,
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  return (
    <Box sx={{ py: 2 }}>
      {showTitle && (
        <Typography variant="h5" gutterBottom>
          Similar Products
        </Typography>
      )}
      <Grid container spacing={3}>
        {isLoading
          ? Array.from(new Array(limit)).map((_, index) => (
              <Grid item xs={12} sm={6} md={3} key={index}>
                <Skeleton
                  variant="rectangular"
                  height={400}
                  sx={{ borderRadius: 1 }}
                />
              </Grid>
            ))
          : similarProducts.map((product) => (
              <Grid item xs={12} sm={6} md={3} key={product.id}>
                <RecommendationCard
                  product={product}
                  reason={getRecommendationReason(product)}
                  onClick={handleProductClick}
                />
              </Grid>
            ))}
      </Grid>
    </Box>
  );
}; 