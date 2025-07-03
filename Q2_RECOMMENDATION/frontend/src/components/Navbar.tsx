import React from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
} from '@mui/material';
import {
  Home as HomeIcon,
  ShoppingCart as ShoppingCartIcon,
  Person as PersonIcon,
  Recommend as RecommendIcon,
} from '@mui/icons-material';

const Navbar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  return (
    <AppBar position="sticky">
      <Toolbar>
        <IconButton
          edge="start"
          color="inherit"
          component={RouterLink}
          to="/"
          sx={{ mr: 2 }}
        >
          <HomeIcon />
        </IconButton>

        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          Product Recommendations
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<ShoppingCartIcon />}
            component={RouterLink}
            to="/products"
          >
            Products
          </Button>

          <Button
            color="inherit"
            startIcon={<RecommendIcon />}
            component={RouterLink}
            to="/recommendations"
          >
            For You
          </Button>

          <Button
            color="inherit"
            startIcon={<PersonIcon />}
            component={RouterLink}
            to="/profile"
          >
            Profile
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;