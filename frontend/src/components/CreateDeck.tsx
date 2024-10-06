import React, { useState } from "react";
import { Box, TextField, Button, Typography } from "@mui/material";

const CreateDeck: React.FC = () => {
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Title is required");
      return;
    }

    try {
      const response = await fetch("/v1/decks/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ title, description }),
      });

      if (response.ok) {
        alert("Deck created successfully");
        setTitle("");
        setDescription("");
        // Optionally, redirect or update deck list
      } else {
        const errorData = await response.json();
        alert(`Error: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error creating deck:", error);
      alert("An error occurred while creating the deck");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Create a New Deck
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Deck Title"
          variant="outlined"
          fullWidth
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          label="Description (Optional)"
          variant="outlined"
          fullWidth
          multiline
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" color="primary">
          Create Deck
        </Button>
      </form>
    </Box>
  );
};

export default CreateDeck;