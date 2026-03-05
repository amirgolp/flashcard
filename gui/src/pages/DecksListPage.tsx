import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import FolderIcon from '@mui/icons-material/Folder';
import { useNavigate } from '@tanstack/react-router';
import { useDecks } from '../hooks/useDecks';
import DeckListItem from '../components/decks/DeckListItem';

const PAGE_SIZE = 20;

export default function DecksListPage() {
  const navigate = useNavigate();
  const [page] = useState(1);
  const { data: decks, isLoading } = useDecks((page - 1) * PAGE_SIZE, PAGE_SIZE);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Decks</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate({ to: '/decks/new' })}>
          Create Deck
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : !decks?.length ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <FolderIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No decks yet. Create your first deck!</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {decks.map((deck) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={deck.id}>
              <DeckListItem deck={deck} onClick={() => navigate({ to: '/decks/$deckId', params: { deckId: deck.id } })} />
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
