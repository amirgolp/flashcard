import React, { useState } from 'react'
import { TextField, Button, Box } from '@mui/material'
import { Flashcard } from '../types/Flashcard'

interface FlashcardFormProps {
  initialData?: Partial<Flashcard>
  onSubmit: (data: Omit<Flashcard, '_id'>) => void
}

const FlashcardForm: React.FC<FlashcardFormProps> = ({
  initialData = {},
  onSubmit,
}) => {
  const [german, setGerman] = useState<string>(initialData.german || '')
  const [english, setEnglish] = useState<string>(initialData.english || '')
  const [exampleSentence, setExampleSentence] = useState<string>(
    initialData.example_sentence || ''
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({ german, english, example_sentence: exampleSentence })
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        label="German"
        value={german}
        onChange={(e) => setGerman(e.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="English"
        value={english}
        onChange={(e) => setEnglish(e.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Example Sentence"
        value={exampleSentence}
        onChange={(e) => setExampleSentence(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Submit
      </Button>
    </Box>
  )
}

export default FlashcardForm
