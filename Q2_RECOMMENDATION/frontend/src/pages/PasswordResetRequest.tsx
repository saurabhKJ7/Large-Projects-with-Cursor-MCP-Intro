import { useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
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
import { PasswordResetRequestSchema } from '../../../backend/src/types/auth';
import { api } from '../services/api';

type PasswordResetRequestFormData = {
  email: string;
};

const PasswordResetRequest = () => {
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<PasswordResetRequestFormData>({
    resolver: zodResolver(PasswordResetRequestSchema),
  });

  const onSubmit = async (data: PasswordResetRequestFormData) => {
    try {
      setError(null);
      setSuccess(null);

      await api.post('/auth/password-reset-request', data);
      setSuccess('If your email is registered, you will receive a reset link');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'An error occurred while requesting password reset'
      );
    }
  };

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
          Enter your email address and we'll send you instructions to reset your
          password.
        </Typography>

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <TextField
            {...register('email')}
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            error={!!errors.email}
            helperText={errors.email?.message}
          />

          <Button
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            disabled={isSubmitting}
            sx={{ mt: 2 }}
          >
            {isSubmitting ? 'Sending...' : 'Send Reset Link'}
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

export default PasswordResetRequest; 