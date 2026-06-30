import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30 * 1000,        // dados ficam frescos por 30s — evita refetch em todo foco/navegação
        refetchOnWindowFocus: false,  // sem refetch ao focar a aba
        retry: 1,
      },
    },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 30 * 1000, // hover no menu não dispara refetch se dados ainda são frescos
  });

  return router;
};
