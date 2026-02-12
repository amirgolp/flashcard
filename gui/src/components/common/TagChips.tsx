import { Box, Chip } from '@mui/material';

interface TagChipsProps {
  tags: string[];
}

export default function TagChips({ tags }: TagChipsProps) {
  if (tags.length === 0) return null;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {tags.map((tag) => (
        <Chip key={tag} label={tag} size="small" variant="outlined" />
      ))}
    </Box>
  );
}
