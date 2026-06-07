"use client";

import { useState } from "react";
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { reportRequestError } from "@/lib/errorToast";

/**
 * TanStack Query provider. Caches backend data on the client (dedupe,
 * stale-while-revalidate) so e.g. switching List/Map views does not refetch.
 * Any failed query/mutation surfaces the generic "try again" toast.
 */
export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: () => reportRequestError() }),
        mutationCache: new MutationCache({ onError: () => reportRequestError() }),
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 min fresh
            gcTime: 5 * 60_000, // keep cache 5 min
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
