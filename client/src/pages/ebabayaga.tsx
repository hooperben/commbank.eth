import { Button } from "@/_components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/_components/ui/card";
import { Input } from "@/_components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/_components/ui/select";
import { useAuth } from "@/_providers/auth-provider";
import PageContainer from "@/_providers/page-container";
import { PAGE_METADATA } from "@/_constants/seo-config";
import {
  peerExtensionSdk,
  PEER_EXTENSION_CHROME_URL,
  type PeerExtensionState,
  type PeerExtensionOnrampParams,
} from "@zkp2p/sdk";
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Chrome,
  ExternalLink,
  Loader2,
  RefreshCw,
  Plug,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";

type Tab = "onramp" | "offramp";

const SUPPORTED_TOKENS = [
  {
    label: "ETH on Base",
    value: "8453:0x0000000000000000000000000000000000000000",
  },
  {
    label: "USDC on Base",
    value: "8453:0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  },
  {
    label: "ETH on Ethereum",
    value: "1:0x0000000000000000000000000000000000000000",
  },
  {
    label: "ETH on Arbitrum",
    value: "42161:0x0000000000000000000000000000000000000000",
  },
  {
    label: "USDC on Arbitrum",
    value: "42161:0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
  },
];

const PAYMENT_PLATFORMS = [
  { label: "Any", value: "any" },
  { label: "Venmo", value: "venmo" },
  { label: "CashApp", value: "cashapp" },
  { label: "Revolut", value: "revolut" },
  { label: "PayPal", value: "paypal" },
  { label: "Wise", value: "wise" },
  { label: "Zelle", value: "zelle" },
];

export default function EbabayagaPage() {
  const { address } = useAuth();
  const [tab, setTab] = useState<Tab>("onramp");
  const [extensionState, setExtensionState] =
    useState<PeerExtensionState>("needs_install");
  const [isCheckingState, setIsCheckingState] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);

  // Onramp form state
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0].value);
  const [paymentPlatform, setPaymentPlatform] = useState("any");
  const [recipientAddress, setRecipientAddress] = useState("");

  // Pre-fill recipient address with user's address
  useEffect(() => {
    if (address && !recipientAddress) {
      setRecipientAddress(address);
    }
  }, [address, recipientAddress]);

  const checkExtensionState = useCallback(async () => {
    setIsCheckingState(true);
    try {
      const state = await peerExtensionSdk.getState();
      setExtensionState(state);
    } catch {
      setExtensionState("needs_install");
    } finally {
      setIsCheckingState(false);
    }
  }, []);

  useEffect(() => {
    checkExtensionState();
  }, [checkExtensionState]);

  const handleInstall = () => {
    window.open(PEER_EXTENSION_CHROME_URL, "_blank");
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await peerExtensionSdk.requestConnection();
      await checkExtensionState();
    } catch (error) {
      console.error("Failed to connect to Peer extension:", error);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleOnramp = () => {
    try {
      const params: PeerExtensionOnrampParams = {
        referrer: "commbank.eth",
        referrerLogo: "https://commbank.eth.limo/commbankdotethlogo.jpg",
        callbackUrl: window.location.href,
        toToken: selectedToken,
        recipientAddress: recipientAddress || undefined,
      };

      if (amount) {
        params.inputAmount = amount;
      }
      if (paymentPlatform && paymentPlatform !== "any") {
        params.paymentPlatform = paymentPlatform;
      }

      console.log("Peer onramp params:", params);
      console.log("Extension available:", peerExtensionSdk.isAvailable());
      peerExtensionSdk.onramp(params);
    } catch (error) {
      console.error("Peer onramp error:", error);
    }
  };

  const handleOfframp = () => {
    peerExtensionSdk.openSidebar("/offramp");
  };

  const renderExtensionStatus = () => {
    if (isCheckingState) {
      return (
        <div className="flex items-center justify-center gap-2 p-6 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Checking Peer extension...</span>
        </div>
      );
    }

    if (extensionState === "needs_install") {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Chrome className="h-10 w-10 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="font-medium">Peer Extension Required</p>
              <p className="text-sm text-muted-foreground">
                Install the Peer browser extension to on/offramp directly from
                your browser.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleInstall}>
                <ExternalLink className="h-4 w-4 mr-2" />
                Install Extension
              </Button>
              <Button variant="outline" onClick={checkExtensionState}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (extensionState === "needs_connection") {
      return (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-4 p-6">
            <Plug className="h-10 w-10 text-muted-foreground" />
            <div className="text-center space-y-1">
              <p className="font-medium">Connect to Peer</p>
              <p className="text-sm text-muted-foreground">
                Allow commbank.eth to connect with your Peer extension.
              </p>
            </div>
            <Button onClick={handleConnect} disabled={isConnecting}>
              {isConnecting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Connecting...
                </>
              ) : (
                <>
                  <Plug className="h-4 w-4 mr-2" />
                  Connect
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const isReady = extensionState === "ready";

  return (
    <PageContainer {...PAGE_METADATA.ebabayaga}>
      <div className="container mx-auto max-w-4xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">On/Offramp</CardTitle>
            <CardDescription>
              Buy and sell crypto with fiat using{" "}
              <a
                href="https://peer.xyz"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Peer (ZKP2P)
              </a>
              . No middlemen, no extra verification.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {renderExtensionStatus()}

            {isReady && (
              <>
                {/* Tab Selector */}
                <div className="grid grid-cols-2 gap-3 w-full">
                  <Button
                    variant={tab === "onramp" ? "default" : "outline"}
                    className="h-14 text-lg font-semibold flex-col gap-1"
                    onClick={() => setTab("onramp")}
                  >
                    <ArrowDownToLine className="h-5 w-5" />
                    <span className="text-sm">Buy Crypto</span>
                  </Button>
                  <Button
                    variant={tab === "offramp" ? "default" : "outline"}
                    className="h-14 text-lg font-semibold flex-col gap-1"
                    onClick={() => setTab("offramp")}
                  >
                    <ArrowUpFromLine className="h-5 w-5" />
                    <span className="text-sm">Sell Crypto</span>
                  </Button>
                </div>

                {/* Onramp Form */}
                {tab === "onramp" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Receive Token
                      </label>
                      <Select
                        value={selectedToken}
                        onValueChange={setSelectedToken}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SUPPORTED_TOKENS.map((token) => (
                            <SelectItem key={token.value} value={token.value}>
                              {token.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Amount (USD)
                      </label>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Payment Method
                      </label>
                      <Select
                        value={paymentPlatform}
                        onValueChange={setPaymentPlatform}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Any payment method" />
                        </SelectTrigger>
                        <SelectContent>
                          {PAYMENT_PLATFORMS.map((p) => (
                            <SelectItem key={p.value} value={p.value}>
                              {p.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium">
                        Recipient Address
                      </label>
                      <Input
                        type="text"
                        placeholder="0x..."
                        value={recipientAddress}
                        onChange={(e) => setRecipientAddress(e.target.value)}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Pre-filled with your wallet address.
                      </p>
                    </div>

                    <Button
                      onClick={handleOnramp}
                      className="w-full h-12 text-base"
                    >
                      <ArrowDownToLine className="h-4 w-4 mr-2" />
                      Buy Crypto with Peer
                    </Button>
                  </div>
                )}

                {/* Offramp */}
                {tab === "offramp" && (
                  <div className="space-y-4">
                    <div className="p-4 bg-muted rounded-lg space-y-2">
                      <p className="text-sm">
                        Sell your crypto for fiat using Peer. The offramp opens
                        directly in the Peer extension where you can select your
                        payment method and amount.
                      </p>
                    </div>

                    <Button
                      onClick={handleOfframp}
                      className="w-full h-12 text-base"
                    >
                      <ArrowUpFromLine className="h-4 w-4 mr-2" />
                      Sell Crypto with Peer
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
