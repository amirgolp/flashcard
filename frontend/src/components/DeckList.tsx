import React, { useEffect, useState } from "react";
import { Box, Typography, Button, Grid, Card, CardContent, CardActions } from "@mui/material";
import { useNavigate } from "react-router-dom";

interface Deck {
  _id: string;
  title: string;
  description?: string;
  numberOfCards: number;
}

const DeckList: React.FC = () => {
  const [decks, setDecks] = useState<Deck[]>([]);
  const navigate = useNavigate();

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

  const handleDelete = async (deckId: string) => {
    if (!window.confirm("Are you sure you want to delete this deck?")) return;

    try {
      const response = await fetch(`/v1/decks/${deckId}`, {
        method: "DELETE",
      });

      if (response.status === 204) {
        alert("Deck deleted successfully");
        fetchDecks();
      } else {
        const errorData = await response.json();
        alert(`Error deleting deck: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Error deleting deck:", error);
      alert("An error occurred while deleting the deck");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Your Decks
      </Typography>
      <Grid container spacing={2}>
        {decks.map((deck) => (
          <Grid item xs={12} sm={6} md={4} key={deck._id}>
            <Card>
              <CardContent>
                <Typography variant="h5">{deck.title}</Typography>
                {deck.description && (
                  <Typography variant="body2" color="text.secondary">
                    {deck.description}
                  </Typography>
                )}
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Number of Cards: {deck.numberOfCards}
                </Typography>
              </CardContent>
              <CardActions>
                <Button size="small" onClick={() => navigate(`/study/${deck._id}`)}>
                  Study
                </Button>
                <Button size="small" color="error" onClick={() => handleDelete(deck._id)}>
                  Delete
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DeckList;