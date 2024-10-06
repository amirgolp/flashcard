import {CssBaseline, ThemeProvider} from "@mui/material"
import {QueryClient, QueryClientProvider} from "@tanstack/react-query"
import {Route, BrowserRouter as Router, Routes} from "react-router-dom"
import {ColorModeContext, useMode} from "./theme/theme.ts"
import Layout from "./components/Layout.tsx"
import DeckList from "./components/DeckList.tsx"
import CreateDeck from "./components/CreateDeck.tsx"
import DeckView from "./components/DeckView.tsx"
import ReviewDecks from "./components/ReviewDecks.tsx"

function App() {
  const [theme, colorMode] = useMode()

  const queryClient = new QueryClient();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <CssBaseline />
            <Layout>
              <Routes>
                <Route path="/" element={<DeckList />} />
                <Route path="/create" element={<CreateDeck />} />
                <Route path="/deck/:id" element={<DeckView />} />
                <Route path="/review" element={<ReviewDecks />} />
              </Routes>
            </Layout>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}

export default App
