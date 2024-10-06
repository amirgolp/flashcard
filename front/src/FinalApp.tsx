import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {useQuery, useMutation, QueryClient, QueryClientProvider, useQueryClient} from '@tanstack/react-query'
import axios from 'axios';
import {
  Typography,
  IconButton,
  Container,
  Button,
  Box,
  TextField,
  Paper,
  Alert,
  CircularProgress,
  LinearProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Card,
  CardContent,
  CardActions,
  Divider,
} from '@mui/material'
import {
  NavigateNext,
  NavigateBefore, Delete,
} from '@mui/icons-material'
import { BrowserRouter as Router, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import {ColorModeContext, useMode} from "./theme/theme.ts"
import Layout from "./components/Layout.tsx"
import Flashcard from './components/Flashcard'

// API client setup
const api = axios.create({
  baseURL: 'http://localhost:8000/v1',
});

// Types
interface Flashcard {
  id: string;
  germanWord: string;
  englishTranslation: string;
  exampleUsage?: string;
  deckName: string;
  note?: string;
  studied: boolean;
  guessedRight?: boolean;
}

interface Deck {
  id: string;
  title: string;
  description?: string;
  flashcards: Flashcard[];
}

// API functions
const apiClient = {
  getDecks: () => api.get<Deck[]>('/decks').then(res => res.data),
  getDeck: (id: string) => api.get<Deck>(`/decks/${id}`).then(res => res.data),
  createDeck: (deck: Omit<Deck, 'id'>) => api.post<Deck>('/decks', deck).then(res => res.data),
  updateDeck: (deck: Deck) => api.put<Deck>(`/decks/${deck.id}`, deck).then(res => res.data),
  deleteDeck: (id: string) => api.delete(`/decks/${id}`),
  createFlashcard: (deckId: string, flashcard: Omit<Flashcard, 'id'>) =>
    api.post<Flashcard>(`/decks/${deckId}/flashcards`, flashcard).then(res => res.data),
  updateFlashcard: (deckId: string, flashcard: Flashcard) =>
    api.put<Flashcard>(`/decks/${deckId}/flashcards/${flashcard.id}`, flashcard).then(res => res.data),
  deleteFlashcard: (deckId: string, flashcardId: string) =>
    api.delete(`/decks/${deckId}/flashcards/${flashcardId}`),
};

export function App() {
  const [theme, colorMode] = useMode()

  const queryClient = new QueryClient();

  return (
    <ColorModeContext.Provider value={colorMode}>
      <ThemeProvider theme={theme}>
        <QueryClientProvider client={queryClient}>
          <Router>
            <CssBaseline />
            <Layout>
              <Routes>
                <Route path="/" element={<DeckList />} />
                <Route path="/create" element={<CreateDeck />} />
                <Route path="/deck/:id" element={<DeckView />} />
                <Route path="/review" element={<ReviewDecks />} />
              </Routes>
            </Layout>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
    </ColorModeContext.Provider>
  );
}


interface DeckComponentProps {
  deck: Deck;
  onDelete: (id: string) => void;
}

export function DeckComponent({ deck, onDelete }: DeckComponentProps) {
  const navigate = useNavigate();

  return (
    <Card>
      <CardContent>
        <Typography variant="h5" component="div">
          {deck.title}
        </Typography>
        {deck.description && (
          <Typography color="text.secondary">{deck.description}</Typography>
        )}
        <Typography variant="body2">
          {deck.flashcards.length} flashcards
        </Typography>
      </CardContent>
      <CardActions>
        <Button onClick={() => navigate(`/deck/${deck.id}`)}>Study</Button>
        <Button startIcon={<Delete />} color="error" onClick={() => onDelete(deck.id)}>
          Delete
        </Button>
      </CardActions>
    </Card>
  );
}

export function DeckList() {
  const queryClient = useQueryClient();
  const { data: decks, isLoading, error } = useQuery({
    queryKey: ['decks'],
    queryFn: apiClient.getDecks,
  });

  const deleteMutation = useMutation({
    mutationFn: apiClient.deleteDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading decks</Alert>;

  return (
    <Container>
      <Typography variant="h4" gutterBottom>
        Your Decks
      </Typography>
      <Box display="grid" gridTemplateColumns="repeat(auto-fill, minmax(300px, 1fr))" gap={3}>
        {decks?.map((deck) => (
          <DeckComponent
            key={deck.id}
            deck={deck}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </Box>
    </Container>
  );
}

export function CreateDeck() {
  const navigate = useNavigate();
  const [title, setTitle] = React.useState('');
  const [description, setDescription] = React.useState('');
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: apiClient.createDeck,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] });
      navigate('/');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      title,
      description,
      flashcards: [],
    });
  };

  return (
    <Container maxWidth="sm">
      <Typography variant="h4" gutterBottom>Create New Deck</Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          fullWidth
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          margin="normal"
          required
        />
        <TextField
          fullWidth
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          margin="normal"
          multiline
          rows={4}
        />
        <Button
          type="submit"
          variant="contained"
          sx={{ mt: 2 }}
          disabled={createMutation.isPending}
        >
          {createMutation.isPending ? <CircularProgress size={24} /> : 'Create Deck'}
        </Button>
      </form>
      {createMutation.isError && (
        <Alert severity="error" sx={{ mt: 2 }}>Error creating deck</Alert>
      )}
    </Container>
  );
}

// DeckView component
export function DeckView() {
  const { id } = useParams<{ id: string }>();
  const [currentCardIndex, setCurrentCardIndex] = React.useState(0);
  const queryClient = useQueryClient();

  const { data: deck, isLoading, error } = useQuery<Deck>({
    queryKey: ['deck', id],
    queryFn: () => apiClient.getDeck(id!),
    enabled: !!id,
  });

  const updateFlashcardMutation = useMutation({
    mutationFn: (flashcard: Flashcard) => apiClient.updateFlashcard(id!, flashcard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', id] });
    },
  });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Error loading deck</Alert>;
  if (!deck) return <Alert severity="error">Deck not found</Alert>;

  const currentCard = deck.flashcards[currentCardIndex];

  const handleFlashcardCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['deck', id] });
  };

  return (
    <Container>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" gutterBottom>{deck.title}</Typography>
        {deck.description && (
          <Typography color="text.secondary">{deck.description}</Typography>
        )}
        <CreateFlashcard deckId={deck.id} onSuccess={handleFlashcardCreated} />
      </Box>

      <Divider sx={{ my: 2 }} />

      {deck.flashcards.length > 0 ? (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton
              onClick={() => setCurrentCardIndex(i => Math.max(0, i - 1))}
              disabled={currentCardIndex === 0}
            >
              <NavigateBefore />
            </IconButton>
            <Box sx={{ flexGrow: 1 }}>
              <Flashcard
                card={currentCard}
                onSave={(updatedCard) => updateFlashcardMutation.mutate(updatedCard)}
              />
            </Box>
            <IconButton
              onClick={() => setCurrentCardIndex(i => Math.min(deck.flashcards.length - 1, i + 1))}
              disabled={currentCardIndex === deck.flashcards.length - 1}
            >
              <NavigateNext />
            </IconButton>
          </Box>
          <Typography sx={{ mt: 2 }}>
            Card {currentCardIndex + 1} of {deck.flashcards.length}
          </Typography>
        </>
      ) : (
        <Alert severity="info">
          This deck has no flashcards yet. Use the "Add Flashcard" button to create some!
        </Alert>
      )}
    </Container>
  );
}

// ReviewDecks component
export function ReviewDecks() {
  const { data: decks, isLoading } = useQuery({
    queryKey: ['decks'],
    queryFn: apiClient.getDecks,
  });

  if (isLoading) return <CircularProgress />;

  const totalCards = decks?.reduce((sum, deck) => sum + deck.flashcards.length, 0) || 0;
  const studiedCards = decks?.reduce(
    (sum, deck) => sum + deck.flashcards.filter(card => card.studied).length,
    0
  ) || 0;

  return (
    <Container>
      <Typography variant="h4" gutterBottom>Review Progress</Typography>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Overall Progress</Typography>
        <LinearProgress
          variant="determinate"
          value={(studiedCards / totalCards) * 100}
          sx={{ mt: 1, mb: 1 }}
        />
        <Typography>{studiedCards} of {totalCards} cards studied</Typography>
      </Box>
      {decks?.map(deck => (
        <Paper key={deck.id} sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6">{deck.title}</Typography>
          <Typography variant="body2" color="text.secondary">
            {deck.flashcards.filter(card => card.studied).length} of {deck.flashcards.length} cards studied
          </Typography>
          <LinearProgress
            variant="determinate"
            value={(deck.flashcards.filter(card => card.studied).length / deck.flashcards.length) * 100}
            sx={{ mt: 1 }}
          />
        </Paper>
      ))}
    </Container>
  );
}

interface CreateFlashcardProps {
  deckId: string;
  onSuccess: () => void;
}

export function CreateFlashcard({ deckId, onSuccess }: CreateFlashcardProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [germanWord, setGermanWord] = React.useState('');
  const [englishTranslation, setEnglishTranslation] = React.useState('');
  const [exampleUsage, setExampleUsage] = React.useState('');

  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (flashcard: Omit<Flashcard, 'id'>) =>
      apiClient.createFlashcard(deckId, flashcard),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['deck', deckId] });
      setIsOpen(false);
      resetForm();
      onSuccess();
    },
  });

  const resetForm = () => {
    setGermanWord('');
    setEnglishTranslation('');
    setExampleUsage('');
  };

  const handleCreate = () => {
    createMutation.mutate({
      germanWord,
      englishTranslation,
      exampleUsage: exampleUsage || undefined,
      deckName: '',
      studied: false,
    });
  };

  return (
    <>
      <Button variant="contained" onClick={() => setIsOpen(true)}>
        Add Flashcard
      </Button>
      <Dialog
        open={isOpen}
        onClose={() => {
          setIsOpen(false);
          resetForm();
        }}
      >
        <DialogTitle>Create New Flashcard</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="German Word"
            fullWidth
            variant="outlined"
            value={germanWord}
            onChange={(e) => setGermanWord(e.target.value)}
          />
          <TextField
            margin="dense"
            label="English Translation"
            fullWidth
            variant="outlined"
            value={englishTranslation}
            onChange={(e) => setEnglishTranslation(e.target.value)}
          />
          <TextField
            margin="dense"
            label="Example Usage (Optional)"
            fullWidth
            variant="outlined"
            multiline
            rows={2}
            value={exampleUsage}
            onChange={(e) => setExampleUsage(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setIsOpen(false);
            resetForm();
          }}>
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={createMutation.isPending || !germanWord || !englishTranslation}
          >
            {createMutation.isPending ? <CircularProgress size={24} /> : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
