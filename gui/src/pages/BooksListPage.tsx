import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { useNavigate } from '@tanstack/react-router';
import { useBooks } from '../hooks/useBooks';
import BookListItem from '../components/books/BookListItem';
import BookUploadDialog from '../components/books/BookUploadDialog';

export default function BooksListPage() {
  const navigate = useNavigate();
  const { data: books, isLoading } = useBooks();
  const [uploadOpen, setUploadOpen] = useState(false);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Books</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setUploadOpen(true)}>
          Upload Book
        </Button>
      </Box>

      {isLoading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
      ) : !books?.length ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <MenuBookIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
          <Typography color="text.secondary">No books yet. Upload your first PDF textbook!</Typography>
        </Box>
      ) : (
        <Grid container spacing={2}>
          {books.map((book) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={book.id}>
              <BookListItem book={book} onClick={() => navigate({ to: '/books/$bookId', params: { bookId: book.id } })} />
            </Grid>
          ))}
        </Grid>
      )}

      <BookUploadDialog
        open={uploadOpen}
        onClose={() => setUploadOpen(false)}
        onSuccess={(bookId) => {
          setUploadOpen(false);
          navigate({ to: '/books/$bookId', params: { bookId } });
        }}
      />
    </Box>
  );
}
