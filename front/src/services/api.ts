import axios from 'axios'

const API_BASE_URL = 'http://localhost:8000/v1'

export interface Deck {
  id: string
  title: string
  description?: string
}

export interface Flashcard {
  id: string
  german_word: string
  english_translation: string
  decks: string[]
  status: 'easy' | 'medium' | 'hard' | 'fail'
}

export const api = {
  getDecks: async (): Promise<Deck[]> => {
    const response = await axios.get(`${API_BASE_URL}/decks/`)
    return response.data
  },
  getDeck: async (title: string): Promise<Deck> => {
    const response = await axios.get(`${API_BASE_URL}/decks/${title}`)
    return response.data
  },
  createDeck: async (deck: Partial<Deck>): Promise<Deck> => {
    const response = await axios.post(`${API_BASE_URL}/decks/`, deck)
    return response.data
  },
  deleteDeck: async (title: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/decks/${title}`)
  },

  getFlashcardsByDeck: async (title: string): Promise<Flashcard[]> => {
    const response = await axios.get(`${API_BASE_URL}/flashcards/`)
    return response.data.filter((card: Flashcard) => card.decks.includes(title))
  },
  createFlashcard: async (flashcard: {
    status: string
    german_word: string
    english_translation: string
    decks: string[]
  }): Promise<Flashcard> => {
    const response = await axios.post(`${API_BASE_URL}/flashcards/`, flashcard)
    return response.data
  },
  updateFlashcard: async (
    id: string,
    flashcard: Partial<Flashcard>
  ): Promise<void> => {
    await axios.put(`${API_BASE_URL}/flashcards/${id}`, flashcard)
  },
  deleteFlashcard: async (id: string): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/flashcards/${id}`)
  },
}
