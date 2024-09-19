import React, { useEffect, useState } from 'react'
import FlashcardForm from '../components/FlashcardForm'
import { getFlashcard, updateFlashcard } from '../api/api'
import { useNavigate, useParams } from 'react-router-dom'
import { Box, Typography, CircularProgress } from '@mui/material'
import { Flashcard } from '../types/Flashcard'

const EditFlashcardPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [flashcard, setFlashcard] = useState<Flashcard | null>(null)
  const [loading, setLoading] = useState<boolean>(true)

  const fetchFlashcard = async () => {
    try {
      if (id) {
        const data = await getFlashcard(id)
        setFlashcard(data)
      }
    } catch (error) {
      console.error('Error fetching flashcard:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFlashcard()
  }, [id])

  const handleSubmit = async (data: {
    german: string
    english: string
    example_sentence?: string
  }) => {
    if (id) {
      try {
        await updateFlashcard(id, data)
        navigate('/')
      } catch (error) {
        console.error('Error updating flashcard:', error)
      }
    }
  }

  if (loading) return <CircularProgress />

  if (!flashcard) return <Typography>Flashcard not found.</Typography>

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Edit Flashcard
      </Typography>
      <FlashcardForm initialData={flashcard} onSubmit={handleSubmit} />
    </Box>
  )
}

export default EditFlashcardPage
