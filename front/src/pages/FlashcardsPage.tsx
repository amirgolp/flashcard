import { FC, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  Container,
  Typography,
  Button,
  ToggleButton,
  ToggleButtonGroup,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material'
import { Add } from '@mui/icons-material'
import {
  useFlashcardsByDeck,
  useCreateFlashcard,
  useUpdateFlashcard,
} from '../services/api'
import { Flashcard } from '../types'
import {
  GalleryView,
  ListView,
  OnebyoneView,
} from '../components/DataView/SharedViews'

const FlashcardsPage: FC = () => {
  const { title } = useParams<{ title: string }>()
  const { data: flashcards = [], refetch } = useFlashcardsByDeck(title!)
  const createFlashcard = useCreateFlashcard()
  const updateFlashcard = useUpdateFlashcard()

  const [view, setView] = useState<'gallery' | 'list' | 'one'>('gallery')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [openAddDialog, setOpenAddDialog] = useState(false)
  const [openEditDialog, setOpenEditDialog] = useState(false)
  const [newGermanWord, setNewGermanWord] = useState('')
  const [newEnglishTranslation, setNewEnglishTranslation] = useState('')
  const [editedFlashcard, setEditedFlashcard] = useState<Flashcard | null>(null)

  useEffect(() => {
    refetch()
  }, [title, refetch])

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextView: 'gallery' | 'list' | 'one'
  ) => {
    if (nextView !== null) setView(nextView)
  }

  const handleNextCard = () => {
    setCurrentIndex((prev) => (prev + 1) % flashcards.length)
  }

  const handlePreviousCard = () => {
    setCurrentIndex(
      (prev) => (prev - 1 + flashcards.length) % flashcards.length
    )
  }

  const handleFlashcardClick = (id: string) => {
    const index = flashcards.findIndex((fc) => fc.id === id)
    setCurrentIndex(index)
    setView('one')
  }

  const handleAddFlashcard = async () => {
    if (title) {
      try {
        await createFlashcard.mutateAsync({
          german_word: newGermanWord,
          english_translation: newEnglishTranslation,
          decks: [title],
          status: 'easy',
        })
        setOpenAddDialog(false)
        setNewGermanWord('')
        setNewEnglishTranslation('')
        await refetch()
      } catch (error) {
        console.error(error)
        alert('Error adding flashcard.')
      }
    }
  }

  const handleEditFlashcard = async () => {
    if (editedFlashcard) {
      try {
        await updateFlashcard.mutateAsync({
          id: editedFlashcard.id,
          flashcard: {
            german_word: editedFlashcard.german_word,
            english_translation: editedFlashcard.english_translation,
            status: editedFlashcard.status,
            decks: editedFlashcard.decks, // Include decks in the update
          },
        })
        setOpenEditDialog(false)
        await refetch()
      } catch (error) {
        console.error(error)
        alert('Error updating flashcard.')
      }
    }
  }

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Deck: {title}
      </Typography>

      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <ToggleButtonGroup
          value={view}
          exclusive
          onChange={handleViewChange}
          aria-label="view toggle"
          style={{ marginBottom: '16px' }}
        >
          <ToggleButton value="gallery" aria-label="gallery view">
            Gallery
          </ToggleButton>
          <ToggleButton value="list" aria-label="list view">
            List
          </ToggleButton>
          <ToggleButton value="one" aria-label="one by one view">
            1/1
          </ToggleButton>
        </ToggleButtonGroup>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => setOpenAddDialog(true)}
        >
          Add Flashcard
        </Button>
      </div>

      {view === 'gallery' && (
        <GalleryView
          items={flashcards}
          onClick={handleFlashcardClick}
          isDeck={false}
        />
      )}
      {view === 'list' && (
        <ListView
          items={flashcards}
          onClick={handleFlashcardClick}
          isDeck={false}
        />
      )}
      {view === 'one' && (
        <>
          <OnebyoneView
            flashcard={flashcards[currentIndex]}
            onUpdate={refetch}
            onNext={handleNextCard}
            onPrevious={handlePreviousCard}
            currentIndex={currentIndex}
            totalFlashcards={flashcards.length}
          />
        </>
      )}

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

export default FlashcardsPage
