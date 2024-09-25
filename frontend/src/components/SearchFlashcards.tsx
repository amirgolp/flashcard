import React from 'react'
import { TextField, Container, Box, Typography } from '@mui/material'

interface SearchFlashcardsProps {
  setSearchQuery: (query: string) => void
}

const SearchFlashcards: React.FC<SearchFlashcardsProps> = ({ setSearchQuery }) => {
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
  }

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h5" gutterBottom>
          Search Flashcards
        </Typography>
        <TextField
          label="Search Flashcards"
          variant="outlined"
          fullWidth
          margin="normal"
          onChange={handleSearch}
        />
        {/* Optionally, display search results here */}
      </Box>
    </Container>
  )
}

export default SearchFlashcards