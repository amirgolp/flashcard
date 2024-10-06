import React, { useState } from "react";
import { Card, CardContent, Typography, CardActions, Button, TextField } from "@mui/material";

interface FlashcardProps {
  flashcard: {
    _id: string;
    front: string;
    back: string;
    decks: string[];
  };
  onDelete: (id: string) => void;
  onUpdate: (id: string, updatedFlashcard: Partial<FlashcardProps["flashcard"]>) => void;
}

const Flashcard: React.FC<FlashcardProps> = ({ flashcard, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [front, setFront] = useState<string>(flashcard.front);
  const [back, setBack] = useState<string>(flashcard.back);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      const response = await fetch(`/v1/flashcards/${flashcard._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ front, back }),
      });

      if (response.ok) {
        const updatedFlashcard = await response.json();
        onUpdate(flashcard._id, updatedFlashcard);
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        alert(`Error updating flashcard: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error updating flashcard:", error);
      alert("An error occurred while updating the flashcard");
    }
  };

  const handleDelete = () => {
    onDelete(flashcard._id);
  };

  const handleCancel = () => {
    setFront(flashcard.front);
    setBack(flashcard.back);
    setIsEditing(false);
  };

  return (
    <Card sx={{ minWidth: 275, mb: 2 }}>
      <CardContent>
        {isEditing ? (
          <>
            <TextField
              label="Front"
              variant="outlined"
              fullWidth
              value={front}
              onChange={(e) => setFront(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              label="Back"
              variant="outlined"
              fullWidth
              value={back}
              onChange={(e) => setBack(e.target.value)}
            />
          </>
        ) : (
          <>
            <Typography variant="h5" component="div">
              Front: {flashcard.front}
            </Typography>
            <Typography sx={{ mb: 1.5 }} color="text.secondary">
              Back: {flashcard.back}
            </Typography>
          </>
        )}
      </CardContent>
      <CardActions>
        {isEditing ? (
          <>
            <Button size="small" onClick={handleSave}>
              Save
            </Button>
            <Button size="small" onClick={handleCancel}>
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button size="small" onClick={handleEdit}>
              Edit
            </Button>
            <Button size="small" color="error" onClick={handleDelete}>
              Delete
            </Button>
          </>
        )}
      </CardActions>
    </Card>
  );
};

export default Flashcard;