import Grid from '@mui/material/Grid2';
import CardListItem from './CardListItem';
import type { Card } from '../../types';

interface CardGridProps {
  cards: Card[];
  onCardClick: (id: string) => void;
}

export default function CardGrid({ cards, onCardClick }: CardGridProps) {
  return (
    <Grid container spacing={3}>
      {cards.map((card) => (
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3, xl: 2.4 }} key={card.id}>
          <CardListItem card={card} onClick={() => onCardClick(card.id)} />
        </Grid>
      ))}
    </Grid>
  );
}
