import { useState } from 'react'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import Chip from '@mui/material/Chip'
import Divider from '@mui/material/Divider'
import { alpha, useTheme } from '@mui/material/styles'
import type { ExampleSentence, HardnessLevel } from '../../types'

interface CardPreviewProps {
  front: string
  back: string
  partOfSpeech?: string
  gender?: string
  pronunciation?: string
  examples: ExampleSentence[]
  tags: string[]
  hardness: HardnessLevel
}

const HARDNESS_COLOR: Record<HardnessLevel, 'success' | 'warning' | 'error'> = {
  easy: 'success',
  medium: 'warning',
  hard: 'error',
}

interface FaceProps {
  flipped?: boolean
  children: React.ReactNode
  accent: string
}

function Face({ flipped, children, accent }: FaceProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        position: 'absolute',
        inset: 0,
        backfaceVisibility: 'hidden',
        transform: flipped ? 'rotateY(180deg)' : undefined,
        display: 'flex',
        flexDirection: 'column',
        p: 3,
        borderRadius: 4,
        border: '1px solid',
        borderColor: 'divider',
        background: `linear-gradient(145deg, ${alpha(accent, 0.08)} 0%, transparent 45%)`,
        bgcolor: 'background.paper',
      }}
    >
      {children}
    </Paper>
  )
}

export default function CardPreview({
  front,
  back,
  partOfSpeech,
  gender,
  pronunciation,
  examples,
  tags,
  hardness,
}: CardPreviewProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const theme = useTheme()
  const example = examples.find((ex) => ex.sentence.trim())

  return (
    <Box>
      <Box
        onClick={() => setIsFlipped(!isFlipped)}
        sx={{ perspective: '1200px', cursor: 'pointer', height: 340 }}
      >
        <Box
          sx={{
            position: 'relative',
            width: '100%',
            height: '100%',
            transformStyle: 'preserve-3d',
            transition: 'transform 0.5s cubic-bezier(0.4, 0.2, 0.2, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          <Face accent={theme.palette.primary.main}>
            <Box display="flex" justifyContent="space-between" alignItems="center">
              <Typography variant="overline" color="text.secondary">
                Front
              </Typography>
              <Chip
                label={hardness}
                color={HARDNESS_COLOR[hardness]}
                size="small"
                variant="outlined"
                sx={{ textTransform: 'capitalize' }}
              />
            </Box>
            <Box
              flexGrow={1}
              display="flex"
              flexDirection="column"
              alignItems="center"
              justifyContent="center"
              textAlign="center"
              gap={1}
            >
              <Typography
                variant="h4"
                sx={{ wordBreak: 'break-word', color: front ? 'text.primary' : 'text.disabled' }}
              >
                {front || 'Front side'}
              </Typography>
              {pronunciation && (
                <Typography variant="body2" color="text.secondary">
                  {pronunciation}
                </Typography>
              )}
            </Box>
            <Box display="flex" gap={1} justifyContent="center" minHeight={24}>
              {partOfSpeech && <Chip label={partOfSpeech} size="small" />}
              {gender && <Chip label={gender} size="small" variant="outlined" />}
            </Box>
          </Face>

          <Face flipped accent={theme.palette.secondary.main}>
            <Typography variant="overline" color="text.secondary">
              Back
            </Typography>
            <Box
              flexGrow={1}
              display="flex"
              flexDirection="column"
              justifyContent="center"
              textAlign="center"
              gap={2}
            >
              <Typography
                variant="h5"
                sx={{ wordBreak: 'break-word', color: back ? 'text.primary' : 'text.disabled' }}
              >
                {back || 'Back side'}
              </Typography>
              {example && (
                <>
                  <Divider flexItem sx={{ mx: 4 }} />
                  <Box>
                    <Typography variant="body2" fontStyle="italic">
                      {example.sentence}
                    </Typography>
                    {example.translation && (
                      <Typography variant="body2" color="text.secondary">
                        {example.translation}
                      </Typography>
                    )}
                  </Box>
                </>
              )}
            </Box>
            <Box
              display="flex"
              gap={0.5}
              justifyContent="center"
              flexWrap="wrap"
              minHeight={24}
            >
              {tags.slice(0, 4).map((tag) => (
                <Chip key={tag} label={tag} size="small" variant="outlined" />
              ))}
            </Box>
          </Face>
        </Box>
      </Box>
      <Typography
        variant="caption"
        color="text.secondary"
        display="block"
        textAlign="center"
        mt={1.5}
      >
        Click the card to flip it
      </Typography>
    </Box>
  )
}
