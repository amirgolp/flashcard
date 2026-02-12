import { createTheme, type Theme } from '@mui/material/styles';

export function getTheme(mode: 'light' | 'dark'): Theme {
  return createTheme({
    palette: {
      mode,
      primary: { main: '#1976d2' },
      secondary: { main: '#f57c00' },
    },
    typography: {
      fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
      h4: { fontWeight: 600 },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiCard: {
        defaultProps: { elevation: 2 },
      },
      MuiButton: {
        styleOverrides: {
          root: { textTransform: 'none' },
        },
      },
    },
  });
}
