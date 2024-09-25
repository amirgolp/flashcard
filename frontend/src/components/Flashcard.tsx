import React from 'react'
import { Card, CardContent, Typography, Button, Stack } from '@mui/material'

interface FlashcardProps {
  flashcard: {
    id: string
    german: string
    english: string
    date_created: string
    date_modified: string
    guessed_correct: boolean
    guessed_wrong: boolean
  }
  onGuess: (id: string, correct: boolean) => void
}

const Flashcard: React.FC<FlashcardProps> = ({ flashcard, onGuess }) => {
  const [flipped, setFlipped] = React.useState(false)

  return (
    <Card sx={{ minWidth: 275, margin: 2 }}>
      <CardContent>
        <Typography variant="h5" component="div">
          {flipped ? flashcard.english : flashcard.german}
        </Typography>
        <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
          <Button variant="outlined" onClick={() => setFlipped(!flipped)}>
            {flipped ? 'Show German' : 'Show English'}
          </Button>
          <Button variant="contained" color="success" onClick={() => onGuess(flashcard.id, true)}>
            Correct
          </Button>
          <Button variant="contained" color="error" onClick={() => onGuess(flashcard.id, false)}>
            Incorrect
          </Button>
        </Stack>
      </CardContent>
    </Card>
  )
}

export default Flashcard