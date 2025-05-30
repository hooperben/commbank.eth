"use client";

import { ReactNode } from "react";
import { WagmiProvider as WagmiProviderWrapper } from "wagmi";
import { http } from "wagmi";
import { RainbowKitProvider, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";

import { sepolia } from "wagmi/chains";

const config = getDefaultConfig({
  appName: "commbank.eth",
  projectId: "22e282d3e8cecf32c5c231dd188cb1ba", // Get this from WalletConnect Cloud
  chains: [sepolia],
  transports: {
    [sepolia.id]: http(),
  },
});

interface WagmiProviderProps {
  children: ReactNode;
}

export default function WagmiProvider({ children }: WagmiProviderProps) {
  return (
    <WagmiProviderWrapper config={config}>
      <RainbowKitProvider>{children}</RainbowKitProvider>
    </WagmiProviderWrapper>
  );
}
