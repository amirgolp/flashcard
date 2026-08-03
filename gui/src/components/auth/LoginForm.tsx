import { useState } from 'react'
import { Alert, Button, Paper, Stack, Typography } from '@mui/material'
import LoginIcon from '@mui/icons-material/Login'
import { useAuth } from '../../context/AuthContext'

export default function LoginForm() {
  const { login } = useAuth()
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async () => {
    setError(null)
    try {
      await login()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to start sign-in')
    }
  }

  return (
    <Paper elevation={3} sx={{ p: 4, width: '100%' }}>
      <Stack spacing={3}>
        <Typography
          variant="h5"
          component="h1"
          textAlign="center"
          fontWeight={600}
        >
          Log In
        </Typography>

        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Typography variant="body2" color="text.secondary" textAlign="center">
          Sign in with your Zitadel account. New accounts are created
          automatically on first sign-in.
        </Typography>

        <Button
          variant="contained"
          size="large"
          fullWidth
          startIcon={<LoginIcon />}
          onClick={handleLogin}
        >
          Sign in with Zitadel
        </Button>
      </Stack>
    </Paper>
  )
}
