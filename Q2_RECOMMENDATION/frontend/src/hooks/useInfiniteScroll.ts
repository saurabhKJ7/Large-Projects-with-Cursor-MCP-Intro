import { useInfiniteQuery, UseInfiniteQueryOptions } from '@tanstack/react-query';
import { useInView } from 'react-intersection-observer';
import { useEffect } from 'react';

interface PageData<T> {
  data: T[];
  nextPage: number | null;
  totalPages: number;
}

interface UseInfiniteScrollOptions<T> extends Omit<UseInfiniteQueryOptions<PageData<T>, Error>, 'queryFn'> {
  queryKey: string[];
  fetchFn: (page: number) => Promise<PageData<T>>;
  enabled?: boolean;
}

export function useInfiniteScroll<T>({
  queryKey,
  fetchFn,
  enabled = true,
  ...options
}: UseInfiniteScrollOptions<T>) {
  const { ref, inView } = useInView({
    threshold: 0.5,
  });

  const query = useInfiniteQuery<PageData<T>, Error>(
    queryKey,
    ({ pageParam = 1 }) => fetchFn(pageParam),
    {
      enabled,
      getNextPageParam: (lastPage) => lastPage.nextPage,
      ...options,
    }
  );

  useEffect(() => {
    if (inView && query.hasNextPage && !query.isFetchingNextPage && enabled) {
      query.fetchNextPage();
    }
  }, [inView, query.hasNextPage, query.isFetchingNextPage, enabled]);

  const flatData = query.data?.pages.flatMap((page) => page.data) ?? [];
  const isLoadingInitialData = query.isLoading;
  const isLoadingMore = query.isFetchingNextPage;
  const isEmpty = query.data?.pages[0]?.data.length === 0;
  const isReachingEnd = isEmpty || !query.hasNextPage;
  const isRefreshing = query.isRefetching && !query.isFetchingNextPage;

  return {
    data: flatData,
    isLoadingInitialData,
    isLoadingMore,
    isEmpty,
    isReachingEnd,
    isRefreshing,
    ref,
    error: query.error,
    refetch: query.refetch,
  };
} 