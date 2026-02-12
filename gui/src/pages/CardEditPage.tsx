import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import Alert from '@mui/material/Alert';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useCard, useUpdateCard } from '../hooks/useCards';
import CardForm from '../components/cards/CardForm';
import { useState } from 'react';

export default function CardEditPage() {
  const { cardId } = useParams({ strict: false }) as { cardId: string };
  const navigate = useNavigate();
  const { data: card, isLoading } = useCard(cardId);
  const updateCard = useUpdateCard();
  const [error, setError] = useState('');

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  if (!card) return <Typography>Card not found</Typography>;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Edit Card</Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <CardForm
        initialValues={{
          front: card.front,
          back: card.back,
          part_of_speech: card.part_of_speech ?? undefined,
          gender: card.gender ?? undefined,
          plural_form: card.plural_form ?? undefined,
          pronunciation: card.pronunciation ?? undefined,
          notes: card.notes ?? undefined,
          hardness_level: card.hardness_level,
          examples: card.examples ?? undefined,
          synonyms: card.synonyms ?? undefined,
          antonyms: card.antonyms ?? undefined,
          tags: card.tags ?? undefined,
        }}
        submitLabel="Update Card"
        isLoading={updateCard.isPending}
        onSubmit={(data) => {
          setError('');
          updateCard.mutate({ id: cardId, data }, {
            onSuccess: () => navigate({ to: '/cards/$cardId', params: { cardId } }),
            onError: (err) => setError(err instanceof Error ? err.message : 'Failed to update card'),
          });
        }}
      />
    </Box>
  );
}
