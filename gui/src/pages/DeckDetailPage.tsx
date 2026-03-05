import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useDeck, useDeleteDeck } from '../hooks/useDecks';
import CardGrid from '../components/cards/CardGrid';

export default function DeckDetailPage() {
  const { deckId } = useParams({ strict: false }) as { deckId: string };
  const navigate = useNavigate();
  const { data: deck, isLoading } = useDeck(deckId);
  const deleteDeck = useDeleteDeck();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  if (!deck) return <Typography>Deck not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'center' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate({ to: '/decks' })}>Back</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<DeleteIcon />} color="error" variant="outlined" onClick={() => setConfirmOpen(true)}>Delete</Button>
      </Box>

      <Typography variant="h4" gutterBottom>{deck.name}</Typography>
      {deck.description && <Typography color="text.secondary" sx={{ mb: 3 }}>{deck.description}</Typography>}

      <Typography variant="h6" sx={{ mb: 2 }}>{deck.cards.length} Cards</Typography>
      {deck.cards.length > 0 ? (
        <CardGrid cards={deck.cards} onCardClick={(id) => navigate({ to: '/cards/$cardId', params: { cardId: id } })} />
      ) : (
        <Typography color="text.secondary">This deck has no cards yet.</Typography>
      )}

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Deck</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete "{deck.name}"?</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => deleteDeck.mutate(deckId, { onSuccess: () => navigate({ to: '/decks' }) })}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
