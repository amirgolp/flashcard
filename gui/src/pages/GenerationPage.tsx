import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { useNavigate } from '@tanstack/react-router';
import GenerateDialog from '../components/generation/GenerateDialog';
import DraftReviewList from '../components/generation/DraftReviewList';
import BookUploadDialog from '../components/books/BookUploadDialog';
import type { GenerationResponse } from '../types';

export default function GenerationPage() {
  const navigate = useNavigate();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedBookId, setSelectedBookId] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<GenerationResponse | null>(null);

  const handleGenerateSuccess = (result: GenerationResponse) => {
    setLastResult(result);
    setTimeout(() => setDialogOpen(false), 2000);
  };

  const handleUploadSuccess = (bookId: string) => {
    setUploadOpen(false);
    setSelectedBookId(bookId);
    setDialogOpen(true);
  };

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <AutoAwesomeIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" component="h1" fontWeight={600}>
            AI Flashcard Generation
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
          Generate flashcards automatically from your uploaded books using AI. Select a book,
          configure the settings, and let AI create draft flashcards for you to review.
        </Typography>

        {/* Action Buttons */}
        <Paper
          elevation={2}
          sx={{
            p: 4,
            textAlign: 'center',
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main}15 0%, ${theme.palette.secondary.main}15 100%)`,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack spacing={2} alignItems="center">
            <AutoAwesomeIcon sx={{ fontSize: 48, color: 'primary.main' }} />
            <Typography variant="h6" fontWeight={600}>
              Ready to Generate Flashcards?
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 500 }}>
              Upload a book or select an existing one to generate flashcards
            </Typography>
            <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
              <Button
                variant="outlined"
                size="large"
                startIcon={<CloudUploadIcon />}
                onClick={() => setUploadOpen(true)}
                sx={{ px: 3, py: 1.5 }}
              >
                Upload Book
              </Button>
              <Button
                variant="contained"
                size="large"
                startIcon={<AddIcon />}
                onClick={() => setDialogOpen(true)}
                sx={{ px: 4, py: 1.5 }}
              >
                Generate Flashcards
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Box>

      {/* Success Message */}
      {lastResult && (
        <Paper
          sx={{
            p: 2,
            mb: 4,
            bgcolor: 'success.main',
            color: 'success.contrastText',
          }}
        >
          <Typography variant="body1" fontWeight={600}>
            {lastResult.message}
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9 }}>
            Generated {lastResult.drafts.length} draft cards from pages{' '}
            {lastResult.pages_processed.start}–{lastResult.pages_processed.end}
          </Typography>
        </Paper>
      )}

      {/* Review section */}
      <Box>
        <Typography variant="h5" component="h2" fontWeight={600} gutterBottom>
          Review Drafts
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Review, edit, and approve generated drafts to add them to your card collection.
        </Typography>
        <DraftReviewList bookId={selectedBookId ?? undefined} />
      </Box>

      {/* Generate Dialog */}
      <GenerateDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        selectedBookId={selectedBookId}
        onBookChange={setSelectedBookId}
        onSuccess={handleGenerateSuccess}
      />

      {/* Upload Book Dialog */}
      <BookUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={handleUploadSuccess}
      />
    </Box>
  );
}
