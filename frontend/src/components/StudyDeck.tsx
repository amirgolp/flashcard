import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Box, Typography, Button, Card, CardContent } from "@mui/material";

interface FlashcardType {
  _id: string;
  front: string;
  back: string;
  decks: string[];
}

const StudyDeck: React.FC = () => {
  const { deckId } = useParams<{ deckId: string }>();
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [showBack, setShowBack] = useState<boolean>(false);

  useEffect(() => {
    fetchFlashcards();
  }, [deckId]);

  const fetchFlashcards = async () => {
    try {
      const response = await fetch(`/v1/flashcards/?deck=${deckId}`);
      if (response.ok) {
        const data: FlashcardType[] = await response.json();
        setFlashcards(data);
      } else {
        const errorData = await response.json();
        alert(`Error fetching flashcards: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error fetching flashcards:", error);
      alert("An error occurred while fetching flashcards");
    }
  };

  const handleNext = () => {
    setShowBack(false);
    setCurrentIndex((prev) => (prev + 1) % flashcards.length);
  };

  const handlePrevious = () => {
    setShowBack(false);
    setCurrentIndex((prev) => (prev - 1 + flashcards.length) % flashcards.length);
  };

  if (flashcards.length === 0) {
    return (
      <Box sx={{ p: 2 }}>
        <Typography variant="h5">No flashcards found in this deck.</Typography>
      </Box>
    );
  }

  const currentFlashcard = flashcards[currentIndex];

  return (
    <Box sx={{ p: 2, textAlign: "center" }}>
      <Typography variant="h4" gutterBottom>
        Study Deck
      </Typography>
      <Card sx={{ maxWidth: 600, margin: "0 auto", p: 2 }}>
        <CardContent>
          <Typography variant="h5">
            {showBack ? `Back: ${currentFlashcard.back}` : `Front: ${currentFlashcard.front}`}
          </Typography>
        </CardContent>
      </Card>
      <Button variant="outlined" onClick={() => setShowBack((prev) => !prev)} sx={{ mt: 2 }}>
        {showBack ? "Show Front" : "Show Back"}
      </Button>
      <Box sx={{ mt: 2 }}>
        <Button variant="contained" onClick={handlePrevious} sx={{ mr: 1 }}>
          Previous
        </Button>
        <Button variant="contained" onClick={handleNext}>
          Next
        </Button>
      </Box>
    </Box>
  );
};

export default StudyDeck;