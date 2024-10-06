import React from 'react';
import { Card, CardContent, CardActions, Typography, Button, TextField, FormControlLabel, Switch } from '@mui/material';
import { Flashcard as FlashcardType } from '../types/types';

interface FlashcardProps {
  card: FlashcardType;
  isEditing?: boolean;
  onSave?: (card: FlashcardType) => void;
  onDelete?: (id: string) => void;
}

export function Flashcard({ card, isEditing, onSave, onDelete }: FlashcardProps) {
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [editedCard, setEditedCard] = React.useState(card);

  if (isEditing) {
    return (
      <Card>
        <CardContent>
          <TextField
            fullWidth
            label="German Word"
            value={editedCard.germanWord}
            onChange={(e) =>
              setEditedCard({ ...editedCard, germanWord: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="English Translation"
            value={editedCard.englishTranslation}
            onChange={(e) =>
              setEditedCard({
                ...editedCard,
                englishTranslation: e.target.value,
              })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Example Usage"
            value={editedCard.exampleUsage || ''}
            onChange={(e) =>
              setEditedCard({ ...editedCard, exampleUsage: e.target.value })
            }
            margin="normal"
          />
          <TextField
            fullWidth
            label="Note"
            value={editedCard.note || ''}
            onChange={(e) =>
              setEditedCard({ ...editedCard, note: e.target.value })
            }
            margin="normal"
          />
          <FormControlLabel
            control={
              <Switch
                checked={editedCard.studied}
                onChange={(e) =>
                  setEditedCard({ ...editedCard, studied: e.target.checked })
                }
              />
            }
            label="Studied"
          />
        </CardContent>
        <CardActions>
          <Button onClick={() => onSave?.(editedCard)}>Save</Button>
          <Button onClick={() => onDelete?.(card.id)}>Delete</Button>
        </CardActions>
      </Card>
    );
  }

  return (
    <Card
      sx={{ cursor: 'pointer', minHeight: 200 }}
      onClick={() => setIsFlipped(!isFlipped)}
      data-testid="flashcard"
    >
      <CardContent>
        <Typography variant="h5" component="div">
          {isFlipped ? card.englishTranslation : card.germanWord}
        </Typography>
        {isFlipped && card.exampleUsage && (
          <Typography color="text.secondary">{card.exampleUsage}</Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default Flashcard