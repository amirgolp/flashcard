import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Box, Typography, IconButton, Paper } from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'
import DeleteIcon from '@mui/icons-material/Delete'
import type { EditorField } from './TemplateVisualEditor'

interface SortableFieldItemProps {
  field: EditorField
  isActive: boolean
  onClick: () => void
  onDelete: () => void
}

export default function SortableFieldItem({
  field,
  isActive,
  onClick,
  onDelete,
}: SortableFieldItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field.id, data: { type: 'field', field } })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={isActive ? 4 : 1}
      onClick={onClick}
      sx={{
        p: 1.5,
        mb: 1.5,
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        cursor: 'pointer',
        border: isActive ? '2px solid' : '1px solid',
        borderColor: isActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: 'background.paper',
        '&:hover': {
          borderColor: isActive ? 'primary.main' : 'text.disabled',
        },
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        sx={{
          cursor: 'grab',
          display: 'flex',
          alignItems: 'center',
          color: 'text.secondary',
        }}
      >
        <DragIndicatorIcon fontSize="small" />
      </Box>
      <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
          {field.label || field.name || 'Unnamed Field'}
        </Typography>
        <Typography
          variant="caption"
          color="text.secondary"
          noWrap
          display="block"
        >
          {field.type} {field.required ? '• Required' : ''}
        </Typography>
      </Box>
      <IconButton
        size="small"
        color="error"
        onClick={(e) => {
          e.stopPropagation()
          onDelete()
        }}
      >
        <DeleteIcon fontSize="small" />
      </IconButton>
    </Paper>
  )
}
