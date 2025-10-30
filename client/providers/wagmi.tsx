"use client";

import { ReactNode, useMemo } from "react";
import { WagmiProvider as WagmiProviderWrapper } from "wagmi";
import { http } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

import { mainnet, base, optimism, polygon, arbitrum } from "wagmi/chains";

interface WagmiProviderProps {
  children: ReactNode;
}

export default function WagmiProvider({ children }: WagmiProviderProps) {
  const config = useMemo(
    () =>
      getDefaultConfig({
        appName: "commbank.eth",
        projectId: "22e282d3e8cecf32c5c231dd188cb1ba",
        chains: [mainnet, base, optimism, polygon],
        transports: {
          [mainnet.id]: http(
            "https://eth-mainnet.g.alchemy.com/v2/pDPv-kMG3LVtM8dHSaxzynttAxnKSxRF",
          ),
          [base.id]: http(
            "https://base-mainnet.g.alchemy.com/v2/pDPv-kMG3LVtM8dHSaxzynttAxnKSxRF",
          ),
          [optimism.id]: http(
            "https://opt-mainnet.g.alchemy.com/v2/pDPv-kMG3LVtM8dHSaxzynttAxnKSxRF",
          ),
          [polygon.id]: http(
            "https://polygon-mainnet.g.alchemy.com/v2/pDPv-kMG3LVtM8dHSaxzynttAxnKSxRF",
          ),
          [arbitrum.id]: http(
            "https://arb-mainnet.g.alchemy.com/v2/pDPv-kMG3LVtM8dHSaxzynttAxnKSxRF",
          ),
        },
        ssr: true,
      }),
    [],
  );

  return (
    <WagmiProviderWrapper config={config}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </WagmiProviderWrapper>
  );
}
