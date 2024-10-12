import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import { DecksPage } from './pages/DecksPage'
import FlashcardsPage from './pages/FlashcardsPage'
import TopBar from './components/TopBar'
import Breadcrumbs from './components/Breadcrumbs'
import { Drawer, List, ListItem, ListItemText, Box } from '@mui/material'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

const App: React.FC = () => {
  const [openDrawer, setOpenDrawer] = useState(false)
  const navigate = useNavigate()

  return (
    <QueryClientProvider client={queryClient}>
      <TopBar onMenuClick={() => setOpenDrawer(true)} />
      <Drawer
        anchor="left"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
        PaperProps={{
          style: { width: 250 }, // Set drawer width to 250px
        }}
      >
        <List>
          <ListItem
            component="button"
            onClick={() => {
              navigate('/')
              setOpenDrawer(false)
            }}
            style={{ cursor: 'pointer', textAlign: 'left' }}
          >
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem
            component="button"
            onClick={() => {
              navigate('/decks')
              setOpenDrawer(false)
            }}
            style={{ cursor: 'pointer', textAlign: 'left' }}
          >
            <ListItemText primary="Decks" />
          </ListItem>
        </List>
      </Drawer>
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          margin: '16px 0',
        }}
      >
        <Breadcrumbs />
      </Box>
      <Routes>
        <Route path="/" element={<DecksPage />} />
        <Route path="/decks" element={<DecksPage />} />
        <Route path="/decks/:title" element={<FlashcardsPage />} />
      </Routes>
    </QueryClientProvider>
  )
}

export default App
