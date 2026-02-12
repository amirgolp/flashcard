import { useState } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import { useBooks } from '../../hooks/useBooks';
import { useGenerateNextBatch, useGenerateFromRange } from '../../hooks/useGeneration';
import type { BookResponse, GenerationResponse } from '../../types';

type GenerationMode = 'next-batch' | 'page-range';

interface GenerateFormProps {
  selectedBookId: string | null;
  onBookChange: (bookId: string | null) => void;
}

export default function GenerateForm({ selectedBookId, onBookChange }: GenerateFormProps) {
  const { data: books, isLoading: booksLoading } = useBooks(0, 100);

  const [mode, setMode] = useState<GenerationMode>('next-batch');
  const [numPages, setNumPages] = useState(5);
  const [numCards, setNumCards] = useState(10);
  const [startPage, setStartPage] = useState(1);
  const [endPage, setEndPage] = useState(10);
  const [result, setResult] = useState<GenerationResponse | null>(null);

  const generateNextBatch = useGenerateNextBatch();
  const generateFromRange = useGenerateFromRange();

  const isGenerating = generateNextBatch.isPending || generateFromRange.isPending;
  const error = generateNextBatch.error || generateFromRange.error;

  const selectedBook = books?.find((b: BookResponse) => b.id === selectedBookId) ?? null;

  const handleModeChange = (_: React.MouseEvent<HTMLElement>, newMode: GenerationMode | null) => {
    if (newMode) setMode(newMode);
  };

  const handleBookChange = (_: React.SyntheticEvent, value: BookResponse | null) => {
    onBookChange(value?.id ?? null);
    setResult(null);
  };

  const handleGenerate = () => {
    if (!selectedBookId) return;

    setResult(null);

    if (mode === 'next-batch') {
      generateNextBatch.mutate(
        { book_id: selectedBookId, num_pages: numPages, num_cards: numCards },
        { onSuccess: (data) => setResult(data) },
      );
    } else {
      generateFromRange.mutate(
        { book_id: selectedBookId, start_page: startPage, end_page: endPage, num_cards: numCards },
        { onSuccess: (data) => setResult(data) },
      );
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Grid container spacing={3}>
        {/* Book selector */}
        <Grid size={{ xs: 12 }}>
          <Autocomplete
            options={books ?? []}
            loading={booksLoading}
            getOptionLabel={(option: BookResponse) => option.title}
            value={selectedBook}
            onChange={handleBookChange}
            isOptionEqualToValue={(option, value) => option.id === value.id}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Book"
                placeholder="Choose a book to generate flashcards from"
                slotProps={{
                  input: {
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {booksLoading ? <CircularProgress size={20} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  },
                }}
              />
            )}
          />
          {selectedBook && (
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              {selectedBook.total_pages} pages
              {selectedBook.target_language ? ` \u00B7 ${selectedBook.target_language}` : ''}
            </Typography>
          )}
        </Grid>

        {/* Mode toggle */}
        <Grid size={{ xs: 12 }}>
          <Box>
            <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
              Generation Mode
            </Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <ToggleButtonGroup
                value={mode}
                exclusive
                onChange={handleModeChange}
                size="small"
                fullWidth
                sx={{
                  width: '100%',
                  maxWidth: { xs: '100%', sm: 400 },
                  '& .MuiToggleButton-root': {
                    flex: 1,
                    py: 1,
                  }
                }}
              >
                <ToggleButton value="next-batch">Next Batch</ToggleButton>
                <ToggleButton value="page-range">Page Range</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Box>
        </Grid>

        {/* Mode-specific fields */}
        {mode === 'next-batch' ? (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Number of Pages"
                value={numPages}
                onChange={(e) => setNumPages(Math.max(1, parseInt(e.target.value) || 1))}
                slotProps={{ htmlInput: { min: 1, max: selectedBook?.total_pages ?? 100 } }}
                helperText="Pages to process from current position"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                type="number"
                label="Number of Cards"
                value={numCards}
                onChange={(e) => setNumCards(Math.max(1, parseInt(e.target.value) || 1))}
                slotProps={{ htmlInput: { min: 1, max: 50 } }}
                helperText="Target number of cards to generate"
              />
            </Grid>
          </>
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Start Page"
                value={startPage}
                onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                slotProps={{ htmlInput: { min: 1, max: selectedBook?.total_pages ?? 9999 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="End Page"
                value={endPage}
                onChange={(e) => setEndPage(Math.max(1, parseInt(e.target.value) || 1))}
                slotProps={{ htmlInput: { min: startPage, max: selectedBook?.total_pages ?? 9999 } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                type="number"
                label="Number of Cards"
                value={numCards}
                onChange={(e) => setNumCards(Math.max(1, parseInt(e.target.value) || 1))}
                slotProps={{ htmlInput: { min: 1, max: 50 } }}
              />
            </Grid>
          </>
        )}

        {/* Generate button */}
        <Grid size={{ xs: 12 }}>
          <Button
            variant="contained"
            size="large"
            onClick={handleGenerate}
            disabled={!selectedBookId || isGenerating}
            sx={{ minWidth: 200, position: 'relative' }}
          >
            {isGenerating ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <CircularProgress size={20} color="inherit" />
                Generating...
              </Box>
            ) : (
              'Generate Flashcards'
            )}
          </Button>
        </Grid>

        {/* Loading progress bar */}
        {isGenerating && (
          <Grid size={{ xs: 12 }}>
            <Box>
              <LinearProgress />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                This may take 10-30 seconds depending on the number of pages...
              </Typography>
            </Box>
          </Grid>
        )}

        {/* Error */}
        {error && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="error">
              {error instanceof Error ? error.message : 'Generation failed. Please try again.'}
            </Alert>
          </Grid>
        )}

        {/* Result summary */}
        {result && (
          <Grid size={{ xs: 12 }}>
            <Alert severity="success">
              <Typography variant="body2" fontWeight={600} gutterBottom>
                {result.message}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Generated {result.drafts.length} draft card{result.drafts.length !== 1 ? 's' : ''} from pages{' '}
                {result.pages_processed.start}\u2013{result.pages_processed.end}
              </Typography>
            </Alert>
          </Grid>
        )}
      </Grid>
    </Paper>
  );
}
