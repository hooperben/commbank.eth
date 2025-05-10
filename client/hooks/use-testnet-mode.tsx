"use client";

import { useEffect, useState } from "react";
import { useStore } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { createStore } from "zustand/vanilla";

type TestnetSettings = {
  testnetEnabled: boolean;
  setTestnetEnabled: (enabled: boolean) => void;
};

export const testnetModeStore = createStore<TestnetSettings>()(
  persist(
    (set) => ({
      testnetEnabled: false,
      setTestnetEnabled: (enabled) => set({ testnetEnabled: enabled }),
    }),
    {
      name: "testnet-enabled",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export const useTestnet = () => {
  const [hydrated, setHydrated] = useState(false);
  const store = useStore(testnetModeStore);

  // This ensures hydration happens once after component mounts
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Return the store only after hydration or fallback to initial values
  return hydrated
    ? store
    : { testnetEnabled: false, setTestnetEnabled: () => {} };
};
