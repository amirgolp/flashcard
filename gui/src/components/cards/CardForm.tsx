import { useState } from 'react'
import Box from '@mui/material/Box'
import TextField from '@mui/material/TextField'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import IconButton from '@mui/material/IconButton'
import Autocomplete from '@mui/material/Autocomplete'
import Chip from '@mui/material/Chip'
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup'
import ToggleButton from '@mui/material/ToggleButton'
import Stack from '@mui/material/Stack'
import Tooltip from '@mui/material/Tooltip'
import Collapse from '@mui/material/Collapse'
import ButtonBase from '@mui/material/ButtonBase'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import ExpandMoreIcon from '@mui/icons-material/ExpandMore'
import HelpOutlineIcon from '@mui/icons-material/HelpOutline'
import { useQuery } from '@tanstack/react-query'
import { listTemplates } from '../../api/templates'
import CardPreview from './CardPreview'
import type {
  CardCreate,
  HardnessLevel,
  ExampleSentence,
  TemplateResponse,
} from '../../types'

interface CardFormProps {
  initialValues?: Partial<CardCreate>
  onSubmit: (data: CardCreate) => void
  isLoading: boolean
  submitLabel: string
}

interface FormSectionProps {
  title: string
  summary?: string
  defaultOpen?: boolean
  action?: React.ReactNode
  children: React.ReactNode
}

// Collapsible section — optional fields stay out of the way until needed.
function FormSection({
  title,
  summary,
  defaultOpen = false,
  action,
  children,
}: FormSectionProps) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <Paper
      elevation={0}
      sx={{
        border: '1px solid',
        borderColor: 'divider',
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Box display="flex" alignItems="center">
        <ButtonBase
          onClick={() => setOpen(!open)}
          sx={{
            flexGrow: 1,
            display: 'flex',
            justifyContent: 'flex-start',
            alignItems: 'center',
            gap: 1,
            px: 2.5,
            py: 1.75,
            textAlign: 'left',
          }}
        >
          <ExpandMoreIcon
            fontSize="small"
            sx={{
              color: 'text.secondary',
              transition: 'transform 0.2s',
              transform: open ? 'rotate(0deg)' : 'rotate(-90deg)',
            }}
          />
          <Typography fontWeight={600}>{title}</Typography>
          {!open && summary && (
            <Typography variant="body2" color="text.secondary" noWrap>
              {summary}
            </Typography>
          )}
        </ButtonBase>
        {open && action && <Box pr={1.5}>{action}</Box>}
      </Box>
      <Collapse in={open}>
        <Box px={2.5} pb={2.5}>
          {children}
        </Box>
      </Collapse>
    </Paper>
  )
}

export default function CardForm({
  initialValues,
  onSubmit,
  isLoading,
  submitLabel,
}: CardFormProps) {
  const [front, setFront] = useState(initialValues?.front ?? '')
  const [back, setBack] = useState(initialValues?.back ?? '')
  const [partOfSpeech, setPartOfSpeech] = useState(
    initialValues?.part_of_speech ?? '',
  )
  const [gender, setGender] = useState(initialValues?.gender ?? '')
  const [pluralForm, setPluralForm] = useState(initialValues?.plural_form ?? '')
  const [pronunciation, setPronunciation] = useState(
    initialValues?.pronunciation ?? '',
  )
  const [notes, setNotes] = useState(initialValues?.notes ?? '')
  const [hardness, setHardness] = useState<HardnessLevel>(
    initialValues?.hardness_level ?? 'medium',
  )
  const [examples, setExamples] = useState<ExampleSentence[]>(
    initialValues?.examples?.length
      ? initialValues.examples
      : [{ sentence: '', translation: '' }],
  )
  const [synonyms, setSynonyms] = useState<string[]>(
    initialValues?.synonyms ?? [],
  )
  const [antonyms, setAntonyms] = useState<string[]>(
    initialValues?.antonyms ?? [],
  )
  const [tags, setTags] = useState<string[]>(initialValues?.tags ?? [])
  const [templateId, setTemplateId] = useState<string | null>(
    initialValues?.template_id ?? null,
  )
  const [customFields, setCustomFields] = useState<Record<string, string>>(
    initialValues?.custom_fields ?? {},
  )

  const { data: templates, isLoading: templatesLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => listTemplates(0, 50, true),
  })

  const selectedTemplate =
    templates?.find((t: TemplateResponse) => t.id === templateId) ?? null

  const handleCustomFieldChange = (key: string, value: string) => {
    setCustomFields((prev) => ({ ...prev, [key]: value }))
  }

  const handleExampleChange = (
    index: number,
    field: keyof ExampleSentence,
    value: string,
  ) => {
    const updated = [...examples]
    updated[index] = { ...updated[index], [field]: value }
    setExamples(updated)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const filteredExamples = examples.filter(
      (ex) => ex.sentence.trim() || ex.translation.trim(),
    )
    onSubmit({
      front,
      back,
      part_of_speech: partOfSpeech || undefined,
      gender: gender || undefined,
      plural_form: pluralForm || undefined,
      pronunciation: pronunciation || undefined,
      notes: notes || undefined,
      hardness_level: hardness,
      template_id: templateId || undefined,
      custom_fields:
        Object.keys(customFields).length > 0 ? customFields : undefined,
      examples: filteredExamples.length > 0 ? filteredExamples : undefined,
      synonyms: synonyms.length > 0 ? synonyms : undefined,
      antonyms: antonyms.length > 0 ? antonyms : undefined,
      tags: tags.length > 0 ? tags : undefined,
    })
  }

  const filledExamples = examples.filter((ex) => ex.sentence.trim()).length
  const hasLinguistics = !!(partOfSpeech || gender || pluralForm || pronunciation)
  const hasRelations = synonyms.length > 0 || antonyms.length > 0
  const hasNotesOrTags = !!notes || tags.length > 0

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'minmax(0, 1fr) 340px' },
        gap: 4,
        alignItems: 'start',
        maxWidth: 1100,
      }}
    >
      <Stack spacing={2}>
        {/* Essentials — the only part most cards need. */}
        <Paper
          elevation={0}
          sx={{
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            p: 2.5,
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              fullWidth
              required
              autoFocus
              label="Front"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              placeholder="Bonjour"
              inputProps={{ style: { fontSize: '1.3rem', fontWeight: 600 } }}
            />
            <TextField
              fullWidth
              required
              label="Back"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              multiline
              minRows={2}
              placeholder="Hello"
            />
            <Box
              display="flex"
              alignItems="center"
              gap={2}
              flexWrap="wrap"
              justifyContent="space-between"
            >
              <ToggleButtonGroup
                value={hardness}
                exclusive
                onChange={(_, v) => v && setHardness(v)}
                size="small"
                aria-label="hardness level"
              >
                <ToggleButton value="easy" color="success">
                  Easy
                </ToggleButton>
                <ToggleButton value="medium" color="warning">
                  Medium
                </ToggleButton>
                <ToggleButton value="hard" color="error">
                  Hard
                </ToggleButton>
              </ToggleButtonGroup>
              <Autocomplete
                sx={{ minWidth: 220, flexGrow: 1, maxWidth: 320 }}
                size="small"
                options={templates ?? []}
                loading={templatesLoading}
                getOptionLabel={(option: TemplateResponse) => option.name}
                value={selectedTemplate}
                onChange={(_, value) => setTemplateId(value?.id ?? null)}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                renderInput={(params) => (
                  <TextField {...params} label="Template (optional)" />
                )}
              />
            </Box>
          </Stack>
        </Paper>

        {selectedTemplate && selectedTemplate.fields.length > 0 && (
          <FormSection title={`${selectedTemplate.name} fields`} defaultOpen>
            <Stack spacing={2}>
              {selectedTemplate.fields.map((field) => (
                <TextField
                  key={field.name}
                  fullWidth
                  required={field.required}
                  label={field.label}
                  value={customFields[field.name] || ''}
                  onChange={(e) =>
                    handleCustomFieldChange(field.name, e.target.value)
                  }
                  multiline={field.type === 'textarea'}
                  minRows={field.type === 'textarea' ? 3 : 1}
                  helperText={field.description}
                />
              ))}
            </Stack>
          </FormSection>
        )}

        <FormSection
          title="Linguistic details"
          summary={
            hasLinguistics
              ? [partOfSpeech, gender, pluralForm, pronunciation]
                  .filter(Boolean)
                  .join(' · ')
              : 'part of speech, gender, plural, pronunciation'
          }
          defaultOpen={hasLinguistics}
        >
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
          >
            <Autocomplete
              freeSolo
              options={[
                'noun',
                'verb',
                'adjective',
                'adverb',
                'preposition',
                'conjunction',
                'interjection',
              ]}
              value={partOfSpeech}
              onChange={(_, v) => setPartOfSpeech(v || '')}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Part of speech"
                  placeholder="noun"
                />
              )}
            />
            <Autocomplete
              freeSolo
              options={['masculine', 'feminine', 'neuter']}
              value={gender}
              onChange={(_, v) => setGender(v || '')}
              renderInput={(params) => (
                <TextField {...params} label="Gender" placeholder="masculine" />
              )}
            />
            <TextField
              label="Plural form"
              value={pluralForm}
              onChange={(e) => setPluralForm(e.target.value)}
              placeholder="chats"
            />
            <TextField
              label="Pronunciation"
              value={pronunciation}
              onChange={(e) => setPronunciation(e.target.value)}
              placeholder="/bɔ̃.ʒuʁ/"
              InputProps={{
                endAdornment: (
                  <Tooltip title="International Phonetic Alphabet representation">
                    <HelpOutlineIcon fontSize="small" color="action" />
                  </Tooltip>
                ),
              }}
            />
          </Box>
        </FormSection>

        <FormSection
          title="Examples"
          summary={
            filledExamples > 0
              ? `${filledExamples} added`
              : 'sentences using the word'
          }
          defaultOpen={filledExamples > 0}
          action={
            <Button
              startIcon={<AddIcon />}
              onClick={() =>
                setExamples([...examples, { sentence: '', translation: '' }])
              }
              disabled={examples.length >= 5}
              size="small"
            >
              Add
            </Button>
          }
        >
          <Stack spacing={2}>
            {examples.map((ex, i) => (
              <Box key={i} display="flex" alignItems="flex-start" gap={1}>
                <Box
                  display="grid"
                  gap={2}
                  flexGrow={1}
                  gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
                >
                  <TextField
                    label={`Sentence ${i + 1}`}
                    value={ex.sentence}
                    onChange={(e) =>
                      handleExampleChange(i, 'sentence', e.target.value)
                    }
                    size="small"
                    placeholder="Example sentence using the word"
                  />
                  <TextField
                    label="Translation"
                    value={ex.translation}
                    onChange={(e) =>
                      handleExampleChange(i, 'translation', e.target.value)
                    }
                    size="small"
                    placeholder="Its translation"
                  />
                </Box>
                <IconButton
                  onClick={() =>
                    setExamples(examples.filter((_, idx) => idx !== i))
                  }
                  disabled={examples.length <= 1}
                  size="small"
                  sx={{ mt: 0.5 }}
                >
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Box>
            ))}
          </Stack>
        </FormSection>

        <FormSection
          title="Synonyms & antonyms"
          summary={
            hasRelations
              ? [...synonyms, ...antonyms].slice(0, 4).join(', ')
              : 'related words'
          }
          defaultOpen={hasRelations}
        >
          <Box
            display="grid"
            gap={2}
            gridTemplateColumns={{ xs: '1fr', sm: '1fr 1fr' }}
          >
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={synonyms}
              onChange={(_, v) => setSynonyms(v)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={index}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Synonyms"
                  placeholder="Type and press Enter"
                />
              )}
            />
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={antonyms}
              onChange={(_, v) => setAntonyms(v)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={index}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Antonyms"
                  placeholder="Type and press Enter"
                />
              )}
            />
          </Box>
        </FormSection>

        <FormSection
          title="Tags & notes"
          summary={
            hasNotesOrTags
              ? [tags.join(', '), notes && 'notes'].filter(Boolean).join(' · ')
              : 'organization and mnemonics'
          }
          defaultOpen={hasNotesOrTags}
        >
          <Stack spacing={2}>
            <Autocomplete
              multiple
              freeSolo
              options={[]}
              value={tags}
              onChange={(_, v) => setTags(v)}
              renderTags={(value, getTagProps) =>
                value.map((option, index) => (
                  <Chip
                    variant="outlined"
                    label={option}
                    size="small"
                    {...getTagProps({ index })}
                    key={index}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Tags"
                  placeholder="Type and press Enter"
                />
              )}
            />
            <TextField
              fullWidth
              label="Notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              multiline
              minRows={3}
              placeholder="Extra context, usage notes, or mnemonic devices…"
            />
          </Stack>
        </FormSection>

        <Box display="flex" justifyContent="flex-end" pt={1} pb={4}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={isLoading || !front.trim() || !back.trim()}
            sx={{ px: 4, py: 1.5 }}
          >
            {isLoading ? 'Saving…' : submitLabel}
          </Button>
        </Box>
      </Stack>

      {/* Live preview — sticky beside the form on desktop, above it on mobile. */}
      <Box
        sx={{
          order: { xs: -1, md: 0 },
          position: { md: 'sticky' },
          top: { md: 88 },
        }}
      >
        <CardPreview
          front={front}
          back={back}
          partOfSpeech={partOfSpeech}
          gender={gender}
          pronunciation={pronunciation}
          examples={examples}
          tags={tags}
          hardness={hardness}
        />
      </Box>
    </Box>
  )
}
