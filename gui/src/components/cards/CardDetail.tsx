import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import type { Card } from '../../types';

const hardnessColors = { easy: 'success', medium: 'warning', hard: 'error' } as const;

export default function CardDetail({ card }: { card: Card }) {
  return (
    <Paper sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Box>
          <Typography variant="h4">{card.front}</Typography>
          <Typography variant="h5" color="text.secondary">{card.back}</Typography>
        </Box>
        <Chip label={card.hardness_level} color={hardnessColors[card.hardness_level]} />
      </Box>

      {(card.part_of_speech || card.gender || card.plural_form || card.pronunciation) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Grammar</Typography>
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {card.part_of_speech && <Box><Typography variant="caption" color="text.secondary">Part of Speech</Typography><Typography>{card.part_of_speech}</Typography></Box>}
            {card.gender && <Box><Typography variant="caption" color="text.secondary">Gender</Typography><Typography>{card.gender}</Typography></Box>}
            {card.plural_form && <Box><Typography variant="caption" color="text.secondary">Plural</Typography><Typography>{card.plural_form}</Typography></Box>}
            {card.pronunciation && <Box><Typography variant="caption" color="text.secondary">Pronunciation</Typography><Typography>{card.pronunciation}</Typography></Box>}
          </Box>
        </>
      )}

      {(card.examples?.length ?? 0) > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Examples</Typography>
          {card.examples!.map((ex, i) => (
            <Box key={i} sx={{ mb: 1, pl: 2, borderLeft: 2, borderColor: 'primary.main' }}>
              <Typography>{ex.sentence}</Typography>
              <Typography variant="body2" color="text.secondary">{ex.translation}</Typography>
            </Box>
          ))}
        </>
      )}

      {((card.synonyms?.length ?? 0) > 0 || (card.antonyms?.length ?? 0) > 0) && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Related Words</Typography>
          {(card.synonyms?.length ?? 0) > 0 && (
            <Box sx={{ mb: 1 }}>
              <Typography variant="caption" color="text.secondary">Synonyms</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>{card.synonyms!.map((s) => <Chip key={s} label={s} size="small" variant="outlined" />)}</Box>
            </Box>
          )}
          {(card.antonyms?.length ?? 0) > 0 && (
            <Box>
              <Typography variant="caption" color="text.secondary">Antonyms</Typography>
              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5 }}>{card.antonyms!.map((a) => <Chip key={a} label={a} size="small" variant="outlined" />)}</Box>
            </Box>
          )}
        </>
      )}

      {(card.tags?.length ?? 0) > 0 && (
        <>
          <Divider sx={{ my: 2 }} />
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {card.tags!.map((tag) => <Chip key={tag} label={tag} size="small" />)}
          </Box>
        </>
      )}

      {card.notes && (
        <>
          <Divider sx={{ my: 2 }} />
          <Typography variant="h6" gutterBottom>Notes</Typography>
          <Typography>{card.notes}</Typography>
        </>
      )}

      <Divider sx={{ my: 2 }} />
      <Typography variant="caption" color="text.secondary">
        Created: {new Date(card.date_created).toLocaleDateString()} | Last edited: {new Date(card.last_edited).toLocaleDateString()}
      </Typography>
    </Paper>
  );
}
