import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Deck, Flashcard } from '../types.ts'

const API_BASE_URL = 'http://localhost:8000/v1'

const fetchDecks = async (): Promise<Deck[]> => {
  const response = await axios.get(`${API_BASE_URL}/decks/`)
  return response.data
}

const fetchDeck = async (title: string): Promise<Deck> => {
  const response = await axios.get(`${API_BASE_URL}/decks/${title}`)
  return response.data
}

const fetchFlashcardsByDeck = async (title: string): Promise<Flashcard[]> => {
  const response = await axios.get(`${API_BASE_URL}/flashcards/`)
  return response.data.filter((card: Flashcard) => card.decks.includes(title))
}

export const useDecks = () => {
  return useQuery<Deck[], Error>({
    queryKey: ['decks'],
    queryFn: fetchDecks,
  })
}

export const useDeck = (title: string) => {
  return useQuery<Deck, Error>({
    queryKey: ['deck', title],
    queryFn: () => fetchDeck(title),
  })
}

export const useCreateDeck = () => {
  const queryClient = useQueryClient()
  return useMutation<Deck, Error, Partial<Deck>>({
    mutationFn: async (deck: Partial<Deck>) => {
      const response = await axios.post(`${API_BASE_URL}/decks/`, deck)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })
}

export const useDeleteDeck = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (title: string) => {
      await axios.delete(`${API_BASE_URL}/decks/${title}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['decks'] })
    },
  })
}

export const useFlashcardsByDeck = (title: string) => {
  return useQuery<Flashcard[], Error>({
    queryKey: ['flashcards', title],
    queryFn: () => fetchFlashcardsByDeck(title),
  })
}

export const useCreateFlashcard = () => {
  const queryClient = useQueryClient()
  return useMutation<
    Flashcard,
    Error,
    {
      status: string
      german_word: string
      english_translation: string
      decks: string[]
    }
  >({
    mutationFn: async (flashcard) => {
      const response = await axios.post(
        `${API_BASE_URL}/flashcards/`,
        flashcard
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
    },
  })
}

export const useUpdateFlashcard = () => {
  const queryClient = useQueryClient()
  return useMutation<
    void,
    Error,
    { id: string; flashcard: Partial<Flashcard> }
  >({
    mutationFn: async ({ id, flashcard }) => {
      await axios.put(`${API_BASE_URL}/flashcards/${id}`, flashcard)
    },
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['flashcard', id] })
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
    },
  })
}

export const useDeleteFlashcard = () => {
  const queryClient = useQueryClient()
  return useMutation<void, Error, string>({
    mutationFn: async (id: string) => {
      await axios.delete(`${API_BASE_URL}/flashcards/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['flashcards'] })
    },
  })
}
