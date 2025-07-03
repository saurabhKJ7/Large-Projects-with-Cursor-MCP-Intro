import React from 'react';
import {
  Box,
  Container,
  Grid,
  Typography,
  CircularProgress,
  Alert,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import ProductCard from '../components/ProductCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { api } from '../services/api';

interface Product {
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

interface ProductFilters {
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'rating_desc';
}

const ProductCatalog: React.FC = () => {
  const [filters, setFilters] = React.useState<ProductFilters>({});
  const [categories, setCategories] = React.useState<string[]>([]);
  const [searchTerm, setSearchTerm] = React.useState('');

  React.useEffect(() => {
    api.get('/products/categories').then((response) => {
      setCategories(response.data);
    });
  }, []);

  const fetchProducts = async (page: number) => {
    const response = await api.get('/products', {
      params: {
        page,
        limit: 12,
        search: searchTerm,
        ...filters,
      },
    });
    return response.data;
  };

  const {
    data: products,
    isLoadingInitialData,
    isLoadingMore,
    isEmpty,
    isReachingEnd,
    ref,
    error,
  } = useInfiniteScroll<Product>({
    queryKey: ['products', JSON.stringify(filters), searchTerm],
    fetchFn: fetchProducts,
  });

  const handleFilterChange = (
    field: keyof ProductFilters,
    value: string | number | undefined
  ) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value === '' ? undefined : value,
    }));
  };

  if (error) {
    return (
      <Container>
        <Alert severity="error" sx={{ mt: 4 }}>
          Error loading products: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Product Catalog
      </Typography>

      <Box sx={{ mb: 4 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Search products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={filters.category || ''}
                label="Category"
                onChange={(e) => handleFilterChange('category', e.target.value)}
              >
                <MenuItem value="">All</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="number"
              label="Min Price"
              value={filters.minPrice || ''}
              onChange={(e) =>
                handleFilterChange('minPrice', parseFloat(e.target.value))
              }
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <TextField
              fullWidth
              type="number"
              label="Max Price"
              value={filters.maxPrice || ''}
              onChange={(e) =>
                handleFilterChange('maxPrice', parseFloat(e.target.value))
              }
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <FormControl fullWidth>
              <InputLabel>Sort By</InputLabel>
              <Select
                value={filters.sortBy || ''}
                label="Sort By"
                onChange={(e) =>
                  handleFilterChange(
                    'sortBy',
                    e.target.value as ProductFilters['sortBy']
                  )
                }
              >
                <MenuItem value="">None</MenuItem>
                <MenuItem value="price_asc">Price: Low to High</MenuItem>
                <MenuItem value="price_desc">Price: High to Low</MenuItem>
                <MenuItem value="rating_desc">Highest Rated</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Box>

      {isLoadingInitialData ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : isEmpty ? (
        <Alert severity="info">No products found</Alert>
      ) : (
        <>
          <Grid container spacing={3}>
            {products.map((product) => (
              <Grid item key={product.id} xs={12} sm={6} md={4} lg={3}>
                <ProductCard {...product} />
              </Grid>
            ))}
          </Grid>

          <Box
            ref={ref}
            display="flex"
            justifyContent="center"
            my={4}
            minHeight={100}
          >
            {isLoadingMore && <CircularProgress />}
            {isReachingEnd && (
              <Typography color="text.secondary">
                No more products to load
              </Typography>
            )}
          </Box>
        </>
      )}
    </Container>
  );
};

export default ProductCatalog; 