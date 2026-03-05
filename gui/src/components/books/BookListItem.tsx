import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { BookResponse } from '../../types';

interface BookListItemProps {
  book: BookResponse;
  onClick: () => void;
}

export default function BookListItem({ book, onClick }: BookListItemProps) {
  return (
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Typography variant="h6" noWrap gutterBottom>{book.title}</Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip label={`${book.total_pages} pages`} size="small" variant="outlined" />
            {book.target_language && <Chip label={book.target_language} size="small" color="primary" />}
            {book.native_language && <Chip label={book.native_language} size="small" color="secondary" />}
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            {book.filename}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
