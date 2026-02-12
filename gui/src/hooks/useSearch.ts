import { useInfiniteQuery } from '@tanstack/react-query';
import { searchCards } from '../api/cards';

export function useSearchCards(query: string, limit = 10) {
  return useInfiniteQuery({
    queryKey: ['searchCards', query],
    queryFn: ({ pageParam }) => searchCards(query, pageParam, limit),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
    enabled: query.length > 0,
  });
}
