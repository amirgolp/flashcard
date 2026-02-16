import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Typography from '@mui/material/Typography';
import Checkbox from '@mui/material/Checkbox';
import Chip from '@mui/material/Chip';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import type { DraftCardResponse, DraftCardStatus } from '../../types';

interface DraftReviewCardProps {
  draft: DraftCardResponse;
  selected: boolean;
  onToggle: () => void;
  onApprove: (deckId?: string) => void;
  onReject: () => void;
  onEdit: () => void;
}

const statusConfig: Record<DraftCardStatus, { label: string; color: 'default' | 'success' | 'error'; borderColor: string }> = {
  pending: { label: 'Pending', color: 'default', borderColor: '#2196f3' }, // Blue for pending
  approved: { label: 'Approved', color: 'success', borderColor: '#4caf50' }, // Green for approved
  rejected: { label: 'Rejected', color: 'error', borderColor: '#f44336' },   // Red for rejected
};

export default function DraftReviewCard({
  draft,
  selected,
  onToggle,
  onApprove,
  onReject,
  onEdit,
}: DraftReviewCardProps) {
  const isPending = draft.status === 'pending';
  const { label, color, borderColor } = statusConfig[draft.status];

  return (
    <Card
      elevation={selected ? 4 : 1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        transition: 'all 0.2s ease-in-out',
        borderTop: `4px solid ${borderColor}`,
        opacity: draft.status === 'rejected' ? 0.7 : 1,
        transform: selected ? 'scale(1.02)' : 'none',
        '&:hover': {
          elevation: 8,
          transform: 'translateY(-2px)',
          boxShadow: (theme) => theme.shadows[4],
        },
      }}
    >
      <CardContent sx={{ flexGrow: 1, pb: 1 }}>
        {/* Header: Checkbox, Pages, Status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Checkbox
              checked={selected}
              onChange={onToggle}
              disabled={!isPending}
              size="small"
              sx={{ p: 0.5, ml: -1 }}
            />
            {draft.source_page_start != null && (
              <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'action.hover', px: 0.5, borderRadius: 1 }}>
                p. {draft.source_page_start}
                {draft.source_page_end != null && draft.source_page_end !== draft.source_page_start
                  ? `-${draft.source_page_end}`
                  : ''}
              </Typography>
            )}
          </Box>
          <Chip
            label={label}
            color={color}
            size="small"
            variant={draft.status === 'pending' ? 'outlined' : 'filled'}
            sx={{ height: 20, fontSize: '0.7rem' }}
          />
        </Box>

        {/* Main Content: Word & Translation */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
            <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
              {draft.front}
            </Typography>
            {draft.pronunciation && (
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', opacity: 0.8 }}>
                /{draft.pronunciation}/
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            {draft.part_of_speech && (
              <Chip
                label={draft.part_of_speech}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                  fontWeight: 600
                }}
              />
            )}
            <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {draft.back}
            </Typography>
          </Box>
        </Box>

        <Divider sx={{ my: 1.5, opacity: 0.6 }} />

        {/* Examples Section */}
        {draft.examples && draft.examples.length > 0 && (
          <Box sx={{ mb: 2 }}>
            <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ display: 'block', mb: 0.5, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Examples
            </Typography>
            <Stack spacing={1}>
              {draft.examples.slice(0, 2).map((ex, i) => ( // Show distinct first 2 examples
                <Box key={i} sx={{
                  p: 1,
                  bgcolor: 'action.hover',
                  borderRadius: 1,
                  borderLeft: '2px solid',
                  borderColor: 'primary.light'
                }}>
                  <Typography variant="body2" color="text.primary" sx={{ fontWeight: 500, lineHeight: 1.3 }}>
                    {ex.sentence}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.3 }}>
                    {ex.translation}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Box>
        )}

        {/* Metadata Grid (Gender, Plural, Synonyms) */}
        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, mt: 'auto' }}>
          {draft.gender && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Gender</Typography>
              <Typography variant="body2">{draft.gender}</Typography>
            </Box>
          )}
          {draft.plural_form && (
            <Box>
              <Typography variant="caption" color="text.secondary" display="block">Plural</Typography>
              <Typography variant="body2">{draft.plural_form}</Typography>
            </Box>
          )}
          {draft.synonyms && draft.synonyms.length > 0 && (
            <Box sx={{ gridColumn: '1 / -1' }}>
              <Typography variant="caption" color="text.secondary" display="block">Synonyms</Typography>
              <Typography variant="caption" sx={{ fontStyle: 'italic' }}>
                {draft.synonyms.join(', ')}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      {/* Actions Footer */}
      <CardActions sx={{ p: 1.5, bgcolor: 'background.default', borderTop: '1px solid', borderColor: 'divider', justifyContent: 'space-between' }}>
        <Button
          size="small"
          startIcon={<EditIcon />}
          onClick={onEdit}
          disabled={!isPending}
          sx={{ textTransform: 'none', color: 'text.secondary' }}
        >
          Edit
        </Button>
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            variant="outlined"
            color="error"
            startIcon={<CancelIcon />}
            onClick={onReject}
            disabled={!isPending}
            sx={{ px: 2, minWidth: 'auto' }}
          >
            Reject
          </Button>
          <Button
            size="small"
            variant="contained"
            color="success"
            startIcon={<CheckCircleIcon />}
            onClick={() => onApprove()}
            disabled={!isPending}
            sx={{ px: 2, minWidth: 'auto', boxShadow: 'none' }}
          >
            Approve
          </Button>
        </Stack>
      </CardActions>
    </Card>
  );
}
