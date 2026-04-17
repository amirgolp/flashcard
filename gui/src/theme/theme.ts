import { createTheme, type Theme } from '@mui/material/styles'

export function getTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#f57c00' },
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 600, letterSpacing: '-0.02em' },
      h5: { fontWeight: 600, letterSpacing: '-0.01em' },
      h6: { fontWeight: 600 },
      button: { fontWeight: 500, letterSpacing: '0.01em' },
    },
    components: {
      MuiCard: {
        defaultProps: { elevation: 2 },
        styleOverrides: { root: { borderRadius: 16 } },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 16 },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: { borderRadius: 24, padding: 8 },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none', borderRadius: 12, padding: '8px 16px' },
        },
      },
      MuiOutlinedInput: {
        styleOverrides: {
          root: { borderRadius: 12 },
        },
      },
    },
  })
}
