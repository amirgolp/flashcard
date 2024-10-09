import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import { useUpdateFlashcard, useDeleteFlashcard } from '../services/api'
import { DialogActions as MuiDialogActions } from '@mui/material'
import { StatusOptions, StatusType } from '../types'

interface FlashcardProps {
  flashcard: {
    id: string
    german_word: string
    english_translation: string
    status: StatusType
  }
  onUpdate: () => void
}

const Flashcard: React.FC<FlashcardProps> = ({ flashcard, onUpdate }) => {
  const [showFront, setShowFront] = useState(true)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editedFlashcard, setEditedFlashcard] = useState({
    german_word: flashcard.german_word,
    english_translation: flashcard.english_translation,
    status: flashcard.status,
  })

  const updateFlashcard = useUpdateFlashcard()
  const deleteFlashcard = useDeleteFlashcard()

  const handleFlip = () => {
    setShowFront((prev) => !prev)
  }

  const handleEditFlashcard = async () => {
    try {
      updateFlashcard.mutate(
        { id: flashcard.id, flashcard: editedFlashcard },
        {
          onSuccess: () => {
            setOpenEditDialog(false)
            onUpdate() // Refresh the flashcards list
          },
          onError: (error) => {
            console.error(error)
            alert('Error updating flashcard.')
          },
        }
      )
    } catch (error) {
      console.error(error)
      alert('Error updating flashcard.')
    }
  }

  const handleDeleteFlashcard = async () => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        deleteFlashcard.mutate(flashcard.id, {
          onSuccess: () => {
            onUpdate()
          },
          onError: (error) => {
            console.error(error)
            alert('Error deleting flashcard.')
          },
        })
      } catch (error) {
        console.error(error)
        alert('Error deleting flashcard.')
      }
    }
  }

  const handleStatusChange = (e: SelectChangeEvent) => {
    setEditedFlashcard({
      ...editedFlashcard,
      status: e.target.value as StatusType,
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
            <InputLabel id="edit-status-label">Status</InputLabel>
            <Select
              labelId="edit-status-label"
              value={editedFlashcard.status}
              label="Status"
              onChange={handleStatusChange}
              style={{
                backgroundColor:
                  editedFlashcard.status === 'hard'
                    ? 'red'
                    : editedFlashcard.status === 'fail'
                      ? 'orange'
                      : 'green',
              }}
            >
              {StatusOptions.map((status) => (
                <MenuItem key={status} value={status}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </MenuItem>
              ))}
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
