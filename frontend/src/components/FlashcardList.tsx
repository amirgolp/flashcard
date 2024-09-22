import React, { useEffect, useState } from 'react'
import { Flashcard } from '../types/Flashcard'
import { getFlashcards, deleteFlashcard } from '../api/api'
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  CircularProgress,
  Typography,
} from '@mui/material'
import { Edit, Delete } from '@mui/icons-material'
import { useNavigate } from 'react-router-dom'
import SearchBar from './SearchBar'

interface FlashcardListProps {
  selectedDeckId: string | null
}

const FlashcardList: React.FC<FlashcardListProps> = ({ selectedDeckId }) => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const navigate = useNavigate()


  useEffect(() => {
    setLoading(true)
    const fetchFlashcards = async () => {
    try {
      const data = await getFlashcards(
        selectedDeckId || undefined,
        searchQuery || undefined
      )
      setFlashcards(data)
    } catch (error) {
      console.error('Error fetching flashcards:', error)
    } finally {
      setLoading(false)
    }
  }
    fetchFlashcards()
  }, [selectedDeckId, searchQuery])

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this flashcard?')) {
      try {
        await deleteFlashcard(id)
        setFlashcards(flashcards.filter((fc) => fc._id !== id))
      } catch (error) {
        console.error('Error deleting flashcard:', error)
      }
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  if (loading) return <CircularProgress />

  return (
    <>
      <Typography variant="h4" gutterBottom>
        German Flashcards
      </Typography>
      <SearchBar onSearch={handleSearch} />
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>German</TableCell>
              <TableCell>English</TableCell>
              <TableCell>Example Sentence</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {flashcards.map((flashcard) => (
              <TableRow key={flashcard._id}>
                <TableCell>{flashcard.german}</TableCell>
                <TableCell>{flashcard.english}</TableCell>
                <TableCell>{flashcard.example_sentence}</TableCell>
                <TableCell align="right">
                  <IconButton
                    onClick={() => navigate(`/edit/${flashcard._id}`)}
                  >
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(flashcard._id)}>
                    <Delete />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {flashcards.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No flashcards found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  )
}

export default FlashcardList
