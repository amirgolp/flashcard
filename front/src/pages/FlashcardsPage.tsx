import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { api, Flashcard } from '../services/api'
import {
  Container,
  Typography,
  Button,
  IconButton,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CardActions,
} from '@mui/material'
import {
  ViewList,
  GridView,
  ArrowForward,
  ArrowBack,
  Add,
  Edit,
} from '@mui/icons-material'
import './FlashcardsPage.css'
import Grid from '@mui/material/Grid2'

const FlashcardsPage: React.FC = () => {
  const { title } = useParams<{ title: string }>()
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [view, setView] = useState<'gallery' | 'list' | 'one'>('gallery')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [newGermanWord, setNewGermanWord] = useState('')
  const [newEnglishTranslation, setNewEnglishTranslation] = useState('')
  const [editedFlashcard, setEditedFlashcard] = useState<Flashcard | null>(null)

  useEffect(() => {
    const fetchFlashcards = async () => {
      if (title) {
        try {
          const data = await api.getFlashcardsByDeck(title)
          setFlashcards(data)
        } catch (error) {
          console.error(error)
        }
      }
    }
    fetchFlashcards()
  }, [title])

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextView: 'gallery' | 'list' | 'one'
  ) => {
    if (nextView !== null) {
      setView(nextView)
    }
  }

  const handleNextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const handlePreviousCard = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length
    )
  }

  const handleAddFlashcard = async () => {
    if (title) {
      try {
        const newFlashcard = await api.createFlashcard({
          german_word: newGermanWord,
          english_translation: newEnglishTranslation,
          decks: [title],
          status: 'medium',
        })
        setFlashcards((prev) => [...prev, newFlashcard])
        setOpenAddDialog(false)
        setNewGermanWord('')
        setNewEnglishTranslation('')
      } catch (error) {
        console.error(error)
        alert('Error adding flashcard.')
      }
    }
  }

  const handleFlashcardClick = (index: number) => {
    setCurrentIndex(index)
    setView('one')
  }

  const handleEditFlashcard = async () => {
    if (editedFlashcard) {
      try {
        await api.updateFlashcard(editedFlashcard.id, {
          german_word: editedFlashcard.german_word,
          english_translation: editedFlashcard.english_translation,
          status: editedFlashcard.status,
        })
        setFlashcards((prev) =>
          prev.map((fc) =>
            fc.id === editedFlashcard.id ? editedFlashcard : fc
          )
        )
        setOpenEditDialog(false)
      } catch (error) {
        console.error(error)
        alert('Error updating flashcard.')
      }
    }
  }

  const openEditDialogForFlashcard = (flashcard: Flashcard) => {
    setEditedFlashcard({ ...flashcard })
    setOpenEditDialog(true)
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Deck: {title}
      </Typography>

      {/* Add Flashcard Button */}
      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={() => setOpenAddDialog(true)}
        style={{ marginBottom: '16px' }}
      >
        Add Flashcard
      </Button>

      {/* Toggle between Gallery, List, and One-By-One view */}
      <ToggleButtonGroup
        value={view}
        exclusive
        onChange={handleViewChange}
        aria-label="view toggle"
        style={{ marginBottom: '16px' }}
      >
        <ToggleButton value="gallery" aria-label="gallery view">
          <GridView />
        </ToggleButton>
        <ToggleButton value="list" aria-label="list view">
          <ViewList />
        </ToggleButton>
        <ToggleButton value="one" aria-label="one by one view">
          1/1
        </ToggleButton>
      </ToggleButtonGroup>

      {view === 'gallery' && (
        <GalleryView
          flashcards={flashcards}
          onFlashcardClick={handleFlashcardClick}
        />
      )}
      {view === 'list' && (
        <ListView
          flashcards={flashcards}
          onFlashcardClick={handleFlashcardClick}
        />
      )}
      {view === 'one' && (
        <OneByOneView
          flashcards={flashcards}
          currentIndex={currentIndex}
          onNext={handleNextCard}
          onPrevious={handlePreviousCard}
          onEdit={() => openEditDialogForFlashcard(flashcards[currentIndex])}
        />
      )}

      {/* Add Flashcard Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="German Word"
            fullWidth
            value={newGermanWord}
            onChange={(e) => setNewGermanWord(e.target.value)}
          />
          <TextField
            margin="dense"
            label="English Translation"
            fullWidth
            value={newEnglishTranslation}
            onChange={(e) => setNewEnglishTranslation(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button onClick={handleAddFlashcard} color="primary">
            Add
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Flashcard Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)}>
        <DialogTitle>Edit Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="German Word"
            fullWidth
            value={editedFlashcard?.german_word || ''}
            onChange={(e) =>
              setEditedFlashcard((prev) =>
                prev ? { ...prev, german_word: e.target.value } : prev
              )
            }
          />
          <TextField
            margin="dense"
            label="English Translation"
            fullWidth
            value={editedFlashcard?.english_translation || ''}
            onChange={(e) =>
              setEditedFlashcard((prev) =>
                prev ? { ...prev, english_translation: e.target.value } : prev
              )
            }
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Status</InputLabel>
            <Select
              value={editedFlashcard?.status || 'easy'}
              onChange={(e) =>
                setEditedFlashcard((prev) =>
                  prev
                    ? {
                        ...prev,
                        status: e.target.value as
                          | 'fail'
                          | 'easy'
                          | 'medium'
                          | 'hard',
                      }
                    : prev
                )
              }
            >
              <MenuItem value="easy">Easy</MenuItem>
              <MenuItem value="medium">Medium</MenuItem>
              <MenuItem value="hard">Hard</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
          <Button onClick={handleEditFlashcard} color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}

const GalleryView: React.FC<{
  flashcards: Flashcard[]
  onFlashcardClick: (index: number) => void
}> = ({ flashcards, onFlashcardClick }) => (
  <Grid container spacing={3}>
    {flashcards.map((flashcard, index) => (
      <Grid key={flashcard.id}>
        <Card
          onClick={() => onFlashcardClick(index)}
          style={{ cursor: 'pointer' }}
        >
          <CardContent>
            <Typography variant="h6">{flashcard.german_word}</Typography>
          </CardContent>
        </Card>
      </Grid>
    ))}
  </Grid>
)

const ListView: React.FC<{
  flashcards: Flashcard[]
  onFlashcardClick: (index: number) => void
}> = ({ flashcards, onFlashcardClick }) => (
  <List>
    {flashcards.map((flashcard, index) => (
      <ListItem key={flashcard.id} onClick={() => onFlashcardClick(index)}>
        <ListItemText primary={flashcard.german_word} />
      </ListItem>
    ))}
  </List>
)

const OneByOneView: React.FC<{
  flashcards: Flashcard[]
  currentIndex: number
  onNext: () => void
  onPrevious: () => void
  onEdit: () => void
}> = ({ flashcards, currentIndex, onNext, onPrevious, onEdit }) => {
  const [isFlipped, setIsFlipped] = useState(false)

  const handleFlip = () => {
    setIsFlipped(!isFlipped)
  }

  // Reset flip state when the index changes (next/previous) to always show the front
  useEffect(() => {
    setIsFlipped(false)
  }, [currentIndex])

  return (
    <div className="flashcard-container" onClick={handleFlip}>
      {flashcards.length > 0 ? (
        <div className={`flashcard ${isFlipped ? 'flipped' : ''}`}>
          <div className="flashcard-face flashcard-front">
            <Card>
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Front (German)
                </Typography>
                <Typography variant="h6">
                  {flashcards[currentIndex].german_word}
                </Typography>
              </CardContent>
              <CardActions style={{ justifyContent: 'space-between' }}>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onPrevious()
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onNext()
                  }}
                >
                  <ArrowForward />
                </IconButton>
              </CardActions>
            </Card>
          </div>

          <div className="flashcard-face flashcard-back">
            <Card>
              <CardContent>
                <Typography
                  variant="subtitle2"
                  color="textSecondary"
                  gutterBottom
                >
                  Back (English)
                </Typography>
                <Typography variant="h6">
                  {flashcards[currentIndex].english_translation}
                </Typography>
              </CardContent>
              <CardActions style={{ justifyContent: 'space-between' }}>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onPrevious()
                  }}
                >
                  <ArrowBack />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit()
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  onClick={(e) => {
                    e.stopPropagation()
                    onNext()
                  }}
                >
                  <ArrowForward />
                </IconButton>
              </CardActions>
            </Card>
          </div>
        </div>
      ) : (
        <Typography>No flashcards available.</Typography>
      )}
    </div>
  )
}

export default FlashcardsPage
