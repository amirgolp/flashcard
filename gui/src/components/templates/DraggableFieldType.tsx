import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Box, Typography } from '@mui/material'
import DragIndicatorIcon from '@mui/icons-material/DragIndicator'

export interface FieldTypeTemplate {
  type: string
  label: string
  description: string
}

interface DraggableFieldTypeProps {
  template: FieldTypeTemplate
}

export default function DraggableFieldType({
  template,
}: DraggableFieldTypeProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: `new-${template.type}`,
      data: {
        type: 'new-field',
        template,
      },
    })

  // We don't want to translate the original item much, just a hint maybe,
  // because we'll use a DragOverlay for the actual dragged clone.
  // Actually, we can just let it sit there, or add a slight transform.
  const style = {
    // We only apply transform if not using a DragOverlay, but since we will,
    // we can just use opacity to indicate it's being dragged.
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  }

  return (
    <Box
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        p: 2,
        mb: 2,
        border: '1px dashed #bdbdbd',
        borderRadius: 1,
        bgcolor: '#fafafa',
        '&:hover': {
          bgcolor: '#f0f0f0',
          borderColor: '#9e9e9e',
        },
      }}
    >
      <DragIndicatorIcon color="action" />
      <Box>
        <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
          {template.label}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {template.description}
        </Typography>
      </Box>
    </Box>
  )
}
