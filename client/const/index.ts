export const DEFAULT_PASSKEY_USERNAME = "commbank.eth";

export const formatAddress = (addr: string | undefined) => {
  if (!addr) return "";
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
};
