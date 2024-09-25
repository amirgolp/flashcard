import React, { useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  Button,
  Stack,
  TextField,
} from '@mui/material'
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid'

interface FlashcardProps {
  flashcard: {
    id: string
    german: string
    english: string
    date_created: string
    date_modified: string
    guessed_correct: boolean
    guessed_wrong: boolean
    notes?: string
  }
  onGuess: (id: string, correct: boolean) => void
  onNotesChange?: (id: string, notes: string) => void
}

const Flashcard: React.FC<FlashcardProps> = ({
  flashcard,
  onGuess,
  onNotesChange,
}) => {
  const [flipped, setFlipped] = useState(false)
  const [notes, setNotes] = useState(flashcard.notes || '')

  const handleFlip = () => {
    setFlipped(!flipped)
  }

  const handleNotesChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setNotes(e.target.value)
    if (onNotesChange) {
      onNotesChange(flashcard.id, e.target.value)
    }
  }

  return (
    <Card
      sx={{
        width: { xs: '90%', sm: 300 }, // 90% width on extra-small screens, 300px on small and up
        margin: 'auto',
        perspective: '1000px',
      }}
    >
      <CardContent
        sx={{
          position: 'relative',
          width: '100%',
          height: 200,
          transformStyle: 'preserve-3d',
          transition: 'transform 0.8s',
          transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Side - German */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            backgroundColor: '#f0f0f0',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
          }}
        >
          <Typography variant="h5" component="div">
            {flashcard.german}
          </Typography>
        </div>

        {/* Back Side - English */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            backgroundColor: '#d0e1f9',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
            boxSizing: 'border-box',
            transform: 'rotateY(180deg)',
          }}
        >
          <Typography variant="h5" component="div">
            {flashcard.english}
          </Typography>
        </div>
      </CardContent>

      {/* Flip Button */}
      <Stack direction="row" justifyContent="center" sx={{ mt: 1 }}>
        <Button
          variant="outlined"
          startIcon={<FlipCameraAndroidIcon />}
          onClick={handleFlip}
        >
          Flip
        </Button>
      </Stack>

      {/* Guess Buttons */}
      <Stack
        direction="row"
        spacing={2}
        justifyContent="center"
        sx={{ mt: 2, mb: 2 }}
      >
        <Button
          variant="contained"
          color="success"
          onClick={() => onGuess(flashcard.id, true)}
        >
          Correct
        </Button>
        <Button
          variant="contained"
          color="error"
          onClick={() => onGuess(flashcard.id, false)}
        >
          Incorrect
        </Button>
      </Stack>

      {/* Notes Section */}
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notes
        </Typography>
        <TextField
          label="Your Notes"
          variant="outlined"
          fullWidth
          multiline
          rows={3}
          value={notes}
          onChange={handleNotesChange}
        />
      </CardContent>
    </Card>
  )
}

export default Flashcard
