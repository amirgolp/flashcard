import React, { useState, useEffect } from 'react'
import {
  Container,
  Typography,
  Button,
  List,
  ListItem,
  ListItemText,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material'
import { Delete, PlayArrow, ViewList, GridView } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import Grid from '@mui/material/Grid2'
import { useDecks, useCreateDeck, useDeleteDeck } from '../services/api'
import { Deck } from '../types'

const DecksPage: React.FC = () => {
  const { data: decks = [], isLoading, error, refetch } = useDecks()
  const createDeck = useCreateDeck()
  const deleteDeck = useDeleteDeck()

  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Deck[]>([])
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')
  const [view, setView] = useState<'gallery' | 'list'>('gallery')
  const navigate = useNavigate()

  useEffect(() => {
    if (searchTerm) {
      const results = decks.filter((deck) =>
        deck.title.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }, [searchTerm, decks])

  const handleSearch = (term: string) => {
    setSearchTerm(term)
  }

  const handleCreateDeck = async () => {
    try {
      await createDeck.mutateAsync({
        title: newDeckTitle,
        description: newDeckDescription,
      })
      setOpenCreateDialog(false)
      setNewDeckTitle('')
      setNewDeckDescription('')
      refetch() // Refresh the decks list
    } catch (error) {
      console.error(error)
      alert('Error creating deck. The title might already exist.')
    }
  }

  const handleDeleteDeck = async (title: string) => {
    if (window.confirm(`Are you sure you want to delete the deck "${title}"?`)) {
      try {
        await deleteDeck.mutateAsync(title)
        refetch() // Refresh the decks list
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
        onChange={(e) => handleSearch(e.target.value)}
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

      {searchTerm && (
        <List>
          {searchResults.map((deck) => (
            <ListItem
              key={deck.id}
              onClick={() => navigate(`/decks/${deck.title}`)}
            >
              <ListItemText primary={deck.title} />
            </ListItem>
          ))}
        </List>
      )}

      {view === 'gallery' ? (
        <GalleryView
          decks={decks}
          onDelete={handleDeleteDeck}
          onStudy={handleStudyDeck}
        />
      ) : (
        <ListView
          decks={decks}
          onDelete={handleDeleteDeck}
          onStudy={handleStudyDeck}
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

const GalleryView: React.FC<{
  decks: Deck[]
  onDelete: (title: string) => void
  onStudy: (title: string) => void
}> = ({ decks, onDelete, onStudy }) => (
  <Grid container spacing={3}>
    {decks.map((deck) => (
      <Grid key={deck.id}>
        <Card>
          <CardContent>
            <Typography variant="h6">{deck.title}</Typography>
            <Typography variant="body2" color="textSecondary">
              {deck.description}
            </Typography>
          </CardContent>
          <CardActions>
            <Button
              size="small"
              color="primary"
              onClick={() => onStudy(deck.title)}
            >
              Study
            </Button>
            <IconButton onClick={() => onDelete(deck.title)}>
              <Delete />
            </IconButton>
          </CardActions>
        </Card>
      </Grid>
    ))}
  </Grid>
)

const ListView: React.FC<{
  decks: Deck[]
  onDelete: (title: string) => void
  onStudy: (title: string) => void
}> = ({ decks, onDelete, onStudy }) => (
  <List>
    {decks.map((deck) => (
      <ListItem key={deck.id}>
        <ListItemText primary={deck.title} secondary={deck.description} />
        <IconButton onClick={() => onStudy(deck.title)}>
          <PlayArrow />
        </IconButton>
        <IconButton onClick={() => onDelete(deck.title)}>
          <Delete />
        </IconButton>
      </ListItem>
    ))}
  </List>
)

export default DecksPage
