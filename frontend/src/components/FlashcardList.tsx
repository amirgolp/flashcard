import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Grid } from "@mui/material";
import Flashcard from "./Flashcard";
import { useNavigate } from "react-router-dom";

interface FlashcardType {
  _id: string;
  front: string;
  back: string;
  decks: string[];
}

const FlashcardList: React.FC = () => {
  const [flashcards, setFlashcards] = useState<FlashcardType[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFlashcards();
  }, []);

  const fetchFlashcards = async () => {
    try {
      const response = await fetch("/v1/flashcards/");
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

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this flashcard?")) return;

    try {
      const response = await fetch(`/v1/flashcards/${id}`, {
        method: "DELETE",
      });

      if (response.status === 204) {
        alert("Flashcard deleted successfully");
        setFlashcards((prev) => prev.filter((card) => card._id !== id));
      } else {
        const errorData = await response.json();
        alert(`Error deleting flashcard: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting flashcard:", error);
      alert("An error occurred while deleting the flashcard");
    }
  };

  const handleUpdate = (id: string, updatedFlashcard: FlashcardType) => {
    setFlashcards((prev) =>
      prev.map((card) => (card._id === id ? updatedFlashcard : card))
    );
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Flashcards
      </Typography>
      <Button variant="contained" color="primary" onClick={() => navigate("/flashcards/create")}>
        Create Flashcard
      </Button>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        {flashcards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card._id}>
            <Flashcard flashcard={card} onDelete={handleDelete} onUpdate={handleUpdate} />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default FlashcardList;