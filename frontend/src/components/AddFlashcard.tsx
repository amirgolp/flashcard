import React, { useState } from 'react'
import { TextField, Button, Container, Box, Typography } from '@mui/material'
import { useMutation, useQueryClient } from 'react-query'
import axios from 'axios'

const AddFlashcard: React.FC = () => {
  const [german, setGerman] = useState('')
  const [english, setEnglish] = useState('')
  const queryClient = useQueryClient()

  const mutation = useMutation(
    (newFlashcard: { german: string; english: string }) => axios.post('/flashcards/', newFlashcard),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('flashcards')
        setGerman('')
        setEnglish('')
      },
    }
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    mutation.mutate({ german, english })
  }

  return (
    <Container>
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Add New Flashcard
        </Typography>
        <TextField
          label="German"
          variant="outlined"
          fullWidth
          required
          value={german}
          onChange={(e) => setGerman(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="English"
          variant="outlined"
          fullWidth
          required
          value={english}
          onChange={(e) => setEnglish(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" color="primary">
          Add Flashcard
        </Button>
      </Box>
    </Container>
  )
}

export default AddFlashcard