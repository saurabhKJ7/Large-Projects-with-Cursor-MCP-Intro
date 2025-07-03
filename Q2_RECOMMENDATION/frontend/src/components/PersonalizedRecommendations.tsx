import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Typography,
  Skeleton,
  Alert,
  Button,
} from '@mui/material';
import { Product } from '../../../backend/src/types/product';
import { RecommendationCard } from './RecommendationCard';
import { api } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface PersonalizedRecommendationsProps {
  limit?: number;
  showTitle?: boolean;
  onProductClick?: (product: Product) => void;
}

export const PersonalizedRecommendations: React.FC<PersonalizedRecommendationsProps> = ({
  limit = 4,
  showTitle = true,
  onProductClick,
}) => {
  const [recommendations, setRecommendations] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const response = await api.get(`/recommendations/personalized?limit=${limit}`);
        setRecommendations(response.data);
        setError(null);
      } catch (error) {
        console.error('Error fetching personalized recommendations:', error);
        setError('Failed to load recommendations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [limit, isAuthenticated]);

  const handleProductClick = (product: Product) => {
    if (onProductClick) {
      onProductClick(product);
    } else {
      navigate(`/products/${product.id}`);
    }
  };

  if (!isAuthenticated) {
    return (
      <Alert
        severity="info"
        action={
          <Button color="inherit" size="small" onClick={() => navigate('/login')}>
            Sign In
          </Button>
        }
      >
        Sign in to see personalized recommendations
      </Alert>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  const getRecommendationReason = (product: Product) => {
    const reasons = [
      'Based on your browsing history',
      'Similar to items you\'ve liked',
      'Popular in categories you\'ve shown interest in',
      'Matches your shopping preferences',
    ];
    return reasons[Math.floor(Math.random() * reasons.length)];
  };

  return (
    <Box sx={{ py: 2 }}>
      {showTitle && (
        <Typography variant="h5" gutterBottom>
          Recommended for You
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
          : recommendations.map((product) => (
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