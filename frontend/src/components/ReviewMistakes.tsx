import { useState, useEffect } from 'react';
import axios from 'axios';

interface Flashcard {
  id: number;
  german: string;
  english: string;
  notes: string;
}


const FlashCardList = () => {
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<null|string>(null); 

  useEffect(() => {
    const fetchWrongFlashcards = async () => {
      try {
        const response = await axios.get('http://localhost:8000/flashcards'); 
        setFlashcards(response.data); // Set the flashcards from the API response
        setLoading(false); // Set loading to false after data is fetched
      } catch (err) {
        setError('Failed to load the flashcards'); // Error handling
        setLoading(false); // Set loading to false on error
      }
    };

    fetchWrongFlashcards(); 
  }, []);

  if (loading) return <div>Loading...</div>; 
  if (error) return <div>{error}</div>; 

  return (
    <div>
      <h2>Wrongly Guessed Flashcards</h2>
      <ul>
        {flashcards.map((flashcard) => (
          <li key={flashcard.id}> {/* Ensure your data has an 'id' property */}
            <strong>German:</strong> {flashcard.german} <br />
            <strong>English:</strong> {flashcard.english} <br />
            <strong>Notes:</strong> {flashcard.notes} <br />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FlashCardList;
