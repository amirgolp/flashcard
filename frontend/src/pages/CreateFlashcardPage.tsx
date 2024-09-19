import React from 'react'
import FlashcardForm from '../components/FlashcardForm'
import { createFlashcard } from '../api/api'
import { useNavigate } from 'react-router-dom'
import { Box, Typography } from '@mui/material'

const CreateFlashcardPage: React.FC = () => {
  const navigate = useNavigate()

  const handleSubmit = async (data: {
    german: string
    english: string
    example_sentence?: string
  }) => {
    try {
      await createFlashcard(data)
      navigate('/')
    } catch (error) {
      console.error('Error creating flashcard:', error)
    }
  }

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Create New Flashcard
      </Typography>
      <FlashcardForm onSubmit={handleSubmit} />
    </Box>
  )
}

export default CreateFlashcardPage
