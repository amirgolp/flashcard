import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Divider from '@mui/material/Divider';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AddIcon from '@mui/icons-material/Add';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import StyleIcon from '@mui/icons-material/Style';
import { useNavigate } from '@tanstack/react-router';
import { useCards } from '../hooks/useCards';
import { useDecks } from '../hooks/useDecks';
import { useBooks } from '../hooks/useBooks';
import { useDrafts } from '../hooks/useGeneration';
import type { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: number | undefined;
  color: string;
  isLoading: boolean;
}

function StatCard({ icon, label, value, color, isLoading }: StatCardProps) {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderLeft: 4,
        borderColor: `${color}.main`,
      }}
    >
      <Box sx={{ color: `${color}.main`, display: 'flex', alignItems: 'center' }}>
        {icon}
      </Box>
      <Box>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : (
          <Typography variant="h4" fontWeight="bold">
            {value ?? 0}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();

  const { data: cards, isLoading: cardsLoading } = useCards(0, 100);
  const { data: recentCards, isLoading: recentLoading } = useCards(0, 5);
  const { data: decks, isLoading: decksLoading } = useDecks(0, 100);
  const { data: books, isLoading: booksLoading } = useBooks(0, 100);
  const { data: pendingDrafts, isLoading: draftsLoading } = useDrafts({ status: 'pending' });

  return (
    <Box>
      {/* Page Title */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 4 }}>
        <DashboardIcon sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4">Dashboard</Typography>
      </Box>

      {/* Stat Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<StyleIcon sx={{ fontSize: 40 }} />}
            label="Total Cards"
            value={cards?.length}
            color="primary"
            isLoading={cardsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<SchoolIcon sx={{ fontSize: 40 }} />}
            label="Total Decks"
            value={decks?.length}
            color="secondary"
            isLoading={decksLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<MenuBookIcon sx={{ fontSize: 40 }} />}
            label="Books"
            value={books?.length}
            color="info"
            isLoading={booksLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            icon={<AutoAwesomeIcon sx={{ fontSize: 40 }} />}
            label="Pending Drafts"
            value={pendingDrafts?.length}
            color="warning"
            isLoading={draftsLoading}
          />
        </Grid>
      </Grid>

      {/* Quick Actions */}
      <Paper elevation={1} sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Quick Actions
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate({ to: '/cards/new' })}
          >
            Create Card
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<SchoolIcon />}
            onClick={() => navigate({ to: '/decks/new' })}
          >
            Create Deck
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<MenuBookIcon />}
            onClick={() => navigate({ to: '/books' })}
          >
            Upload Book
          </Button>
          <Button
            variant="contained"
            color="warning"
            startIcon={<AutoAwesomeIcon />}
            onClick={() => navigate({ to: '/generation' })}
          >
            Generate Cards
          </Button>
        </Box>
      </Paper>

      {/* Recent Cards */}
      <Paper elevation={1} sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Recent Cards
        </Typography>
        {recentLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : !recentCards?.length ? (
          <Typography color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
            No cards yet. Create your first flashcard to get started!
          </Typography>
        ) : (
          <List disablePadding>
            {recentCards.map((card, index) => (
              <Box key={card.id}>
                {index > 0 && <Divider />}
                <ListItem
                  sx={{ cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() =>
                    navigate({ to: '/cards/$cardId', params: { cardId: card.id } })
                  }
                >
                  <ListItemText
                    primary={card.front}
                    secondary={card.back}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                    secondaryTypographyProps={{
                      noWrap: true,
                      sx: { maxWidth: 500 },
                    }}
                  />
                </ListItem>
              </Box>
            ))}
          </List>
        )}
      </Paper>
    </Box>
  );
}
