import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useNavigate } from '@tanstack/react-router';
import { useCreateDeck } from '../hooks/useDecks';
import DeckForm from '../components/decks/DeckForm';
import { useState } from 'react';

export default function DeckCreatePage() {
  const navigate = useNavigate();
  const createDeck = useCreateDeck();
  const [error, setError] = useState('');

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Create Deck</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <DeckForm
        submitLabel="Create Deck"
        isLoading={createDeck.isPending}
        onSubmit={(data) => {
          setError('');
          createDeck.mutate(data, {
            onSuccess: (deck) => navigate({ to: '/decks/$deckId', params: { deckId: deck.id } }),
            onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create deck'),
          });
        }}
      />
    </Box>
  );
}
