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

const statusConfig: Record<DraftCardStatus, { label: string; color: 'default' | 'success' | 'error' }> = {
  pending: { label: 'Pending', color: 'default' },
  approved: { label: 'Approved', color: 'success' },
  rejected: { label: 'Rejected', color: 'error' },
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
  const { label, color } = statusConfig[draft.status];

  return (
    <Card
      variant="outlined"
      sx={{
        opacity: draft.status === 'rejected' ? 0.6 : 1,
        borderColor: selected ? 'primary.main' : undefined,
        borderWidth: selected ? 2 : 1,
        transition: 'border-color 0.2s, opacity 0.2s',
      }}
    >
      <CardContent sx={{ pb: 1 }}>
        {/* Header row: checkbox, status chip */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Checkbox
              checked={selected}
              onChange={onToggle}
              disabled={!isPending}
              size="small"
              sx={{ p: 0 }}
            />
            <Chip label={label} color={color} size="small" variant="outlined" />
            {draft.part_of_speech && (
              <Chip label={draft.part_of_speech} size="small" variant="filled" color="info" />
            )}
          </Box>
          {draft.source_page_start != null && (
            <Typography variant="caption" color="text.secondary">
              p. {draft.source_page_start}
              {draft.source_page_end != null && draft.source_page_end !== draft.source_page_start
                ? `\u2013${draft.source_page_end}`
                : ''}
            </Typography>
          )}
        </Box>

        {/* Front / Back */}
        <Typography variant="subtitle1" fontWeight={600} gutterBottom>
          {draft.front}
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          {draft.back}
        </Typography>

        {/* Examples */}
        {draft.examples && draft.examples.length > 0 && (
          <Box sx={{ mt: 1 }}>
            {draft.examples.map((ex, i) => (
              <Box key={i} sx={{ mb: 0.5 }}>
                <Typography variant="caption" sx={{ fontStyle: 'italic', display: 'block' }}>
                  {ex.sentence}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                  {ex.translation}
                </Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Linguistic info row */}
        {(draft.gender || draft.plural_form || draft.pronunciation) && (
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            {draft.gender && (
              <Typography variant="caption" color="text.secondary">
                Gender: {draft.gender}
              </Typography>
            )}
            {draft.plural_form && (
              <Typography variant="caption" color="text.secondary">
                Plural: {draft.plural_form}
              </Typography>
            )}
            {draft.pronunciation && (
              <Typography variant="caption" color="text.secondary">
                [{draft.pronunciation}]
              </Typography>
            )}
          </Box>
        )}

        {/* Synonyms / Antonyms */}
        {((draft.synonyms && draft.synonyms.length > 0) || (draft.antonyms && draft.antonyms.length > 0)) && (
          <Box sx={{ display: 'flex', gap: 2, mt: 1, flexWrap: 'wrap' }}>
            {draft.synonyms && draft.synonyms.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Syn: {draft.synonyms.join(', ')}
              </Typography>
            )}
            {draft.antonyms && draft.antonyms.length > 0 && (
              <Typography variant="caption" color="text.secondary">
                Ant: {draft.antonyms.join(', ')}
              </Typography>
            )}
          </Box>
        )}

        {/* Tags */}
        {draft.tags && draft.tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1 }}>
            {draft.tags.map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        )}

        {/* Notes */}
        {draft.notes && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block', fontStyle: 'italic' }}>
            {draft.notes}
          </Typography>
        )}
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'flex-end', px: 2, py: 0.5 }}>
        <Tooltip title="Edit">
          <span>
            <IconButton size="small" onClick={onEdit} disabled={!isPending}>
              <EditIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Approve">
          <span>
            <IconButton size="small" color="success" onClick={() => onApprove()} disabled={!isPending}>
              <CheckCircleIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Reject">
          <span>
            <IconButton size="small" color="error" onClick={onReject} disabled={!isPending}>
              <CancelIcon fontSize="small" />
            </IconButton>
          </span>
        </Tooltip>
      </CardActions>
    </Card>
  );
}
