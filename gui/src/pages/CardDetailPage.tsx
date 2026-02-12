import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useCard, useDeleteCard } from '../hooks/useCards';
import CardDetail from '../components/cards/CardDetail';
import { useState } from 'react';

export default function CardDetailPage() {
  const { cardId } = useParams({ strict: false }) as { cardId: string };
  const navigate = useNavigate();
  const { data: card, isLoading } = useCard(cardId);
  const deleteCard = useDeleteCard();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  if (!card) return <Typography>Card not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate({ to: '/cards' })}>Back</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button startIcon={<EditIcon />} variant="outlined" onClick={() => navigate({ to: '/cards/$cardId/edit', params: { cardId } })}>Edit</Button>
        <Button startIcon={<DeleteIcon />} color="error" variant="outlined" onClick={() => setConfirmOpen(true)}>Delete</Button>
      </Box>
      <CardDetail card={card} />
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Card</DialogTitle>
        <DialogContent><DialogContentText>Are you sure you want to delete this card? This cannot be undone.</DialogContentText></DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button color="error" onClick={() => deleteCard.mutate(cardId, { onSuccess: () => navigate({ to: '/cards' }) })}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
