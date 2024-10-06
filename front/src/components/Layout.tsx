import {useNavigate} from "react-router-dom"
import {
  AppBar,
  Box,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography
} from "@mui/material"
import {useMode} from "../theme/theme.ts"
import {ReactNode} from "react"
import {Brightness4, Brightness7, Create, Reviews, ViewList} from "@mui/icons-material"


function Layout({ children }: { children: ReactNode }) {
  const [theme, colorMode] = useMode()
  // const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const menuItems = [
    { text: 'Create Deck', icon: <Create />, path: '/create' },
    { text: 'Show Decks', icon: <ViewList />, path: '/' },
    { text: 'Review Decks', icon: <Reviews />, path: '/review' },
  ];

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Flashcard App
          </Typography>
          <IconButton onClick={colorMode.toggleColorMode} color="inherit">
            {theme.palette.mode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Toolbar>
      </AppBar>
      <Drawer
        variant="permanent"
        sx={{
          width: 240,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: 240,
            boxSizing: 'border-box',
            marginTop: '64px',
          },
        }}
      >
        <List>
          {menuItems.map((item) => (
            // eslint-disable-next-line @typescript-eslint/ban-ts-comment
            // @ts-expect-error
            <ListItem
              button
              key={item.text}
              onClick={() => navigate(item.path)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItem>
          ))}
        </List>
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginTop: '64px',
          marginLeft: '240px',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}

export default Layout