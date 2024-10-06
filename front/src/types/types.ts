export interface Flashcard {
  id: string;
  germanWord: string;
  englishTranslation: string;
  exampleUsage?: string;
  deckName: string;
  note?: string;
  studied: boolean;
  guessedRight?: boolean;
}

export interface Deck {
  id: string;
  title: string;
  description?: string;
  flashcards: Flashcard[];
}