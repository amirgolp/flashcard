import React, { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  Typography,
  CardActions,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  DialogActions as MuiDialogActions,
} from '@mui/material'
import { ArrowBack, ArrowForward, Delete } from '@mui/icons-material'
import Grid from '@mui/material/Grid2'
import { Flashcard as FlashcardType } from '../../types'
import { useDeleteFlashcard, useUpdateFlashcard } from '../../services/api'
import { SelectChangeEvent } from '@mui/material/Select'
import EditIcon from '@mui/icons-material/Edit'
import DeleteIcon from '@mui/icons-material/Delete'

type Item = {
  id: string
  title?: string
  description?: string
  german_word?: string
  english_translation?: string
}

interface SharedViewProps {
  items: Item[]
  onClick: (idOrTitle: string) => void
  onDelete?: (idOrTitle: string) => void
  isDeck?: boolean
}

interface OnebyoneViewProps {
  flashcard: FlashcardType
  onUpdate: () => void
  onNext: () => void
  onPrevious: () => void
  currentIndex: number
  totalFlashcards: number
}

export const GalleryView: React.FC<SharedViewProps> = ({
  items,
  onClick,
  onDelete,
  isDeck,
}) => (
  <Grid container spacing={3}>
    {items.map((item) => (
      <Grid key={item.id}>
        <Card style={{ cursor: 'pointer' }}>
          <CardContent onClick={() => onClick(item.title || item.id)}>
            <Typography variant="h6">
              {isDeck ? item.title : item.german_word}
            </Typography>
            {isDeck && (
              <Typography variant="body2" color="textSecondary">
                {item.description}
              </Typography>
            )}
          </CardContent>
          {onDelete && (
            <CardActions>
              <IconButton onClick={() => onDelete(item.title || item.id)}>
                <Delete />
              </IconButton>
            </CardActions>
          )}
        </Card>
      </Grid>
    ))}
  </Grid>
)

export const ListView: React.FC<SharedViewProps> = ({
  items,
  onClick,
  onDelete,
  isDeck,
}) => (
  <List>
    {items.map((item) => (
      <ListItem key={item.id}>
        <ListItemText
          primary={isDeck ? item.title : item.german_word}
          secondary={isDeck ? item.description : item.english_translation}
          onClick={() => onClick(item.title || item.id)}
          style={{ cursor: 'pointer' }}
        />
        {onDelete && (
          <IconButton onClick={() => onDelete(item.title || item.id)}>
            <Delete />
          </IconButton>
        )}
      </ListItem>
    ))}
  </List>
)

export const OnebyoneView: React.FC<OnebyoneViewProps> = ({
  flashcard,
  onUpdate,
  onNext,
  onPrevious,
  currentIndex,
  totalFlashcards,
}) => {
  const [showFront, setShowFront] = useState(true)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [editedFlashcard, setEditedFlashcard] = useState({
    german_word: flashcard.german_word,
    english_translation: flashcard.english_translation,
    status: flashcard.status,
    decks: flashcard.decks || [],
  })

  const updateFlashcard = useUpdateFlashcard()
  const deleteFlashcard = useDeleteFlashcard()

  useEffect(() => {
    setShowFront(true)
  }, [currentIndex])

  const handleFlip = () => {
    setShowFront((prev) => !prev)
  }

  const handleEditFlashcard = async () => {
    try {
      await updateFlashcard.mutateAsync({
        id: flashcard.id,
        flashcard: {
          ...editedFlashcard,
          decks: editedFlashcard.decks,
        },
      })
      setOpenEditDialog(false)
      onUpdate()
    } catch (error) {
      console.error(error)
      alert('Error updating flashcard.')
    }
  }

  const handleDeleteFlashcard = async () => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await deleteFlashcard.mutateAsync(flashcard.id)
        onUpdate()
      } catch (error) {
        console.error(error)
        alert('Error deleting flashcard.')
      }
    }
  }

  const handleStatusChange = (event: SelectChangeEvent) => {
    setEditedFlashcard({
      ...editedFlashcard,
      status: event.target.value as 'easy' | 'medium' | 'hard' | 'fail',
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
                Front (German)
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
                Back (English)
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

        <RadioGroup
          row
          aria-label="status"
          name="status"
          value={editedFlashcard.status}
          onChange={handleStatusChange}
        >
          <FormControlLabel
            value="easy"
            control={<Radio color="success" />}
            label="Easy"
          />
          <FormControlLabel
            value="medium"
            control={<Radio color="warning" />}
            label="Medium"
          />
          <FormControlLabel
            value="hard"
            control={<Radio color="error" />}
            label="Hard"
          />
          <FormControlLabel
            value="fail"
            control={<Radio color="default" />}
            label="Fail"
          />
        </RadioGroup>

        <IconButton onClick={() => setOpenEditDialog(true)}>
          <EditIcon />
        </IconButton>
        <IconButton onClick={handleDeleteFlashcard}>
          <DeleteIcon />
        </IconButton>
      </CardActions>

      <div className="pagination-controls" style={{ textAlign: 'center' }}>
        <IconButton onClick={onPrevious} disabled={currentIndex === 0}>
          <ArrowBack />
        </IconButton>
        <Typography variant="body2">
          {currentIndex + 1} / {totalFlashcards}
        </Typography>
        <IconButton
          onClick={onNext}
          disabled={currentIndex === totalFlashcards - 1}
        >
          <ArrowForward />
        </IconButton>
      </div>

      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Front (German)"
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
            label="Back (English)"
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
              variant="filled"
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
              <MenuItem value="fail">Fail</MenuItem>
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
