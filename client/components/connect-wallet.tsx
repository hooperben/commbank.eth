"use client";

import { Button } from "@/components/ui/button";
import { useAccount, useConnect } from "wagmi";
import { useState } from "react";
import { CustomWalletModal } from "./custom-wallet-modal";
import { formatAddress } from "@/const";

const ConnectWallet = () => {
  const { connect, connectors } = useConnect();
  const { isConnected, address } = useAccount();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);

  // Filter and get specific wallet connectors
  const getWalletConnector = (walletName: string) => {
    return connectors.find((connector) =>
      connector.name.toLowerCase().includes(walletName.toLowerCase()),
    );
  };

  const walletOptions = [
    {
      name: "MetaMask",
      connector: getWalletConnector("metamask"),
      icon: "🦊",
    },
    {
      name: "WalletConnect",
      connector: getWalletConnector("walletconnect"),
      icon: "🔗",
    },
    {
      name: "Rainbow",
      connector: getWalletConnector("rainbow"),
      icon: "🌈",
    },
    {
      name: "Coinbase Wallet",
      connector: getWalletConnector("coinbase"),
      icon: "🔵",
    },
  ].filter((wallet) => wallet.connector); // Only show available wallets

  const handleWalletConnect = async (connector?: (typeof connectors)[0]) => {
    if (!connector) {
      console.error("No connector provided");
      return;
    }

    try {
      setIsConnecting(true);
      connect({ connector });
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      // You could also show a toast notification here
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <>
      {!isConnected ? (
        <div className="space-y-3">
          {walletOptions.map((wallet) => (
            <Button
              key={wallet.name}
              onClick={() => handleWalletConnect(wallet?.connector)}
              type="button"
              variant="outline"
              className="w-full flex items-center gap-3 justify-start h-12"
              disabled={isConnecting}
            >
              <span className="text-lg">{wallet.icon}</span>
              <span>{isConnecting ? "Connecting..." : wallet.name}</span>
            </Button>
          ))}
        </div>
      ) : (
        <Button
          onClick={() => setIsModalOpen(true)}
          type="button"
          className="flex items-center gap-2 w-full"
        >
          {formatAddress(address)}
        </Button>
      )}

      <CustomWalletModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};

export default ConnectWallet;
