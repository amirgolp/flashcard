import { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Grid from '@mui/material/Grid2';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import TranslateIcon from '@mui/icons-material/Translate';
import SchoolIcon from '@mui/icons-material/School';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { borderRadius: 2 }
      }}
    >
      <DialogTitle sx={{ borderBottom: '1px solid', borderColor: 'divider', pb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ p: 1, bgcolor: 'primary.light', borderRadius: 1, color: 'primary.contrastText', display: 'flex' }}>
            <EditIcon fontSize="small" />
          </Box>
          <Typography variant="h6" fontWeight={600}>Edit Flashcard Draft</Typography>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ bgcolor: 'grey.50', p: 3 }}>
        <Stack spacing={3} sx={{ mt: 1 }}>

          {/* Core Fields Section */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, borderLeft: '4px solid', borderLeftColor: 'primary.main', bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <TranslateIcon color="primary" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5 }}>CORE CONTENT</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Front (word/phrase)"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  multiline
                  variant="outlined"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  fullWidth
                  label="Back (translation)"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  multiline
                  variant="outlined"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Linguistics Section */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <SchoolIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5 }}>LINGUISTICS</Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <TextField
                  fullWidth
                  label="Part of Speech"
                  value={partOfSpeech}
                  onChange={(e) => setPartOfSpeech(e.target.value)}
                  placeholder="noun, verb..."
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <TextField
                  fullWidth
                  label="Gender"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="m, f, n"
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <TextField
                  fullWidth
                  label="Plural Form"
                  value={pluralForm}
                  onChange={(e) => setPluralForm(e.target.value)}
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6, lg: 3 }}>
                <TextField
                  fullWidth
                  label="Pronunciation"
                  value={pronunciation}
                  onChange={(e) => setPronunciation(e.target.value)}
                  placeholder="IPA"
                  size="small"
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </Grid>
          </Paper>

          {/* Examples Section */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <MenuBookIcon color="action" fontSize="small" />
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5 }}>CONTEXT & EXAMPLES</Typography>
              </Box>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddExample}
                size="small"
                disabled={examples.length >= 5}
              >
                Add Example
              </Button>
            </Box>

            <Stack spacing={2}>
              {examples.length === 0 && (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', textAlign: 'center', py: 2 }}>
                  No examples added yet.
                </Typography>
              )}
              {examples.map((ex, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1.5, alignItems: 'start', p: 1.5, bgcolor: 'action.hover', borderRadius: 1 }}>
                  <Chip label={i + 1} size="small" sx={{ height: 24, minWidth: 24 }} />
                  <Grid container spacing={1} sx={{ flex: 1 }}>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        placeholder="Example sentence"
                        value={ex.sentence}
                        onChange={(e) => handleExampleChange(i, 'sentence', e.target.value)}
                        size="small"
                        variant="standard"
                        slotProps={{ input: { disableUnderline: true, style: { fontWeight: 500 } } }}
                      />
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                      <TextField
                        fullWidth
                        placeholder="Translation"
                        value={ex.translation}
                        onChange={(e) => handleExampleChange(i, 'translation', e.target.value)}
                        size="small"
                        variant="standard"
                        slotProps={{ input: { disableUnderline: true, style: { color: 'text.secondary', fontSize: '0.9em' } } }}
                      />
                    </Grid>
                  </Grid>
                  <IconButton onClick={() => handleRemoveExample(i)} size="small" color="error" sx={{ opacity: 0.6, '&:hover': { opacity: 1 } }}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Stack>
          </Paper>

          {/* Taxonomy Section */}
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: 2, bgcolor: 'background.paper' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <LocalOfferIcon color="action" fontSize="small" />
              <Typography variant="subtitle2" fontWeight={700} color="text.secondary" sx={{ letterSpacing: 0.5 }}>TAXONOMY & NOTES</Typography>
            </Box>
            <Grid container spacing={2}>
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
                    <TextField {...params} label="Synonyms" placeholder="Type..." size="small" />
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
                    <TextField {...params} label="Antonyms" placeholder="Type..." size="small" />
                  )}
                />
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
                    <TextField {...params} label="Tags" placeholder="Type..." size="small" />
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
                  variant="outlined"
                />
              </Grid>
            </Grid>
          </Paper>

        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Button onClick={onClose} disabled={isSaving} color="inherit">
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={isSaving || !front.trim() || !back.trim()}
          disableElevation
          sx={{ px: 3 }}
        >
          {isSaving ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} color="inherit" />
              Saving...
            </Box>
          ) : (
            'Save Changes'
          )}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
