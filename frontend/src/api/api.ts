import axios from 'axios'
import { Flashcard } from '../types/Flashcard'
import { Deck } from '../types/Deck'

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000'

interface GetFlashcardsParams {
  deck_id?: string
  search?: string
}

export const getFlashcards = async (
  deckId?: string,
  searchQuery?: string
): Promise<Flashcard[]> => {
  const params: GetFlashcardsParams = {}
  if (deckId) params.deck_id = deckId
  if (searchQuery) params.search = searchQuery

  const response = await axios.get(`${API_BASE_URL}/flashcards/`, { params })
  return response.data
}

export const getFlashcard = async (id: string): Promise<Flashcard> => {
  const response = await axios.get(`${API_BASE_URL}/flashcards/${id}`)
  return response.data
}

export const createFlashcard = async (
  flashcard: Omit<Flashcard, '_id'>
): Promise<Flashcard> => {
  const response = await axios.post(`${API_BASE_URL}/flashcards/`, flashcard)
  return response.data
}

export const updateFlashcard = async (
  id: string,
  flashcard: Partial<Omit<Flashcard, '_id'>>
): Promise<Flashcard> => {
  const response = await axios.put(
    `${API_BASE_URL}/flashcards/${id}`,
    flashcard
  )
  return response.data
}

export const deleteFlashcard = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/flashcards/${id}`)
}

// --- Deck APIs ---
export const getDecks = async (): Promise<Deck[]> => {
  const response = await axios.get(`${API_BASE_URL}/decks/`)
  return response.data
}

export const getDeck = async (id: string): Promise<Deck> => {
  const response = await axios.get(`${API_BASE_URL}/decks/${id}`)
  return response.data
}

export const createDeck = async (deck: Omit<Deck, '_id'>): Promise<Deck> => {
  const response = await axios.post(`${API_BASE_URL}/decks/`, deck)
  return response.data
}

export const updateDeck = async (
  id: string,
  deck: Partial<Omit<Deck, '_id'>>
): Promise<Deck> => {
  const response = await axios.put(`${API_BASE_URL}/decks/${id}`, deck)
  return response.data
}

export const deleteDeck = async (id: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/decks/${id}`)
}
