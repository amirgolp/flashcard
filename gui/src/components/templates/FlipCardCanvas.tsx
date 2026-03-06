import { Box, Paper, Typography, IconButton } from '@mui/material'
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useDroppable } from '@dnd-kit/core'
import SortableFieldItem from './SortableFieldItem'
import type { EditorField } from './TemplateVisualEditor'

interface FlipCardCanvasProps {
  isFlipped: boolean
  onFlip: () => void
  frontFields: EditorField[]
  backFields: EditorField[]
  activeFieldId: string | null
  onFieldClick: (id: string) => void
  onFieldDelete: (id: string) => void
}

export default function FlipCardCanvas({
  isFlipped,
  onFlip,
  frontFields,
  backFields,
  activeFieldId,
  onFieldClick,
  onFieldDelete,
}: FlipCardCanvasProps) {
  const { setNodeRef: setFrontNodeRef } = useDroppable({
    id: 'front-container',
  })

  const { setNodeRef: setBackNodeRef } = useDroppable({
    id: 'back-container',
  })

  return (
    <Box
      sx={{
        perspective: '1000px',
        width: '100%',
        height: '100%',
        minHeight: 400,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2,
      }}
    >
      <Box
        sx={{
          width: '100%',
          maxWidth: 400,
          height: '100%',
          minHeight: 500,
          position: 'relative',
          transition: 'transform 0.6s',
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}
      >
        {/* Front Side */}
        <Paper
          ref={setFrontNodeRef}
          elevation={3}
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            border: isFlipped ? '1px solid transparent' : '2px solid #1976d2',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 2,
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" color="primary">
              Front Side
            </Typography>
            <IconButton onClick={onFlip} size="small" title="Flip to Back">
              <FlipCameraAndroidIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <SortableContext
              items={frontFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {frontFields.map((field) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  isActive={activeFieldId === field.id}
                  onClick={() => onFieldClick(field.id)}
                  onDelete={() => onFieldDelete(field.id)}
                />
              ))}
              {frontFields.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 4, opacity: 0.7 }}
                >
                  Drag fields here...
                </Typography>
              )}
            </SortableContext>
          </Box>
        </Paper>

        {/* Back Side */}
        <Paper
          ref={setBackNodeRef}
          elevation={3}
          sx={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            p: 3,
            bgcolor: '#f5f5f5',
            borderRadius: 2,
            transform: 'rotateY(180deg)',
            border: isFlipped ? '2px solid #9c27b0' : '1px solid transparent',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              mb: 2,
              alignItems: 'center',
            }}
          >
            <Typography variant="h6" color="secondary">
              Back Side
            </Typography>
            <IconButton onClick={onFlip} size="small" title="Flip to Front">
              <FlipCameraAndroidIcon />
            </IconButton>
          </Box>
          <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
            <SortableContext
              items={backFields.map((f) => f.id)}
              strategy={verticalListSortingStrategy}
            >
              {backFields.map((field) => (
                <SortableFieldItem
                  key={field.id}
                  field={field}
                  isActive={activeFieldId === field.id}
                  onClick={() => onFieldClick(field.id)}
                  onDelete={() => onFieldDelete(field.id)}
                />
              ))}
              {backFields.length === 0 && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  align="center"
                  sx={{ mt: 4, opacity: 0.7 }}
                >
                  Drag fields here...
                </Typography>
              )}
            </SortableContext>
          </Box>
        </Paper>
      </Box>
    </Box>
  )
}
