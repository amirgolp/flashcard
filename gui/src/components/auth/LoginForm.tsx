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

export default function LoginForm() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username, password);
      navigate({ to: '/dashboard' });
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Login failed. Please check your credentials and try again.');
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
            Log In
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
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            autoComplete="current-password"
            disabled={loading}
          />

          <Button
            type="submit"
            variant="contained"
            size="large"
            fullWidth
            disabled={loading || !username || !password}
          >
            {loading ? 'Logging in...' : 'Log In'}
          </Button>

          <Typography variant="body2" textAlign="center">
            Don&apos;t have an account?{' '}
            <MuiLink
              component="button"
              type="button"
              variant="body2"
              onClick={() => navigate({ to: '/register' })}
              sx={{ cursor: 'pointer' }}
            >
              Register
            </MuiLink>
          </Typography>
        </Stack>
      </form>
    </Paper>
  );
}
