import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Grid,
  Box,
  Typography,
  Rating,
  Chip,
  Button,
  Divider,
  CircularProgress,
  Paper,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  Favorite as FavoriteIcon,
  FavoriteBorder as FavoriteBorderIcon,
  ShoppingCart as CartIcon,
} from '@mui/icons-material';
import { ProductCard } from '../components/ProductCard';
import { SimilarProducts } from '../components/SimilarProducts';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { Product } from '../../../backend/src/types/product';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [inCart, setInCart] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error',
  });

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get<Product>(`/products/${id}`);
        setProduct(response.data);

        // Track view interaction
        if (isAuthenticated) {
          await api.post('/interactions', {
            productId: id,
            type: 'view',
          });
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        navigate('/products');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProductDetails();
    }
  }, [id, navigate, isAuthenticated]);

  useEffect(() => {
    const fetchUserInteractions = async () => {
      if (isAuthenticated && id) {
        try {
          const response = await api.get('/interactions/history');
          setIsLiked(response.data.likedProducts.includes(id));
          setInCart(response.data.purchasedProducts.includes(id));
        } catch (error) {
          console.error('Error fetching user interactions:', error);
        }
      }
    };

    fetchUserInteractions();
  }, [id, isAuthenticated]);

  const handleInteraction = async (type: 'like' | 'addToCart' | 'purchase') => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    try {
      await api.post('/interactions', {
        productId: id,
        type,
      });

      switch (type) {
        case 'like':
          setIsLiked(!isLiked);
          setSnackbar({
            open: true,
            message: isLiked ? 'Removed from favorites' : 'Added to favorites',
            severity: 'success',
          });
          break;
        case 'addToCart':
          setInCart(true);
          setSnackbar({
            open: true,
            message: 'Added to cart',
            severity: 'success',
          });
          break;
        case 'purchase':
          setSnackbar({
            open: true,
            message: 'Purchase successful',
            severity: 'success',
          });
          break;
      }
    } catch (error) {
      console.error(`Error ${type}ing product:`, error);
      setSnackbar({
        open: true,
        message: `Error ${type}ing product`,
        severity: 'error',
      });
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={2} sx={{ p: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Product Image */}
          <Grid item xs={12} md={6}>
            <Box
              component="img"
              src={product.imageUrl}
              alt={product.productName}
              sx={{
                width: '100%',
                height: 'auto',
                maxHeight: 500,
                objectFit: 'contain',
                bgcolor: 'background.paper',
                borderRadius: 1,
              }}
            />
          </Grid>

          {/* Product Info */}
          <Grid item xs={12} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h4">
                {product.productName}
              </Typography>
              <IconButton
                color="primary"
                onClick={() => handleInteraction('like')}
                sx={{ ml: 1 }}
              >
                {isLiked ? <FavoriteIcon /> : <FavoriteBorderIcon />}
              </IconButton>
            </Box>
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Chip label={product.category} color="primary" />
              <Chip label={product.subcategory} color="secondary" />
              {product.isFeatured && <Chip label="Featured" color="warning" />}
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Rating value={product.rating} precision={0.5} readOnly />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({product.rating})
              </Typography>
            </Box>
            <Typography variant="h5" color="primary" sx={{ mb: 2 }}>
              ${product.price.toFixed(2)}
              {product.isOnSale && (
                <Chip
                  label={`Sale: $${product.salePrice?.toFixed(2)}`}
                  color="error"
                  size="small"
                  sx={{ ml: 2 }}
                />
              )}
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {product.description}
            </Typography>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Manufacturer
                </Typography>
                <Typography variant="body1">{product.manufacturer}</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Release Date
                </Typography>
                <Typography variant="body1">
                  {new Date(product.releaseDate).toLocaleDateString()}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Weight
                </Typography>
                <Typography variant="body1">{product.weight} kg</Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle2" color="text.secondary">
                  Stock
                </Typography>
                <Typography variant="body1">{product.quantityInStock} units</Typography>
              </Grid>
            </Grid>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Dimensions
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              {product.dimensions}
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="contained"
                  color="primary"
                  size="large"
                  fullWidth
                  startIcon={<CartIcon />}
                  onClick={() => handleInteraction('addToCart')}
                  disabled={inCart}
                >
                  {inCart ? 'In Cart' : 'Add to Cart'}
                </Button>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  color="primary"
                  size="large"
                  fullWidth
                  onClick={() => handleInteraction('purchase')}
                >
                  Buy Now
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>
      </Paper>

      {/* Similar Products Section */}
      <Box sx={{ mt: 6 }}>
        <SimilarProducts
          productId={id!}
          currentCategory={product.category}
          limit={4}
        />
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
}; 