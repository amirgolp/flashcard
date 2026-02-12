import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import { useNavigate } from '@tanstack/react-router';
import { useCreateCard } from '../hooks/useCards';
import CardForm from '../components/cards/CardForm';
import { useState } from 'react';

export default function CardCreatePage() {
  const navigate = useNavigate();
  const createCard = useCreateCard();
  const [error, setError] = useState('');

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Create Card</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <CardForm
        submitLabel="Create Card"
        isLoading={createCard.isPending}
        onSubmit={(data) => {
          setError('');
          createCard.mutate(data, {
            onSuccess: (card) => navigate({ to: '/cards/$cardId', params: { cardId: card.id } }),
            onError: (err) => setError(err instanceof Error ? err.message : 'Failed to create card'),
          });
        }}
      />
    </Box>
  );
}
