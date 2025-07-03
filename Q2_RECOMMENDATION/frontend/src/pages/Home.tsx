import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Grid,
  Paper,
} from '@mui/material';
import { TrendingProducts } from '../components/TrendingProducts';
import { PersonalizedRecommendations } from '../components/PersonalizedRecommendations';
import { useAuth } from '../contexts/AuthContext';

export const Home: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  return (
    <Container maxWidth="lg">
      {/* Hero Section */}
      <Paper
        sx={{
          position: 'relative',
          backgroundColor: 'grey.800',
          color: '#fff',
          mb: 4,
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'center',
          backgroundImage: 'url(https://source.unsplash.com/random?shopping)',
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            right: 0,
            left: 0,
            backgroundColor: 'rgba(0,0,0,.6)',
          }}
        />
        <Grid container>
          <Grid item md={6}>
            <Box
              sx={{
                position: 'relative',
                p: { xs: 3, md: 6 },
                pr: { md: 0 },
              }}
            >
              <Typography component="h1" variant="h3" color="inherit" gutterBottom>
                Discover Products You'll Love
              </Typography>
              <Typography variant="h5" color="inherit" paragraph>
                Our AI-powered recommendation system helps you find the perfect products
                based on your interests and preferences.
              </Typography>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/products')}
              >
                Browse Products
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Trending Products Section */}
      <Box sx={{ mb: 6 }}>
        <TrendingProducts limit={8} />
      </Box>

      {/* Personalized Recommendations Section */}
      {isAuthenticated && (
        <Box sx={{ mb: 6 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h5" gutterBottom>
              Recommended for You
            </Typography>
            <Button
              variant="outlined"
              color="primary"
              onClick={() => navigate('/recommended')}
            >
              View All
            </Button>
          </Box>
          <PersonalizedRecommendations limit={4} showTitle={false} />
        </Box>
      )}
    </Container>
  );
};

export default Home; 