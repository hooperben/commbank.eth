export interface SupportedAsset {
  chainId: number;
  name: string;
  symbol: string;
  lzEndpointId: number; // v2 by default
  address: string;
  decimals: number;
  isNative?: boolean;
  roundTo?: number;
}

export const mainnetAssets: SupportedAsset[] = [
  {
    chainId: 1,
    lzEndpointId: 30101,
    name: "Australian Digital Dollar",
    symbol: "AUDD",
    address: "0x4cCe605eD955295432958d8951D0B176C10720d5",
    decimals: 6,
  },
  {
    chainId: 1,
    lzEndpointId: 30101,
    name: "Ethereum",
    symbol: "ETH",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    isNative: true,
    roundTo: 8,
  },
];

export const sepoliaAssets: SupportedAsset[] = [
  {
    chainId: 11155111,
    lzEndpointId: 40101,
    name: "USD Coin",
    symbol: "USDC",
    address: "0x237eEeE66266c72DBb7Ee2Aa84811666cE4EB815",
    decimals: 6,
    roundTo: 2,
  },
  {
    chainId: 11155111,
    lzEndpointId: 40101,
    name: "Australian Dollar Coin",
    symbol: "AUDD",
    address: "0xd794125Bc226895b987845Ef768B8C104fAbecD5",
    decimals: 6,
    roundTo: 2,
  },
  {
    chainId: 11155111,
    lzEndpointId: 40101,
    name: "Ethereum",
    symbol: "ETH",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    isNative: true,
    roundTo: 8,
  },
];

export const defaultNetwork = sepoliaAssets[0].chainId;
