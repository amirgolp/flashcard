import React from 'react'
import FlashcardList from '../components/FlashcardList'
import { Button, Box } from '@mui/material'
import { useNavigate } from 'react-router-dom'

const HomePage: React.FC = () => {
  const navigate = useNavigate()

  return (
    <Box sx={{ padding: 4 }}>
      <Button
        variant="contained"
        color="primary"
        onClick={() => navigate('/create')}
      >
        Create New Flashcard
      </Button>
      <FlashcardList />
    </Box>
  )
}

export default HomePage
