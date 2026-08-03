import { useEffect, useRef, useState } from 'react'
import { Alert, Box, Button, CircularProgress, Typography } from '@mui/material'
import { useNavigate } from '@tanstack/react-router'
import { useAuth } from '../context/AuthContext'

export default function CallbackPage() {
  const { completeLogin } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  // signinCallback consumes the one-time authorization code, so it must not
  // run twice (React StrictMode double-invokes effects in dev).
  const ran = useRef(false)

  useEffect(() => {
    if (ran.current) return
    ran.current = true
    completeLogin()
      .then(() => navigate({ to: '/dashboard' }))
      .catch((e) =>
        setError(e instanceof Error ? e.message : 'Sign-in failed'),
      )
  }, [completeLogin, navigate])

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 2,
      }}
    >
      {error ? (
        <>
          <Alert severity="error">{error}</Alert>
          <Button onClick={() => navigate({ to: '/login' })}>
            Back to sign-in
          </Button>
        </>
      ) : (
        <>
          <CircularProgress />
          <Typography color="text.secondary">Completing sign-in…</Typography>
        </>
      )}
    </Box>
  )
}
