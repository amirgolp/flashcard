import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { Chapter } from '../../types';

interface ChapterEditorProps {
  chapters: Chapter[];
  onSave: (chapters: Chapter[]) => void;
  isSaving: boolean;
}

export default function ChapterEditor({ chapters, onSave, isSaving }: ChapterEditorProps) {
  const [items, setItems] = useState<Chapter[]>(chapters);
  const [name, setName] = useState('');
  const [startPage, setStartPage] = useState('');
  const [endPage, setEndPage] = useState('');

  const addChapter = () => {
    if (!name.trim() || !startPage || !endPage) return;
    setItems([...items, { name: name.trim(), start_page: +startPage, end_page: +endPage }]);
    setName('');
    setStartPage('');
    setEndPage('');
  };

  const removeChapter = (idx: number) => {
    setItems(items.filter((_, i) => i !== idx));
  };

  const dirty = JSON.stringify(items) !== JSON.stringify(chapters);

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Chapters</Typography>

      {items.length > 0 && (
        <List dense>
          {items.map((ch, i) => (
            <ListItem
              key={i}
              secondaryAction={
                <IconButton edge="end" size="small" onClick={() => removeChapter(i)}>
                  <DeleteIcon fontSize="small" />
                </IconButton>
              }
            >
              <ListItemText
                primary={ch.name}
                secondary={`Pages ${ch.start_page} – ${ch.end_page}`}
              />
            </ListItem>
          ))}
        </List>
      )}

      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mt: 1 }}>
        <TextField size="small" label="Name" value={name} onChange={(e) => setName(e.target.value)} sx={{ flexGrow: 1 }} />
        <TextField size="small" label="Start" type="number" value={startPage} onChange={(e) => setStartPage(e.target.value)} sx={{ width: 80 }} />
        <TextField size="small" label="End" type="number" value={endPage} onChange={(e) => setEndPage(e.target.value)} sx={{ width: 80 }} />
        <IconButton onClick={addChapter} disabled={!name.trim() || !startPage || !endPage}>
          <AddIcon />
        </IconButton>
      </Box>

      {dirty && (
        <Button variant="contained" size="small" sx={{ mt: 2 }} onClick={() => onSave(items)} disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Chapters'}
        </Button>
      )}
    </Paper>
  );
}
