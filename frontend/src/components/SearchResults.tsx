import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Box, Typography, Card, CardContent, Grid } from "@mui/material";

interface Deck {
  _id: string;
  title: string;
  description?: string;
  numberOfCards: number;
}

interface Flashcard {
  _id: string;
  front: string;
  back: string;
  decks: string[];
}

const useQuery = () => {
  return new URLSearchParams(useLocation().search);
};

const SearchResults: React.FC = () => {
  const query = useQuery();
  const searchQuery = query.get("q") || "";
  const [decks, setDecks] = useState<Deck[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (searchQuery.trim()) {
      performSearch(searchQuery.trim());
    }
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    try {
      const response = await fetch(`/v1/flashcards/?search=${encodeURIComponent(query)}`);
      if (response.ok) {
        const data: Flashcard[] = await response.json();
        setFlashcards(data);
      } else {
        const errorData = await response.json();
        alert(`Error searching flashcards: ${errorData.detail}`);
      }

      const deckResponse = await fetch(`/v1/decks/?search=${encodeURIComponent(query)}`);
      if (deckResponse.ok) {
        const deckData: Deck[] = await deckResponse.json();
        setDecks(deckData);
      } else {
        const deckErrorData = await deckResponse.json();
        alert(`Error searching decks: ${deckErrorData.detail}`);
      }
    } catch (error) {
      console.error("Error performing search:", error);
      alert("An error occurred while performing the search");
    }
  };

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h4" gutterBottom>
        Search Results for "{searchQuery}"
      </Typography>

      {decks.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom>
            Decks
          </Typography>
          <Grid container spacing={2}>
            {decks.map((deck) => (
              <Grid item xs={12} sm={6} md={4} key={deck._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">{deck.title}</Typography>
                    {deck.description && (
                      <Typography variant="body2" color="text.secondary">
                        {deck.description}
                      </Typography>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      Number of Cards: {deck.numberOfCards}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {flashcards.length > 0 && (
        <>
          <Typography variant="h5" gutterBottom sx={{ mt: 4 }}>
            Flashcards
          </Typography>
          <Grid container spacing={2}>
            {flashcards.map((card) => (
              <Grid item xs={12} sm={6} md={4} key={card._id}>
                <Card>
                  <CardContent>
                    <Typography variant="h6">Front: {card.front}</Typography>
                    <Typography variant="body1">Back: {card.back}</Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </>
      )}

      {decks.length === 0 && flashcards.length === 0 && (
        <Typography variant="body1">No results found.</Typography>
      )}
    </Box>
  );
};

export default SearchResults;