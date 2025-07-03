import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Alert,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import { Product } from '../types/product';
import { RecommendationCard } from './RecommendationCard';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';

type TimeWindow = 'day' | 'week' | 'month';

interface TrendingProductsProps {
  limit?: number;
  showTitle?: boolean;
  showTimeFilter?: boolean;
  onProductClick?: (product: Product) => void;
}

export const TrendingProducts: React.FC<TrendingProductsProps> = ({
  limit = 4,
  showTitle = true,
  showTimeFilter = true,
  onProductClick,
}) => {
  const [trendingProducts, setTrendingProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeWindow, setTimeWindow] = useState<TimeWindow>('week');
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTrendingProducts = async () => {
      try {
        const response = await api.get(`/recommendations/trending?limit=${limit}&timeWindow=${timeWindow}`);
        setTrendingProducts(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching trending products:', error);
        setError('Failed to load trending products');
      } finally {
        setIsLoading(false);
      }
    };

    setIsLoading(true);
    fetchTrendingProducts();
  }, [limit, timeWindow]);

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate(`/products/${product.id}`);
    }
  };

  const handleTimeWindowChange = (
    _event: React.MouseEvent<HTMLElement>,
    newTimeWindow: TimeWindow | null
  ) => {
    if (newTimeWindow) {
      setTimeWindow(newTimeWindow);
    }
  };

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const getRecommendationReason = (product: Product) => {
    const reasons = [
      `Popular in the last ${timeWindow}`,
      `Trending in ${product.category}`,
      `Highly rated by customers`,
      `Frequently purchased item`,
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  return (
    <Box sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        {showTitle && (
          <Typography variant="h5">
            Trending Products
          </Typography>
        )}
        {showTimeFilter && (
          <ToggleButtonGroup
            value={timeWindow}
            exclusive
            onChange={handleTimeWindowChange}
            size="small"
          >
            <ToggleButton value="day">Today</ToggleButton>
            <ToggleButton value="week">This Week</ToggleButton>
            <ToggleButton value="month">This Month</ToggleButton>
          </ToggleButtonGroup>
        )}
      </Box>
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
          : trendingProducts.map((product) => (
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