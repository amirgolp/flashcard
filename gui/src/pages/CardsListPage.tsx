import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Pagination from '@mui/material/Pagination';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import StyleIcon from '@mui/icons-material/Style';
import { useNavigate } from '@tanstack/react-router';
import { useCards } from '../hooks/useCards';
import CardGrid from '../components/cards/CardGrid';

const PAGE_SIZE = 20;

export default function CardsListPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const skip = (page - 1) * PAGE_SIZE;
  const { data: cards, isLoading } = useCards(skip, PAGE_SIZE);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Cards</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => navigate({ to: '/cards/new' })}>
          Create Card
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : !cards?.length ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <StyleIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No cards yet. Create your first flashcard!</Typography>
        </Box>
      ) : (
        <>
          <CardGrid cards={cards} onCardClick={(id) => navigate({ to: '/cards/$cardId', params: { cardId: id } })} />
          {cards.length >= PAGE_SIZE && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination count={page + 1} page={page} onChange={(_, p) => setPage(p)} />
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
