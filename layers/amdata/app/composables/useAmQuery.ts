import type { UseQueryOptions, UseQueryReturn } from "@pinia/colada";

type AmQueryOptions<T> = Pick<UseQueryOptions<T>, "key" | "query"> & {
  enabled?: MaybeRefOrGetter<boolean | string | null | undefined>;
  staleTime: number;
  gcTime: number | false;
};

export default function useAmQuery<T>(options: AmQueryOptions<T>): UseQueryReturn<T> {
  return useQuery(useAmQueryOptions(options));
}

export function useAmQueryOptions<T>(options: AmQueryOptions<T>): UseQueryOptions<T> {
  return {
    ...useAmQueryScope(options),
    query: options.query,
    staleTime: options.staleTime,
    gcTime: options.gcTime,
  };
}

export function useAmQueryScope(options: Pick<AmQueryOptions<unknown>, "key" | "enabled">) {
  const { profile, storefront, valid } = useAuth();
  const settings = useSettingsStore();

  return {
    key: () => [
      "amdata",
      ...toValue(options.key),
      profile.value?.id ?? null,
      storefront.value?.id ?? null,
      settings.language ?? null,
    ],
    enabled: () =>
      valid.value &&
      !!storefront.value?.id &&
      (options.enabled === undefined || !!toValue(options.enabled)),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
    refetchOnMount: true,
    autoRefetch: true,
  };
}
