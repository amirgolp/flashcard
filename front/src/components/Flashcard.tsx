import { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions as MuiDialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import './Flashcard.css'
import { api } from '../services/api'

// @ts-expect-error desc
const Flashcard = ({ flashcard, onUpdate }) => {
  const [showFront, setShowFront] = useState(true)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editedFlashcard, setEditedFlashcard] = useState({
    german_word: flashcard.german_word,
    english_translation: flashcard.english_translation,
    status: flashcard.status,
  })

  const handleFlip = () => {
    setShowFront((prev) => !prev)
  }

  const handleEditFlashcard = async () => {
    try {
      await api.updateFlashcard(flashcard.id, editedFlashcard)
      setOpenEditDialog(false)
      onUpdate() // Refresh the flashcards list
    } catch (error) {
      console.error(error)
      alert('Error updating flashcard.')
    }
  }

  const handleDeleteFlashcard = async () => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await api.deleteFlashcard(flashcard.id)
        onUpdate() // Refresh the flashcards list
      } catch (error) {
        console.error(error)
        alert('Error deleting flashcard.')
      }
    }
  }
  // @ts-expect-error desc
  const handleStatusChange = (e) => {
    setEditedFlashcard({
      ...editedFlashcard,
      status: e.target.value,
    })
  }

  return (
    <div className="flashcard-container">
      <div
        className={`flashcard ${showFront ? '' : 'flip'}`}
        onClick={handleFlip}
      >
        <div className="front">
          <Card variant="outlined" style={{ minWidth: 275 }}>
            <CardContent>
              <Typography
                variant="h6"
                component="div"
                gutterBottom
                style={{ textAlign: 'left', fontSize: '1rem' }}
              >
                German Word
              </Typography>
              <Typography
                variant="h5"
                style={{ textAlign: 'left', fontSize: '1.2rem' }}
              >
                {flashcard.german_word}
              </Typography>
            </CardContent>
          </Card>
        </div>
        <div className="back">
          <Card variant="outlined" style={{ minWidth: 275 }}>
            <CardContent>
              <Typography
                variant="h6"
                component="div"
                gutterBottom
                style={{ textAlign: 'left', fontSize: '1rem' }}
              >
                English Translation
              </Typography>
              <Typography
                variant="h5"
                style={{ textAlign: 'left', fontSize: '1.2rem' }}
              >
                {flashcard.english_translation}
              </Typography>
            </CardContent>
          </Card>
        </div>
      </div>
      <CardActions style={{ justifyContent: 'center' }}>
        <Button onClick={() => setShowFront(true)} disabled={showFront}>
          Show Front
        </Button>
        <Button onClick={() => setShowFront(false)} disabled={!showFront}>
          Show Back
        </Button>
        <Button onClick={() => setOpenEditDialog(true)}>Edit</Button>
        <IconButton onClick={handleDeleteFlashcard}>
          <DeleteIcon />
        </IconButton>
      </CardActions>

      {/* Edit Flashcard Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="German Word"
            fullWidth
            value={editedFlashcard.german_word}
            onChange={(e) =>
              setEditedFlashcard({
                ...editedFlashcard,
                german_word: e.target.value,
              })
            }
          />
          <TextField
            margin="dense"
            label="English Translation"
            fullWidth
            value={editedFlashcard.english_translation}
            onChange={(e) =>
              setEditedFlashcard({
                ...editedFlashcard,
                english_translation: e.target.value,
              })
            }
          />
          <FormControl fullWidth margin="dense">
            <InputLabel id="edit-status-label">
              Staus
            </InputLabel>
            <Select
              labelId="edit-status-label"
              value={editedFlashcard.status}
              label="Status"
              onChange={handleStatusChange}
              style={{
                backgroundColor:
                  editedFlashcard.status === 'hard'
                    ? 'red'
                    : editedFlashcard.status === 'medium'
                      ? 'yellow'
                      : 'green',
              }}
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
              <MenuItem value="fail">Hard</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <MuiDialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditFlashcard} color="primary">
            Save
          </Button>
        </MuiDialogActions>
      </Dialog>
    </div>
  )
}

export default Flashcard