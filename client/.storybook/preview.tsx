import type { Preview, Decorator } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import React from "react";
import "../src/index.css";

// Create a fresh QueryClient for stories
const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        refetchOnWindowFocus: false,
      },
    },
  });

// Global decorator to provide QueryClient for React Query hooks
const withQueryClient: Decorator = (Story) => {
  const queryClient = React.useMemo(() => createTestQueryClient(), []);
  return (
    <QueryClientProvider client={queryClient}>
      <Story />
    </QueryClientProvider>
  );
};

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },

  // Global decorators applied to all stories
  decorators: [withQueryClient],
};

export default preview;
