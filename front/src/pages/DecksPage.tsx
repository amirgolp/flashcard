import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { GridView, ViewList } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import { useDecks, useCreateDeck, useDeleteDeck } from '../services/api'
import { GalleryView, ListView } from '../components/DataView/SharedViews'

export const DecksPage: React.FC = () => {
  const { data: decks = [], isLoading, error, refetch } = useDecks()
  const createDeck = useCreateDeck()
  const deleteDeck = useDeleteDeck()

  const [searchTerm, setSearchTerm] = useState('')
  const [filteredDecks, setFilteredDecks] = useState(decks)
  const [view, setView] = useState<'gallery' | 'list'>('gallery')
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const results = searchTerm
      ? decks.filter((deck) =>
          deck.title.toLowerCase().includes(searchTerm.toLowerCase())
        )
      : decks
    setFilteredDecks(results)
  }, [searchTerm, decks])

  const handleCreateDeck = async () => {
    try {
      await createDeck.mutateAsync({
        title: newDeckTitle,
        description: newDeckDescription,
      })
      setOpenCreateDialog(false)
      setNewDeckTitle('')
      setNewDeckDescription('')
      await refetch()
    } catch (error) {
      console.error(error)
      alert('Error creating deck. The title might already exist.')
    }
  }

  const handleDeleteDeck = async (title: string) => {
    if (
      window.confirm(`Are you sure you want to delete the deck "${title}"?`)
    ) {
      try {
        await deleteDeck.mutateAsync(title)
        await refetch()
      } catch (error) {
        console.error(error)
        alert('Error deleting deck.')
      }
    }
  }

  const handleStudyDeck = (title: string) => {
    navigate(`/decks/${title}`)
  }

  const handleViewChange = (
    _event: React.MouseEvent<HTMLElement>,
    nextView: 'gallery' | 'list'
  ) => {
    if (nextView !== null) {
      setView(nextView)
    }
  }

  if (isLoading) return <Typography>Loading...</Typography>
  if (error) return <Typography>Error loading decks.</Typography>

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Decks
      </Typography>
      <Button
        variant="contained"
        color="primary"
        onClick={() => setOpenCreateDialog(true)}
      >
        Create Deck
      </Button>
      <TextField
        label="Search Decks"
        variant="outlined"
        fullWidth
        margin="normal"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
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
      </ToggleButtonGroup>

      {view === 'gallery' ? (
        <GalleryView
          items={filteredDecks}
          onClick={handleStudyDeck}
          onDelete={handleDeleteDeck}
          isDeck
        />
      ) : (
        <ListView
          items={filteredDecks}
          onClick={handleStudyDeck}
          onDelete={handleDeleteDeck}
          isDeck
        />
      )}

      <Dialog
        open={openCreateDialog}
        onClose={() => setOpenCreateDialog(false)}
      >
        <DialogTitle>Create New Deck</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Deck Title"
            fullWidth
            value={newDeckTitle}
            onChange={(e) => setNewDeckTitle(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            value={newDeckDescription}
            onChange={(e) => setNewDeckDescription(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreateDialog(false)}>Cancel</Button>
          <Button onClick={handleCreateDeck} color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  )
}
