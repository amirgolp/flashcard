import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActionArea from '@mui/material/CardActionArea';
import Typography from '@mui/material/Typography';
import Chip from '@mui/material/Chip';
import Box from '@mui/material/Box';
import type { Deck } from '../../types';

interface DeckListItemProps {
  deck: Deck;
  onClick: () => void;
}

export default function DeckListItem({ deck, onClick }: DeckListItemProps) {
  return (
    <Card>
      <CardActionArea onClick={onClick}>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="h6" noWrap>{deck.name}</Typography>
            <Chip label={`${deck.cards.length} cards`} size="small" color="primary" variant="outlined" />
          </Box>
          {deck.description && (
            <Typography variant="body2" color="text.secondary" sx={{ overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
              {deck.description}
            </Typography>
          )}
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
