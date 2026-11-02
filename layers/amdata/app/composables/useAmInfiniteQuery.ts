import { useInfiniteQuery, type UseInfiniteQueryOptions } from "@pinia/colada";

type AmInfiniteQueryOptions<TPage, TParam> = Pick<
  UseInfiniteQueryOptions<TPage, Error, TParam, undefined>,
  "key" | "query" | "initialPageParam"
> & {
  getNextPageParam: (page: TPage) => TParam | null;
  enabled?: MaybeRefOrGetter<boolean | string | null | undefined>;
  staleTime: number;
  gcTime: number | false;
};

export default function useAmInfiniteQuery<TPage, TParam>(
  options: AmInfiniteQueryOptions<TPage, TParam>,
) {
  const query = useInfiniteQuery({
    ...useAmQueryScope(options),
    query: options.query,
    initialPageParam: options.initialPageParam,
    getNextPageParam: options.getNextPageParam,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
    autoRefetch: false,
  });

  const hasNextPage = computed(() => {
    const page = query.data.value?.pages.at(-1);
    return page !== undefined && options.getNextPageParam(page) != null;
  });

  function loadMore() {
    if (query.asyncStatus.value === "loading" || query.error.value || !hasNextPage.value) return;
    void query.loadNextPage({ cancelRefetch: false });
  }

  return { ...query, hasNextPage, loadMore };
}
