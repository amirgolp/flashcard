import { Box, Button, CssBaseline, ThemeProvider } from '@mui/material'
import { ColorModeContext, useMode } from './theme'
import React from 'react'

const App: React.FC = () => {
  const [theme, colorMode] = useMode()

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <Box
          sx={{
            display: "flex",
            height: "100vh",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "background.default",
            color: "text.primary",
          }}
        >
          <Button variant="contained" onClick={colorMode.toggleColorMode}>
            Toggle Color Mode
          </Button>
        </Box>
      </ThemeProvider>
    </ColorModeContext.Provider>

  )
}

export default App
