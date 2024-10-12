import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Autocomplete,
  IconButton,
} from '@mui/material'
import { useNavigate } from 'react-router-dom'
import MenuIcon from '@mui/icons-material/Menu'
import { useDecks } from '../services/api'
import { Deck } from '../types'

interface TopBarProps {
  onMenuClick: () => void
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const { data: allDecks = [] } = useDecks()
  const [options, setOptions] = React.useState<Deck[]>([])
  const [inputValue, setInputValue] = React.useState('')
  const navigate = useNavigate()

  const handleInputChange = (_: React.SyntheticEvent, value: string) => {
    setInputValue(value)
    if (value) {
      const results = allDecks.filter((deck) =>
        deck.title.toLowerCase().includes(value.toLowerCase())
      )
      setOptions(results)
    } else {
      setOptions([])
    }
  }

  const handleOptionSelect = (
    _event: React.SyntheticEvent,
    value: Deck | null
  ) => {
    if (value) {
      navigate(`/decks/${value.title}`)
    }
  }

  return (
    <AppBar position="static">
      <Toolbar>
        <IconButton color="inherit" edge="start" onClick={onMenuClick}>
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Flashcard App
        </Typography>
        <Autocomplete
          options={options}
          getOptionLabel={(option) => option.title}
          style={{ width: 300 }}
          onInputChange={handleInputChange}
          onChange={handleOptionSelect}
          inputValue={inputValue}
          renderInput={(params) => (
            <TextField {...params} label="Search Decks" variant="outlined" />
          )}
        />
      </Toolbar>
    </AppBar>
  )
}

export default TopBar
