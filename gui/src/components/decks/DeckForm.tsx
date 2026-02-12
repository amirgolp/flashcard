import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import type { DeckCreate } from '../../types';

interface DeckFormProps {
  initialValues?: Partial<DeckCreate>;
  onSubmit: (data: DeckCreate) => void;
  isLoading: boolean;
  submitLabel: string;
}

export default function DeckForm({ initialValues, onSubmit, isLoading, submitLabel }: DeckFormProps) {
  const [name, setName] = useState(initialValues?.name ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({ name, description: description || undefined });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField fullWidth required label="Deck Name" value={name} onChange={(e) => setName(e.target.value)} />
        <TextField fullWidth label="Description" value={description} onChange={(e) => setDescription(e.target.value)} multiline rows={3} />
        <Button type="submit" variant="contained" size="large" disabled={isLoading || !name.trim()}>
          {isLoading ? 'Saving...' : submitLabel}
        </Button>
      </Box>
    </Paper>
  );
}
