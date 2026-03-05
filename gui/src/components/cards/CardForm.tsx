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
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Stack from '@mui/material/Stack';
import Tooltip from '@mui/material/Tooltip';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import type { CardCreate, HardnessLevel, ExampleSentence } from '../../types';

interface CardFormProps {
  initialValues?: Partial<CardCreate>;
  onSubmit: (data: CardCreate) => void;
  isLoading: boolean;
  submitLabel: string;
}

const SECTION_SPACING = 3;

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
    <Box component="form" onSubmit={handleSubmit}>
      <Stack spacing={SECTION_SPACING}>
        {/* Core Information */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">Core Information</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Front (Word/Phrase)"
                  value={front}
                  onChange={(e) => setFront(e.target.value)}
                  placeholder="e.g., 'Bonjour'"
                  helperText="The main term you want to learn."
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  required
                  label="Back (Translation/Definition)"
                  value={back}
                  onChange={(e) => setBack(e.target.value)}
                  multiline
                  minRows={2}
                  placeholder="e.g., 'Hello'"
                  variant="outlined"
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  freeSolo
                  options={["noun", "verb", "adjective", "adverb", "preposition", "conjunction", "interjection"]}
                  value={partOfSpeech}
                  onChange={(_, v) => setPartOfSpeech(v || "")}
                  renderInput={(params) => <TextField {...params} label="Part of Speech" placeholder="e.g., noun" />}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Box display="flex" alignItems="center" gap={2}>
                  <Typography variant="body2" color="text.secondary">Difficulty:</Typography>
                  <ToggleButtonGroup
                    value={hardness}
                    exclusive
                    onChange={(_, v) => v && setHardness(v)}
                    size="small"
                    aria-label="hardness level"
                  >
                    <ToggleButton value="easy" color="success">Easy</ToggleButton>
                    <ToggleButton value="medium" color="warning">Medium</ToggleButton>
                    <ToggleButton value="hard" color="error">Hard</ToggleButton>
                  </ToggleButtonGroup>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Linguistic Details */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">Linguistic Details</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Autocomplete
                  freeSolo
                  options={["masculine", "feminine", "neuter"]}
                  value={gender}
                  onChange={(_, v) => setGender(v || "")}
                  renderInput={(params) => <TextField {...params} label="Gender" placeholder="e.g., masculine" />}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Plural Form"
                  value={pluralForm}
                  onChange={(e) => setPluralForm(e.target.value)}
                  placeholder="e.g., chats"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Pronunciation"
                  value={pronunciation}
                  onChange={(e) => setPronunciation(e.target.value)}
                  placeholder="IPA (e.g., /bɔ̃.ʒuʁ/)"
                  InputProps={{
                    endAdornment: (
                      <Tooltip title="International Phonetic Alphabet representation">
                        <HelpOutlineIcon fontSize="small" color="action" />
                      </Tooltip>
                    )
                  }}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Examples */}
        <Card variant="outlined">
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" color="primary">Examples</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={() => setExamples([...examples, { sentence: '', translation: '' }])}
                disabled={examples.length >= 5}
                size="small"
              >
                Add Example
              </Button>
            </Box>
            <Stack spacing={2}>
              {examples.map((ex, i) => (
                <Paper key={i} elevation={0} variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                  <Box display="flex" alignItems="flex-start" gap={2}>
                    <Grid container spacing={2} flex={1}>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label={`Sentence ${i + 1}`}
                          value={ex.sentence}
                          onChange={(e) => handleExampleChange(i, 'sentence', e.target.value)}
                          size="small"
                          placeholder="Example sentence using the word"
                        />
                      </Grid>
                      <Grid item xs={12} md={6}>
                        <TextField
                          fullWidth
                          label={`Translation ${i + 1}`}
                          value={ex.translation}
                          onChange={(e) => handleExampleChange(i, 'translation', e.target.value)}
                          size="small"
                          placeholder="Translation of the example"
                        />
                      </Grid>
                    </Grid>
                    <IconButton
                      onClick={() => setExamples(examples.filter((_, idx) => idx !== i))}
                      disabled={examples.length <= 1}
                      color="error"
                      size="small"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>

        {/* Relationships */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">Relationships</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
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
                    <TextField {...params} label="Synonyms" placeholder="Type and press Enter" helperText="Words with similar meanings" />
                  )}
                />
              </Grid>
              <Grid item xs={12} md={6}>
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
                    <TextField {...params} label="Antonyms" placeholder="Type and press Enter" helperText="Words with opposite meanings" />
                  )}
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Metadata */}
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">Additional Notes & Tags</Typography>
            <Grid container spacing={3}>
              <Grid item xs={12}>
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
                    <TextField {...params} label="Tags" placeholder="Type and press Enter" />
                  )}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  multiline
                  minRows={3}
                  placeholder="Any extra context, usage notes, or mnemonic devices..."
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        <Box display="flex" justifyContent="flex-end" pt={2} pb={4}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading || !front.trim() || !back.trim()}
            sx={{ px: 4, py: 1.5 }}
          >
            {isLoading ? 'Saving...' : submitLabel}
          </Button>
        </Box>
      </Stack>
    </Box>
  );
}
