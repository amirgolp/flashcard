import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Box,
  Typography,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Switch,
  FormControlLabel,
} from '@mui/material'
import DeleteIcon from '@mui/icons-material/Delete'
import AddIcon from '@mui/icons-material/Add'
import type {
  TemplateUpdate,
  TemplateResponse,
  TemplateFieldSchema,
} from '../../types'
import { createTemplate, updateTemplate } from '../../api/templates'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface TemplateFormModalProps {
  open: boolean
  onClose: () => void
  template: TemplateResponse | null
}

const emptyField: TemplateFieldSchema = {
  name: '',
  label: '',
  type: 'text',
  description: '',
  show_on_front: true,
  required: false,
}

export default function TemplateFormModal({
  open,
  onClose,
  template,
}: TemplateFormModalProps) {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [systemPrompt, setSystemPrompt] = useState('')
  const [fields, setFields] = useState<TemplateFieldSchema[]>([])

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
      setSystemPrompt(template.system_prompt || '')
      setFields([...template.fields])
    } else {
      setName('')
      setDescription('')
      setSystemPrompt('')
      setFields([
        { ...emptyField, name: 'front', label: 'Front' },
        { ...emptyField, name: 'back', label: 'Back', show_on_front: false },
      ])
    }
  }, [template, open])

  const createMutation = useMutation({
    mutationFn: createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      onClose()
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: { id: string; update: TemplateUpdate }) =>
      updateTemplate(data.id, data.update),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      onClose()
    },
  })

  const handleAddField = () => {
    setFields([...fields, { ...emptyField }])
  }

  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index))
  }

  const handleFieldChange = (
    index: number,
    key: keyof TemplateFieldSchema,
    value: any,
  ) => {
    const newFields = [...fields]
    newFields[index] = { ...newFields[index], [key]: value }
    setFields(newFields)
  }

  const handleSave = () => {
    const data = {
      name,
      description,
      system_prompt: systemPrompt,
      fields: fields.map((f) => ({
        ...f,
        // sanitize name
        name: f.name.toLowerCase().replace(/\s+/g, '_'),
      })),
    }

    if (template) {
      updateMutation.mutate({ id: template.id, update: data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>{template ? 'Edit Template' : 'New Template'}</DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, my: 1 }}>
          <TextField
            label="Template Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />

          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            fullWidth
            multiline
            rows={2}
          />

          <TextField
            label="AI System Prompt Instructions"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            fullWidth
            multiline
            rows={3}
            helperText="Instructions to guide Gemini on how to extract and populate these specific fields."
          />

          <Box>
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
              }}
            >
              <Typography variant="h6">Fields</Typography>
              <Button
                startIcon={<AddIcon />}
                onClick={handleAddField}
                size="small"
              >
                Add Field
              </Button>
            </Box>

            {fields.map((field, index) => (
              <Box
                key={index}
                sx={{
                  display: 'flex',
                  gap: 2,
                  alignItems: 'flex-start',
                  mb: 2,
                  p: 2,
                  border: '1px solid #eee',
                  borderRadius: 1,
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    flexGrow: 1,
                  }}
                >
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <TextField
                      label="Field Key"
                      value={field.name}
                      onChange={(e) =>
                        handleFieldChange(index, 'name', e.target.value)
                      }
                      size="small"
                      required
                      sx={{ width: '30%' }}
                      helperText="e.g. 'front', 'examples'"
                    />
                    <TextField
                      label="Display Label"
                      value={field.label}
                      onChange={(e) =>
                        handleFieldChange(index, 'label', e.target.value)
                      }
                      size="small"
                      required
                      sx={{ width: '30%' }}
                      helperText="e.g. 'Question', 'Examples'"
                    />
                    <FormControl size="small" sx={{ width: '40%' }}>
                      <InputLabel>Type</InputLabel>
                      <Select
                        value={field.type}
                        label="Type"
                        onChange={(e) =>
                          handleFieldChange(index, 'type', e.target.value)
                        }
                      >
                        <MenuItem value="text">Short Text</MenuItem>
                        <MenuItem value="textarea">Long Text</MenuItem>
                        <MenuItem value="list">List of Strings</MenuItem>
                      </Select>
                    </FormControl>
                  </Box>
                  <TextField
                    label="Description for AI prompt"
                    value={field.description}
                    onChange={(e) =>
                      handleFieldChange(index, 'description', e.target.value)
                    }
                    size="small"
                    fullWidth
                  />
                  <Box sx={{ display: 'flex', gap: 3 }}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.show_on_front}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              'show_on_front',
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label="Show on Front Card"
                    />
                    <FormControlLabel
                      control={
                        <Switch
                          checked={field.required}
                          onChange={(e) =>
                            handleFieldChange(
                              index,
                              'required',
                              e.target.checked,
                            )
                          }
                        />
                      }
                      label="Required"
                    />
                  </Box>
                </Box>
                <IconButton
                  color="error"
                  onClick={() => handleRemoveField(index)}
                  sx={{ mt: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}
          </Box>
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleSave}
          disabled={!name || fields.length === 0}
        >
          Save
        </Button>
      </DialogActions>
    </Dialog>
  )
}
