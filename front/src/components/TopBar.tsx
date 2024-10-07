import React from 'react'
import {
  AppBar,
  Toolbar,
  Typography,
  TextField,
  Autocomplete,
  IconButton,
} from '@mui/material'
import { api, Deck } from '../services/api'
import { useNavigate } from 'react-router-dom'
import MenuIcon from '@mui/icons-material/Menu'

interface TopBarProps {
  onMenuClick: () => void
}

const TopBar: React.FC<TopBarProps> = ({ onMenuClick }) => {
  const [options, setOptions] = React.useState<Deck[]>([])
  const [inputValue, setInputValue] = React.useState('')
  const navigate = useNavigate()

  const handleInputChange = async (_: never, value: string) => {
    setInputValue(value)
    if (value) {
      try {
        const data = await api.getDecks()
        const results = data.filter((deck) =>
          deck.title.toLowerCase().includes(value.toLowerCase())
        )
        setOptions(results)
      } catch (error) {
        console.error(error)
      }
    } else {
      setOptions([])
    }
  }

  const handleOptionSelect = (_event: never, value: Deck | null) => {
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
          // @ts-ignore
          onInputChange={handleInputChange}
          // @ts-ignore
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
