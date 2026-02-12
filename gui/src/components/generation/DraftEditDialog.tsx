import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { DraftCardResponse, DraftCardUpdate, ExampleSentence } from '../../types';

interface DraftEditDialogProps {
  open: boolean;
  draft: DraftCardResponse | null;
  onClose: () => void;
  onSave: (data: DraftCardUpdate) => void;
  isSaving: boolean;
}

export default function DraftEditDialog({ open, draft, onClose, onSave, isSaving }: DraftEditDialogProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [examples, setExamples] = useState<ExampleSentence[]>([]);
  const [synonyms, setSynonyms] = useState<string[]>([]);
  const [antonyms, setAntonyms] = useState<string[]>([]);
  const [partOfSpeech, setPartOfSpeech] = useState('');
  const [gender, setGender] = useState('');
  const [pluralForm, setPluralForm] = useState('');
  const [pronunciation, setPronunciation] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);

  // Reset form when draft changes
  useEffect(() => {
    if (draft) {
      setFront(draft.front);
      setBack(draft.back);
      setExamples(draft.examples ?? []);
      setSynonyms(draft.synonyms ?? []);
      setAntonyms(draft.antonyms ?? []);
      setPartOfSpeech(draft.part_of_speech ?? '');
      setGender(draft.gender ?? '');
      setPluralForm(draft.plural_form ?? '');
      setPronunciation(draft.pronunciation ?? '');
      setNotes(draft.notes ?? '');
      setTags(draft.tags ?? []);
    }
  }, [draft]);

  const handleExampleChange = (index: number, field: keyof ExampleSentence, value: string) => {
    const updated = [...examples];
    updated[index] = { ...updated[index], [field]: value };
    setExamples(updated);
  };

  const handleAddExample = () => {
    setExamples([...examples, { sentence: '', translation: '' }]);
  };

  const handleRemoveExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    const filteredExamples = examples.filter((ex) => ex.sentence.trim() || ex.translation.trim());

    const data: DraftCardUpdate = {
      front: front || undefined,
      back: back || undefined,
      examples: filteredExamples.length > 0 ? filteredExamples : undefined,
      synonyms: synonyms.length > 0 ? synonyms : undefined,
      antonyms: antonyms.length > 0 ? antonyms : undefined,
      part_of_speech: partOfSpeech || undefined,
      gender: gender || undefined,
      plural_form: pluralForm || undefined,
      pronunciation: pronunciation || undefined,
      notes: notes || undefined,
      tags: tags.length > 0 ? tags : undefined,
    };

    onSave(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>Edit Draft Card</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {/* Core fields */}
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" gutterBottom>Core</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Front (word/phrase)"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              multiline
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField
              fullWidth
              label="Back (translation)"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              multiline
            />
          </Grid>

          {/* Linguistics */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>Linguistics</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <TextField
              fullWidth
              label="Part of Speech"
              value={partOfSpeech}
              onChange={(e) => setPartOfSpeech(e.target.value)}
              placeholder="noun, verb, adjective..."
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <TextField
              fullWidth
              label="Gender"
              value={gender}
              onChange={(e) => setGender(e.target.value)}
              placeholder="masculine, feminine, neuter"
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <TextField
              fullWidth
              label="Plural Form"
              value={pluralForm}
              onChange={(e) => setPluralForm(e.target.value)}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6, lg: 3 }}>
            <TextField
              fullWidth
              label="Pronunciation"
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              placeholder="IPA or phonetic"
            />
          </Grid>

          {/* Examples */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>Examples</Typography>
          </Grid>
          {examples.map((ex, i) => (
            <Grid size={{ xs: 12 }} key={i}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField
                  sx={{ flex: 1 }}
                  label={`Sentence ${i + 1}`}
                  value={ex.sentence}
                  onChange={(e) => handleExampleChange(i, 'sentence', e.target.value)}
                  size="small"
                />
                <TextField
                  sx={{ flex: 1 }}
                  label={`Translation ${i + 1}`}
                  value={ex.translation}
                  onChange={(e) => handleExampleChange(i, 'translation', e.target.value)}
                  size="small"
                />
                <IconButton onClick={() => handleRemoveExample(i)} size="small">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Button
              startIcon={<AddIcon />}
              onClick={handleAddExample}
              size="small"
              disabled={examples.length >= 5}
            >
              Add Example
            </Button>
          </Grid>

          {/* Related words */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>Related Words</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={synonyms}
              onChange={(_, v) => setSynonyms(v)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Synonyms" placeholder="Type and press Enter" size="small" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={antonyms}
              onChange={(_, v) => setAntonyms(v)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Antonyms" placeholder="Type and press Enter" size="small" />
              )}
            />
          </Grid>

          {/* Meta */}
          <Grid size={{ xs: 12 }}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" gutterBottom>Meta</Typography>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={tags}
              onChange={(_, v) => setTags(v)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />
                ))
              }
              renderInput={(params) => (
                <TextField {...params} label="Tags" placeholder="Type and press Enter" size="small" />
              )}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              rows={2}
              size="small"
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSaving}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !front.trim() || !back.trim()}
        >
          {isSaving ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Saving...
            </Box>
          ) : (
            'Save'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
