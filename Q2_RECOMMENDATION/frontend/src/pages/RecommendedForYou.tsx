import React from 'react';
import {
  Box,
  Container,
  Typography,
  Divider,
} from '@mui/material';
import { PersonalizedRecommendations } from '../components/PersonalizedRecommendations';
import { TrendingProducts } from '../components/TrendingProducts';
import { useAuth } from '../contexts/AuthContext';

export const RecommendedForYou: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Recommended for You
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph>
          Discover products tailored to your interests and shopping history.
        </Typography>

        <Box sx={{ mt: 4 }}>
          <PersonalizedRecommendations
            limit={8}
            showTitle={false}
          />
        </Box>

        <Divider sx={{ my: 6 }} />

        <Box>
          <Typography variant="h5" gutterBottom>
            Trending Now
          </Typography>
          <Typography variant="body1" color="text.secondary" paragraph>
            See what's popular with other shoppers.
          </Typography>
          <TrendingProducts
            limit={8}
            showTitle={false}
            showTimeFilter={true}
          />
        </Box>

        {isAuthenticated && (
          <>
            <Divider sx={{ my: 6 }} />
            <Box>
              <Typography variant="h5" gutterBottom>
                Based on Your Recent Views
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph>
                Products similar to what you've been exploring.
              </Typography>
              <PersonalizedRecommendations
                limit={4}
                showTitle={false}
              />
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
}; 