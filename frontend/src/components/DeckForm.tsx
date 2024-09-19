import React, { useState } from 'react'
import { TextField, Button, Box } from '@mui/material'
import { createDeck } from '../api/api'

interface DeckFormProps {
  onDeckCreated: () => void
}

const DeckForm: React.FC<DeckFormProps> = ({ onDeckCreated }) => {
  const [name, setName] = useState<string>('')
  const [description, setDescription] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await createDeck({ name, description })
      setName('')
      setDescription('')
      onDeckCreated()
    } catch (error) {
      console.error('Error creating deck:', error)
    }
  }

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
      <TextField
        label="Deck Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        fullWidth
        required
        margin="normal"
      />
      <TextField
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Create Deck
      </Button>
    </Box>
  )
}

export default DeckForm
