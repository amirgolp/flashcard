import React, { useContext } from 'react'
import { Box, Toolbar, Container, Typography } from '@mui/material'
import { Routes, Route } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import axios from 'axios'

import Flashcard from './components/Flashcard'
import Topbar from './components/Topbar'
import Sidebar from './components/Sidebar'
import AddFlashcard from './components/AddFlashcard'
import SearchFlashcards from './components/SearchFlashcards'

import { SearchContext } from './context/SearchContext'

const fetchFlashcards = async (
  query: string
): Promise<
  {
    id: string
    german: string
    english: string
    date_created: string
    date_modified: string
    guessed_correct: boolean
    guessed_wrong: boolean
    notes?: string
  }[]
> => {
  if (query.trim() === '') {
    const res = await axios.get('/flashcards')
    return res.data
  } else {
    const res = await axios.get('/flashcards/search/', {
      params: { query },
    })
    return res.data
  }
}

const App: React.FC = () => {
  const queryClient = useQueryClient()
  const { searchQuery } = useContext(SearchContext)

  const {
    data: flashcards,
    isLoading,
    isError,
    error,
  } = useQuery(
    ['flashcards', searchQuery],
    () => fetchFlashcards(searchQuery),
    {
      keepPreviousData: true,
    }
  )

  const mutation = useMutation(
    ({ id, correct }: { id: string; correct: boolean }) =>
      axios.put(`/flashcards/${id}`, {
        guessed_correct: correct,
        guessed_wrong: !correct,
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['flashcards', searchQuery])
      },
    }
  )

  const notesMutation = useMutation(
    ({ id, notes }: { id: string; notes: string }) =>
      axios.put(`/flashcards/${id}`, {
        notes,
        date_modified: new Date().toISOString(),
      }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['flashcards', searchQuery])
      },
    }
  )

  const handleGuess = (id: string, correct: boolean) => {
    mutation.mutate({ id, correct })
  }

  const handleNotesChange = (id: string, notes: string) => {
    notesMutation.mutate({ id, notes })
  }

  return (
    <Box sx={{ display: 'flex' }}>
      <Topbar />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
        <Toolbar />
        <Routes>
          <Route
            path="/"
            element={
              <Container>
                {isLoading && <Typography>Loading...</Typography>}
                {isError && (
                  <Typography color="error">
                    Error: {(error as Error).message}
                  </Typography>
                )}
                {flashcards &&
                  flashcards.map(fc => (
                    <Flashcard
                      key={fc.id}
                      flashcard={fc}
                      onGuess={handleGuess}
                      onNotesChange={handleNotesChange}
                    />
                  ))}
              </Container>
            }
          />
          <Route path="/add" element={<AddFlashcard />} />
          <Route path="/search" element={<SearchFlashcards />} />
          {/* Add more routes as needed */}
        </Routes>
      </Box>
    </Box>
  )
}

export default App
