import React from 'react'
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import SearchIcon from '@mui/icons-material/Search'
import AddBoxIcon from '@mui/icons-material/AddBox'
import ListItemButton from '@mui/material/ListItemButton'
import Link from './Link'
import { link } from 'fs'
import InsertComment from '@mui/icons-material/InsertComment'
import { MenuBookOutlined, ModeOutlined } from '@mui/icons-material'

const drawerWidth = 240

const Sidebar: React.FC = () => {
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box' },
      }}
    >
      <Toolbar />
      <List>
        {/* Home */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/">
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>
        </ListItem>

        {/* Search */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/search">
            <ListItemIcon>
              <SearchIcon />
            </ListItemIcon>
            <ListItemText primary="Search" />
          </ListItemButton>
        </ListItem>

        {/* Add Flashcard */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/add">
            <ListItemIcon>
              <AddBoxIcon />
            </ListItemIcon>
            <ListItemText primary="Add Flashcard" />
          </ListItemButton>
        </ListItem>

        {/* Review Mistakes */}
        <ListItem disablePadding>
          <ListItemButton component={Link} to="/mistakes">
            <ListItemIcon>
              <MenuBookOutlined/>
            </ListItemIcon>
            <ListItemText primary ="Review Mistakes"/>
          </ListItemButton>
        </ListItem>
      
      </List>
    </Drawer>
  )
}

export default Sidebar