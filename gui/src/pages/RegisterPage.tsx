import { Container, Box } from '@mui/material';
import { Navigate } from '@tanstack/react-router';
import { useAuth } from '../context/AuthContext';
import RegisterForm from '../components/auth/RegisterForm';

export default function RegisterPage() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return (
    <Container maxWidth="xs">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <RegisterForm />
      </Box>
    </Container>
  );
}
