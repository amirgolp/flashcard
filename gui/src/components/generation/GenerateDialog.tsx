import { useState } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Autocomplete from '@mui/material/Autocomplete';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Stack from '@mui/material/Stack';
import { useBooks } from '../../hooks/useBooks';
import { useGenerateNextBatch, useGenerateFromRange } from '../../hooks/useGeneration';
import type { BookResponse, GenerationResponse } from '../../types';

type GenerationMode = 'next-batch' | 'page-range';

interface GenerateDialogProps {
    open: boolean;
    onClose: () => void;
    selectedBookId: string | null;
    onBookChange: (bookId: string | null) => void;
    onSuccess?: (result: GenerationResponse) => void;
}

export default function GenerateDialog({
    open,
    onClose,
    selectedBookId,
    onBookChange,
    onSuccess,
}: GenerateDialogProps) {
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

        const onSuccessCallback = (data: GenerationResponse) => {
            setResult(data);
            if (onSuccess) onSuccess(data);
        };

        if (mode === 'next-batch') {
            generateNextBatch.mutate(
                { book_id: selectedBookId, num_pages: numPages, num_cards: numCards },
                { onSuccess: onSuccessCallback },
            );
        } else {
            generateFromRange.mutate(
                { book_id: selectedBookId, start_page: startPage, end_page: endPage, num_cards: numCards },
                { onSuccess: onSuccessCallback },
            );
        }
    };

    const handleClose = () => {
        if (!isGenerating) {
            setResult(null);
            onClose();
        }
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Generate Flashcards</DialogTitle>
            <DialogContent>
                <Stack spacing={3} sx={{ mt: 1 }}>
                    {/* Book selector */}
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
                        <Typography variant="caption" color="text.secondary" sx={{ mt: -2 }}>
                            {selectedBook.total_pages} pages
                            {selectedBook.target_language ? ` · ${selectedBook.target_language}` : ''}
                        </Typography>
                    )}

                    {/* Mode toggle */}
                    <Box>
                        <Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
                            Generation Mode
                        </Typography>
                        <ToggleButtonGroup
                            value={mode}
                            exclusive
                            onChange={handleModeChange}
                            fullWidth
                            size="small"
                        >
                            <ToggleButton value="next-batch">Next Batch</ToggleButton>
                            <ToggleButton value="page-range">Page Range</ToggleButton>
                        </ToggleButtonGroup>
                    </Box>

                    {/* Mode-specific fields */}
                    {mode === 'next-batch' ? (
                        <Stack direction="row" spacing={2}>
                            <TextField
                                fullWidth
                                type="number"
                                label="Number of Pages"
                                value={numPages}
                                onChange={(e) => setNumPages(Math.max(1, parseInt(e.target.value) || 1))}
                                slotProps={{ htmlInput: { min: 1, max: selectedBook?.total_pages ?? 100 } }}
                                helperText="Pages to process"
                            />
                            <TextField
                                fullWidth
                                type="number"
                                label="Number of Cards"
                                value={numCards}
                                onChange={(e) => setNumCards(Math.max(1, parseInt(e.target.value) || 1))}
                                slotProps={{ htmlInput: { min: 1, max: 50 } }}
                                helperText="Target cards"
                            />
                        </Stack>
                    ) : (
                        <Stack spacing={2}>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="Start Page"
                                    value={startPage}
                                    onChange={(e) => setStartPage(Math.max(1, parseInt(e.target.value) || 1))}
                                    slotProps={{ htmlInput: { min: 1, max: selectedBook?.total_pages ?? 9999 } }}
                                />
                                <TextField
                                    fullWidth
                                    type="number"
                                    label="End Page"
                                    value={endPage}
                                    onChange={(e) => setEndPage(Math.max(1, parseInt(e.target.value) || 1))}
                                    slotProps={{ htmlInput: { min: startPage, max: selectedBook?.total_pages ?? 9999 } }}
                                />
                            </Stack>
                            <TextField
                                fullWidth
                                type="number"
                                label="Number of Cards"
                                value={numCards}
                                onChange={(e) => setNumCards(Math.max(1, parseInt(e.target.value) || 1))}
                                slotProps={{ htmlInput: { min: 1, max: 50 } }}
                                helperText="Target number of cards to generate"
                            />
                        </Stack>
                    )}

                    {/* Loading progress bar */}
                    {isGenerating && (
                        <Box>
                            <LinearProgress />
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                Generating flashcards... This may take 10-30 seconds.
                            </Typography>
                        </Box>
                    )}

                    {/* Error */}
                    {error && (
                        <Alert severity="error">
                            {error instanceof Error ? error.message : 'Generation failed. Please try again.'}
                        </Alert>
                    )}

                    {/* Result summary */}
                    {result && (
                        <Alert severity="success">
                            <Typography variant="body2" fontWeight={600} gutterBottom>
                                {result.message}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Generated {result.drafts.length} draft card{result.drafts.length !== 1 ? 's' : ''} from
                                pages {result.pages_processed.start}–{result.pages_processed.end}
                            </Typography>
                        </Alert>
                    )}
                </Stack>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={handleClose} disabled={isGenerating}>
                    {result ? 'Close' : 'Cancel'}
                </Button>
                <Button
                    variant="contained"
                    onClick={handleGenerate}
                    disabled={!selectedBookId || isGenerating}
                    startIcon={isGenerating ? <CircularProgress size={20} color="inherit" /> : null}
                >
                    {isGenerating ? 'Generating...' : 'Generate'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}
