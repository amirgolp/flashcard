import { useState, type FormEvent } from 'react';
import {
  Paper,
  Stack,
  TextField,
  Button,
  Alert,
  Typography,
  Link as MuiLink,
} from '@mui/material';
import { useNavigate } from '@tanstack/react-router';
import { useAuth } from '../../context/AuthContext';

export default function RegisterForm() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordMismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const passwordTooShort = password.length > 0 && password.length < 8;

  const isFormValid =
    username.trim().length > 0 &&
    email.trim().length > 0 &&
    password.length >= 8 &&
    password === confirmPassword;

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setLoading(true);

    try {
      await register({ username, email, password });
      navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
      <form onSubmit={handleSubmit} noValidate>
        <Stack spacing={3}>
          <Typography variant="h5" component="h1" textAlign="center" fontWeight={600}>
            Create Account
          </Typography>

          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <TextField
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            fullWidth
            autoComplete="username"
            autoFocus
            disabled={loading}
          />

          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            autoComplete="email"
            disabled={loading}
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            disabled={loading}
            helperText="Must be at least 8 characters"
            error={passwordTooShort}
          />

          <TextField
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            disabled={loading}
            error={passwordMismatch}
            helperText={passwordMismatch ? 'Passwords do not match' : undefined}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading || !isFormValid}
          >
            {loading ? 'Creating account...' : 'Register'}
          </Button>

          <Typography variant="body2" textAlign="center">
            Already have an account?{' '}
            <MuiLink
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate({ to: '/login' })}
              sx={{ cursor: 'pointer' }}
            >
              Log in
            </MuiLink>
          </Typography>
        </Stack>
      </form>
    </Paper>
  );
}
