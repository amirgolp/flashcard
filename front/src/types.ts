export const StatusOptions = ['easy', 'medium', 'hard', 'fail'] as const
export type StatusType = (typeof StatusOptions)[number]

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
