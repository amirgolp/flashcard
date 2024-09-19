import React, { useEffect, useState } from 'react'
import { Deck } from '../types/Deck'
import { getDecks, deleteDeck } from '../api/api'
import {
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Typography,
  Box,
  ListItemButton,
} from '@mui/material'
import { Delete, Edit } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'

interface DeckListProps {
  selectedDeckId: string | null
  onSelectDeck: (deckId: string | null) => void
}

const DeckList: React.FC<DeckListProps> = ({
  selectedDeckId,
  onSelectDeck,
}) => {
  const [decks, setDecks] = useState<Deck[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const navigate = useNavigate()

  const fetchDecks = async () => {
    try {
      const data = await getDecks()
      setDecks(data)
    } catch (error) {
      console.error('Error fetching decks:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchDecks()
  }, [])

  const handleDelete = async (id: string) => {
    if (
      window.confirm(
        'Are you sure you want to delete this deck? All associated flashcards will be deleted.'
      )
    ) {
      try {
        await deleteDeck(id)
        setDecks(decks.filter((deck) => deck._id !== id))
        if (selectedDeckId === id) {
          onSelectDeck(null)
        }
      } catch (error) {
        console.error('Error deleting deck:', error)
      }
    }
  }

  if (loading) return <CircularProgress />

  return (
    <>
      <Typography variant="h6" gutterBottom>
        Decks
      </Typography>
      <List>
        {/* "All Decks" List Item */}
        <ListItem disablePadding>
          <ListItemButton
            selected={selectedDeckId === null}
            onClick={() => onSelectDeck(null)}
            sx={{ justifyContent: 'space-between' }}
          >
            <ListItemText primary="All Decks" />
          </ListItemButton>
        </ListItem>

        {/* Individual Decks */}
        {decks.map((deck) => (
          <ListItem key={deck._id} disablePadding>
            <ListItemButton
              selected={selectedDeckId === deck._id}
              onClick={() => onSelectDeck(deck._id)}
              sx={{ justifyContent: 'space-between' }}
            >
              <ListItemText primary={deck.name} secondary={deck.description} />
              <Box>
                <IconButton
                  edge="end"
                  aria-label="edit"
                  onClick={(e) => {
                    e.stopPropagation()
                    navigate(`/edit/${deck._id}`)
                  }}
                >
                  <Edit />
                </IconButton>
                <IconButton
                  edge="end"
                  aria-label="delete"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete(deck._id)
                  }}
                >
                  <Delete />
                </IconButton>
              </Box>
            </ListItemButton>
          </ListItem>
        ))}

        {/* No Decks Found */}
        {decks.length === 0 && (
          <ListItem>
            <ListItemText primary="No decks found." />
          </ListItem>
        )}
      </List>
    </>
  )
}

export default DeckList
