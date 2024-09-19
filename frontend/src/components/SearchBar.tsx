import React, { useState } from 'react'
import { TextField, Box } from '@mui/material'

interface SearchBarProps {
  onSearch: (query: string) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [search, setSearch] = useState<string>('')

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearch(value)
    onSearch(value)
  }

  return (
    <Box sx={{ mb: 2 }}>
      <TextField
        label="Search"
        value={search}
        onChange={handleChange}
        fullWidth
      />
    </Box>
  )
}

export default SearchBar
