import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@mui/material/styles';
import { ErrorBoundary } from 'react-error-boundary';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import { AuthProvider } from './contexts/AuthContext';
import theme from './theme';

// Lazy load components
const Layout = React.lazy(() => import('./components/Layout'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Home = React.lazy(() => import('./pages/Home'));
const ProductCatalog = React.lazy(() => import('./pages/ProductCatalog'));
const ProductDetail = React.lazy(() => import('./pages/ProductDetail'));
const Profile = React.lazy(() => import('./pages/Profile'));
const RecommendedForYou = React.lazy(() => import('./pages/RecommendedForYou'));
const PasswordReset = React.lazy(() => import('./pages/PasswordReset'));
const PasswordResetRequest = React.lazy(() => import('./pages/PasswordResetRequest'));

// Create Query Client with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30000,
      cacheTime: 3600000,
      refetchOnWindowFocus: false,
      suspense: true,
    },
  },
});

// Loading fallback component
const LoadingFallback = () => (
  <Box
    display="flex"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
  >
    <CircularProgress />
  </Box>
);

// Error fallback component
const ErrorFallback = ({ error, resetErrorBoundary }: any) => (
  <Box
    display="flex"
    flexDirection="column"
    justifyContent="center"
    alignItems="center"
    minHeight="100vh"
    p={3}
    textAlign="center"
  >
    <h2>Something went wrong:</h2>
    <pre style={{ color: 'red' }}>{error.message}</pre>
    <button onClick={resetErrorBoundary}>Try again</button>
  </Box>
);

function App() {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <BrowserRouter>
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/password-reset" element={<PasswordReset />} />
                  <Route path="/password-reset-request" element={<PasswordResetRequest />} />
                  <Route path="/" element={<Layout />}>
                    <Route index element={<Home />} />
                    <Route path="products" element={<ProductCatalog />} />
                    <Route path="products/:id" element={<ProductDetail />} />
                    <Route path="profile" element={<Profile />} />
                    <Route path="recommendations" element={<RecommendedForYou />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </AuthProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App; 