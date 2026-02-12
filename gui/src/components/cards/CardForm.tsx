import { useState } from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import ToggleButton from '@mui/material/ToggleButton';
import Divider from '@mui/material/Divider';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import type { CardCreate, HardnessLevel, ExampleSentence } from '../../types';

interface CardFormProps {
  initialValues?: Partial<CardCreate>;
  onSubmit: (data: CardCreate) => void;
  isLoading: boolean;
  submitLabel: string;
}

export default function CardForm({ initialValues, onSubmit, isLoading, submitLabel }: CardFormProps) {
  const [front, setFront] = useState(initialValues?.front ?? '');
  const [back, setBack] = useState(initialValues?.back ?? '');
  const [partOfSpeech, setPartOfSpeech] = useState(initialValues?.part_of_speech ?? '');
  const [gender, setGender] = useState(initialValues?.gender ?? '');
  const [pluralForm, setPluralForm] = useState(initialValues?.plural_form ?? '');
  const [pronunciation, setPronunciation] = useState(initialValues?.pronunciation ?? '');
  const [notes, setNotes] = useState(initialValues?.notes ?? '');
  const [hardness, setHardness] = useState<HardnessLevel>(initialValues?.hardness_level ?? 'medium');
  const [examples, setExamples] = useState<ExampleSentence[]>(
    initialValues?.examples ?? [{ sentence: '', translation: '' }]
  );
  const [synonyms, setSynonyms] = useState<string[]>(initialValues?.synonyms ?? []);
  const [antonyms, setAntonyms] = useState<string[]>(initialValues?.antonyms ?? []);
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? []);

  const handleExampleChange = (index: number, field: keyof ExampleSentence, value: string) => {
    const updated = [...examples];
    updated[index] = { ...updated[index], [field]: value };
    setExamples(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const filteredExamples = examples.filter((ex) => ex.sentence.trim() || ex.translation.trim());
    onSubmit({
      front,
      back,
      part_of_speech: partOfSpeech || undefined,
      gender: gender || undefined,
      plural_form: pluralForm || undefined,
      pronunciation: pronunciation || undefined,
      notes: notes || undefined,
      hardness_level: hardness,
      examples: filteredExamples.length > 0 ? filteredExamples : undefined,
      synonyms: synonyms.length > 0 ? synonyms : undefined,
      antonyms: antonyms.length > 0 ? antonyms : undefined,
      tags: tags.length > 0 ? tags : undefined,
    });
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box component="form" onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Typography variant="h6">Core</Typography>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth required label="Front (word/phrase)" value={front} onChange={(e) => setFront(e.target.value)} multiline />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth required label="Back (translation)" value={back} onChange={(e) => setBack(e.target.value)} multiline />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <TextField fullWidth label="Part of Speech" value={partOfSpeech} onChange={(e) => setPartOfSpeech(e.target.value)} placeholder="noun, verb, adjective..." />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Box>
              <Typography variant="body2" sx={{ mb: 1 }}>Difficulty</Typography>
              <ToggleButtonGroup value={hardness} exclusive onChange={(_, v) => v && setHardness(v)} size="small">
                <ToggleButton value="easy" color="success">Easy</ToggleButton>
                <ToggleButton value="medium" color="warning">Medium</ToggleButton>
                <ToggleButton value="hard" color="error">Hard</ToggleButton>
              </ToggleButtonGroup>
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /><Typography variant="h6" sx={{ mt: 1 }}>Linguistics</Typography></Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Gender" value={gender} onChange={(e) => setGender(e.target.value)} placeholder="masculine, feminine, neuter" />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Plural Form" value={pluralForm} onChange={(e) => setPluralForm(e.target.value)} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <TextField fullWidth label="Pronunciation" value={pronunciation} onChange={(e) => setPronunciation(e.target.value)} placeholder="IPA or phonetic" />
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /><Typography variant="h6" sx={{ mt: 1 }}>Examples</Typography></Grid>
          {examples.map((ex, i) => (
            <Grid size={{ xs: 12 }} key={i}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <TextField sx={{ flex: 1 }} label={`Sentence ${i + 1}`} value={ex.sentence} onChange={(e) => handleExampleChange(i, 'sentence', e.target.value)} />
                <TextField sx={{ flex: 1 }} label={`Translation ${i + 1}`} value={ex.translation} onChange={(e) => handleExampleChange(i, 'translation', e.target.value)} />
                <IconButton onClick={() => setExamples(examples.filter((_, idx) => idx !== i))} disabled={examples.length <= 1}>
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Grid>
          ))}
          <Grid size={{ xs: 12 }}>
            <Button startIcon={<AddIcon />} onClick={() => setExamples([...examples, { sentence: '', translation: '' }])} disabled={examples.length >= 5}>
              Add Example
            </Button>
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /><Typography variant="h6" sx={{ mt: 1 }}>Related Words</Typography></Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete multiple freeSolo options={[]} value={synonyms} onChange={(_, v) => setSynonyms(v)}
              renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />)}
              renderInput={(params) => <TextField {...params} label="Synonyms" placeholder="Type and press Enter" />}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Autocomplete multiple freeSolo options={[]} value={antonyms} onChange={(_, v) => setAntonyms(v)}
              renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />)}
              renderInput={(params) => <TextField {...params} label="Antonyms" placeholder="Type and press Enter" />}
            />
          </Grid>

          <Grid size={{ xs: 12 }}><Divider /><Typography variant="h6" sx={{ mt: 1 }}>Meta</Typography></Grid>
          <Grid size={{ xs: 12 }}>
            <Autocomplete multiple freeSolo options={[]} value={tags} onChange={(_, v) => setTags(v)}
              renderTags={(value, getTagProps) => value.map((option, index) => <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} key={index} />)}
              renderInput={(params) => <TextField {...params} label="Tags" placeholder="Type and press Enter" />}
            />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField fullWidth label="Notes" value={notes} onChange={(e) => setNotes(e.target.value)} multiline rows={3} />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Button type="submit" variant="contained" size="large" disabled={isLoading || !front.trim() || !back.trim()}>
              {isLoading ? 'Saving...' : submitLabel}
            </Button>
          </Grid>
        </Grid>
      </Box>
    </Paper>
  );
}
