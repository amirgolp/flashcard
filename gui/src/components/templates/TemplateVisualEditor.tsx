import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core'
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import {
  Box,
  Typography,
  Divider,
  Tabs,
  Tab,
  TextField,
  Switch,
  FormControlLabel,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material'

import type { TemplateFieldSchema } from '../../types'
import FlipCardCanvas from './FlipCardCanvas'
import DraggableFieldType, { FieldTypeTemplate } from './DraggableFieldType'
import SortableFieldItem from './SortableFieldItem'

export type EditorField = TemplateFieldSchema & { id: string }

export interface TemplateVisualEditorProps {
  fields: EditorField[]
  onChange: (fields: EditorField[]) => void
}

const FIELD_TYPES: FieldTypeTemplate[] = [
  { type: 'text', label: 'Short Text', description: 'A single line of text.' },
  {
    type: 'textarea',
    label: 'Long Text',
    description: 'Multiple lines of text.',
  },
  { type: 'list', label: 'List of Strings', description: 'A bulleted list.' },
]

export default function TemplateVisualEditor({
  fields,
  onChange,
}: TemplateVisualEditorProps) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const [activeFieldId, setActiveFieldId] = useState<string | null>(null)
  const [isFlipped, setIsFlipped] = useState(false)
  const [tabIndex, setTabIndex] = useState(0) // 0 for Toolbox, 1 for Properties

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const frontFields = fields.filter((f) => f.show_on_front)
  const backFields = fields.filter((f) => !f.show_on_front)
  const activeFieldData = fields.find((f) => f.id === activeFieldId)

  // Handlers
  const handleFieldClick = (id: string) => {
    setActiveFieldId(id)
    setTabIndex(1) // Switch to Properties tab
  }

  const handleFieldDelete = (id: string) => {
    onChange(fields.filter((f) => f.id !== id))
    if (activeFieldId === id) {
      setActiveFieldId(null)
      setTabIndex(0)
    }
  }

  const handlePropertyChange = <K extends keyof TemplateFieldSchema>(key: K, value: TemplateFieldSchema[K]) => {
    if (!activeFieldId) return
    onChange(
      fields.map((f) => {
        if (f.id === activeFieldId) {
          return { ...f, [key]: value }
        }
        return f
      }),
    )
  }

  // DND Handlers
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event
    if (!over) return

    const activeContainer = active.data.current?.sortable?.containerId
    const overContainer = over.data.current?.sortable?.containerId || over.id

    // Only handling moves between front and back here
    if (
      active.data.current?.type === 'field' &&
      activeContainer &&
      overContainer &&
      activeContainer !== overContainer &&
      (overContainer === 'front-container' ||
        overContainer === 'back-container')
    ) {
      // Find the dragged item and change its show_on_front property
      const fieldId = active.id as string
      onChange(
        fields.map((f) => {
          if (f.id === fieldId) {
            return {
              ...f,
              show_on_front: overContainer === 'front-container',
            }
          }
          return f
        }),
      )
    }
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null)
    const { active, over } = event
    if (!over) return

    // 1. Handling dropping a NEW field from toolbox
    if (active.data.current?.type === 'new-field') {
      const template = active.data.current.template as FieldTypeTemplate
      const containerId = over.data.current?.sortable?.containerId || over.id

      const isFront =
        containerId === 'front-container' ||
        (over.data.current?.type === 'field' &&
          over.data.current.field.show_on_front) ||
        (!isFlipped && containerId !== 'back-container') // Fallback

      const newField: EditorField = {
        id: `field-${Date.now()}`,
        name: `new_${template.type}_${Math.floor(Math.random() * 1000)}`,
        label: `New ${template.label}`,
        type: template.type,
        description: '',
        show_on_front: isFront,
        required: false,
      }

      // We just append it for now. A more complex implementation would insert it at the specific index.
      onChange([...fields, newField])
      return
    }

    // 2. Handling reordering within the same container
    if (active.data.current?.type === 'field') {
      const activeContainer = active.data.current?.sortable?.containerId
      const overContainer = over.data.current?.sortable?.containerId || over.id

      // If dropped directly into empty container, changing side already handled in onDragOver
      if (
        activeContainer === overContainer &&
        over.data.current?.type === 'field'
      ) {
        const oldIndex = fields.findIndex((f) => f.id === active.id)
        const newIndex = fields.findIndex((f) => f.id === over.id)

        if (oldIndex !== newIndex) {
          onChange(arrayMove(fields, oldIndex, newIndex))
        }
      } else if (
        over.id === 'front-container' ||
        over.id === 'back-container'
      ) {
        // Dropped on empty container
        const fieldId = active.id as string
        onChange(
          fields.map((f) => {
            if (f.id === fieldId) {
              return {
                ...f,
                show_on_front: over.id === 'front-container',
              }
            }
            return f
          }),
        )
      }
    }
  }

  // Active item for overlay rendering
  const isDraggingNew = activeId?.toString().startsWith('new-')
  const dragOverlayItem = isDraggingNew
    ? FIELD_TYPES.find((t) => `new-${t.type}` === activeId)
    : fields.find((f) => f.id === activeId)

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <Box
        sx={{
          display: 'flex',
          height: '600px',
          border: '1px solid #e0e0e0',
          borderRadius: 2,
          overflow: 'hidden',
        }}
      >
        {/* Playfield Area */}
        <Box sx={{ flexGrow: 1, bgcolor: '#eef2f6', overflow: 'hidden' }}>
          <FlipCardCanvas
            isFlipped={isFlipped}
            onFlip={() => setIsFlipped(!isFlipped)}
            frontFields={frontFields}
            backFields={backFields}
            activeFieldId={activeFieldId}
            onFieldClick={handleFieldClick}
            onFieldDelete={handleFieldDelete}
          />
        </Box>

        <Divider orientation="vertical" />

        {/* Sidebar / Properties Panel */}
        <Box
          sx={{
            width: 350,
            display: 'flex',
            flexDirection: 'column',
            bgcolor: 'background.paper',
          }}
        >
          <Tabs
            value={tabIndex}
            onChange={(_, val) => setTabIndex(val)}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Toolbox" />
            <Tab label="Properties" disabled={!activeFieldId} />
          </Tabs>

          <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
            {tabIndex === 0 && (
              <Box>
                <Typography variant="subtitle2" color="text.secondary" mb={2}>
                  Drag fields onto the card
                </Typography>
                {FIELD_TYPES.map((ft) => (
                  <DraggableFieldType key={ft.type} template={ft} />
                ))}
              </Box>
            )}

            {tabIndex === 1 && activeFieldData && (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Editing Field
                </Typography>

                <TextField
                  label="Field Key (Internal Name)"
                  value={activeFieldData.name}
                  onChange={(e) => handlePropertyChange('name', e.target.value)}
                  size="small"
                  fullWidth
                  required
                  helperText="Lowercase, no spaces (e.g. 'translation')"
                />
                <TextField
                  label="Display Label"
                  value={activeFieldData.label}
                  onChange={(e) =>
                    handlePropertyChange('label', e.target.value)
                  }
                  size="small"
                  fullWidth
                  required
                />

                <FormControl size="small" fullWidth>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={activeFieldData.type}
                    label="Type"
                    onChange={(e) =>
                      handlePropertyChange('type', e.target.value)
                    }
                  >
                    <MenuItem value="text">Short Text</MenuItem>
                    <MenuItem value="textarea">Long Text</MenuItem>
                    <MenuItem value="list">List of Strings</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  label="Description for AI prompt"
                  value={activeFieldData.description}
                  onChange={(e) =>
                    handlePropertyChange('description', e.target.value)
                  }
                  size="small"
                  fullWidth
                  multiline
                  rows={2}
                />

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={activeFieldData.show_on_front}
                        onChange={(e) =>
                          handlePropertyChange(
                            'show_on_front',
                            e.target.checked,
                          )
                        }
                      />
                    }
                    label="Show on Front Side"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={activeFieldData.required}
                        onChange={(e) =>
                          handlePropertyChange('required', e.target.checked)
                        }
                      />
                    }
                    label="Required Field"
                  />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      </Box>

      {/* Drag Overlay for smooth animations */}
      <DragOverlay>
        {dragOverlayItem ? (
          isDraggingNew ? (
            <Box
              sx={{
                p: 2,
                border: '1px solid #1976d2',
                borderRadius: 1,
                bgcolor: 'background.paper',
                opacity: 0.9,
              }}
            >
              <Typography variant="subtitle2">
                {(dragOverlayItem as FieldTypeTemplate).label}
              </Typography>
            </Box>
          ) : (
            <SortableFieldItem
              field={dragOverlayItem as EditorField}
              isActive={false}
              onClick={() => { }}
              onDelete={() => { }}
            />
          )
        ) : null}
      </DragOverlay>
    </DndContext>
  )
}
