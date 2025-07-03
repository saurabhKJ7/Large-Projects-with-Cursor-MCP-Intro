import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Chip,
  Rating,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LazyImage from './LazyImage';

interface ProductCardProps {
  id: string;
  productName: string;
  price: number;
  salePrice?: number;
  rating: number;
  imageUrl: string;
  category: string;
  isOnSale: boolean;
  isFeatured: boolean;
}

const ProductCard: React.FC<ProductCardProps> = ({
  id,
  productName,
  price,
  salePrice,
  rating,
  imageUrl,
  category,
  isOnSale,
  isFeatured,
}) => {
  const navigate = useNavigate();

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: 4,
          transition: 'all 0.3s ease-in-out',
        },
      }}
    >
      {(isOnSale || isFeatured) && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 1,
            display: 'flex',
            gap: 1,
          }}
        >
          {isOnSale && (
            <Chip
              label="Sale"
              color="error"
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          )}
          {isFeatured && (
            <Chip
              label="Featured"
              color="primary"
              size="small"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </Box>
      )}
      <Box sx={{ position: 'relative', paddingTop: '100%' }}>
        <LazyImage
          src={imageUrl}
          alt={productName}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
          }}
        />
      </Box>
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography
          variant="subtitle2"
          color="text.secondary"
          gutterBottom
          noWrap
        >
          {category}
        </Typography>
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            minHeight: '3.6em',
          }}
        >
          {productName}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            mb: 1,
          }}
        >
          <Rating value={rating} precision={0.5} readOnly size="small" />
          <Typography variant="body2" color="text.secondary">
            ({rating})
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
          {isOnSale && salePrice ? (
            <>
              <Typography
                variant="h6"
                color="error"
                component="span"
                fontWeight="bold"
              >
                ${salePrice.toFixed(2)}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ textDecoration: 'line-through' }}
              >
                ${price.toFixed(2)}
              </Typography>
            </>
          ) : (
            <Typography variant="h6" component="span" fontWeight="bold">
              ${price.toFixed(2)}
            </Typography>
          )}
        </Box>
      </CardContent>
      <CardActions>
        <Button
          size="small"
          color="primary"
          onClick={() => navigate(`/products/${id}`)}
          fullWidth
        >
          View Details
        </Button>
      </CardActions>
    </Card>
  );
};

export default ProductCard; 