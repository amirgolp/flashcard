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
} from '@mui/material'
import type {
  TemplateUpdate,
  TemplateResponse,
  TemplateFieldSchema,
} from '../../types'
import { createTemplate, updateTemplate } from '../../api/templates'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import TemplateVisualEditor, { EditorField } from './TemplateVisualEditor'

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
  const [fields, setFields] = useState<EditorField[]>([])

  useEffect(() => {
    if (template) {
      setName(template.name)
      setDescription(template.description || '')
      setSystemPrompt(template.system_prompt || '')
      setFields(
        template.fields.map((f, i) => ({
          ...f,
          id: `field-${i}-${Date.now()}`, // Attach temporary ID for dnd-kit
        })),
      )
    } else {
      setName('')
      setDescription('')
      setSystemPrompt('')
      setFields([
        {
          ...emptyField,
          name: 'front',
          label: 'Front',
          id: `field-front-${Date.now()}`,
        },
        {
          ...emptyField,
          name: 'back',
          label: 'Back',
          show_on_front: false,
          id: `field-back-${Date.now()}`,
        },
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

  const handleSave = () => {
    const data = {
      name,
      description,
      system_prompt: systemPrompt,
      fields: fields.map((f) => {
        // Strip out the local 'id' required by the editor before saving
        const { id: _, ...rest } = f
        return {
          ...rest,
          // sanitize name
          name: rest.name.toLowerCase().replace(/\s+/g, '_'),
        }
      }),
    }

    if (template) {
      updateMutation.mutate({ id: template.id, update: data })
    } else {
      createMutation.mutate(data)
    }
  }

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xl" fullWidth>
      <DialogTitle sx={{ pt: 3, px: 4, pb: 1 }}>
        <Typography variant="h5" color="text.primary">{template ? 'Edit Template' : 'Create New Template'}</Typography>
      </DialogTitle>
      <DialogContent sx={{ px: 4, pb: 4, pt: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Template Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              sx={{ width: '30%' }}
              required
            />
            <TextField
              label="Description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              sx={{ width: '70%' }}
            />
          </Box>
          <TextField
            label="AI System Prompt Instructions"
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            fullWidth
            multiline
            rows={2}
            helperText="Instructions to guide Gemini on how to extract and populate these fields."
          />

          <Box mt={2}>
            <TemplateVisualEditor fields={fields} onChange={setFields} />
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
