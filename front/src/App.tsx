import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import DecksPage from './pages/DecksPage'
import FlashcardsPage from './pages/FlashcardsPage'
import TopBar from './components/TopBar'
import Breadcrumbs from './components/Breadcrumbs'
import { Drawer, List, ListItem, ListItemText } from '@mui/material'

const App: React.FC = () => {
  const [openDrawer, setOpenDrawer] = useState(false)
  const navigate = useNavigate()

  return (
    <>
      <TopBar onMenuClick={() => setOpenDrawer(true)} />
      <Drawer
        anchor="left"
        open={openDrawer}
        onClose={() => setOpenDrawer(false)}
      >
        <List>
          <ListItem
            onClick={() => {
              navigate('/')
              setOpenDrawer(false)
            }}
          >
            <ListItemText primary="Home" />
          </ListItem>
          <ListItem
            onClick={() => {
              navigate('/decks')
              setOpenDrawer(false)
            }}
          >
            <ListItemText primary="Decks" />
          </ListItem>
        </List>
      </Drawer>
      <Breadcrumbs />
      <Routes>
        <Route path="/" element={<DecksPage />} />
        <Route path="/decks" element={<DecksPage />} />
        <Route path="/decks/:title" element={<FlashcardsPage />} />
      </Routes>
    </>
  )
}

export default App
