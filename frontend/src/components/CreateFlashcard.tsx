import React, { useState, useEffect } from "react";
import { Box, TextField, Button, Typography, Autocomplete } from "@mui/material";

interface Deck {
  _id: string;
  title: string;
}

const CreateFlashcard: React.FC = () => {
  const [front, setFront] = useState<string>("");
  const [back, setBack] = useState<string>("");
  const [selectedDecks, setSelectedDecks] = useState<string[]>([]);
  const [decks, setDecks] = useState<Deck[]>([]);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    try {
      const response = await fetch("/v1/decks/");
      if (response.ok) {
        const data: Deck[] = await response.json();
        setDecks(data);
      } else {
        const errorData = await response.json();
        alert(`Error fetching decks: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error fetching decks:", error);
      alert("An error occurred while fetching decks");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      alert("Front and Back content are required");
      return;
    }

    try {
      const response = await fetch("/v1/flashcards/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          front,
          back,
          decks: selectedDecks,
        }),
      });

      if (response.ok) {
        alert("Flashcard created successfully");
        setFront("");
        setBack("");
        setSelectedDecks([]);
        // Optionally, redirect or update flashcard list
      } else {
        const errorData = await response.json();
        alert(`Error creating flashcard: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error creating flashcard:", error);
      alert("An error occurred while creating the flashcard");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Create a New Flashcard
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Front"
          variant="outlined"
          fullWidth
          required
          value={front}
          onChange={(e) => setFront(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Back"
          variant="outlined"
          fullWidth
          required
          value={back}
          onChange={(e) => setBack(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Autocomplete
          multiple
          options={decks.map((deck) => deck.title)}
          getOptionLabel={(option) => option}
          value={selectedDecks}
          onChange={(_, newValue) => {
            setSelectedDecks(newValue);
          }}
          renderInput={(params) => <TextField {...params} label="Select Decks" placeholder="Decks" />}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" color="primary">
          Create Flashcard
        </Button>
      </form>
    </Box>
  );
};

export default CreateFlashcard;