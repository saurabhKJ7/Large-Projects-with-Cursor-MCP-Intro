import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Box,
  Tabs,
  Tab,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Divider,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Favorite as LikeIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { ProductCard } from '../components/ProductCard';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Product } from '../../../backend/src/types/product';
import { InteractionStats } from '../../../backend/src/types/interaction';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

export const Profile: React.FC = () => {
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InteractionStats | null>(null);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [recommendations, setRecommendations] = useState<Product[]>([]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const [statsResponse, recentResponse, recommendationsResponse] = await Promise.all([
          api.get<InteractionStats>('/interactions/history'),
          api.get<Product[]>('/interactions/recently-viewed'),
          api.get<Product[]>('/interactions/recommendations'),
        ]);

        setStats(statsResponse.data);
        setRecentlyViewed(recentResponse.data);
        setRecommendations(recommendationsResponse.data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={4}>
        {/* User Info */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
              {user?.name}'s Profile
            </Typography>
            <Typography variant="body1" color="text.secondary">
              {user?.email}
            </Typography>
          </Paper>
        </Grid>

        {/* Interaction Stats */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" gutterBottom>
              Activity Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <ViewIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{stats?.totalViews || 0}</Typography>
                  <Typography variant="subtitle1">Products Viewed</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <LikeIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{stats?.totalLikes || 0}</Typography>
                  <Typography variant="subtitle1">Products Liked</Typography>
                </Box>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <CartIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                  <Typography variant="h4">{stats?.totalPurchases || 0}</Typography>
                  <Typography variant="subtitle1">Products Purchased</Typography>
                </Box>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Tabs */}
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Recently Viewed" />
              <Tab label="Recommended for You" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {recentlyViewed.map((product) => (
                  <Grid item key={product.id} xs={12} sm={6} md={4}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
                {recentlyViewed.length === 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary" align="center">
                      No recently viewed products
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Grid container spacing={3}>
                {recommendations.map((product) => (
                  <Grid item key={product.id} xs={12} sm={6} md={4}>
                    <ProductCard product={product} />
                  </Grid>
                ))}
                {recommendations.length === 0 && (
                  <Grid item xs={12}>
                    <Typography variant="body1" color="text.secondary" align="center">
                      No recommendations available yet
                    </Typography>
                  </Grid>
                )}
              </Grid>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}; 