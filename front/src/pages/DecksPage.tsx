import React, { useEffect, useState } from 'react'
import { api, Deck } from '../services/api'
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

const DecksPage: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [searchResults, setSearchResults] = useState<Deck[]>([])
  const [openCreateDialog, setOpenCreateDialog] = useState(false)
  const [newDeckTitle, setNewDeckTitle] = useState('')
  const [newDeckDescription, setNewDeckDescription] = useState('')
  const [view, setView] = useState<'gallery' | 'list'>('gallery')
  const navigate = useNavigate()

  useEffect(() => {
    const fetchDecks = async () => {
      try {
        const data = await api.getDecks()
        setDecks(data.slice(0, 5)) // Limit to 5 decks
      } catch (error) {
        console.error(error)
      }
    }
    fetchDecks()
  }, [])

  const handleSearch = async (term: string) => {
    setSearchTerm(term)
    if (term) {
      try {
        const data = await api.getDecks()
        const results = data.filter((deck) =>
          deck.title.toLowerCase().includes(term.toLowerCase())
        )
        setSearchResults(results)
      } catch (error) {
        console.error(error)
      }
    } else {
      setSearchResults([])
    }
  }

  const handleCreateDeck = async () => {
    try {
      const newDeck = await api.createDeck({
        title: newDeckTitle,
        description: newDeckDescription,
      })
      setDecks((prev) => [newDeck, ...prev].slice(0, 5))
      setOpenCreateDialog(false)
      setNewDeckTitle('')
      setNewDeckDescription('')
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
        await api.deleteDeck(title)
        setDecks((prev) => prev.filter((deck) => deck.title !== title))
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

      {/* Toggle between Gallery and List view */}
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

      {/* Create Deck Dialog */}
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

// List View Component
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
