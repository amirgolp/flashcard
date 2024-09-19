import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import HomePage from './pages/Homepage'
import CreateFlashcardPage from './pages/CreateFlashcardPage'
import EditFlashcardPage from './pages/EditFlashcardPage'
import { Container } from '@mui/material'

const App: React.FC = () => {
  return (
    <Router>
      <Container maxWidth="md">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/create" element={<CreateFlashcardPage />} />
          <Route path="/edit/:id" element={<EditFlashcardPage />} />
        </Routes>
      </Container>
    </Router>
  )
}

export default App
