import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import type { Card as CardType } from '../../types';

interface CardListItemProps {
  card: CardType;
  onClick: () => void;
}

const hardnessConfig = {
  easy: { color: 'success' as const, borderColor: '#4caf50' },
  medium: { color: 'warning' as const, borderColor: '#ff9800' },
  hard: { color: 'error' as const, borderColor: '#f44336' },
};

export default function CardListItem({ card, onClick }: CardListItemProps) {
  const { color, borderColor } = hardnessConfig[card.hardness_level];

  return (
    <Card
      elevation={1}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.2s ease-in-out',
        borderTop: `4px solid ${borderColor}`,
        '&:hover': {
          elevation: 8,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardActionArea onClick={onClick} sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'stretch', justifyContent: 'flex-start' }}>
        <CardContent sx={{ flexGrow: 1, pb: 2 }}>
          {/* Header: Hardness & Pages */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
            <Chip
              label={card.hardness_level}
              size="small"
              color={color}
              variant="outlined"
              sx={{ height: 20, fontSize: '0.7rem', textTransform: 'capitalize' }}
            />
            {card.source_page != null && (
              <Typography variant="caption" color="text.secondary" sx={{ bgcolor: 'action.hover', px: 0.5, borderRadius: 1 }}>
                p. {card.source_page}
              </Typography>
            )}
          </Box>

          {/* Main Content */}
          <Box sx={{ mb: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'baseline', flexWrap: 'wrap', gap: 1 }}>
              <Typography variant="h5" fontWeight={700} color="text.primary" sx={{ lineHeight: 1.2 }}>
                {card.front}
              </Typography>
              {card.pronunciation && (
                <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', opacity: 0.8 }}>
                  /{card.pronunciation}/
                </Typography>
              )}
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              {card.part_of_speech && (
                <Chip
                  label={card.part_of_speech}
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
              <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }} noWrap>
                {card.back}
              </Typography>
            </Box>
          </Box>

          {(card.tags && card.tags.length > 0) && (
            <>
              <Divider sx={{ my: 1, opacity: 0.6 }} />
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {card.tags.slice(0, 3).map((tag) => (
                  <Chip key={tag} label={tag} size="small" variant="outlined" sx={{ height: 20, fontSize: '0.7rem' }} />
                ))}
                {card.tags.length > 3 && (
                  <Typography variant="caption" color="text.secondary">+{card.tags.length - 3}</Typography>
                )}
              </Box>
            </>
          )}

        </CardContent>
      </CardActionArea>
    </Card>
  );
}
