import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import type { Card as CardType } from '../../types';

interface CardListItemProps {
  card: CardType;
  onClick: () => void;
}

const hardnessColors = { easy: 'success', medium: 'warning', hard: 'error' } as const;

export default function CardListItem({ card, onClick }: CardListItemProps) {
  return (
    <Card>
      <CardActionArea onClick={onClick} sx={{ height: '100%' }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={600} noWrap>
            {card.front}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap sx={{ mb: 1 }}>
            {card.back}
          </Typography>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', alignItems: 'center' }}>
            <Chip label={card.hardness_level} size="small" color={hardnessColors[card.hardness_level]} />
            {card.part_of_speech && <Chip label={card.part_of_speech} size="small" variant="outlined" />}
            {(card.tags ?? []).slice(0, 2).map((tag) => (
              <Chip key={tag} label={tag} size="small" variant="outlined" />
            ))}
          </Box>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
