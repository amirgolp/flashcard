import { useState } from 'react';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import VolumeUpIcon from '@mui/icons-material/VolumeUp';
import FlipCameraAndroidIcon from '@mui/icons-material/FlipCameraAndroid';
import Stack from '@mui/material/Stack';
import type { Card } from '../../types';

const hardnessColors = { easy: 'success', medium: 'warning', hard: 'error' } as const;

export default function CardDetail({ card }: { card: Card }) {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleFlip = () => setIsFlipped(!isFlipped);

  return (
    <Box sx={{
      perspective: '1000px',
      height: '600px',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      cursor: 'pointer'
    }} onClick={handleFlip}>
      <Box sx={{
        position: 'relative',
        width: '100%',
        maxWidth: '600px',
        height: '100%',
        transition: 'transform 0.6s',
        transformStyle: 'preserve-3d',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
      }}>
        {/* Front Side */}
        <Paper elevation={4} sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          p: 4,
          borderRadius: 4,
          borderTop: `8px solid`,
          borderColor: (theme) => theme.palette[hardnessColors[card.hardness_level]].main
        }}>
          <Box sx={{ position: 'absolute', top: 16, right: 16 }}>
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); /* Play audio */ }}>
              <VolumeUpIcon />
            </IconButton>
          </Box>

          <Typography variant="h2" component="h1" fontWeight={700} align="center" gutterBottom>
            {card.front}
          </Typography>

          {card.pronunciation && (
            <Typography variant="h5" color="text.secondary" sx={{ fontFamily: 'monospace', opacity: 0.8 }}>
              /{card.pronunciation}/
            </Typography>
          )}

          <Box sx={{ mt: 8, display: 'flex', gap: 1, alignItems: 'center', color: 'text.secondary' }}>
            <FlipCameraAndroidIcon />
            <Typography variant="body2">Click to flip</Typography>
          </Box>
        </Paper>

        {/* Back Side */}
        <Paper elevation={4} sx={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          backfaceVisibility: 'hidden',
          transform: 'rotateY(180deg)',
          p: 4,
          borderRadius: 4,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          borderTop: `8px solid`,
          borderColor: (theme) => theme.palette[hardnessColors[card.hardness_level]].main
        }}>
          <Box sx={{ mb: 3, textAlign: 'center' }}>
            <Typography variant="h4" gutterBottom>{card.back}</Typography>
            {card.part_of_speech && (
              <Chip label={card.part_of_speech} color="primary" variant="outlined" />
            )}
          </Box>

          <Stack spacing={3} sx={{ flex: 1 }}>
            {/* Grammar */}
            {(card.gender || card.plural_form) && (
              <Box sx={{ display: 'flex', gap: 4, justifyContent: 'center', bgcolor: 'action.hover', p: 2, borderRadius: 2 }}>
                {card.gender && (
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary">GENDER</Typography>
                    <Typography variant="body1" fontWeight={500}>{card.gender}</Typography>
                  </Box>
                )}
                {card.plural_form && (
                  <Box textAlign="center">
                    <Typography variant="caption" color="text.secondary">PLURAL</Typography>
                    <Typography variant="body1" fontWeight={500}>{card.plural_form}</Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Examples */}
            {(card.examples?.length ?? 0) > 0 && (
              <Box>
                <Divider sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">EXAMPLES</Typography>
                </Divider>
                <Stack spacing={2}>
                  {card.examples!.map((ex, i) => (
                    <Box key={i} sx={{ pl: 2, borderLeft: '3px solid', borderColor: 'primary.light' }}>
                      <Typography variant="body1">{ex.sentence}</Typography>
                      <Typography variant="body2" color="text.secondary">{ex.translation}</Typography>
                    </Box>
                  ))}
                </Stack>
              </Box>
            )}

            {/* Synonyms/Antonyms */}
            {((card.synonyms?.length ?? 0) > 0 || (card.antonyms?.length ?? 0) > 0) && (
              <Box>
                <Divider sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary">RELATED</Typography>
                </Divider>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', justifyContent: 'center' }}>
                  {card.synonyms?.map(s => <Chip key={s} label={s} size="small" variant="outlined" />)}
                  {card.antonyms?.map(a => <Chip key={a} label={a} size="small" color="error" variant="outlined" />)}
                </Box>
              </Box>
            )}

            {/* Notes */}
            {card.notes && (
              <Box sx={{ mt: 'auto', p: 2, bgcolor: 'warning.light', color: 'warning.contrastText', borderRadius: 2 }}>
                <Typography variant="caption" fontWeight={700} display="block">NOTES</Typography>
                <Typography variant="body2">{card.notes}</Typography>
              </Box>
            )}
          </Stack>
        </Paper>
      </Box>
    </Box>
  );
}
