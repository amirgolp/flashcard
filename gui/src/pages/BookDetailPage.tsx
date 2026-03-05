import { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import { useNavigate, useParams } from '@tanstack/react-router';
import { useBook, useDeleteBook, useBookProgress, useUpdateBookChapters } from '../hooks/useBooks';
import ProgressBar from '../components/books/ProgressBar';
import ChapterEditor from '../components/books/ChapterEditor';

export default function BookDetailPage() {
  const { bookId } = useParams({ strict: false }) as { bookId: string };
  const navigate = useNavigate();
  const { data: book, isLoading } = useBook(bookId);
  const { data: progress } = useBookProgress(bookId);
  const deleteBook = useDeleteBook();
  const updateChapters = useUpdateBookChapters();
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>;
  if (!book) return <Typography>Book not found</Typography>;

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, mb: 3, alignItems: 'center' }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate({ to: '/books' })}>Back</Button>
        <Box sx={{ flexGrow: 1 }} />
        <Button
          startIcon={<DeleteIcon />}
          color="error"
          variant="outlined"
          onClick={() => setConfirmOpen(true)}
        >
          Delete
        </Button>
      </Box>

      <Typography variant="h4" gutterBottom>{book.title}</Typography>

      <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
        <Chip label={`${book.total_pages} pages`} variant="outlined" />
        {book.target_language && <Chip label={book.target_language} color="primary" />}
        {book.native_language && <Chip label={book.native_language} color="secondary" />}
      </Box>

      <Typography variant="body2" color="text.secondary" gutterBottom>
        File: {book.filename}
      </Typography>

      {progress && (
        <>
          <Divider sx={{ my: 3 }} />
          <Typography variant="h6" gutterBottom>Reading Progress</Typography>
          <ProgressBar
            currentPage={progress.current_page}
            totalPages={book.total_pages}
          />
          {progress.current_chapter && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              Current chapter: {progress.current_chapter}
            </Typography>
          )}
          {progress.chapters_completed.length > 0 && (
            <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
              <Typography variant="body2" color="text.secondary">Completed:</Typography>
              {progress.chapters_completed.map((ch) => (
                <Chip key={ch} label={ch} size="small" color="success" variant="outlined" />
              ))}
            </Box>
          )}
        </>
      )}

      <Divider sx={{ my: 3 }} />
      <ChapterEditor
        chapters={book.chapters}
        onSave={(chapters) => updateChapters.mutate({ bookId, chapters })}
        isSaving={updateChapters.isPending}
      />

      <Box sx={{ mt: 3 }}>
        <Button
          variant="contained"
          onClick={() => navigate({ to: '/generation' })}
        >
          Generate Cards from this Book
        </Button>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Book</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete "{book.title}"? This will also delete all associated progress and draft cards.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => deleteBook.mutate(bookId, { onSuccess: () => navigate({ to: '/books' }) })}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
