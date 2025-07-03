import { useState } from 'react';
import { useNavigate, Link as RouterLink, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Box,
  Button,
  TextField,
  Typography,
  Link,
  Alert,
  Paper,
} from '@mui/material';
import { PasswordResetSchema } from '../../../backend/src/types/auth';
import { api } from '../services/api';

type PasswordResetFormData = {
  password: string;
};

const PasswordReset = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetFormData>({
    resolver: zodResolver(PasswordResetSchema),
  });

  const onSubmit = async (data: PasswordResetFormData) => {
    try {
      setError(null);

      if (!token) {
        throw new Error('Reset token is missing');
      }

      await api.post('/auth/password-reset', {
        token,
        password: data.password,
      });

      // Redirect to login with success message
      navigate('/login', {
        state: { message: 'Password has been reset successfully. Please log in.' },
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while resetting password'
      );
    }
  };

  if (!token) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '80vh',
        }}
      >
        <Paper elevation={3} sx={{ p: 4, maxWidth: 400 }}>
          <Typography variant="h6" color="error" gutterBottom>
            Invalid Reset Link
          </Typography>
          <Typography variant="body1" paragraph>
            The password reset link is invalid or has expired.
          </Typography>
          <Button
            component={RouterLink}
            to="/password-reset-request"
            variant="contained"
            fullWidth
          >
            Request New Reset Link
          </Button>
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '80vh',
      }}
    >
      <Paper
        elevation={3}
        sx={{
          p: 4,
          width: '100%',
          maxWidth: 400,
        }}
      >
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>

        <Typography variant="body2" sx={{ mb: 3 }} align="center">
          Please enter your new password.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register('password')}
            label="New Password"
            type="password"
            fullWidth
            margin="normal"
            error={!!errors.password}
            helperText={errors.password?.message}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? 'Resetting...' : 'Reset Password'}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Typography variant="body2">
              Remember your password?{' '}
              <Link component={RouterLink} to="/login">
                Back to login
              </Link>
            </Typography>
          </Box>
        </form>
      </Paper>
    </Box>
  );
};

export default PasswordReset; 